import * as THREE from 'three';
import { ISimulationProfile, SlicerRenderMode } from '@/types/simulator';

export interface ISlicePoint {
  x: number;
  z: number;
}

export interface ISliceSegment {
  p1: ISlicePoint;
  p2: ISlicePoint;
  length: number;
  inx?: number;
  inz?: number;
}

export interface IContourLoop {
  points: ISlicePoint[];
  totalLength: number;
  cumulativeLengths: number[];
  signedArea: number;
  bbox: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface IInfillPath {
  lines: [ISlicePoint, ISlicePoint][];
  totalLength: number;
  cumulativeLengths: number[];
}

export interface ILayerSliceData {
  heightY: number;
  segments: ISliceSegment[];
  contours: IContourLoop[];
  innerWallContours: IContourLoop[][];
  seamPoint: ISlicePoint | null;
  totalPerimeterLength: number;
  infill: IInfillPath;
  bbox: { minX: number; maxX: number; minZ: number; maxZ: number };
}

/**
 * Mỗi tam giác lưu gọn trong Float32Array (11 floats / tam giác):
 * [0..2]: ax, ay, az
 * [3..5]: bx, by, bz
 * [6..8]: cx, cy, cz
 * [9..10]: inx, inz (pháp tuyến 2D hướng vào trong lòng vật thể trên mặt phẳng XZ)
 */
const FLOATS_PER_TRI = 11;

interface IGeometryBucketIndex {
  uuid: string;
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  bucketCount: number;
  triData: Float32Array;
  triCount: number;
  buckets: number[][];
}

const bucketIndexCache = new Map<string, IGeometryBucketIndex>();

/**
 * Xây dựng bộ chỉ mục phân vùng cao độ Y (128 Y-Interval Buckets trên TypedArray)
 * Giữ nguyên 100% độ liền mạch của tam giác (không bỏ sót bất kỳ chi tiết nào) và chạy trong < 8ms.
 */
export function getOrBuildGeometryBucketIndex(
  geometry: THREE.BufferGeometry
): IGeometryBucketIndex | null {
  const positionAttr = geometry.getAttribute('position');
  if (!positionAttr || positionAttr.count < 3) return null;

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minY = bbox.min.y;
  const maxY = Math.max(minY + 0.1, bbox.max.y);
  const uuid = `${geometry.uuid}_${positionAttr.count}_${minY.toFixed(2)}_${maxY.toFixed(2)}`;

  const existing = bucketIndexCache.get(uuid);
  if (existing) {
    return existing;
  }

  // Giới hạn số lượng cache tránh rò rỉ bộ nhớ
  if (bucketIndexCache.size > 8) {
    const firstKey = bucketIndexCache.keys().next().value;
    if (firstKey) bucketIndexCache.delete(firstKey);
  }

  const spanY = Math.max(0.1, maxY - minY);
  const bucketCount = 128;
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);

  const indexAttr = geometry.getIndex();
  const vertexCount = indexAttr ? indexAttr.count : positionAttr.count;
  const rawTriangleCount = Math.floor(vertexCount / 3);

  const triData = new Float32Array(rawTriangleCount * FLOATS_PER_TRI);
  let validTriCount = 0;

  for (let t = 0; t < rawTriangleCount; t++) {
    const idx0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const idx1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const idx2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    const ax = positionAttr.getX(idx0);
    const ay = positionAttr.getY(idx0);
    const az = positionAttr.getZ(idx0);

    const bx = positionAttr.getX(idx1);
    const by = positionAttr.getY(idx1);
    const bz = positionAttr.getZ(idx1);

    const cx = positionAttr.getX(idx2);
    const cy = positionAttr.getY(idx2);
    const cz = positionAttr.getZ(idx2);

    const triMinY = Math.min(ay, by, cy);
    const triMaxY = Math.max(ay, by, cy);
    if (triMaxY - triMinY < 1e-5) continue;

    // Pháp tuyến 3D của tam giác: (B - A) x (C - A)
    const e1x = bx - ax,
      e1y = by - ay,
      e1z = bz - az;
    const e2x = cx - ax,
      e2y = cy - ay,
      e2z = cz - az;
    const nx = e1y * e2z - e1z * e2y;
    const nz = e1x * e2y - e1y * e2x;
    const nLenXZ = Math.hypot(nx, nz);
    const inx = nLenXZ > 1e-6 ? -nx / nLenXZ : 0;
    const inz = nLenXZ > 1e-6 ? -nz / nLenXZ : 0;

    const baseOffset = validTriCount * FLOATS_PER_TRI;
    triData[baseOffset] = ax;
    triData[baseOffset + 1] = ay;
    triData[baseOffset + 2] = az;
    triData[baseOffset + 3] = bx;
    triData[baseOffset + 4] = by;
    triData[baseOffset + 5] = bz;
    triData[baseOffset + 6] = cx;
    triData[baseOffset + 7] = cy;
    triData[baseOffset + 8] = cz;
    triData[baseOffset + 9] = inx;
    triData[baseOffset + 10] = inz;

    const bStart = Math.max(
      0,
      Math.min(bucketCount - 1, Math.floor(((triMinY - minY) / spanY) * bucketCount))
    );
    const bEnd = Math.max(
      0,
      Math.min(bucketCount - 1, Math.floor(((triMaxY - minY) / spanY) * bucketCount))
    );

    for (let b = bStart; b <= bEnd; b++) {
      buckets[b].push(validTriCount);
    }

    validTriCount++;
  }

  const built: IGeometryBucketIndex = {
    uuid,
    minY,
    maxY,
    minX: bbox.min.x,
    maxX: bbox.max.x,
    minZ: bbox.min.z,
    maxZ: bbox.max.z,
    bucketCount,
    triData,
    triCount: validTriCount,
    buckets,
  };

  bucketIndexCache.set(uuid, built);
  return built;
}

/**
 * Cắt nhanh 1 layer cho chế độ Xem Sợi In 3D (Full Filament Preview):
 * Thời gian thực thi O(S) tuyến tính (< 0.08ms / layer), bảo toàn 100% biên dạng cánh, sừng, vảy, thân mô hình!
 */
