import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  ISimulationProfile,
  ISupportOverhangPatch,
  TreeSupportStyle,
} from '@/types/simulator';
import {
  SdfGrid2D,
  sminPoly,
  extractMarchingSquaresSegments,
} from './polygonSdf2D';

export interface IOverhangTriangle {
  ax: number;
  ay: number;
  az: number;
  bx: number;
  by: number;
  bz: number;
  cx: number;
  cy: number;
  cz: number;
  mx: number;
  my: number;
  mz: number;
  nx: number;
  ny: number;
  nz: number;
  area: number;
  angleDeg: number;
  floorY: number;
}

export interface IConformalOverhangPatch extends ISupportOverhangPatch {
  normal: [number, number, number];
  floorY: number;
  triangles: IOverhangTriangle[];
}

export interface ITreeCapsuleSegment {
  x0: number;
  y0: number;
  z0: number;
  r0: number;
  x1: number;
  y1: number;
  z1: number;
  r1: number;
  isNearTip: boolean;
}

export interface ITreeSupport2DLevelDisc {
  x: number;
  z: number;
  r: number;
  nearTip: boolean;
}

export interface ITreeInterfacePad {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  radius: number;
}

/**
 * Dữ liệu trường thể tích Tree Support 2.0 dùng chung đồng bộ 1:1 giữa:
 * - Chế độ Khối 3D (Sparse Surface Nets Implicit Bark Mesh)
 * - Chế độ Sợi In (2D Marching Squares Hollow 1-2 Wall Loops + Concentric Root Brim + Roof Interface)
 */
export interface ITreeSupport2DVolume {
  minY: number;
  maxY: number;
  levelStepY: number;
  numLevels: number;
  gridRes: number;
  gridMinX: number;
  gridMinZ: number;
  cellSize: number;
  xyClearanceMm: number;
  topZDistMm: number;
  interfaceHeightMm: number;
  smoothUnionK: number;
  levelModelSdfs: Float32Array[];
  levelDiscs: ITreeSupport2DLevelDisc[][];
  capsules: ITreeCapsuleSegment[];
  interfacePads: ITreeInterfacePad[];
  groundedRoots: { x: number; z: number; r: number }[];
}

const INF_ESCAPE = 1e6;

// 12 cạnh chuẩn của ô lập phương đơn vị cho thuật toán Surface Nets
// Đánh số góc c = dx + 2*dy + 4*dz (0..7)
const CUBE_EDGES: ReadonlyArray<[number, number]> = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7], // 4 cạnh song song trục X
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7], // 4 cạnh song song trục Y
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7], // 4 cạnh song song trục Z
];

function safeMergeGeometries(geoms: (THREE.BufferGeometry | null)[]): THREE.BufferGeometry | null {
  const valid = geoms.filter(
    (g): g is THREE.BufferGeometry =>
      g !== null &&
      g !== undefined &&
      g.getAttribute('position') !== undefined &&
      g.getAttribute('position').count > 0
  );
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];
  try {
    return BufferGeometryUtils.mergeGeometries(valid, false);
  } catch {
    return valid[0];
  }
}

/**
 * Cắt tam giác Overhang gọn trong bán kính đệm tiếp xúc đầu nhánh để lớp Support Roof (#d946ef)
 * ôm khít 100% mặt dưới mô hình mà không bao giờ chòi ra ngoài rìa mẫu.
 */
function buildPatchConformalCapGeometry(
  patch: IConformalOverhangPatch,
  capRadius: number,
  topZDistanceMm: number = 0.2,
  interfaceLayers: number = 2
): THREE.BufferGeometry | null {
  if (!patch.triangles || patch.triangles.length === 0) return null;

  const positions: number[] = [];
  const layerThickness = Math.max(0.14, Math.min(0.45, interfaceLayers * 0.16));
  const [cx, cy, cz] = patch.center;
  const maxDist = Math.max(1.3, capRadius * 1.45);

  for (const tri of patch.triangles) {
    if (Math.hypot(tri.mx - cx, tri.mz - cz) > maxDist || Math.abs(tri.my - cy) > 2.6) {
      continue;
    }

    // Kéo nhẹ đỉnh xa tâm vào vùng bán kính đệm để nắp tiếp xúc gọn mịn
    const clampVertex = (vx: number, vy: number, vz: number): [number, number, number] => {
      const dx = vx - cx;
      const dz = vz - cz;
      const d = Math.hypot(dx, dz);
      if (d <= capRadius) return [vx, vy, vz];
      const s = capRadius / d;
      return [cx + dx * s, cy + (vy - cy) * s, cz + dz * s];
    };

    const [ax, ay, az] = clampVertex(tri.ax, tri.ay, tri.az);
    const [bx, by, bz] = clampVertex(tri.bx, tri.by, tri.bz);
    const [ccx, ccy, ccz] = clampVertex(tri.cx, tri.cy, tri.cz);

    const topOff = Math.max(0.06, topZDistanceMm * 0.55);
    const botOff = topOff + layerThickness;

    const aTopX = ax + tri.nx * topOff,
      aTopY = Math.max(0.22, ay + tri.ny * topOff),
      aTopZ = az + tri.nz * topOff;
    const bTopX = bx + tri.nx * topOff,
      bTopY = Math.max(0.22, by + tri.ny * topOff),
      bTopZ = bz + tri.nz * topOff;
    const cTopX = ccx + tri.nx * topOff,
      cTopY = Math.max(0.22, ccy + tri.ny * topOff),
      cTopZ = ccz + tri.nz * topOff;

    const aBotX = ax + tri.nx * botOff,
      aBotY = Math.max(0.16, ay + tri.ny * botOff),
      aBotZ = az + tri.nz * botOff;
    const bBotX = bx + tri.nx * botOff,
      bBotY = Math.max(0.16, by + tri.ny * botOff),
      bBotZ = bz + tri.nz * botOff;
    const cBotX = ccx + tri.nx * botOff,
      cBotY = Math.max(0.16, ccy + tri.ny * botOff),
      cBotZ = ccz + tri.nz * botOff;

    // Mặt trên + Mặt dưới + 3 vách bên của tấm đệm Conformal Support Roof
    positions.push(aTopX, aTopY, aTopZ, cTopX, cTopY, cTopZ, bTopX, bTopY, bTopZ);
    positions.push(aBotX, aBotY, aBotZ, bBotX, bBotY, bBotZ, cBotX, cBotY, cBotZ);

    positions.push(aTopX, aTopY, aTopZ, bTopX, bTopY, bTopZ, bBotX, bBotY, bBotZ);
    positions.push(aTopX, aTopY, aTopZ, bBotX, bBotY, bBotZ, aBotX, aBotY, aBotZ);

    positions.push(bTopX, bTopY, bTopZ, cTopX, cTopY, cTopZ, cBotX, cBotY, cBotZ);
    positions.push(bTopX, bTopY, bTopZ, cBotX, cBotY, cBotZ, bBotX, bBotY, bBotZ);

    positions.push(cTopX, cTopY, cTopZ, aTopX, aTopY, aTopZ, aBotX, aBotY, aBotZ);
    positions.push(cTopX, cTopY, cTopZ, aBotX, aBotY, aBotZ, cBotX, cBotY, cBotZ);
  }

  if (positions.length === 0) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}

interface IPreindexedModelTriangles {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  triCoords: Float32Array; // 9 floats per triangle: ax,ay,az, bx,by,bz, cx,cy,cz
  triCount: number;
  numYBuckets: number;
  bucketStepY: number;
  buckets: Int32Array[];
}

function buildPreindexedTriangles(geometry: THREE.BufferGeometry): IPreindexedModelTriangles | null {
  const posAttr = geometry.getAttribute('position');
  if (!posAttr || posAttr.count < 3) return null;

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minX = bbox.min.x,
    maxX = bbox.max.x;
  const minY = bbox.min.y,
    maxY = bbox.max.y;
  const minZ = bbox.min.z,
    maxZ = bbox.max.z;
  const height = Math.max(0.5, maxY - minY);

  const indexAttr = geometry.getIndex();
  const rawTriCount = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(posAttr.count / 3);
  if (rawTriCount <= 0) return null;

  // Giữ độ chính xác cao lên tới 90.000 tam giác cho bộ dựng SDF & Overhang
  const stride = Math.max(1, Math.floor(rawTriCount / 90000));
  const estCount = Math.ceil(rawTriCount / stride);
  const triCoords = new Float32Array(estCount * 9);

  const numYBuckets = 64;
  const bucketStepY = height / numYBuckets;
  const tempBuckets: number[][] = Array.from({ length: numYBuckets }, () => []);

  let validCount = 0;
  for (let t = 0; t < rawTriCount; t += stride) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    const ax = posAttr.getX(i0),
      ay = posAttr.getY(i0),
      az = posAttr.getZ(i0);
    const bx = posAttr.getX(i1),
      by = posAttr.getY(i1),
      bz = posAttr.getZ(i1);
    const cx = posAttr.getX(i2),
      cy = posAttr.getY(i2),
      cz = posAttr.getZ(i2);

    const base = validCount * 9;
    triCoords[base] = ax;
    triCoords[base + 1] = ay;
    triCoords[base + 2] = az;
    triCoords[base + 3] = bx;
    triCoords[base + 4] = by;
    triCoords[base + 5] = bz;
    triCoords[base + 6] = cx;
    triCoords[base + 7] = cy;
    triCoords[base + 8] = cz;

    const tMinY = Math.min(ay, by, cy);
    const tMaxY = Math.max(ay, by, cy);
    const b0 = Math.max(0, Math.min(numYBuckets - 1, Math.floor((tMinY - minY) / bucketStepY)));
    const b1 = Math.max(0, Math.min(numYBuckets - 1, Math.floor((tMaxY - minY) / bucketStepY)));
    for (let b = b0; b <= b1; b++) {
      tempBuckets[b].push(validCount);
    }

    validCount++;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    triCoords: triCoords.subarray(0, validCount * 9),
    triCount: validCount,
    numYBuckets,
    bucketStepY,
    buckets: tempBuckets.map((arr) => new Int32Array(arr)),
  };
}

/**
 * Cắt nhanh lưới tam giác tại mặt phẳng Y = sliceY thành các đoạn 2D [x1, z1, x2, z2]
 */
function intersectPreindexedAtY(
  pre: IPreindexedModelTriangles,
  sliceY: number,
  outSegBuf: Float32Array
): number {
  const bIdx = Math.max(
    0,
    Math.min(pre.numYBuckets - 1, Math.floor((sliceY - pre.minY) / pre.bucketStepY))
  );
  const bucket = pre.buckets[bIdx];
  const coords = pre.triCoords;
  const maxSegs = Math.floor(outSegBuf.length / 4);
  let segCount = 0;

  for (let i = 0; i < bucket.length; i++) {
    const base = bucket[i] * 9;
    const ay = coords[base + 1];
    const by = coords[base + 4];
    const cy = coords[base + 7];

    const sA = ay - sliceY;
    const sB = by - sliceY;
    const sC = cy - sliceY;
    if ((sA > 0 && sB > 0 && sC > 0) || (sA < 0 && sB < 0 && sC < 0)) continue;

    const ax = coords[base],
      az = coords[base + 2];
    const bx = coords[base + 3],
      bz = coords[base + 5];
    const cx = coords[base + 6],
      cz = coords[base + 8];

    let p1x = 0,
      p1z = 0,
      p2x = 0,
      p2z = 0;
    let hits = 0;

    if ((sA >= 0 && sB < 0) || (sA < 0 && sB >= 0)) {
      const dy = by - ay;
      if (Math.abs(dy) > 1e-6) {
        const t = (sliceY - ay) / dy;
        p1x = ax + t * (bx - ax);
        p1z = az + t * (bz - az);
        hits = 1;
      }
    }
    if ((sB >= 0 && sC < 0) || (sB < 0 && sC >= 0)) {
      const dy = cy - by;
      if (Math.abs(dy) > 1e-6) {
        const t = (sliceY - by) / dy;
        const ix = bx + t * (cx - bx);
        const iz = bz + t * (cz - bz);
        if (hits === 0) {
          p1x = ix;
          p1z = iz;
          hits = 1;
        } else {
          p2x = ix;
          p2z = iz;
          hits = 2;
        }
      }
    }
    if (hits < 2 && ((sC >= 0 && sA < 0) || (sC < 0 && sA >= 0))) {
      const dy = ay - cy;
      if (Math.abs(dy) > 1e-6) {
        const t = (sliceY - cy) / dy;
        const ix = cx + t * (ax - cx);
        const iz = cz + t * (az - cz);
        if (hits === 0) {
          p1x = ix;
          p1z = iz;
          hits = 1;
        } else {
          p2x = ix;
          p2z = iz;
          hits = 2;
        }
      }
    }

    if (hits === 2 && segCount < maxSegs) {
      if (Math.hypot(p2x - p1x, p2z - p1z) > 0.005) {
        const o = segCount * 4;
        outSegBuf[o] = p1x;
        outSegBuf[o + 1] = p1z;
        outSegBuf[o + 2] = p2x;
        outSegBuf[o + 3] = p2z;
        segCount++;
      }
    }
  }

  return segCount;
}

/**
 * 1. Quét tán lá mao mạch Overhang mật độ cao (lên tới 180 cụm chi tiết nhỏ như răng, vảy, ngón tay, cằm)
 */
function extractHighDensityOverhangPatches(
  pre: IPreindexedModelTriangles,
  thresholdDeg: number = 45,
  maxPatchesCap: number = 180
): IConformalOverhangPatch[] {
  const height = Math.max(0.5, pre.maxY - pre.minY);
  const spanX = Math.max(1, pre.maxX - pre.minX);
  const spanZ = Math.max(1, pre.maxZ - pre.minZ);
  const maxSpan = Math.max(spanX, height, spanZ);

  // Ngưỡng góc Bambu Studio: thresholdDeg (mặc định 45° tính từ phương đứng/ngang)
  const sinThresh = Math.sin((Math.max(15, Math.min(80, 90 - thresholdDeg)) * Math.PI) / 180);

  // Lưới chiếu sàn mịn để kiểm tra khoảng hở thẳng đứng dưới mỗi tam giác Overhang
  const floorRes = 96;
  const floorStepX = spanX / floorRes;
  const floorStepZ = spanZ / floorRes;
  const cellTopSurfaceHeights: number[][] = Array.from({ length: floorRes * floorRes }, () => []);

  const coords = pre.triCoords;
  const candidates: Omit<IOverhangTriangle, 'floorY'>[] = [];

  for (let t = 0; t < pre.triCount; t++) {
    const b = t * 9;
    const ax = coords[b],
      ay = coords[b + 1],
      az = coords[b + 2];
    const bx = coords[b + 3],
      by = coords[b + 4],
      bz = coords[b + 5];
    const cx = coords[b + 6],
      cy = coords[b + 7],
      cz = coords[b + 8];

    const e1x = bx - ax,
      e1y = by - ay,
      e1z = bz - az;
    const e2x = cx - ax,
      e2y = cy - ay,
      e2z = cz - az;

    const cpx = e1y * e2z - e1z * e2y;
    const cpy = e1z * e2x - e1x * e2z;
    const cpz = e1x * e2y - e1y * e2x;
    const doubleArea = Math.hypot(cpx, cpy, cpz);
    if (doubleArea < 0.03) continue;

    const nx = cpx / doubleArea;
    const ny = cpy / doubleArea;
    const nz = cpz / doubleArea;
    const mx = (ax + bx + cx) / 3;
    const my = (ay + by + cy) / 3;
    const mz = (az + bz + cz) / 3;
    const relY = my - pre.minY;

    // Ghi nhận mặt hướng lên làm sàn cản bên dưới
    if (ny > 0.25 && relY > 0.3) {
      const fx = Math.max(0, Math.min(floorRes - 1, Math.floor((mx - pre.minX) / floorStepX)));
      const fz = Math.max(0, Math.min(floorRes - 1, Math.floor((mz - pre.minZ) / floorStepZ)));
      cellTopSurfaceHeights[fx * floorRes + fz].push(my);
    }

    // Tam giác hướng xuống vượt ngưỡng Overhang và cao hơn mép vát đế 1.6mm
    if (ny < -sinThresh && relY >= 1.6) {
      const angleFromVertical = (Math.acos(Math.max(-1, Math.min(1, -ny))) * 180) / Math.PI;
      candidates.push({
        ax,
        ay,
        az,
        bx,
        by,
        bz,
        cx,
        cy,
        cz,
        mx,
        my,
        mz,
        nx,
        ny,
        nz,
        area: doubleArea * 0.5,
        angleDeg: 90 - angleFromVertical, // 90° = trần nằm ngang nguy hiểm nhất
      });
    }
  }

  if (candidates.length === 0) return [];

  // Kích thước ô gom cụm mao mạch nhỏ (2.6mm - 5.2mm) để sinh tán cành dày đặc như Bambu Studio
  const cellMm = Math.max(2.6, Math.min(5.4, maxSpan * 0.042));
  const cellY = Math.max(2.2, cellMm * 0.85);
  const buckets = new Map<string, IOverhangTriangle[]>();

  for (const c of candidates) {
    const fx = Math.max(0, Math.min(floorRes - 1, Math.floor((c.mx - pre.minX) / floorStepX)));
    const fz = Math.max(0, Math.min(floorRes - 1, Math.floor((c.mz - pre.minZ) / floorStepZ)));
    const floors = cellTopSurfaceHeights[fx * floorRes + fz];

    let nearestBelow = pre.minY;
    for (let k = 0; k < floors.length; k++) {
      const fy = floors[k];
      if (fy < c.my - 0.35 && fy > nearestBelow) {
        nearestBelow = fy;
      }
    }

    // Bỏ qua khe tự đỡ quá hẹp (< 1.5mm) không đủ nhét đầu nhánh & lớp đệm
    if (c.my - nearestBelow < 1.5) continue;

    const key = `${Math.floor(c.mx / cellMm)}_${Math.floor(c.my / cellY)}_${Math.floor(c.mz / cellMm)}`;
    let list = buckets.get(key);
    if (!list) {
      list = [];
      buckets.set(key, list);
    }
    list.push({ ...c, floorY: nearestBelow });
  }

  const scoredPatches: { score: number; patch: IConformalOverhangPatch }[] = [];
  let idxCounter = 0;

  buckets.forEach((tris) => {
    let areaSum = 0;
    let wx = 0,
      wy = 0,
      wz = 0;
    let wnx = 0,
      wny = 0,
      wnz = 0;
    let maxDangerAngle = 0;
    let weightedAngle = 0;
    let maxFloorY = pre.minY;

    for (const t of tris) {
      areaSum += t.area;
      wx += t.mx * t.area;
      wy += t.my * t.area;
      wz += t.mz * t.area;
      wnx += t.nx * t.area;
      wny += t.ny * t.area;
      wnz += t.nz * t.area;
      weightedAngle += t.angleDeg * t.area;
      if (t.angleDeg > maxDangerAngle) maxDangerAngle = t.angleDeg;
      if (t.floorY > maxFloorY) maxFloorY = t.floorY;
    }

    if (areaSum < 0.28) return;

    const cx = wx / areaSum;
    const cy = wy / areaSum;
    const cz = wz / areaSum;
    const nLen = Math.hypot(wnx, wny, wnz) || 1;
    const avgAngle = weightedAngle / areaSum;
    const severity: 'critical' | 'moderate' | 'mild' =
      maxDangerAngle >= 62 ? 'critical' : maxDangerAngle >= 50 ? 'moderate' : 'mild';

    // Chọn điểm neo tiếp xúc thực nằm đúng trên tam giác gần trọng tâm cụm nhất
    let bestTri = tris[0];
    let bestDist = Infinity;
    for (const t of tris) {
      const d = Math.hypot(t.mx - cx, t.my - cy, t.mz - cz);
      if (d < bestDist) {
        bestDist = d;
        bestTri = t;
      }
    }

    const score = areaSum * (1 + maxDangerAngle / 45) * (1 + (cy - pre.minY) / height * 0.35);
    scoredPatches.push({
      score,
      patch: {
        id: `patch-v2-${idxCounter++}`,
        center: [
          Number(bestTri.mx.toFixed(2)),
          Number(bestTri.my.toFixed(2)),
          Number(bestTri.mz.toFixed(2)),
        ],
        normal: [wnx / nLen, wny / nLen, wnz / nLen],
        floorY: maxFloorY,
        triangles: tris,
        areaMm2: Number(areaSum.toFixed(2)),
        minAngleDeg: Number((90 - maxDangerAngle).toFixed(1)),
        avgAngleDeg: Number((90 - avgAngle).toFixed(1)),
        severity,
        requiresSupport: true,
        isBridge: maxDangerAngle > 75 && areaSum > 6.5,
      },
    });
  });

  scoredPatches.sort((a, b) => b.score - a.score);
  return scoredPatches.slice(0, maxPatchesCap).map((s) => s.patch);
}