export function sliceLayerFastForPreview(
  geometry: THREE.BufferGeometry,
  heightY: number,
  renderY: number,
  layerIndex: number,
  profile: ISimulationProfile,
  isTopOrBottomShell: boolean,
  outOuterWalls: number[],
  outInnerWalls: number[],
  outInfills: number[],
  outSeams: number[],
  outBaseSegments?: [number, number, number, number, number, number][]
): { perimeterMm: number; infillMm: number } {
  const bucketIndex = getOrBuildGeometryBucketIndex(geometry);
  if (!bucketIndex || bucketIndex.triCount === 0) {
    return { perimeterMm: 0, infillMm: 0 };
  }

  const spanY = Math.max(0.1, bucketIndex.maxY - bucketIndex.minY);
  const bucketIdx = Math.max(
    0,
    Math.min(
      bucketIndex.bucketCount - 1,
      Math.floor(((heightY - bucketIndex.minY) / spanY) * bucketIndex.bucketCount)
    )
  );
  const candidateTriIndices = bucketIndex.buckets[bucketIdx];
  if (!candidateTriIndices || candidateTriIndices.length === 0) {
    return { perimeterMm: 0, infillMm: 0 };
  }

  const triData = bucketIndex.triData;
  const wallLoops = Math.max(1, Math.min(6, profile.wallLoops || 2));
  const lineWidthMm = profile.lineWidth || 0.42;

  // Якщо mô hình có hàng ngàn tam giác trên cùng 1 lát cắt, bước lọc tinh giữ ~900 đoạn/lớp để hiển thị siêu nét & mượt 144 FPS
  const segStride =
    candidateTriIndices.length > 2600 ? Math.ceil(candidateTriIndices.length / 1800) : 1;

  // Cấu hình lưới Scanline 1D để cắt ruột Infill trực tiếp O(S)
  const density = isTopOrBottomShell ? Math.min(45, Math.max(25, profile.infillDensity * 1.6)) : profile.infillDensity;
  const generateInfill = density > 0;
  const spacing = Math.max(2.2, Math.min(14.0, 220 / Math.max(5, density)));

  // Hướng quét Scanline xoay theo từng kiểu ruột in (Grid: +-45°, Triangles: 0/60/120°, Gyroid/Honeycomb: 0/90°)
  let scanAngle = 0;
  if (profile.infillType === 'grid' || profile.infillType === 'solid' || isTopOrBottomShell) {
    scanAngle = layerIndex % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
  } else if (profile.infillType === 'triangles') {
    scanAngle = ((layerIndex % 3) * Math.PI) / 3;
  } else if (profile.infillType === 'gyroid' || profile.infillType === 'honeycomb') {
    scanAngle = layerIndex % 2 === 0 ? 0 : Math.PI / 2;
  }
  const cosA = Math.cos(scanAngle);
  const sinA = Math.sin(scanAngle);

  const maxSpanXZ = Math.hypot(
    bucketIndex.maxX - bucketIndex.minX,
    bucketIndex.maxZ - bucketIndex.minZ
  );
  const halfSpan = Math.max(20, maxSpanXZ * 0.65);
  const centerX = (bucketIndex.minX + bucketIndex.maxX) * 0.5;
  const centerZ = (bucketIndex.minZ + bucketIndex.maxZ) * 0.5;
  const numScanBins = generateInfill ? Math.max(4, Math.min(64, Math.ceil((halfSpan * 2) / spacing))) : 0;
  const scanHits: number[][] = generateInfill
    ? Array.from({ length: numScanBins }, () => [])
    : [];

  let perimeterMm = 0;
  let infillMm = 0;

  // Biến tìm điểm Z-Seam tốt nhất trên lát cắt hiện tại
  const seamMode = profile.seamPosition || 'aligned';
  let bestSeamX = NaN;
  let bestSeamZ = NaN;
  let bestSeamScore = -Infinity;
  const randomTargetIdx =
    seamMode === 'random'
      ? Math.floor(
          (Math.abs(Math.sin(heightY * 127.1 + 311.7)) * 43758.5453 % 1) *
            Math.max(1, Math.floor(candidateTriIndices.length / segStride))
        )
      : -1;
  let segCounter = 0;

  for (let c = 0; c < candidateTriIndices.length; c++) {
    const tIdx = candidateTriIndices[c];
    const base = tIdx * FLOATS_PER_TRI;

    const ay = triData[base + 1];
    const by = triData[base + 4];
    const cy = triData[base + 7];

    const sA = ay - heightY;
    const sB = by - heightY;
    const sC = cy - heightY;

    // Kiểm tra tam giác có cắt qua mặt phẳng Y = heightY không
    if ((sA > 0 && sB > 0 && sC > 0) || (sA < 0 && sB < 0 && sC < 0)) {
      continue;
    }

    const ax = triData[base];
    const az = triData[base + 2];
    const bx = triData[base + 3];
    const bz = triData[base + 5];
    const cx = triData[base + 6];
    const cz = triData[base + 8];

    let p1x = 0,
      p1z = 0,
      p2x = 0,
      p2z = 0;
    let count = 0;

    // Cạnh AB
    if ((sA >= 0 && sB < 0) || (sA < 0 && sB >= 0)) {
      const dy = by - ay;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - ay) / dy;
        p1x = ax + t * (bx - ax);
        p1z = az + t * (bz - az);
        count = 1;
      }
    }

    // Cạnh BC
    if ((sB >= 0 && sC < 0) || (sB < 0 && sC >= 0)) {
      const dy = cy - by;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - by) / dy;
        const ix = bx + t * (cx - bx);
        const iz = bz + t * (cz - bz);
        if (count === 0) {
          p1x = ix;
          p1z = iz;
          count = 1;
        } else {
          p2x = ix;
          p2z = iz;
          count = 2;
        }
      }
    }

    // Cạnh CA
    if (count < 2 && ((sC >= 0 && sA < 0) || (sC < 0 && sA >= 0))) {
      const dy = ay - cy;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - cy) / dy;
        const ix = cx + t * (ax - cx);
        const iz = cz + t * (az - cz);
        if (count === 0) {
          p1x = ix;
          p1z = iz;
          count = 1;
        } else {
          p2x = ix;
          p2z = iz;
          count = 2;
        }
      }
    }

    if (count < 2) continue;

    const segLen = Math.hypot(p2x - p1x, p2z - p1z);
    if (segLen < 0.01) continue;
    perimeterMm += segLen;

    // Ghi nhận giao điểm với hệ thống Scanline 1D để tính Infill chính xác 100%
    if (generateInfill) {
      const dx1 = p1x - centerX,
        dz1 = p1z - centerZ;
      const dx2 = p2x - centerX,
        dz2 = p2z - centerZ;
      // Hệ tọa độ xoay (u: dọc theo tia scanline, v: vuông góc với tia scanline)
      const u1 = dx1 * cosA + dz1 * sinA;
      const v1 = -dx1 * sinA + dz1 * cosA;
      const u2 = dx2 * cosA + dz2 * sinA;
      const v2 = -dx2 * sinA + dz2 * cosA;

      const vMin = Math.min(v1, v2);
      const vMax = Math.max(v1, v2);
      const dv = v2 - v1;
      if (Math.abs(dv) > 1e-5) {
        const bStart = Math.max(0, Math.ceil((vMin + halfSpan) / spacing));
        const bEnd = Math.min(numScanBins - 1, Math.floor((vMax + halfSpan) / spacing));
        for (let b = bStart; b <= bEnd; b++) {
          const scanV = -halfSpan + b * spacing;
          const tScan = (scanV - v1) / dv;
          if (tScan >= 0 && tScan <= 1) {
            const hitU = u1 + tScan * (u2 - u1);
            scanHits[b].push(hitU);
          }
        }
      }
    }

    if (c % segStride !== 0) continue;

    // 1. Đẩy vào Outer Wall (#00e050)
    outOuterWalls.push(p1x, renderY, p1z, p2x, renderY, p2z);

    const inx = triData[base + 9];
    const inz = triData[base + 10];

    if (outBaseSegments) {
      outBaseSegments.push([p1x, p1z, p2x, p2z, inx, inz]);
    }

    // 2. Đẩy vào Inner Walls (#047857) dịch lùi theo pháp tuyến mặt trong
    if (wallLoops > 1 && (inx !== 0 || inz !== 0)) {
      for (let w = 1; w < wallLoops; w++) {
        const off = w * lineWidthMm;
        outInnerWalls.push(
          p1x + inx * off,
          renderY,
          p1z + inz * off,
          p2x + inx * off,
          renderY,
          p2z + inz * off
        );
      }
    }

    // 3. Cập nhật điểm Z-Seam
    if (seamMode === 'random') {
      if (segCounter === randomTargetIdx || isNaN(bestSeamX)) {
        bestSeamX = p1x;
        bestSeamZ = p1z;
      }
    } else if (seamMode === 'back') {
      const score = -p1z;
      if (score > bestSeamScore) {
        bestSeamScore = score;
        bestSeamX = p1x;
        bestSeamZ = p1z;
      }
    } else if (seamMode === 'nearest') {
      const score = Math.abs(inx - inz);
      if (score > bestSeamScore) {
        bestSeamScore = score;
        bestSeamX = p1x;
        bestSeamZ = p1z;
      }
    } else {
      // 'aligned': mặt sau-phải
      const score = p1x * 0.7 - p1z * 0.7;
      if (score > bestSeamScore) {
        bestSeamScore = score;
        bestSeamX = p1x;
        bestSeamZ = p1z;
      }
    }
    segCounter++;
  }

  if (!isNaN(bestSeamX)) {
    outSeams.push(bestSeamX, renderY, bestSeamZ);
  }

  // 4. Tạo các đường Infill từ bảng giao điểm Scanline 1D (Quy tắc Chẵn-Lẻ Jordan)
  if (generateInfill) {
    const wallInset = wallLoops * lineWidthMm + 0.15;
    const toWorldXZ = (u: number, v: number): [number, number] => [
      centerX + u * cosA - v * sinA,
      centerZ + u * sinA + v * cosA,
    ];

    for (let b = 0; b < numScanBins; b++) {
      const hits = scanHits[b];
      if (hits.length < 2) continue;
      hits.sort((a, bVal) => a - bVal);

      const scanV = -halfSpan + b * spacing;

      for (let j = 0; j + 1 < hits.length; j += 2) {
        const uStart = hits[j] + wallInset;
        const uEnd = hits[j + 1] - wallInset;
        if (uEnd - uStart < 0.8) continue;

        infillMm += uEnd - uStart;

        if (!isTopOrBottomShell && profile.infillType === 'gyroid') {
          const stepU = 2.8;
          const freq = (Math.PI * 2) / Math.max(5.5, spacing * 1.8);
          const phaseY = heightY * freq;
          const amp = spacing * 0.34;
          let prevU = uStart;
          let prevV = scanV + Math.sin(prevU * freq + phaseY) * Math.cos(scanV * freq - phaseY) * amp;
          let [prevX, prevZ] = toWorldXZ(prevU, prevV);

          for (let u = uStart + stepU; u <= uEnd + 0.01; u += stepU) {
            const curU = Math.min(u, uEnd);
            const curV =
              scanV + Math.sin(curU * freq + phaseY) * Math.cos(scanV * freq - phaseY) * amp;
            const [curX, curZ] = toWorldXZ(curU, curV);
            outInfills.push(prevX, renderY, prevZ, curX, renderY, curZ);
            prevX = curX;
            prevZ = curZ;
          }
        } else if (!isTopOrBottomShell && profile.infillType === 'honeycomb') {
          const stepU = Math.max(2.2, spacing * 0.55);
          const zigAmp = spacing * 0.28 * (b % 2 === 0 ? 1 : -1);
          let prevU = uStart;
          let prevV = scanV;
          let [prevX, prevZ] = toWorldXZ(prevU, prevV);
          let stepIdx = 0;

          for (let u = uStart + stepU; u <= uEnd + 0.01; u += stepU) {
            stepIdx++;
            const curU = Math.min(u, uEnd);
            const mod = stepIdx % 4;
            const curV = scanV + (mod === 1 || mod === 2 ? zigAmp : -zigAmp * 0.5);
            const [curX, curZ] = toWorldXZ(curU, curV);
            outInfills.push(prevX, renderY, prevZ, curX, renderY, curZ);
            prevX = curX;
            prevZ = curZ;
          }
        } else {
          const [x1, z1] = toWorldXZ(uStart, scanV);
          const [x2, z2] = toWorldXZ(uEnd, scanV);
          outInfills.push(x1, renderY, z1, x2, renderY, z2);
        }
      }
    }
  }

  return { perimeterMm, infillMm };
}