/**
 * API tương thích cho Preflight Analyzer & các dịch vụ kiểm tra Overhang
 */
export function detectOverhangPatches(
  geometry: THREE.BufferGeometry,
  thresholdDeg: number = 45,
  _buildPlateOnly: boolean = true
): ISupportOverhangPatch[] {
  const pre = buildPreindexedTriangles(geometry);
  if (!pre) return [];
  return extractHighDensityOverhangPatches(pre, thresholdDeg, 96);
}

interface IActiveTreeNode {
  id: number;
  x: number;
  z: number;
  r: number;
  ageLevels: number;
  tipWeight: number;
  allowModelFloorLanding: boolean;
  terminated: boolean;
}

/**
 * 2. Thuật toán Nhân Tree Support 2.0 Quét Ngược Từng Lớp (Top-Down Layer-wise Influence Areas + 2D SDF):
 * - Dựng chồng mặt cắt 2D SDF chính xác của mô hình & Trường Đường Hầm Thoát Hiểm (Escape Tunnel Field) từ bàn in lên đỉnh.
 * - Cho hàng trăm nhánh mao mạch mọc từ ngọn xuống đáy: tự luồn lách qua kẽ chân/vòm cửa với khe hở 0.38mm
 *   và tự hút nhau gộp nhánh bảo toàn diện tích như rễ cây thật của Bambu Studio!
 */
export function computeTreeSupport2DVolume(
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  overhangThreshold: number = 45
): { volume: ITreeSupport2DVolume; patches: IConformalOverhangPatch[] } | null {
  const pre = buildPreindexedTriangles(geometry);
  if (!pre) return null;

  const effectiveThreshold = profile.supportAngleThreshold || overhangThreshold || 45;
  let patches = extractHighDensityOverhangPatches(pre, effectiveThreshold, 175);
  if (patches.length === 0 && effectiveThreshold < 58) {
    patches = extractHighDensityOverhangPatches(pre, 58, 120);
  }
  if (patches.length === 0) return null;

  const style: TreeSupportStyle = profile.treeStyle || 'organic';
  const branchDiaScale = Math.max(0.65, Math.min(1.5, (profile.supportBranchDiameter || 2.0) / 2.2));
  const branchAngleDeg = Math.max(25, Math.min(58, profile.supportBranchAngle || 42));
  const tanBranchAngle = Math.tan((branchAngleDeg * Math.PI) / 180);
  const buildPlateOnly = profile.supportOnBuildPlateOnly !== false;
  const topZDistMm = profile.supportTopZDistance ?? 0.2;
  const interfaceLayers = profile.supportInterfaceLayers ?? 2;
  const interfaceHeightMm = Math.max(0.2, interfaceLayers * (profile.layerHeight || 0.2));
  const xyClearanceMm = 0.38;

  let tipRadius = 0.56 * branchDiaScale;
  let maxTrunkRadius = 2.65 * branchDiaScale;
  let mergeRangeScale = 1.0;
  let smoothUnionK = 0.72;

  if (style === 'slim') {
    tipRadius = 0.46 * branchDiaScale;
    maxTrunkRadius = 1.95 * branchDiaScale;
    mergeRangeScale = 0.85;
    smoothUnionK = 0.52;
  } else if (style === 'strong') {
    tipRadius = 0.68 * branchDiaScale;
    maxTrunkRadius = 3.35 * branchDiaScale;
    mergeRangeScale = 1.22;
    smoothUnionK = 0.92;
  } else if (style === 'hybrid') {
    tipRadius = 0.60 * branchDiaScale;
    maxTrunkRadius = 2.85 * branchDiaScale;
    mergeRangeScale = 1.1;
    smoothUnionK = 0.75;
  }

  const height = Math.max(1.0, pre.maxY - pre.minY);
  const spanX = Math.max(2.0, pre.maxX - pre.minX);
  const spanZ = Math.max(2.0, pre.maxZ - pre.minZ);
  const margin = Math.max(12.0, Math.max(spanX, spanZ) * 0.22);

  const gridRes = 84;
  const boxSpan = Math.max(spanX + margin * 2, spanZ + margin * 2);
  const cellSize = boxSpan / gridRes;
  const centerX = (pre.minX + pre.maxX) * 0.5;
  const centerZ = (pre.minZ + pre.maxZ) * 0.5;
  const gridMinX = centerX - boxSpan * 0.5;
  const gridMinZ = centerZ - boxSpan * 0.5;

  const numLevels = Math.max(24, Math.min(68, Math.round(height / 1.45)));
  const levelStepY = height / numLevels;

  // Bước 2.1: Xây dựng chồng mặt cắt 2D SDF chính xác của mô hình trên toàn bộ numLevels độ cao
  const sdfWorkGrid = new SdfGrid2D(gridRes, gridRes);
  sdfWorkGrid.configureBounds(gridMinX, gridMinZ, cellSize);
  const segScratch = new Float32Array(24000 * 4);
  const levelModelSdfs: Float32Array[] = new Array(numLevels);

  for (let k = 0; k < numLevels; k++) {
    const ySlice = pre.minY + (k + 0.35) * levelStepY;
    const segCount = intersectPreindexedAtY(pre, ySlice, segScratch);
    sdfWorkGrid.rasterizeSegments(segScratch, segCount);
    sdfWorkGrid.computeSignedDistanceField();
    levelModelSdfs[k] = new Float32Array(sdfWorkGrid.sdf);
  }

  // Bước 2.2: Lan truyền từ bàn in lên đỉnh (Bottom-Up Escape Tunnel Field)
  // Tìm hành lang thoát hiểm hợp lệ theo góc nghiêng <= branchAngle từ mọi hốc/vòm xuống vùng bàn in trống!
  const escapeFields: Float32Array[] = new Array(numLevels);
  const totalCells = gridRes * gridRes;

  const esc0 = new Float32Array(totalCells);
  const sdf0 = levelModelSdfs[0];
  for (let i = 0; i < totalCells; i++) {
    esc0[i] = sdf0[i] >= xyClearanceMm + 0.25 ? 0 : INF_ESCAPE;
  }
  escapeFields[0] = esc0;

  const maxStepMm = levelStepY * tanBranchAngle;
  const searchCellRad = Math.max(1, Math.min(3, Math.ceil(maxStepMm / cellSize)));

  for (let k = 1; k < numLevels; k++) {
    const prevEsc = escapeFields[k - 1];
    const curSdf = levelModelSdfs[k];
    const curEsc = new Float32Array(totalCells);

    for (let gz = 0; gz < gridRes; gz++) {
      const row = gz * gridRes;
      for (let gx = 0; gx < gridRes; gx++) {
        const idx = row + gx;
        const dModel = curSdf[idx];
        if (dModel < xyClearanceMm) {
          curEsc[idx] = INF_ESCAPE;
          continue;
        }

        let best = INF_ESCAPE;
        const z0 = Math.max(0, gz - searchCellRad);
        const z1 = Math.min(gridRes - 1, gz + searchCellRad);
        const x0 = Math.max(0, gx - searchCellRad);
        const x1 = Math.min(gridRes - 1, gx + searchCellRad);

        for (let nz = z0; nz <= z1; nz++) {
          const dzMm = (nz - gz) * cellSize;
          for (let nx = x0; nx <= x1; nx++) {
            const dxMm = (nx - gx) * cellSize;
            const horizMm = Math.hypot(dxMm, dzMm);
            if (horizMm > maxStepMm + cellSize * 0.65) continue;

            const pVal = prevEsc[nz * gridRes + nx];
            if (pVal >= INF_ESCAPE * 0.5) continue;

            // Khuyến khích đường đi hơi thoáng khỏi mặt tường nhưng vẫn ưu tiên đường ngắn nhất
            const wallPenalty = dModel < 1.8 ? (1.8 - dModel) * 0.22 : 0;
            const cand = pVal + horizMm + levelStepY * 0.35 + wallPenalty;
            if (cand < best) best = cand;
          }
        }
        curEsc[idx] = best;
      }
    }
    escapeFields[k] = curEsc;
  }

  const sampleGridField = (arr: Float32Array, wx: number, wz: number): number => {
    const fx = (wx - gridMinX) / cellSize - 0.5;
    const fz = (wz - gridMinZ) / cellSize - 0.5;
    const cx = Math.max(0, Math.min(gridRes - 1, Math.round(fx)));
    const cz = Math.max(0, Math.min(gridRes - 1, Math.round(fz)));
    if (fx < 0 || fz < 0 || fx >= gridRes - 1 || fz >= gridRes - 1) {
      const edge = arr[cz * gridRes + cx];
      if (edge >= INF_ESCAPE * 0.5) return edge;
      const ox = fx < 0 ? -fx : fx > gridRes - 1 ? fx - (gridRes - 1) : 0;
      const oz = fz < 0 ? -fz : fz > gridRes - 1 ? fz - (gridRes - 1) : 0;
      return edge + Math.hypot(ox, oz) * cellSize;
    }
    const x0 = Math.floor(fx),
      z0 = Math.floor(fz);
    const tx = fx - x0,
      tz = fz - z0;
    const r0 = z0 * gridRes,
      r1 = (z0 + 1) * gridRes;
    const v00 = arr[r0 + x0],
      v10 = arr[r0 + x0 + 1],
      v01 = arr[r1 + x0],
      v11 = arr[r1 + x0 + 1];
    if (v00 >= INF_ESCAPE * 0.5 || v10 >= INF_ESCAPE * 0.5 || v01 >= INF_ESCAPE * 0.5 || v11 >= INF_ESCAPE * 0.5) {
      return Math.min(v00, v10, v01, v11);
    }
    const a = v00 + (v10 - v00) * tx;
    const b = v01 + (v11 - v01) * tx;
    return a + (b - a) * tz;
  };

  const sampleModelGradient = (sdfArr: Float32Array, wx: number, wz: number): [number, number] => {
    const eps = cellSize * 0.8;
    const dx = sampleGridField(sdfArr, wx + eps, wz) - sampleGridField(sdfArr, wx - eps, wz);
    const dz = sampleGridField(sdfArr, wx, wz + eps) - sampleGridField(sdfArr, wx, wz - eps);
    const len = Math.hypot(dx, dz);
    if (len < 1e-5) {
      const rx = wx - centerX,
        rz = wz - centerZ;
      const rLen = Math.hypot(rx, rz) || 1;
      return [rx / rLen, rz / rLen];
    }
    return [dx / len, dz / len];
  };

  // Phân bổ các đầu nhánh mao mạch vào đúng tầng cao độ xuất phát
  const patchesByLevel: IConformalOverhangPatch[][] = Array.from({ length: numLevels }, () => []);
  const acceptedPatches: IConformalOverhangPatch[] = [];
  const interfacePads: ITreeInterfacePad[] = [];

  for (const p of patches) {
    const contactY = p.center[1] - topZDistMm - interfaceHeightMm * 0.5;
    const lvl = Math.max(
      1,
      Math.min(numLevels - 1, Math.floor((contactY - pre.minY) / levelStepY))
    );
    patchesByLevel[lvl].push(p);
  }

  // Bước 2.3: Quét ngược Top-Down từ đỉnh (numLevels - 1) xuống bàn in (0)
  const levelDiscs: ITreeSupport2DLevelDisc[][] = Array.from({ length: numLevels }, () => []);
  const capsules: ITreeCapsuleSegment[] = [];
  let activeNodes: IActiveTreeNode[] = [];
  let nextNodeId = 1;

  const isNormalMode = profile.supportMode === 'normal';

  for (let k = numLevels - 1; k >= 0; k--) {
    const yCur = pre.minY + (k + 0.35) * levelStepY;
    const yAbove = pre.minY + (k + 1.35) * levelStepY;
    const curSdf = levelModelSdfs[k];
    const curEsc = escapeFields[k];

    // A. Di chuyển tất cả các nhánh đang hoạt động từ tầng k + 1 xuống tầng k
    const nextActive: IActiveTreeNode[] = [];

    for (const node of activeNodes) {
      if (node.terminated) continue;
      const prevX = node.x;
      const prevZ = node.z;
      const prevR = node.r;

      let nx = prevX;
      let nz = prevZ;
      node.ageLevels++;

      if (!isNormalMode) {
        // 1. Dẫn đường mượt xuống hành lang thoát hiểm ngắn nhất trên trường Escape Field
        let bestCandEsc = sampleGridField(curEsc, nx, nz);
        let bestDx = 0;
        let bestDz = 0;
        const probeR = Math.min(maxStepMm * 0.92, cellSize * 1.65);

        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          const px = nx + Math.cos(ang) * probeR;
          const pz = nz + Math.sin(ang) * probeR;
          const dMod = sampleGridField(curSdf, px, pz);
          if (dMod < prevR + xyClearanceMm * 0.8) continue;
          const eVal = sampleGridField(curEsc, px, pz);
          if (eVal < bestCandEsc - 0.08) {
            bestCandEsc = eVal;
            bestDx = px - nx;
            bestDz = pz - nz;
          }
        }

        nx += bestDx * 0.72;
        nz += bestDz * 0.72;
      }

      // 2. Xử lý chạm mặt sàn mô hình bên dưới nếu ở chế độ Support Everywhere (!buildPlateOnly)
      const dAtTarget = sampleGridField(curSdf, nx, nz);
      if (node.allowModelFloorLanding && node.ageLevels >= 2 && dAtTarget <= 0.18) {
        capsules.push({
          x0: prevX,
          y0: yAbove,
          z0: prevZ,
          r0: prevR,
          x1: prevX,
          y1: Math.max(pre.minY + 0.2, yCur + levelStepY * 0.35),
          z1: prevZ,
          r1: prevR * 1.12,
          isNearTip: node.ageLevels <= 2,
        });
        node.terminated = true;
        continue;
      }

      // 3. Đảm bảo khoảng cách an toàn tuyệt đối 0.38mm tới bề mặt mô hình ở tầng k
      const clearanceRamp = node.ageLevels <= 2 ? 0.14 + node.ageLevels * 0.12 : xyClearanceMm;
      const reqDist = prevR * 0.75 + clearanceRamp;
      let curDist = sampleGridField(curSdf, nx, nz);

      if (curDist < reqDist) {
        if (isNormalMode && buildPlateOnly && curDist < -0.2) {
          // Cột thẳng đứng Normal Support bị chặn bởi thân mẫu khi bật Build Plate Only -> Dừng
          node.terminated = true;
          continue;
        }
        for (let iter = 0; iter < 3 && curDist < reqDist; iter++) {
          const [gx, gz] = sampleModelGradient(curSdf, nx, nz);
          const push = Math.min(maxStepMm * 0.85, reqDist - curDist + 0.12);
          nx += gx * push;
          nz += gz * push;
          curDist = sampleGridField(curSdf, nx, nz);
        }
      }

      // Khống chế góc nghiêng nhánh không vượt quá branchAngle tối đa để in không cần support phụ
      const stepDist = Math.hypot(nx - prevX, nz - prevZ);
      const maxAllowed = maxStepMm * 1.18;
      if (stepDist > maxAllowed) {
        const s = maxAllowed / stepDist;
        nx = prevX + (nx - prevX) * s;
        nz = prevZ + (nz - prevZ) * s;
      }

      // Nếu vẫn chui sâu vào bên trong mô hình (hốc kín không lối thoát) -> Ngắt nhánh an toàn
      if (sampleGridField(curSdf, nx, nz) < -0.15) {
        node.terminated = true;
        continue;
      }

      // 4. Độ nở thân cây tự nhiên từ ngọn xuống gốc + Loe rễ bám bàn in ở 2 tầng cuối
      let nextR = Math.min(maxTrunkRadius, prevR + levelStepY * (isNormalMode ? 0.004 : 0.015));
      if (k === 1) nextR *= 1.1;
      else if (k === 0) nextR *= 1.24;

      node.x = nx;
      node.z = nz;
      node.r = nextR;
      nextActive.push(node);
    }

    // B. Lực hút quy tụ tán cây hữu cơ (Sibling Canopy Attraction) — Chỉ áp dụng cho Tree Support
    if (!isNormalMode && nextActive.length > 1) {
      const heightRatio = k / numLevels;
      const attractRange =
        (5.5 + (1 - heightRatio) * 10.5) * mergeRangeScale * Math.max(0.75, tanBranchAngle);

      const shiftsX = new Float32Array(nextActive.length);
      const shiftsZ = new Float32Array(nextActive.length);

      for (let i = 0; i < nextActive.length; i++) {
        const a = nextActive[i];
        let pullX = 0,
          pullZ = 0,
          pullW = 0;

        for (let j = 0; j < nextActive.length; j++) {
          if (i === j) continue;
          const b = nextActive[j];
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.05 || d > attractRange) continue;

          // Kiểm tra điểm giữa 2 nhánh không vướng thân mô hình (không kéo xuyên qua chân/cánh mẫu!)
          const midSdf = sampleGridField(curSdf, (a.x + b.x) * 0.5, (a.z + b.z) * 0.5);
          if (midSdf < xyClearanceMm + Math.min(a.r, b.r) * 0.5) continue;

          const w = (b.r * b.r) / (d + 0.8);
          pullX += (dx / d) * w;
          pullZ += (dz / d) * w;
          pullW += w;
        }

        if (pullW > 1e-4) {
          const dirX = pullX / pullW;
          const dirZ = pullZ / pullW;
          const dLen = Math.hypot(dirX, dirZ) || 1;
          const step = Math.min(maxStepMm * 0.46, dLen * levelStepY * 0.52);
          const candX = a.x + (dirX / dLen) * step;
          const candZ = a.z + (dirZ / dLen) * step;
          if (sampleGridField(curSdf, candX, candZ) >= a.r * 0.75 + xyClearanceMm) {
            shiftsX[i] = candX - a.x;
            shiftsZ[i] = candZ - a.z;
          }
        }
      }

      for (let i = 0; i < nextActive.length; i++) {
        nextActive[i].x += shiftsX[i];
        nextActive[i].z += shiftsZ[i];
      }
    }

    // Ghi đoạn Capsule 3D từ vị trí tầng trên xuống vị trí mới đã hút hội tụ ở tầng hiện tại
    // Lưu ý: Để đường nối không bị gấp khúc, lưu từ snapshot trước khi gộp
    // (Ở đây ta lưu trong bước tạo mới bên dưới bằng bảng prevPosMap)

    // C. Phép Gộp Nhánh Sinh Học Bảo Toàn Diện Tích (Area-Preserving Organic Merge)
    const mergedNodes: IActiveTreeNode[] = [];
    const consumed = new Uint8Array(nextActive.length);

    for (let i = 0; i < nextActive.length; i++) {
      if (consumed[i]) continue;
      const primary = nextActive[i];

      if (!isNormalMode) {
        for (let j = i + 1; j < nextActive.length; j++) {
          if (consumed[j]) continue;
          const other = nextActive[j];
          const dist = Math.hypot(primary.x - other.x, primary.z - other.z);
          const mergeThresh = Math.max(0.9, (primary.r + other.r) * 0.64);

          if (dist <= mergeThresh) {
            const w1 = primary.r * primary.r;
            const w2 = other.r * other.r;
            const wSum = w1 + w2;
            primary.x = (primary.x * w1 + other.x * w2) / wSum;
            primary.z = (primary.z * w1 + other.z * w2) / wSum;
            primary.r = Math.min(maxTrunkRadius, Math.sqrt(w1 + w2 * 0.76) + 0.03);
            primary.tipWeight += other.tipWeight;
            primary.ageLevels = Math.max(primary.ageLevels, other.ageLevels);
            consumed[j] = 1;
          }
        }
      }

      mergedNodes.push(primary);
    }

    // D. Sinh các đầu nhánh mao mạch mới bắt đầu từ tầng k
    for (const patch of patchesByLevel[k]) {
      const [px, py, pz] = patch.center;
      const [nx, ny, nz] = patch.normal;

      let spawnX = px + nx * 0.25;
      let spawnZ = pz + nz * 0.25;
      let escHere = sampleGridField(curEsc, spawnX, spawnZ);

      // Nếu điểm ngay sát dưới tam giác hơi sát biên SDF, nhích nhẹ ra hành lang thoát hiểm gần nhất (< 2.6mm)
      if (escHere >= INF_ESCAPE * 0.5) {
        let bestProbeEsc = INF_ESCAPE;
        for (let rStep = 0.8; rStep <= 2.6; rStep += 0.9) {
          for (let a = 0; a < 8; a++) {
            const ang = (a / 8) * Math.PI * 2;
            const tx = px + Math.cos(ang) * rStep;
            const tz = pz + Math.sin(ang) * rStep;
            const eVal = sampleGridField(curEsc, tx, tz);
            if (eVal < bestProbeEsc) {
              bestProbeEsc = eVal;
              spawnX = tx;
              spawnZ = tz;
            }
          }
          if (bestProbeEsc < INF_ESCAPE * 0.5) break;
        }
        escHere = bestProbeEsc;
      }

      const reachableToBed = escHere < INF_ESCAPE * 0.5;
      if (!reachableToBed && buildPlateOnly) {
        // Bỏ qua hốc kín tuyệt đối không có đường luồn ra bàn in khi bật "Chỉ bám bàn in"
        continue;
      }

      const patchTipR = Math.max(
        tipRadius * 0.88,
        Math.min(tipRadius * 1.45, tipRadius * (0.82 + Math.sqrt(patch.areaMm2) * 0.08))
      );

      const newNode: IActiveTreeNode = {
        id: nextNodeId++,
        x: spawnX,
        z: spawnZ,
        r: patchTipR,
        ageLevels: 0,
        tipWeight: 1,
        allowModelFloorLanding: !reachableToBed && !buildPlateOnly,
        terminated: false,
      };
      mergedNodes.push(newNode);
      acceptedPatches.push(patch);

      const padCapR = Math.max(1.15, Math.min(3.2, Math.sqrt(patch.areaMm2) * 0.58));
      interfacePads.push({
        x: px,
        y: py - topZDistMm,
        z: pz,
        nx,
        ny,
        nz,
        radius: padCapR,
      });

      // Nối cuống mao mạch ngắn từ vị trí spawn lên sát đáy tấm đệm Support Roof
      const roofBottomY = Math.max(yCur + 0.15, py - topZDistMm - interfaceHeightMm * 0.65);
      capsules.push({
        x0: px + nx * 0.12,
        y0: roofBottomY,
        z0: pz + nz * 0.12,
        r0: patchTipR * 0.92,
        x1: spawnX,
        y1: yCur,
        z1: spawnZ,
        r1: patchTipR,
        isNearTip: true,
      });
    }

    // Lưu mặt cắt nhánh tại tầng k và nối Capsule từ tầng k xuống tầng k - 1 ở vòng lặp kế tiếp
    levelDiscs[k] = mergedNodes.map((n) => ({
      x: n.x,
      z: n.z,
      r: n.r,
      nearTip: n.ageLevels <= 2,
    }));

    activeNodes = mergedNodes;
  }

  // Dựng danh sách Capsule liên tục giữa các tầng từ levelDiscs (hoặc dùng liên kết gần nhất giữa k+1 -> k)
  for (let k = numLevels - 1; k >= 1; k--) {
    const upper = levelDiscs[k];
    const lower = levelDiscs[k - 1];
    if (upper.length === 0 || lower.length === 0) continue;

    const yUp = pre.minY + (k + 0.35) * levelStepY;
    const yLow = k === 1 ? pre.minY + 0.12 : pre.minY + (k - 0.65) * levelStepY;

    for (const u of upper) {
      let bestLow = lower[0];
      let bestD = Infinity;
      for (const l of lower) {
        const d = Math.hypot(l.x - u.x, l.z - u.z);
        if (d < bestD) {
          bestD = d;
          bestLow = l;
        }
      }
      if (bestD <= maxStepMm * 2.4 + bestLow.r + u.r) {
        capsules.push({
          x0: u.x,
          y0: yUp,
          z0: u.z,
          r0: u.r,
          x1: bestLow.x,
          y1: yLow,
          z1: bestLow.z,
          r1: bestLow.r,
          isNearTip: u.nearTip,
        });
      }
    }
  }

  const groundedRoots = (levelDiscs[0] || []).map((d) => ({
    x: d.x,
    z: d.z,
    r: d.r,
  }));

  return {
    patches: acceptedPatches,
    volume: {
      minY: pre.minY,
      maxY: pre.maxY,
      levelStepY,
      numLevels,
      gridRes,
      gridMinX,
      gridMinZ,
      cellSize,
      xyClearanceMm,
      topZDistMm,
      interfaceHeightMm,
      smoothUnionK: isNormalMode ? 0.08 : smoothUnionK,
      levelModelSdfs,
      levelDiscs,
      capsules,
      interfacePads,
      groundedRoots,
    },
  };
}