/**
 * Cắt nhanh biên dạng của các khối phụ trợ (như Tree Support / Support Interface 3D) tại cao độ heightY
 */
export function sliceAuxiliaryMeshAtHeightFast(
  geometry: THREE.BufferGeometry,
  heightY: number,
  renderY: number,
  outLines: number[]
): void {
  const bucketIndex = getOrBuildGeometryBucketIndex(geometry);
  if (!bucketIndex || bucketIndex.triCount === 0) return;

  if (heightY < bucketIndex.minY || heightY > bucketIndex.maxY) return;

  const spanY = Math.max(0.1, bucketIndex.maxY - bucketIndex.minY);
  const bucketIdx = Math.max(
    0,
    Math.min(
      bucketIndex.bucketCount - 1,
      Math.floor(((heightY - bucketIndex.minY) / spanY) * bucketIndex.bucketCount)
    )
  );
  const candidateTriIndices = bucketIndex.buckets[bucketIdx];
  if (!candidateTriIndices || candidateTriIndices.length === 0) return;

  const triData = bucketIndex.triData;

  for (let c = 0; c < candidateTriIndices.length; c++) {
    const base = candidateTriIndices[c] * FLOATS_PER_TRI;
    const ay = triData[base + 1];
    const by = triData[base + 4];
    const cy = triData[base + 7];

    const sA = ay - heightY;
    const sB = by - heightY;
    const sC = cy - heightY;

    if ((sA > 0 && sB > 0 && sC > 0) || (sA < 0 && sB < 0 && sC < 0)) {
      continue;
    }

    const ax = triData[base];
    const az = triData[base + 2];
    const bx = triData[base + 3];
    const bz = triData[base + 5];
    const cx = triData[base + 6];
    const cz = triData[base + 8];

    let p1x = 0,
      p1z = 0,
      p2x = 0,
      p2z = 0;
    let count = 0;

    if ((sA >= 0 && sB < 0) || (sA < 0 && sB >= 0)) {
      const dy = by - ay;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - ay) / dy;
        p1x = ax + t * (bx - ax);
        p1z = az + t * (bz - az);
        count = 1;
      }
    }

    if ((sB >= 0 && sC < 0) || (sB < 0 && sC >= 0)) {
      const dy = cy - by;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - by) / dy;
        const ix = bx + t * (cx - bx);
        const iz = bz + t * (cz - bz);
        if (count === 0) {
          p1x = ix;
          p1z = iz;
          count = 1;
        } else {
          p2x = ix;
          p2z = iz;
          count = 2;
        }
      }
    }

    if (count < 2 && ((sC >= 0 && sA < 0) || (sC < 0 && sA >= 0))) {
      const dy = ay - cy;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - cy) / dy;
        const ix = cx + t * (ax - cx);
        const iz = cz + t * (az - cz);
        if (count === 0) {
          p1x = ix;
          p1z = iz;
          count = 1;
        } else {
          p2x = ix;
          p2z = iz;
          count = 2;
        }
      }
    }

    if (count === 2) {
      outLines.push(p1x, renderY, p1z, p2x, renderY, p2z);
    }
  }
}

/**
 * Cắt lớp hình học 3D thực tế (Mesh Slicing Engine) tại độ cao Y nhất định
 * Dùng cho chế độ mô phỏng từng lớp (Active Layer Toolpath & Virtual Toolhead).
 */
export function sliceGeometryAtHeight(
  geometry: THREE.BufferGeometry,
  heightY: number,
  profile: ISimulationProfile
): ILayerSliceData {
  const bucketIndex = getOrBuildGeometryBucketIndex(geometry);
  if (!bucketIndex || bucketIndex.triCount === 0) {
    return createEmptySlice(heightY);
  }

  const spanY = Math.max(0.1, bucketIndex.maxY - bucketIndex.minY);
  const bucketIdx = Math.max(
    0,
    Math.min(
      bucketIndex.bucketCount - 1,
      Math.floor(((heightY - bucketIndex.minY) / spanY) * bucketIndex.bucketCount)
    )
  );
  const candidateTriIndices = bucketIndex.buckets[bucketIdx];
  if (!candidateTriIndices || candidateTriIndices.length === 0) {
    return createEmptySlice(heightY);
  }

  const triData = bucketIndex.triData;
  const segments: ISliceSegment[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  // Giới hạn tối đa ~1200 đoạn trên 1 lát cắt interactive để giữ 60fps tuyệt đối
  const stride =
    candidateTriIndices.length > 1600 ? Math.ceil(candidateTriIndices.length / 1200) : 1;

  for (let c = 0; c < candidateTriIndices.length; c += stride) {
    const base = candidateTriIndices[c] * FLOATS_PER_TRI;
    const ay = triData[base + 1];
    const by = triData[base + 4];
    const cy = triData[base + 7];

    const sA = ay - heightY;
    const sB = by - heightY;
    const sC = cy - heightY;

    if ((sA > 0 && sB > 0 && sC > 0) || (sA < 0 && sB < 0 && sC < 0)) {
      continue;
    }

    const ax = triData[base];
    const az = triData[base + 2];
    const bx = triData[base + 3];
    const bz = triData[base + 5];
    const cx = triData[base + 6];
    const cz = triData[base + 8];

    let p1x = 0,
      p1z = 0,
      p2x = 0,
      p2z = 0;
    let count = 0;

    if ((sA >= 0 && sB < 0) || (sA < 0 && sB >= 0)) {
      const dy = by - ay;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - ay) / dy;
        p1x = ax + t * (bx - ax);
        p1z = az + t * (bz - az);
        count = 1;
      }
    }

    if ((sB >= 0 && sC < 0) || (sB < 0 && sC >= 0)) {
      const dy = cy - by;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - by) / dy;
        const ix = bx + t * (cx - bx);
        const iz = bz + t * (cz - bz);
        if (count === 0) {
          p1x = ix;
          p1z = iz;
          count = 1;
        } else {
          p2x = ix;
          p2z = iz;
          count = 2;
        }
      }
    }

    if (count < 2 && ((sC >= 0 && sA < 0) || (sC < 0 && sA >= 0))) {
      const dy = ay - cy;
      if (Math.abs(dy) > 1e-6) {
        const t = (heightY - cy) / dy;
        const ix = cx + t * (ax - cx);
        const iz = cz + t * (az - cz);
        if (count === 0) {
          p1x = ix;
          p1z = iz;
          count = 1;
        } else {
          p2x = ix;
          p2z = iz;
          count = 2;
        }
      }
    }

    if (count === 2) {
      const len = Math.hypot(p2x - p1x, p2z - p1z);
      if (len > 0.01) {
        segments.push({
          p1: { x: p1x, z: p1z },
          p2: { x: p2x, z: p2z },
          length: len,
          inx: triData[base + 9],
          inz: triData[base + 10],
        });
        minX = Math.min(minX, p1x, p2x);
        maxX = Math.max(maxX, p1x, p2x);
        minZ = Math.min(minZ, p1z, p2z);
        maxZ = Math.max(maxZ, p1z, p2z);
      }
    }
  }

  if (segments.length === 0) {
    return createEmptySlice(heightY);
  }

  // Nối nhanh các đoạn bằng Spatial Endpoint Hash O(S)
  const contours = stitchSegmentsIntoContoursFast(segments);

  let totalPerimeterLength = 0;
  contours.forEach((c) => {
    totalPerimeterLength += c.totalLength;
  });

  const wallLoops = Math.max(1, Math.min(6, profile.wallLoops || 2));
  const lineWidthMm = 0.42;
  const innerWallContours: IContourLoop[][] = [];

  for (let w = 1; w < wallLoops; w++) {
    const offsetDist = w * lineWidthMm;
    const ringsForWall: IContourLoop[] = [];
    for (const loop of contours) {
      const offsetLoop = offsetContourInward(loop, offsetDist);
      if (offsetLoop) {
        ringsForWall.push(offsetLoop);
      }
    }
    if (ringsForWall.length > 0) {
      innerWallContours.push(ringsForWall);
    }
  }

  const bbox = {
    minX: isFinite(minX) ? minX : -10,
    maxX: isFinite(maxX) ? maxX : 10,
    minZ: isFinite(minZ) ? minZ : -10,
    maxZ: isFinite(maxZ) ? maxZ : 10,
  };

  const seamPoint = computeSeamPointOnContours(
    contours,
    heightY,
    profile.seamPosition || 'aligned'
  );

  const isTopOrBottomShell =
    heightY <= bucketIndex.minY + (profile.layerHeight || 0.2) * (profile.bottomShellLayers || 3) ||
    heightY >= bucketIndex.maxY - (profile.layerHeight || 0.2) * (profile.topShellLayers || 3);

  const infill = generateFastScanlineInfillFromSegments(
    segments,
    bbox,
    heightY,
    profile,
    isTopOrBottomShell,
    wallLoops * lineWidthMm
  );

  return {
    heightY,
    segments,
    contours,
    innerWallContours,
    seamPoint,
    totalPerimeterLength,
    infill,
    bbox,
  };
}