/**
 * 3. Bộ Dựng Lưới Vỏ Cây Sinh Học Thưa 3D (Sparse Surface Nets Implicit Mesher):
 * Trích xuất bề mặt đẳng trị TreeSDF(x, y, z) = smin_i(Capsule_i) \ (ModelSDF - 0.36mm) = 0
 * -> Sinh thân cây hữu cơ liền khối 100%, chạc cây hòa quyện củ lạc/rễ cây tự nhiên, KHÔNG KHỚP BI CẦU!
 */
function buildSparseSurfaceNetsTreeMesh(vol: ITreeSupport2DVolume): THREE.BufferGeometry | null {
  if (vol.capsules.length === 0) return null;

  let bMinX = Infinity,
    bMaxX = -Infinity;
  let bMinY = Infinity,
    bMaxY = -Infinity;
  let bMinZ = Infinity,
    bMaxZ = -Infinity;

  for (const c of vol.capsules) {
    const rPad = Math.max(c.r0, c.r1) + vol.smoothUnionK + 1.8;
    bMinX = Math.min(bMinX, c.x0 - rPad, c.x1 - rPad);
    bMaxX = Math.max(bMaxX, c.x0 + rPad, c.x1 + rPad);
    bMinY = Math.min(bMinY, c.y0 - rPad, c.y1 - rPad);
    bMaxY = Math.max(bMaxY, c.y0 + rPad, c.y1 + rPad);
    bMinZ = Math.min(bMinZ, c.z0 - rPad, c.z1 - rPad);
    bMaxZ = Math.max(bMaxZ, c.z0 + rPad, c.z1 + rPad);
  }

  bMinY = Math.max(vol.minY - 1.5, bMinY);
  const maxSpan = Math.max(bMaxX - bMinX, bMaxY - bMinY, bMaxZ - bMinZ);
  // Độ phân giải voxel mịn (0.68mm - 1.38mm) giới hạn dưới ~94^3 để chạy < 18ms
  const vox = Math.max(0.68, Math.min(1.42, maxSpan / 92));

  const nx = Math.max(6, Math.ceil((bMaxX - bMinX) / vox) + 3);
  const ny = Math.max(6, Math.ceil((bMaxY - bMinY) / vox) + 3);
  const nz = Math.max(6, Math.ceil((bMaxZ - bMinZ) / vox) + 3);
  const strideY = nx;
  const strideZ = nx * ny;
  const totalCorners = nx * ny * nz;

  const field = new Float32Array(totalCorners);
  field.fill(10.0);
  const touched = new Uint8Array(totalCorners);
  const touchedIndices: number[] = [];

  // Đảm bảo bán kính tối thiểu >= 0.78 * vox để nhánh mao mạch nhỏ không bao giờ lọt qua khe lưới 3D
  const minImplicitR = vox * 0.78;
  const smoothK = vol.smoothUnionK;

  for (const cap of vol.capsules) {
    const r0 = Math.max(minImplicitR, cap.r0);
    const r1 = Math.max(minImplicitR, cap.r1);
    const maxR = Math.max(r0, r1) + smoothK + vox * 1.45;

    const ix0 = Math.max(0, Math.floor((Math.min(cap.x0, cap.x1) - maxR - bMinX) / vox));
    const ix1 = Math.min(nx - 1, Math.ceil((Math.max(cap.x0, cap.x1) + maxR - bMinX) / vox));
    const iy0 = Math.max(0, Math.floor((Math.min(cap.y0, cap.y1) - maxR - bMinY) / vox));
    const iy1 = Math.min(ny - 1, Math.ceil((Math.max(cap.y0, cap.y1) + maxR - bMinY) / vox));
    const iz0 = Math.max(0, Math.floor((Math.min(cap.z0, cap.z1) - maxR - bMinZ) / vox));
    const iz1 = Math.min(nz - 1, Math.ceil((Math.max(cap.z0, cap.z1) + maxR - bMinZ) / vox));

    const abx = cap.x1 - cap.x0;
    const aby = cap.y1 - cap.y0;
    const abz = cap.z1 - cap.z0;
    const abLenSq = abx * abx + aby * aby + abz * abz;
    const invAbLenSq = abLenSq > 1e-6 ? 1 / abLenSq : 0;

    for (let iz = iz0; iz <= iz1; iz++) {
      const wz = bMinZ + iz * vox;
      const zOff = iz * strideZ;
      for (let iy = iy0; iy <= iy1; iy++) {
        const wy = bMinY + iy * vox;
        const yzOff = zOff + iy * strideY;
        for (let ix = ix0; ix <= ix1; ix++) {
          const wx = bMinX + ix * vox;
          const t =
            invAbLenSq > 0
              ? Math.max(
                  0,
                  Math.min(
                    1,
                    ((wx - cap.x0) * abx + (wy - cap.y0) * aby + (wz - cap.z0) * abz) * invAbLenSq
                  )
                )
              : 0;

          const cx = cap.x0 + abx * t;
          const cy = cap.y0 + aby * t;
          const cz = cap.z0 + abz * t;
          const r = r0 + (r1 - r0) * t;
          const dist = Math.hypot(wx - cx, wy - cy, wz - cz) - r;

          const idx = yzOff + ix;
          const prev = field[idx];
          if (prev > 9.5) {
            field[idx] = dist;
          } else {
            field[idx] = sminPoly(prev, dist, smoothK);
          }

          if (touched[idx] === 0) {
            touched[idx] = 1;
            touchedIndices.push(idx);
          }
        }
      }
    }
  }

  // Áp dụng cắt phẳng chân đế bàn in (Y = minY + 0.12) & Trừ Boolean vùng mô hình + khe hở XY 0.35mm!
  const floorPlaneY = vol.minY + 0.12;
  const gRes = vol.gridRes;
  const invCs = 1 / vol.cellSize;

  for (let i = 0; i < touchedIndices.length; i++) {
    const idx = touchedIndices[i];
    const iz = Math.floor(idx / strideZ);
    const rem = idx - iz * strideZ;
    const iy = Math.floor(rem / strideY);
    const ix = rem - iy * strideY;

    const wx = bMinX + ix * vox;
    const wy = bMinY + iy * vox;
    const wz = bMinZ + iz * vox;

    let val = field[idx];
    // Cắt phẳng đáy bàn in để rễ cây đứng vững 100% trên tấm PEI
    if (wy < floorPlaneY) {
      val = Math.max(val, floorPlaneY - wy);
    }

    // Trừ chính xác mặt cắt 2D SDF của mô hình để vỏ cây tự lõm né sát biên dạng mẫu 0.34mm
    if (val < vox * 1.5 && wy >= vol.minY + 0.4 && wy <= vol.maxY) {
      const lvl = Math.max(
        0,
        Math.min(vol.numLevels - 1, Math.floor((wy - vol.minY) / vol.levelStepY))
      );
      const gx = Math.max(0, Math.min(gRes - 1, Math.round((wx - vol.gridMinX) * invCs - 0.5)));
      const gz = Math.max(0, Math.min(gRes - 1, Math.round((wz - vol.gridMinZ) * invCs - 0.5)));
      const modelSdf = vol.levelModelSdfs[lvl][gz * gRes + gx];
      // Không khoét mất đầu mút nhánh ngay sát tấm đệm tiếp xúc
      let nearPad = false;
      for (let p = 0; p < vol.interfacePads.length; p++) {
        const pad = vol.interfacePads[p];
        if (Math.abs(wy - pad.y) < 1.35 && Math.hypot(wx - pad.x, wz - pad.z) < pad.radius + 0.8) {
          nearPad = true;
          break;
        }
      }
      const reqClear = nearPad ? 0.05 : 0.34;
      val = Math.max(val, -(modelSdf - reqClear));
    }

    field[idx] = val;
  }

  // Chạy Surface Nets trên tập các ô hoạt động
  const cellVertIndex = new Int32Array(totalCorners);
  cellVertIndex.fill(-1);
  const activeCells: number[] = [];

  for (let i = 0; i < touchedIndices.length; i++) {
    const idx = touchedIndices[i];
    const iz = Math.floor(idx / strideZ);
    const rem = idx - iz * strideZ;
    const iy = Math.floor(rem / strideY);
    const ix = rem - iy * strideY;

    // Mỗi điểm lưới bị chạm có thể là 1 trong 8 góc của tối đa 8 ô liền trước
    for (let dz = -1; dz <= 0; dz++) {
      const cz = iz + dz;
      if (cz < 0 || cz >= nz - 1) continue;
      for (let dy = -1; dy <= 0; dy++) {
        const cy = iy + dy;
        if (cy < 0 || cy >= ny - 1) continue;
        for (let dx = -1; dx <= 0; dx++) {
          const cx = ix + dx;
          if (cx < 0 || cx >= nx - 1) continue;
          const cIdx = cz * strideZ + cy * strideY + cx;
          if (cellVertIndex[cIdx] === -1) {
            cellVertIndex[cIdx] = -2; // Đánh dấu ứng viên ô cần xét
            activeCells.push(cIdx);
          }
        }
      }
    }
  }

  const vertPositions: number[] = [];
  const vertNormals: number[] = [];
  const cornerVals = new Float32Array(8);
  const cornerOffsets = [
    0,
    1,
    strideY,
    strideY + 1,
    strideZ,
    strideZ + 1,
    strideZ + strideY,
    strideZ + strideY + 1,
  ];

  // Pass 1 Surface Nets: Tính vị trí đỉnh mượt tại tâm giao tuyến 12 cạnh của mỗi ô đổi dấu
  for (let i = 0; i < activeCells.length; i++) {
    const cIdx = activeCells[i];
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const v = field[cIdx + cornerOffsets[c]];
      cornerVals[c] = v;
      if (v < 0) mask |= 1 << c;
    }

    if (mask === 0 || mask === 255) {
      cellVertIndex[cIdx] = -1;
      continue;
    }

    const iz = Math.floor(cIdx / strideZ);
    const rem = cIdx - iz * strideZ;
    const iy = Math.floor(rem / strideY);
    const ix = rem - iy * strideY;

    let sumX = 0,
      sumY = 0,
      sumZ = 0,
      crossCount = 0;

    for (let e = 0; e < 12; e++) {
      const [c0, c1] = CUBE_EDGES[e];
      const v0 = cornerVals[c0];
      const v1 = cornerVals[c1];
      if ((v0 < 0) === (v1 < 0)) continue;

      const t = v0 / (v0 - v1 || 1e-6);
      const x0 = c0 & 1,
        y0 = (c0 >> 1) & 1,
        z0 = (c0 >> 2) & 1;
      const x1 = c1 & 1,
        y1 = (c1 >> 1) & 1,
        z1 = (c1 >> 2) & 1;

      sumX += x0 + (x1 - x0) * t;
      sumY += y0 + (y1 - y0) * t;
      sumZ += z0 + (z1 - z0) * t;
      crossCount++;
    }

    if (crossCount === 0) {
      cellVertIndex[cIdx] = -1;
      continue;
    }

    const invC = 1 / crossCount;
    const wx = bMinX + (ix + sumX * invC) * vox;
    const wy = bMinY + (iy + sumY * invC) * vox;
    const wz = bMinZ + (iz + sumZ * invC) * vox;

    // Pháp tuyến trơn từ Gradient sai phân trung tâm của trường SDF
    const gx =
      (ix + 1 < nx ? field[cIdx + 1] : 10) - (ix > 0 ? field[cIdx - 1] : 10);
    const gy =
      (iy + 1 < ny ? field[cIdx + strideY] : 10) - (iy > 0 ? field[cIdx - strideY] : 10);
    const gz =
      (iz + 1 < nz ? field[cIdx + strideZ] : 10) - (iz > 0 ? field[cIdx - strideZ] : 10);
    const gLen = Math.hypot(gx, gy, gz) || 1;

    const vId = vertPositions.length / 3;
    cellVertIndex[cIdx] = vId;
    vertPositions.push(wx, wy, wz);
    vertNormals.push(gx / gLen, gy / gLen, gz / gLen);
  }

  if (vertPositions.length === 0) return null;

  // Pass 2 Surface Nets: Kết nối tứ giác (2 tam giác đều đẹp) quanh mỗi cạnh trục X, Y, Z có đổi dấu
  const indices: number[] = [];

  const emitQuad = (v0: number, v1: number, v2: number, v3: number, flip: boolean) => {
    if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) return;
    if (flip) {
      indices.push(v0, v1, v2, v0, v2, v3);
    } else {
      indices.push(v0, v2, v1, v0, v3, v2);
    }
  };

  for (let i = 0; i < activeCells.length; i++) {
    const cIdx = activeCells[i];
    const v000 = cellVertIndex[cIdx];
    if (v000 < 0) continue;

    const iz = Math.floor(cIdx / strideZ);
    const rem = cIdx - iz * strideZ;
    const iy = Math.floor(rem / strideY);
    const ix = rem - iy * strideY;

    const f0 = field[cIdx];

    // 1. Cạnh song song trục X từ (ix, iy, iz) -> (ix+1, iy, iz)
    if (iy > 0 && iz > 0) {
      const fX = field[cIdx + 1];
      if ((f0 < 0) !== (fX < 0)) {
        emitQuad(
          v000,
          cellVertIndex[cIdx - strideY],
          cellVertIndex[cIdx - strideY - strideZ],
          cellVertIndex[cIdx - strideZ],
          f0 < 0
        );
      }
    }

    // 2. Cạnh song song trục Y từ (ix, iy, iz) -> (ix, iy+1, iz)
    if (ix > 0 && iz > 0) {
      const fY = field[cIdx + strideY];
      if ((f0 < 0) !== (fY < 0)) {
        emitQuad(
          v000,
          cellVertIndex[cIdx - strideZ],
          cellVertIndex[cIdx - strideZ - 1],
          cellVertIndex[cIdx - 1],
          f0 < 0
        );
      }
    }

    // 3. Cạnh song song trục Z từ (ix, iy, iz) -> (ix, iy, iz+1)
    if (ix > 0 && iy > 0) {
      const fZ = field[cIdx + strideZ];
      if ((f0 < 0) !== (fZ < 0)) {
        emitQuad(
          v000,
          cellVertIndex[cIdx - 1],
          cellVertIndex[cIdx - 1 - strideY],
          cellVertIndex[cIdx - strideY],
          f0 < 0
        );
      }
    }
  }

  if (indices.length === 0) return null;

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertPositions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(vertNormals, 3));
  geom.setIndex(indices);
  return geom;
}