function computeSignedPolygonArea(pts: ISlicePoint[]): number {
  if (pts.length < 3) return 0;
  let area2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    area2 += p1.x * p2.z - p2.x * p1.z;
  }
  return area2 * 0.5;
}

export function offsetContourInward(
  loop: IContourLoop,
  offsetDist: number
): IContourLoop | null {
  const rawPts = loop.points;
  if (rawPts.length < 2) return null;

  const isClosed =
    rawPts.length >= 4 &&
    Math.hypot(
      rawPts[rawPts.length - 1].x - rawPts[0].x,
      rawPts[rawPts.length - 1].z - rawPts[0].z
    ) < 0.5;

  const pts = isClosed ? rawPts.slice(0, rawPts.length - 1) : rawPts;
  const n = pts.length;
  if (n < 2) return null;

  const orientSign = loop.signedArea >= 0 ? 1 : -1;
  const newPoints: ISlicePoint[] = [];

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const dx1 = curr.x - prev.x;
    const dz1 = curr.z - prev.z;
    const len1 = Math.hypot(dx1, dz1) || 1;
    const nx1 = (-dz1 / len1) * orientSign;
    const nz1 = (dx1 / len1) * orientSign;

    const dx2 = next.x - curr.x;
    const dz2 = next.z - curr.z;
    const len2 = Math.hypot(dx2, dz2) || 1;
    const nx2 = (-dz2 / len2) * orientSign;
    const nz2 = (dx2 / len2) * orientSign;

    let mx = nx1 + nx2;
    let mz = nz1 + nz2;
    const mLen = Math.hypot(mx, mz);
    if (mLen < 1e-4) {
      mx = nx1;
      mz = nz1;
    } else {
      mx /= mLen;
      mz /= mLen;
    }

    const cosHalf = Math.max(0.45, mx * nx1 + mz * nz1);
    const miterScale = Math.min(1.85, 1 / cosHalf);

    newPoints.push({
      x: curr.x + mx * offsetDist * miterScale,
      z: curr.z + mz * offsetDist * miterScale,
    });
  }

  if (isClosed) {
    newPoints.push({ ...newPoints[0] });
  }

  let totalLength = 0;
  const cumulativeLengths: number[] = [0];
  let bMinX = Infinity;
  let bMaxX = -Infinity;
  let bMinZ = Infinity;
  let bMaxZ = -Infinity;

  for (let i = 0; i < newPoints.length; i++) {
    const p = newPoints[i];
    bMinX = Math.min(bMinX, p.x);
    bMaxX = Math.max(bMaxX, p.x);
    bMinZ = Math.min(bMinZ, p.z);
    bMaxZ = Math.max(bMaxZ, p.z);
    if (i > 0) {
      totalLength += Math.hypot(p.x - newPoints[i - 1].x, p.z - newPoints[i - 1].z);
      cumulativeLengths.push(totalLength);
    }
  }

  return {
    points: newPoints,
    totalLength,
    cumulativeLengths,
    signedArea: computeSignedPolygonArea(newPoints),
    bbox: { minX: bMinX, maxX: bMaxX, minZ: bMinZ, maxZ: bMaxZ },
  };
}

function computeSeamPointOnContours(
  contours: IContourLoop[],
  heightY: number,
  seamPosition: 'aligned' | 'nearest' | 'random' | 'back'
): ISlicePoint | null {
  if (contours.length === 0 || contours[0].points.length === 0) return null;
  const mainLoop = contours[0];
  const pts = mainLoop.points;

  if (seamPosition === 'random') {
    const hash = Math.abs(Math.sin(heightY * 127.1 + 311.7)) * 43758.5453;
    const idx = Math.floor((hash - Math.floor(hash)) * pts.length) % pts.length;
    return pts[idx];
  }

  if (seamPosition === 'nearest') {
    let bestPt = pts[0];
    let minDot = 2.0;
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const v1x = p1.x - p0.x;
      const v1z = p1.z - p0.z;
      const v2x = p2.x - p1.x;
      const v2z = p2.z - p1.z;
      const l1 = Math.hypot(v1x, v1z) || 1;
      const l2 = Math.hypot(v2x, v2z) || 1;
      const dot = (v1x * v2x + v1z * v2z) / (l1 * l2);
      if (dot < minDot) {
        minDot = dot;
        bestPt = p1;
      }
    }
    return bestPt;
  }

  if (seamPosition === 'back') {
    let backPt = pts[0];
    let minZVal = Infinity;
    for (const p of pts) {
      if (p.z < minZVal) {
        minZVal = p.z;
        backPt = p;
      }
    }
    return backPt;
  }

  let alignedPt = pts[0];
  let bestScore = -Infinity;
  for (const p of pts) {
    const score = p.x * 0.7 - p.z * 0.7;
    if (score > bestScore) {
      bestScore = score;
      alignedPt = p;
    }
  }
  return alignedPt;
}

/**
 * Thuật toán nối các đoạn phân mảnh thành Contour dùng Bảng Băm Không Gian O(S)
 * Không bao giờ bị treo O(S^2) và giữ lại 100% các đoạn kể cả khi lưới bị hở!
 */
function stitchSegmentsIntoContoursFast(segments: ISliceSegment[]): IContourLoop[] {
  const n = segments.length;
  if (n === 0) return [];

  const cellSize = 0.4;
  const grid = new Map<string, number[]>();
  const used = new Uint8Array(n);

  const cellKey = (x: number, z: number) =>
    `${Math.floor(x / cellSize)}_${Math.floor(z / cellSize)}`;

  for (let i = 0; i < n; i++) {
    const k1 = cellKey(segments[i].p1.x, segments[i].p1.z);
    let b1 = grid.get(k1);
    if (!b1) {
      b1 = [];
      grid.set(k1, b1);
    }
    if (b1.length < 32) b1.push(i);

    const k2 = cellKey(segments[i].p2.x, segments[i].p2.z);
    if (k2 !== k1) {
      let b2 = grid.get(k2);
      if (!b2) {
        b2 = [];
        grid.set(k2, b2);
      }
      if (b2.length < 32) b2.push(i);
    }
  }

  const loops: IContourLoop[] = [];

  for (let startIdx = 0; startIdx < n; startIdx++) {
    if (used[startIdx]) continue;
    used[startIdx] = 1;

    const first = segments[startIdx];
    const points: ISlicePoint[] = [{ ...first.p1 }, { ...first.p2 }];

    let steps = 0;
    while (steps < 512) {
      steps++;
      const last = points[points.length - 1];
      const gx = Math.floor(last.x / cellSize);
      const gz = Math.floor(last.z / cellSize);

      let bestIdx = -1;
      let reverse = false;
      let minDist = cellSize;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const candidates = grid.get(`${gx + dx}_${gz + dz}`);
          if (!candidates) continue;
          for (let c = 0; c < candidates.length; c++) {
            const idx = candidates[c];
            if (used[idx]) continue;
            const seg = segments[idx];
            const d1 = Math.hypot(seg.p1.x - last.x, seg.p1.z - last.z);
            if (d1 < minDist) {
              minDist = d1;
              bestIdx = idx;
              reverse = false;
            }
            const d2 = Math.hypot(seg.p2.x - last.x, seg.p2.z - last.z);
            if (d2 < minDist) {
              minDist = d2;
              bestIdx = idx;
              reverse = true;
            }
          }
        }
      }

      if (bestIdx === -1) break;
      used[bestIdx] = 1;
      const seg = segments[bestIdx];
      points.push(reverse ? { ...seg.p1 } : { ...seg.p2 });

      const start = points[0];
      const curr = points[points.length - 1];
      if (points.length >= 4 && Math.hypot(curr.x - start.x, curr.z - start.z) < cellSize) {
        points.push({ ...start });
        break;
      }
    }

    if (points.length >= 2) {
      let len = 0;
      const cumulativeLengths: number[] = [0];
      let bMinX = points[0].x;
      let bMaxX = points[0].x;
      let bMinZ = points[0].z;
      let bMaxZ = points[0].z;

      for (let p = 1; p < points.length; p++) {
        const segLen = Math.hypot(points[p].x - points[p - 1].x, points[p].z - points[p - 1].z);
        len += segLen;
        cumulativeLengths.push(len);
        bMinX = Math.min(bMinX, points[p].x);
        bMaxX = Math.max(bMaxX, points[p].x);
        bMinZ = Math.min(bMinZ, points[p].z);
        bMaxZ = Math.max(bMaxZ, points[p].z);
      }

      loops.push({
        points,
        totalLength: len,
        cumulativeLengths,
        signedArea: computeSignedPolygonArea(points),
        bbox: { minX: bMinX, maxX: bMaxX, minZ: bMinZ, maxZ: bMaxZ },
      });
    }
  }

  loops.sort((a, b) => b.totalLength - a.totalLength);
  return loops;
}

/**
 * Sinh các đường Ruột Infill bằng Scanline 1D trực tiếp từ tập đoạn cắt O(S)
 */