/**
 * 4. Xuất trực tiếp đường chạy dao RỖNG RUỘT (Hollow 1-2 Wall Loops + Concentric Root Brim + Dense Support Roof)
 *    của Tree Support 2.0 tại cao độ lát cắt worldY cho chế độ Sợi In chuẩn 100% Bambu Studio!
 */
export function extractTreeSupportHollowLayerToolpaths(
  vol: ITreeSupport2DVolume,
  worldY: number,
  renderY: number,
  isLayer0: boolean,
  doubleWall: boolean,
  scratchGrid: Float32Array,
  outSupports: number[],
  outInterfaces: number[],
  outBrims?: number[]
): void {
  const gRes = vol.gridRes;
  const cs = vol.cellSize;
  const minX = vol.gridMinX;
  const minZ = vol.gridMinZ;

  // 4.1 Sinh tấm lưới Support Interface Roof (#d946ef) dày đặc ngay dưới các vùng Overhang tại cao độ này
  for (let p = 0; p < vol.interfacePads.length; p++) {
    const pad = vol.interfacePads[p];
    const dy = pad.y - worldY;
    if (dy >= -0.08 && dy <= vol.interfaceHeightMm + 0.14) {
      const r = Math.max(0.8, pad.radius * 0.92);
      const spacing = 0.52;
      const rot = Math.round(worldY * 5) % 2 === 0 ? 0.45 : -1.12;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      for (let v = -r; v <= r; v += spacing) {
        const halfChord = Math.sqrt(Math.max(0, r * r - v * v));
        if (halfChord < 0.25) continue;
        const x1 = pad.x + (-halfChord * cosR - v * sinR);
        const z1 = pad.z + (-halfChord * sinR + v * cosR);
        const x2 = pad.x + (halfChord * cosR - v * sinR);
        const z2 = pad.z + (halfChord * sinR + v * cosR);
        outInterfaces.push(x1, renderY, z1, x2, renderY, z2);
      }
    }
  }

  // 4.2 Cắt ngang các Capsule hoạt động tại worldY bằng 2D Smooth-Min Union SDF \ ModelSDF
  const activeSlices: { x: number; z: number; r: number; nearTip: boolean }[] = [];
  for (let i = 0; i < vol.capsules.length; i++) {
    const c = vol.capsules[i];
    const yMax = Math.max(c.y0, c.y1);
    const yMin = Math.min(c.y0, c.y1);
    if (worldY < yMin - 0.15 || worldY > yMax + 0.15) continue;

    const denom = c.y1 - c.y0;
    const t = Math.abs(denom) > 1e-4 ? Math.max(0, Math.min(1, (worldY - c.y0) / denom)) : 0.5;
    activeSlices.push({
      x: c.x0 + (c.x1 - c.x0) * t,
      z: c.z0 + (c.z1 - c.z0) * t,
      r: c.r0 + (c.r1 - c.r0) * t,
      nearTip: c.isNearTip && t < 0.55,
    });
  }

  if (activeSlices.length === 0) return;

  let gxMin = gRes - 1,
    gxMax = 0,
    gzMin = gRes - 1,
    gzMax = 0;
  const brimExtra = isLayer0 && outBrims ? 3.5 : 0.8;
  const invCs = 1 / cs;

  for (const s of activeSlices) {
    const pad = s.r + vol.smoothUnionK + brimExtra + cs * 2;
    gxMin = Math.min(gxMin, Math.floor((s.x - pad - minX) * invCs));
    gxMax = Math.max(gxMax, Math.ceil((s.x + pad - minX) * invCs));
    gzMin = Math.min(gzMin, Math.floor((s.z - pad - minZ) * invCs));
    gzMax = Math.max(gzMax, Math.ceil((s.z + pad - minZ) * invCs));
  }

  gxMin = Math.max(0, gxMin);
  gxMax = Math.min(gRes - 1, gxMax);
  gzMin = Math.max(0, gzMin);
  gzMax = Math.min(gRes - 1, gzMax);
  if (gxMin >= gxMax || gzMin >= gzMax) return;

  const lvl = Math.max(
    0,
    Math.min(vol.numLevels - 1, Math.floor((worldY - vol.minY) / vol.levelStepY))
  );
  const modelSdf = vol.levelModelSdfs[lvl];
  const smoothK = vol.smoothUnionK;

  for (let gz = gzMin; gz <= gzMax; gz++) {
    const wz = minZ + (gz + 0.5) * cs;
    const row = gz * gRes;
    for (let gx = gxMin; gx <= gxMax; gx++) {
      const wx = minX + (gx + 0.5) * cs;
      let d = 50.0;
      let anyNearTip = false;

      for (let i = 0; i < activeSlices.length; i++) {
        const s = activeSlices[i];
        const dx = wx - s.x;
        const dz = wz - s.z;
        if (Math.abs(dx) > s.r + 6.0 || Math.abs(dz) > s.r + 6.0) continue;
        const dist = Math.hypot(dx, dz) - s.r;
        d = d > 45.0 ? dist : sminPoly(d, dist, smoothK);
        if (s.nearTip && dist < 0.8) anyNearTip = true;
      }

      const clear = anyNearTip ? 0.1 : 0.35;
      d = Math.max(d, -(modelSdf[row + gx] - clear));
      scratchGrid[row + gx] = d;
    }
  }

  const roi = {
    gxMin,
    gxMax: Math.min(gRes - 2, gxMax),
    gzMin,
    gzMax: Math.min(gRes - 2, gzMax),
  };

  // Vòng chu vi ngoài của thân cây rỗng ruột (1st Hollow Tree Wall Loop #10b981)
  extractMarchingSquaresSegments(
    scratchGrid,
    gRes,
    gRes,
    minX,
    minZ,
    cs,
    0.0,
    renderY,
    outSupports,
    roi
  );

  // Vòng chu vi thứ 2 nếu chọn Tree Strong / Hybrid (2nd Hollow Wall Loop, bên trong vẫn rỗng 0% infill!)
  if (doubleWall) {
    extractMarchingSquaresSegments(
      scratchGrid,
      gRes,
      gRes,
      minX,
      minZ,
      cs,
      -0.44,
      renderY,
      outSupports,
      roi
    );
  }

  // Tại Layer 0: Sinh các vòng Tree Brim đồng tâm mở rộng mượt quanh biên dạng rễ cây hữu cơ!
  if (isLayer0 && outBrims) {
    for (let ring = 1; ring <= 4; ring++) {
      extractMarchingSquaresSegments(
        scratchGrid,
        gRes,
        gRes,
        minX,
        minZ,
        cs,
        ring * 0.48,
        renderY,
        outBrims,
        roi
      );
    }
  }
}