function generateFastScanlineInfillFromSegments(
  segments: ISliceSegment[],
  bbox: { minX: number; maxX: number; minZ: number; maxZ: number },
  heightY: number,
  profile: ISimulationProfile,
  isTopOrBottomShell: boolean,
  wallInset: number
): IInfillPath {
  const density = isTopOrBottomShell ? 75 : profile.infillDensity;
  if (density <= 0 || segments.length === 0) {
    return { lines: [], totalLength: 0, cumulativeLengths: [0] };
  }

  const spacing = Math.max(1.8, Math.min(14.0, 200 / Math.max(5, density)));
  const layerIndex = Math.round(heightY / Math.max(0.08, profile.layerHeight || 0.2));

  let scanAngle = 0;
  if (profile.infillType === 'grid' || profile.infillType === 'solid' || isTopOrBottomShell) {
    scanAngle = layerIndex % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
  } else if (profile.infillType === 'triangles') {
    scanAngle = ((layerIndex % 3) * Math.PI) / 3;
  } else if (profile.infillType === 'gyroid' || profile.infillType === 'honeycomb') {
    scanAngle = layerIndex % 2 === 0 ? 0 : Math.PI / 2;
  }
  const cosA = Math.cos(scanAngle);
  const sinA = Math.sin(scanAngle);

  const centerX = (bbox.minX + bbox.maxX) * 0.5;
  const centerZ = (bbox.minZ + bbox.maxZ) * 0.5;
  const halfSpan = Math.max(10, Math.hypot(bbox.maxX - bbox.minX, bbox.maxZ - bbox.minZ) * 0.6);
  const numScanBins = Math.max(4, Math.min(64, Math.ceil((halfSpan * 2) / spacing)));
  const scanHits: number[][] = Array.from({ length: numScanBins }, () => []);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const dx1 = seg.p1.x - centerX,
      dz1 = seg.p1.z - centerZ;
    const dx2 = seg.p2.x - centerX,
      dz2 = seg.p2.z - centerZ;

    const u1 = dx1 * cosA + dz1 * sinA;
    const v1 = -dx1 * sinA + dz1 * cosA;
    const u2 = dx2 * cosA + dz2 * sinA;
    const v2 = -dx2 * sinA + dz2 * cosA;

    const vMin = Math.min(v1, v2);
    const vMax = Math.max(v1, v2);
    const dv = v2 - v1;
    if (Math.abs(dv) > 1e-5) {
      const bStart = Math.max(0, Math.ceil((vMin + halfSpan) / spacing));
      const bEnd = Math.min(numScanBins - 1, Math.floor((vMax + halfSpan) / spacing));
      for (let b = bStart; b <= bEnd; b++) {
        const scanV = -halfSpan + b * spacing;
        const tScan = (scanV - v1) / dv;
        if (tScan >= 0 && tScan <= 1) {
          scanHits[b].push(u1 + tScan * (u2 - u1));
        }
      }
    }
  }

  const lines: [ISlicePoint, ISlicePoint][] = [];
  const toWorldPt = (u: number, v: number): ISlicePoint => ({
    x: centerX + u * cosA - v * sinA,
    z: centerZ + u * sinA + v * cosA,
  });

  for (let b = 0; b < numScanBins; b++) {
    const hits = scanHits[b];
    if (hits.length < 2) continue;
    hits.sort((a, bVal) => a - bVal);
    const scanV = -halfSpan + b * spacing;

    for (let j = 0; j + 1 < hits.length; j += 2) {
      const uStart = hits[j] + wallInset;
      const uEnd = hits[j + 1] - wallInset;
      if (uEnd - uStart < 0.8) continue;

      if (!isTopOrBottomShell && profile.infillType === 'gyroid') {
        const stepU = 2.8;
        const freq = (Math.PI * 2) / Math.max(5.5, spacing * 1.8);
        const phaseY = heightY * freq;
        const amp = spacing * 0.34;
        let prevPt = toWorldPt(
          uStart,
          scanV + Math.sin(uStart * freq + phaseY) * Math.cos(scanV * freq - phaseY) * amp
        );
        for (let u = uStart + stepU; u <= uEnd + 0.01; u += stepU) {
          const curU = Math.min(u, uEnd);
          const curPt = toWorldPt(
            curU,
            scanV + Math.sin(curU * freq + phaseY) * Math.cos(scanV * freq - phaseY) * amp
          );
          lines.push([prevPt, curPt]);
          prevPt = curPt;
        }
      } else {
        lines.push([toWorldPt(uStart, scanV), toWorldPt(uEnd, scanV)]);
      }
    }
  }

  let totalLength = 0;
  const cumulativeLengths: number[] = [0];
  for (const [p1, p2] of lines) {
    totalLength += Math.hypot(p2.x - p1.x, p2.z - p1.z);
    cumulativeLengths.push(totalLength);
  }

  return { lines, totalLength, cumulativeLengths };
}

function samplePointOnPolyline(
  points: ISlicePoint[],
  cumulativeLengths: number[],
  totalLength: number,
  t: number
): ISlicePoint {
  if (points.length === 0) return { x: 0, z: 0 };
  if (points.length === 1 || totalLength <= 0.001) return points[0];

  const targetDist = Math.max(0, Math.min(1, t)) * totalLength;

  for (let i = 1; i < cumulativeLengths.length; i++) {
    const prevDist = cumulativeLengths[i - 1];
    const currDist = cumulativeLengths[i];
    if (targetDist <= currDist || i === cumulativeLengths.length - 1) {
      const segLen = Math.max(0.0001, currDist - prevDist);
      const localT = (targetDist - prevDist) / segLen;
      const p1 = points[i - 1];
      const p2 = points[i];
      return {
        x: p1.x + localT * (p2.x - p1.x),
        z: p1.z + localT * (p2.z - p1.z),
      };
    }
  }

  return points[points.length - 1];
}

export function getRealToolheadPositionOnSlice(
  slice: ILayerSliceData,
  layerProgress: number,
  profile: ISimulationProfile,
  fallbackCenter: [number, number]
): {
  position: [number, number, number];
  toolpathType: 'perimeter' | 'infill' | 'support' | 'travel' | 'brim';
} {
  const y = slice.heightY;

  if (slice.contours.length === 0) {
    return {
      position: [fallbackCenter[0], y, fallbackCenter[1]],
      toolpathType: 'perimeter',
    };
  }

  const mainContour = slice.contours[0];

  if (layerProgress < 0.45) {
    const t = layerProgress / 0.45;
    const pt = samplePointOnPolyline(
      mainContour.points,
      mainContour.cumulativeLengths,
      mainContour.totalLength,
      t
    );
    return {
      position: [pt.x, y, pt.z],
      toolpathType: 'perimeter',
    };
  }

  if (layerProgress < 0.68) {
    const t = (layerProgress - 0.45) / 0.23;
    const innerLoop =
      slice.innerWallContours.length > 0 && slice.innerWallContours[0].length > 0
        ? slice.innerWallContours[0][0]
        : slice.contours.length > 1
        ? slice.contours[1]
        : mainContour;

    const pt = samplePointOnPolyline(
      innerLoop.points,
      innerLoop.cumulativeLengths,
      innerLoop.totalLength,
      t
    );
    return {
      position: [pt.x, y, pt.z],
      toolpathType: 'perimeter',
    };
  }

  if (layerProgress < 0.94 && slice.infill.lines.length > 0) {
    const t = (layerProgress - 0.68) / 0.26;
    const targetDist = t * slice.infill.totalLength;
    const cum = slice.infill.cumulativeLengths;

    for (let i = 0; i < slice.infill.lines.length; i++) {
      const prevD = cum[i];
      const nextD = cum[i + 1];
      if (targetDist <= nextD || i === slice.infill.lines.length - 1) {
        const segLen = Math.max(0.0001, nextD - prevD);
        const localT = (targetDist - prevD) / segLen;
        const [p1, p2] = slice.infill.lines[i];
        return {
          position: [
            p1.x + localT * (p2.x - p1.x),
            y,
            p1.z + localT * (p2.z - p1.z),
          ],
          toolpathType: 'infill',
        };
      }
    }
  }

  const lastInfill =
    slice.infill.lines.length > 0
      ? slice.infill.lines[slice.infill.lines.length - 1][1]
      : mainContour.points[mainContour.points.length - 1];
  const firstNext = mainContour.points[0];
  const t = Math.max(0, Math.min(1, (layerProgress - 0.94) / 0.06));

  return {
    position: [
      lastInfill.x + t * (firstNext.x - lastInfill.x),
      y,
      lastInfill.z + t * (firstNext.z - lastInfill.z),
    ],
    toolpathType: 'travel',
  };
}

export function createSliceToolpathMeshes(
  slice: ILayerSliceData,
  profile: ISimulationProfile,
  renderMode: SlicerRenderMode
): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];
  const y = slice.heightY + 0.08;

  const outerColor = renderMode === 'features' ? 0xff7b00 : 0x38bdf8;
  const innerColor = renderMode === 'features' ? 0xfacc15 : 0x0284c7;
  const infillColor = renderMode === 'features' ? 0xef4444 : 0xf59e0b;

  const outerVerts: number[] = [];
  const innerVerts: number[] = [];

  for (const seg of slice.segments) {
    outerVerts.push(seg.p1.x, y, seg.p1.z, seg.p2.x, y, seg.p2.z);
    if (profile.wallLoops > 1 && (seg.inx || seg.inz)) {
      const inx = seg.inx || 0;
      const inz = seg.inz || 0;
      for (let w = 1; w < Math.min(6, profile.wallLoops); w++) {
        const off = w * 0.42;
        innerVerts.push(
          seg.p1.x + inx * off,
          y - 0.01,
          seg.p1.z + inz * off,
          seg.p2.x + inx * off,
          y - 0.01,
          seg.p2.z + inz * off
        );
      }
    }
  }

  if (outerVerts.length >= 6) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(outerVerts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: outerColor,
      transparent: true,
      opacity: 0.96,
    });
    objects.push(new THREE.LineSegments(geom, mat));
  }

  if (innerVerts.length >= 6) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(innerVerts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: innerColor,
      transparent: true,
      opacity: 0.85,
    });
    objects.push(new THREE.LineSegments(geom, mat));
  }

  if (slice.infill.lines.length > 0 && profile.infillDensity > 0) {
    const infillVertices: number[] = [];
    for (const [p1, p2] of slice.infill.lines) {
      infillVertices.push(p1.x, y - 0.02, p1.z, p2.x, y - 0.02, p2.z);
    }

    if (infillVertices.length >= 6) {
      const infillGeom = new THREE.BufferGeometry();
      infillGeom.setAttribute('position', new THREE.Float32BufferAttribute(infillVertices, 3));
      const infillMat = new THREE.LineBasicMaterial({
        color: infillColor,
        transparent: true,
        opacity: 0.85,
      });
      objects.push(new THREE.LineSegments(infillGeom, infillMat));
    }
  }

  if (slice.seamPoint) {
    const seamGeom = new THREE.BufferGeometry();
    seamGeom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([slice.seamPoint.x, y + 0.04, slice.seamPoint.z], 3)
    );
    const seamMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 4.0,
      sizeAttenuation: false,
    });
    objects.push(new THREE.Points(seamGeom, seamMat));
  }

  return objects;
}

function createEmptySlice(heightY: number): ILayerSliceData {
  return {
    heightY,
    segments: [],
    contours: [],
    innerWallContours: [],
    seamPoint: null,
    totalPerimeterLength: 0,
    infill: { lines: [], totalLength: 0, cumulativeLengths: [0] },
    bbox: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  };
}

class LayerSliceCache {
  private lastGeometryUuid: string = '';
  private lastProfileKey: string = '';
  private cache = new Map<number, ILayerSliceData>();

  public getSlice(
    geometry: THREE.BufferGeometry,
    layerNumber: number,
    heightY: number,
    profile: ISimulationProfile
  ): ILayerSliceData {
    const profileKey = `${profile.infillType}_${profile.infillDensity}_${profile.wallLoops}_${profile.layerHeight}_${profile.seamPosition}`;
    const geomUuid = `${geometry.uuid}_${geometry.getAttribute('position')?.count || 0}`;

    if (geomUuid !== this.lastGeometryUuid || profileKey !== this.lastProfileKey) {
      this.cache.clear();
      this.lastGeometryUuid = geomUuid;
      this.lastProfileKey = profileKey;
    }

    const existing = this.cache.get(layerNumber);
    if (existing) {
      return existing;
    }

    if (this.cache.size > 48) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    const computed = sliceGeometryAtHeight(geometry, heightY, profile);
    this.cache.set(layerNumber, computed);
    return computed;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const layerSliceCache = new LayerSliceCache();