/**
 * 5. Hàm giao diện chính tạo cấu trúc Three.js Tree Support 2.0 cho /3dsim Viewport
 */
export function generateBambuSupportStructures(
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  overhangThreshold: number = 45
): THREE.Group {
  const supportGroup = new THREE.Group();
  supportGroup.name = 'support_structures_group';

  if (profile.supportMode === 'none') {
    return supportGroup;
  }

  const computed = computeTreeSupport2DVolume(geometry, profile, overhangThreshold);
  if (!computed) {
    return supportGroup;
  }

  const { volume, patches } = computed;
  // Gắn trực tiếp trường thể tích 2D vào userData để Slicer View trích xuất vòng sợi rỗng 1:1 tức thì!
  supportGroup.userData.treeVolume = volume;

  const isTree = profile.supportMode === 'tree';

  const supportMat = new THREE.MeshStandardMaterial({
    color: isTree ? 0x10b981 : 0x06b6d4, // Bambu Emerald Organic Green / Normal Cyan
    roughness: 0.36,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const interfaceMat = new THREE.MeshStandardMaterial({
    color: 0xd946ef, // Bambu Support Interface Magenta-Purple
    roughness: 0.26,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const brimMat = new THREE.MeshStandardMaterial({
    color: 0xc026d3, // Bambu Tree Brim
    roughness: 0.4,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  // 5.1 Dựng thân cây hữu cơ bằng Sparse Surface Nets (0 khớp bi cầu, gộp chạc mượt sinh học!)
  const organicBarkGeom = buildSparseSurfaceNetsTreeMesh(volume);
  if (organicBarkGeom) {
    const branchMesh = new THREE.Mesh(organicBarkGeom, supportMat);
    branchMesh.name = 'conformal_tree_branches';
    branchMesh.castShadow = true;
    branchMesh.receiveShadow = true;
    supportGroup.add(branchMesh);
  }

  // 5.2 Dựng lớp đệm tiếp xúc Conformal Support Roof (#d946ef) ôm sát 100% tam giác Overhang
  const topZDist = profile.supportTopZDistance ?? 0.2;
  const interfaceLayers = profile.supportInterfaceLayers ?? 2;
  if (interfaceLayers > 0) {
    const capGeoms: (THREE.BufferGeometry | null)[] = [];
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i];
      const padRadius = Math.max(1.15, Math.min(3.2, Math.sqrt(p.areaMm2) * 0.58));
      capGeoms.push(buildPatchConformalCapGeometry(p, padRadius, topZDist, interfaceLayers));
    }
    const mergedInterfaces = safeMergeGeometries(capGeoms);
    if (mergedInterfaces) {
      const interfaceMesh = new THREE.Mesh(mergedInterfaces, interfaceMat);
      interfaceMesh.name = 'conformal_tree_interfaces';
      interfaceMesh.castShadow = true;
      supportGroup.add(interfaceMesh);
    }
  }

  // 5.3 Dựng vành đế Tree Support Brim mỏng sát bàn in PEI hợp nhất quanh từng gốc rễ
  if (volume.groundedRoots.length > 0) {
    const brimGeoms: THREE.BufferGeometry[] = [];
    for (const root of volume.groundedRoots) {
      const brimR = root.r + 1.65;
      const disc = new THREE.CylinderGeometry(brimR * 0.96, brimR, 0.14, 20);
      disc.translate(root.x, volume.minY + 0.07, root.z);
      brimGeoms.push(disc.toNonIndexed());
    }
    const mergedBrim = safeMergeGeometries(brimGeoms);
    if (mergedBrim) {
      const brimMesh = new THREE.Mesh(mergedBrim, brimMat);
      brimMesh.name = 'conformal_tree_brims';
      brimMesh.receiveShadow = true;
      supportGroup.add(brimMesh);
    }
  }

  return supportGroup;
}
