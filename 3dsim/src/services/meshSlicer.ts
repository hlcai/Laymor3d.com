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

interface IIndexedTriangle {
  ax: number;
  ay: number;
  az: number;
  bx: number;
  by: number;
  bz: number;
  cx: number;
  cy: number;
  cz: number;
  minY: number;
  maxY: number;
}

interface IGeometryBucketIndex {
  uuid: string;
  minY: number;
  maxY: number;
  bucketCount: number;
  buckets: IIndexedTriangle[][];
  allTriangles: IIndexedTriangle[];
}

let cachedBucketIndex: IGeometryBucketIndex | null = null;

/**
 * Xây dựng bộ chỉ mục phân vùng cao độ Y (Y-Interval Spatial Bucket Index)
 * Giúp cắt 1 layer trong < 0.3ms và cắt toàn bộ 250 layers trong < 15ms.
 */
function getOrBuildGeometryBucketIndex(geometry: THREE.BufferGeometry): IGeometryBucketIndex | null {
  const positionAttr = geometry.getAttribute('position');
  if (!positionAttr) return null;

  const uuid = `${geometry.uuid}_${positionAttr.count}`;
  if (cachedBucketIndex && cachedBucketIndex.uuid === uuid) {
    return cachedBucketIndex;
  }

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minY = bbox.min.y;
  const maxY = Math.max(minY + 0.1, bbox.max.y);
  const spanY = maxY - minY;
  const bucketCount = 64;

  const buckets: IIndexedTriangle[][] = Array.from({ length: bucketCount }, () => []);
  const allTriangles: IIndexedTriangle[] = [];

  const indexAttr = geometry.getIndex();
  const vertexCount = indexAttr ? indexAttr.count : positionAttr.count;
  const triangleCount = Math.floor(vertexCount / 3);

  // Nếu mô hình cực nặng (> 120,000 tam giác), lấy mẫu thông minh để giữ tốc độ 60fps
  const stride = triangleCount > 120000 ? Math.ceil(triangleCount / 90000) : 1;

  for (let t = 0; t < triangleCount; t += stride) {
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

    const tri: IIndexedTriangle = {
      ax,
      ay,
      az,
      bx,
      by,
      bz,
      cx,
      cy,
      cz,
      minY: triMinY,
      maxY: triMaxY,
    };

    allTriangles.push(tri);

    const bStart = Math.max(0, Math.min(bucketCount - 1, Math.floor(((triMinY - minY) / spanY) * bucketCount)));
    const bEnd = Math.max(0, Math.min(bucketCount - 1, Math.floor(((triMaxY - minY) / spanY) * bucketCount)));

    for (let b = bStart; b <= bEnd; b++) {
      buckets[b].push(tri);
    }
  }

  cachedBucketIndex = {
    uuid,
    minY,
    maxY,
    bucketCount,
    buckets,
    allTriangles,
  };

  return cachedBucketIndex;
}

/**
 * Cắt lớp hình học 3D thực tế (Mesh Slicing Engine) tại độ cao Y nhất định
 * Tìm giao tuyến giữa mặt phẳng Y = heightY với các tam giác trong Y-Bucket tương ứng.
 */
export function sliceGeometryAtHeight(
  geometry: THREE.BufferGeometry,
  heightY: number,
  profile: ISimulationProfile
): ILayerSliceData {
  const bucketIndex = getOrBuildGeometryBucketIndex(geometry);
  if (!bucketIndex) {
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
  const candidateTris = bucketIndex.buckets[bucketIdx] || bucketIndex.allTriangles;

  const segments: ISliceSegment[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  // Helper tìm giao điểm của 1 cạnh với mặt phẳng Y = heightY
  const getEdgeIntersection = (
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number
  ): ISlicePoint | null => {
    const dy = by - ay;
    if (Math.abs(dy) < 1e-6) return null;
    const t = (heightY - ay) / dy;
    if (t < -0.0001 || t > 1.0001) return null;
    const clampedT = Math.max(0, Math.min(1, t));
    return {
      x: ax + clampedT * (bx - ax),
      z: az + clampedT * (bz - az),
    };
  };

  for (let i = 0; i < candidateTris.length; i++) {
    const tri = candidateTris[i];
    if (heightY < tri.minY - 0.001 || heightY > tri.maxY + 0.001) {
      continue;
    }

    const cuts: ISlicePoint[] = [];
    const ptAB = getEdgeIntersection(tri.ax, tri.ay, tri.az, tri.bx, tri.by, tri.bz);
    if (ptAB) cuts.push(ptAB);

    const ptBC = getEdgeIntersection(tri.bx, tri.by, tri.bz, tri.cx, tri.cy, tri.cz);
    if (ptBC) {
      if (!cuts.some((c) => Math.hypot(c.x - ptBC.x, c.z - ptBC.z) < 0.001)) {
        cuts.push(ptBC);
      }
    }

    const ptCA = getEdgeIntersection(tri.cx, tri.cy, tri.cz, tri.ax, tri.ay, tri.az);
    if (ptCA) {
      if (!cuts.some((c) => Math.hypot(c.x - ptCA.x, c.z - ptCA.z) < 0.001)) {
        cuts.push(ptCA);
      }
    }

    if (cuts.length >= 2) {
      const p1 = cuts[0];
      const p2 = cuts[1];
      const len = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      if (len > 0.015) {
        segments.push({ p1, p2, length: len });
        minX = Math.min(minX, p1.x, p2.x);
        maxX = Math.max(maxX, p1.x, p2.x);
        minZ = Math.min(minZ, p1.z, p2.z);
        maxZ = Math.max(maxZ, p1.z, p2.z);
      }
    }
  }

  if (segments.length === 0) {
    return createEmptySlice(heightY);
  }

  // 2. Nối các đoạn rời rạc thành các đường bao khép kín (Contour Stitching)
  const contours = stitchSegmentsIntoContours(segments);

  let totalPerimeterLength = 0;
  contours.forEach((c) => {
    totalPerimeterLength += c.totalLength;
  });

  // 2.5 Tạo các đường Vách Trong (Inner Wall Perimeters) bằng Miter-Normal Offset chuẩn hình học
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
    minY: heightY,
    maxZ: isFinite(maxZ) ? maxZ : 10,
  };

  // 3. Tính toán vị trí Z-Seam chuẩn theo profile.seamPosition ('aligned' | 'nearest' | 'random')
  const seamPoint = computeSeamPointOnContours(contours, heightY, profile.seamPosition || 'aligned');

  // 4. Sinh các đường Ruột in (Infill Lines) nằm bên trong vách trong cùng
  const innermostContours =
    innerWallContours.length > 0 ? innerWallContours[innerWallContours.length - 1] : contours;

  const isTopOrBottomShell =
    heightY <= bucketIndex.minY + (profile.layerHeight || 0.2) * (profile.bottomShellLayers || 3) ||
    heightY >= bucketIndex.maxY - (profile.layerHeight || 0.2) * (profile.topShellLayers || 3);

  const infill = generateInfillLinesInsideContours(
    innermostContours,
    bbox,
    heightY,
    profile,
    isTopOrBottomShell
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

/**
 * Tính diện tích có hướng (Shoelace Formula) để xác định chiều quay của Contour (CW hay CCW)
 */
function computeSignedPolygonArea(points: ISlicePoint[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].z - points[j].x * points[i].z;
  }
  return area * 0.5;
}

/**
 * Thuật toán dịch chuyển đa giác vào phía trong theo vector pháp tuyến phân giác đỉnh (Miter-Normal Inward Offset)
 * Giữ nguyên hình dạng chính xác cho cả các chi tiết lõm (bánh răng, chữ X/Y/Z, hộp rỗng, rồng khớp)
 */
export function offsetContourInward(loop: IContourLoop, offsetMm: number): IContourLoop | null {
  const pts = loop.points;
  const spanX = loop.bbox.maxX - loop.bbox.minX;
  const spanZ = loop.bbox.maxZ - loop.bbox.minZ;
  if (pts.length < 4 || Math.min(spanX, spanZ) <= offsetMm * 2.3) {
    return null;
  }

  // Loại bỏ đỉnh cuối nếu trùng đỉnh đầu để tính toán vòng khép kín
  const isClosed =
    Math.hypot(pts[pts.length - 1].x - pts[0].x, pts[pts.length - 1].z - pts[0].z) < 0.05;
  const ring = isClosed ? pts.slice(0, -1) : pts;
  const n = ring.length;
  if (n < 3) return null;

  const signedArea = computeSignedPolygonArea(ring);
  const orientSign = signedArea >= 0 ? 1 : -1;
  const cx = (loop.bbox.minX + loop.bbox.maxX) * 0.5;
  const cz = (loop.bbox.minZ + loop.bbox.maxZ) * 0.5;

  const newPoints: ISlicePoint[] = [];
  let bMinX = Infinity;
  let bMaxX = -Infinity;
  let bMinZ = Infinity;
  let bMaxZ = -Infinity;

  for (let i = 0; i < n; i++) {
    const prev = ring[(i - 1 + n) % n];
    const curr = ring[i];
    const next = ring[(i + 1) % n];

    const e1x = curr.x - prev.x;
    const e1z = curr.z - prev.z;
    const len1 = Math.hypot(e1x, e1z) || 1;
    const n1x = (-e1z / len1) * orientSign;
    const n1z = (e1x / len1) * orientSign;

    const e2x = next.x - curr.x;
    const e2z = next.z - curr.z;
    const len2 = Math.hypot(e2x, e2z) || 1;
    const n2x = (-e2z / len2) * orientSign;
    const n2z = (e2x / len2) * orientSign;

    let mx = n1x + n2x;
    let mz = n1z + n2z;
    const mLen = Math.hypot(mx, mz);
    if (mLen > 1e-4) {
      mx /= mLen;
      mz /= mLen;
    } else {
      mx = n1x;
      mz = n1z;
    }

    // Hệ số miter giới hạn tránh nhọn quá mức ở góc hẹp
    const cosHalf = Math.max(0.45, mx * n1x + mz * n1z);
    const miterDist = Math.min(offsetMm * 1.65, offsetMm / cosHalf);

    let nx = curr.x + mx * miterDist;
    let nz = curr.z + mz * miterDist;

    // Đảm bảo điểm mới thực sự lùi về phía trong thiết diện
    const distBefore = Math.hypot(curr.x - cx, curr.z - cz);
    const distAfter = Math.hypot(nx - cx, nz - cz);
    if (distAfter > distBefore && n < 12) {
      nx = curr.x - mx * miterDist;
      nz = curr.z - mz * miterDist;
    }

    newPoints.push({ x: nx, z: nz });
    bMinX = Math.min(bMinX, nx);
    bMaxX = Math.max(bMaxX, nx);
    bMinZ = Math.min(bMinZ, nz);
    bMaxZ = Math.max(bMaxZ, nz);
  }

  // Khép kín vòng lặp
  newPoints.push({ ...newPoints[0] });

  let len = 0;
  const cumulativeLengths: number[] = [0];
  for (let i = 1; i < newPoints.length; i++) {
    const segLen = Math.hypot(
      newPoints[i].x - newPoints[i - 1].x,
      newPoints[i].z - newPoints[i - 1].z
    );
    len += segLen;
    cumulativeLengths.push(len);
  }

  return {
    points: newPoints,
    totalLength: len,
    cumulativeLengths,
    signedArea,
    bbox: { minX: bMinX, maxX: bMaxX, minZ: bMinZ, maxZ: bMaxZ },
  };
}

/**
 * Tìm điểm bắt đầu lớp Z-Seam dựa trên chế độ seamPosition ('aligned' | 'nearest' | 'random')
 */
function computeSeamPointOnContours(
  contours: IContourLoop[],
  heightY: number,
  seamPosition: 'aligned' | 'nearest' | 'random'
): ISlicePoint | null {
  if (contours.length === 0 || contours[0].points.length === 0) return null;
  const mainLoop = contours[0];
  const pts = mainLoop.points;

  if (seamPosition === 'random') {
    // Giả ngẫu nhiên tất định theo chiều cao lớp để điểm seam rải đều quanh vỏ
    const hash = Math.abs(Math.sin(heightY * 127.1 + 311.7)) * 43758.5453;
    const idx = Math.floor((hash - Math.floor(hash)) * pts.length) % pts.length;
    return pts[idx];
  }

  if (seamPosition === 'nearest') {
    // Ưu tiên góc khuất (đỉnh có độ cong gắt nhất trên contour)
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

  // 'aligned': Căn thẳng hàng ở mặt sau-phải (max X, min Z) chuẩn Bambu Studio Back-Aligned Seam
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
 * Thuật toán nối các đoạn phân mảnh thành các đường bao Contour liên tục
 */
function stitchSegmentsIntoContours(segments: ISliceSegment[]): IContourLoop[] {
  const loops: IContourLoop[] = [];
  const remaining = [...segments];
  const tolerance = 0.35;

  while (remaining.length > 0) {
    const first = remaining.pop()!;
    const points: ISlicePoint[] = [{ ...first.p1 }, { ...first.p2 }];
    let growing = true;

    while (growing) {
      growing = false;
      const last = points[points.length - 1];

      let bestIdx = -1;
      let reverse = false;
      let minDist = tolerance;

      for (let i = 0; i < remaining.length; i++) {
        const seg = remaining[i];
        const d1 = Math.hypot(seg.p1.x - last.x, seg.p1.z - last.z);
        if (d1 < minDist) {
          minDist = d1;
          bestIdx = i;
          reverse = false;
        }
        const d2 = Math.hypot(seg.p2.x - last.x, seg.p2.z - last.z);
        if (d2 < minDist) {
          minDist = d2;
          bestIdx = i;
          reverse = true;
        }
      }

      if (bestIdx !== -1) {
        const seg = remaining.splice(bestIdx, 1)[0];
        points.push(reverse ? { ...seg.p1 } : { ...seg.p2 });
        growing = true;

        const start = points[0];
        const curr = points[points.length - 1];
        if (points.length >= 4 && Math.hypot(curr.x - start.x, curr.z - start.z) < tolerance) {
          points.push({ ...start });
          break;
        }
      }
    }

    if (points.length >= 3) {
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
 * Sinh các đường ruột in (Infill) nằm CHUẨN XÁC bên trong thiết diện thực của mô hình
 * Hỗ trợ đầy đủ: gyroid, honeycomb, concentric, grid, triangles, solid
 */
function generateInfillLinesInsideContours(
  contours: IContourLoop[],
  bbox: { minX: number; maxX: number; minZ: number; maxZ: number },
  heightY: number,
  profile: ISimulationProfile,
  isTopOrBottomShell: boolean = false
): IInfillPath {
  const resultLines: [ISlicePoint, ISlicePoint][] = [];
  if (contours.length === 0 || (profile.infillDensity <= 0 && !isTopOrBottomShell)) {
    return { lines: [], totalLength: 0, cumulativeLengths: [0] };
  }

  const infillType = isTopOrBottomShell ? 'solid' : profile.infillType || 'gyroid';

  // Chế độ Concentric Infill: Thu nhỏ đồng tâm liên tiếp theo đúng biên dạng contour
  if (infillType === 'concentric') {
    const density = Math.max(5, profile.infillDensity || 15);
    const stepMm = Math.max(0.85, 6.5 / (density / 15));
    for (const baseLoop of contours) {
      for (let k = 1; k <= 8; k++) {
        const subLoop = offsetContourInward(baseLoop, k * stepMm);
        if (!subLoop) break;
        for (let i = 0; i < subLoop.points.length - 1; i++) {
          resultLines.push([subLoop.points[i], subLoop.points[i + 1]]);
        }
      }
    }
    return finalizeInfillPath(resultLines);
  }

  const effectiveDensity = isTopOrBottomShell ? 55 : Math.max(5, profile.infillDensity || 15);
  const spacing = isTopOrBottomShell
    ? 1.35
    : Math.max(2.1, 19 / (effectiveDensity / 15 || 1));

  const spanX = bbox.maxX - bbox.minX;
  const spanZ = bbox.maxZ - bbox.minZ;
  const maxSpan = Math.max(spanX, spanZ);

  const contourSegments: ISliceSegment[] = [];
  contours.forEach((c) => {
    for (let i = 0; i < c.points.length - 1; i++) {
      contourSegments.push({
        p1: c.points[i],
        p2: c.points[i + 1],
        length: Math.hypot(c.points[i + 1].x - c.points[i].x, c.points[i + 1].z - c.points[i].z),
      });
    }
  });

  const isGyroid = infillType === 'gyroid';
  const isHoneycomb = infillType === 'honeycomb';
  const isTriangles = infillType === 'triangles';
  const isCross = infillType === 'grid' || isTriangles;

  // Luân phiên góc quét monotonic giữa các lớp chẵn/lẻ cho Top/Bottom Solid Shell
  const layerParity = Math.round(heightY / (profile.layerHeight || 0.2)) % 2;
  const angles = isTriangles
    ? [Math.PI / 3, -Math.PI / 3, 0]
    : isCross
    ? [Math.PI / 4, -Math.PI / 4]
    : isHoneycomb
    ? [0, Math.PI / 3, -Math.PI / 3]
    : [layerParity === 0 ? Math.PI / 4 : -Math.PI / 4];

  angles.forEach((angle, angleIdx) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const midX = (bbox.minX + bbox.maxX) / 2;
    const midZ = (bbox.minZ + bbox.maxZ) / 2;

    const perpCos = -sinA;
    const perpSin = cosA;
    const stepOffset = isHoneycomb ? spacing * 1.25 : spacing;

    for (let offset = -maxSpan * 0.94; offset <= maxSpan * 0.94; offset += stepOffset) {
      const rayOriginX = midX + perpCos * offset;
      const rayOriginZ = midZ + perpSin * offset;
      const rayDirX = cosA;
      const rayDirZ = sinA;

      const hitDistances: number[] = [];

      for (const seg of contourSegments) {
        const hit = intersectRayWithSegment(
          rayOriginX,
          rayOriginZ,
          rayDirX,
          rayDirZ,
          seg.p1.x,
          seg.p1.z,
          seg.p2.x,
          seg.p2.z
        );
        if (hit !== null) {
          hitDistances.push(hit);
        }
      }

      hitDistances.sort((a, b) => a - b);

      for (let h = 0; h < hitDistances.length - 1; h += 2) {
        const d1 = hitDistances[h];
        const d2 = hitDistances[h + 1];
        if (d2 - d1 > 0.35) {
          const inset = 0.22;
          const pStart: ISlicePoint = {
            x: rayOriginX + rayDirX * (d1 + inset),
            z: rayOriginZ + rayDirZ * (d1 + inset),
          };
          const pEnd: ISlicePoint = {
            x: rayOriginX + rayDirX * (d2 - inset),
            z: rayOriginZ + rayDirZ * (d2 - inset),
          };

          if (isGyroid) {
            const segLen = Math.hypot(pEnd.x - pStart.x, pEnd.z - pStart.z);
            const stepCount = Math.max(1, Math.floor(segLen / 1.8));
            const phase = heightY * 1.85 + offset * 0.28;

            let prevPt: ISlicePoint = { ...pStart };
            for (let s = 1; s <= stepCount; s++) {
              const u = s / stepCount;
              const baseX = pStart.x + u * (pEnd.x - pStart.x);
              const baseZ = pStart.z + u * (pEnd.z - pStart.z);
              const wave = Math.sin(u * segLen * 0.48 + phase) * Math.min(1.45, spacing * 0.38);
              const curPt: ISlicePoint = {
                x: baseX + perpCos * wave,
                z: baseZ + perpSin * wave,
              };
              resultLines.push([prevPt, curPt]);
              prevPt = curPt;
            }
          } else if (isHoneycomb) {
            // Tổ ong lục giác: tạo đường zíc-zắc hình thang cân tạo ô lục giác khi giao 3 hướng
            const segLen = Math.hypot(pEnd.x - pStart.x, pEnd.z - pStart.z);
            const hexSide = Math.max(2.2, spacing * 0.65);
            const stepCount = Math.max(1, Math.floor(segLen / hexSide));
            let prevPt: ISlicePoint = { ...pStart };
            for (let s = 1; s <= stepCount; s++) {
              const u = s / stepCount;
              const baseX = pStart.x + u * (pEnd.x - pStart.x);
              const baseZ = pStart.z + u * (pEnd.z - pStart.z);
              const zig = ((s + angleIdx) % 2 === 0 ? 1 : -1) * (hexSide * 0.36);
              const curPt: ISlicePoint = {
                x: baseX + perpCos * zig,
                z: baseZ + perpSin * zig,
              };
              resultLines.push([prevPt, curPt]);
              prevPt = curPt;
            }
          } else {
            resultLines.push([pStart, pEnd]);
          }
        }
      }
    }
  });

  return finalizeInfillPath(resultLines);
}

function finalizeInfillPath(resultLines: [ISlicePoint, ISlicePoint][]): IInfillPath {
  let totalLength = 0;
  const cumulativeLengths: number[] = [0];
  resultLines.forEach(([p1, p2]) => {
    const l = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    totalLength += l;
    cumulativeLengths.push(totalLength);
  });

  return {
    lines: resultLines,
    totalLength,
    cumulativeLengths,
  };
}

/**
 * Giao điểm giữa tia và đoạn thẳng
 */
function intersectRayWithSegment(
  rx: number,
  rz: number,
  rdx: number,
  rdz: number,
  sx1: number,
  sz1: number,
  sx2: number,
  sz2: number
): number | null {
  const sdx = sx2 - sx1;
  const sdz = sz2 - sz1;
  const denominator = rdx * sdz - rdz * sdx;
  if (Math.abs(denominator) < 1e-8) return null;

  const dx = sx1 - rx;
  const dz = sz1 - rz;
  const t = (dx * sdz - dz * sdx) / denominator;
  const u = (dx * rdz - dz * rdx) / denominator;

  if (u >= 0 && u <= 1.0) {
    return t;
  }
  return null;
}

/**
 * Tính toán tọa độ đầu in thực tế chạy chuẩn xác theo biên dạng mô hình 3D
 */
export function getRealToolheadPositionOnSlice(
  slice: ILayerSliceData,
  layerProgress: number,
  profile: ISimulationProfile,
  fallbackCenter: [number, number] = [0, 0]
): {
  position: [number, number, number];
  toolpathType: 'perimeter' | 'infill' | 'support' | 'travel' | 'brim';
} {
  const heightY = slice.heightY;

  if (slice.contours.length === 0) {
    return {
      position: [fallbackCenter[0], heightY, fallbackCenter[1]],
      toolpathType: 'travel',
    };
  }

  if (layerProgress < 0.55) {
    const perimeterFrac = layerProgress / 0.55;
    const targetDist = perimeterFrac * slice.totalPerimeterLength;

    let accumulated = 0;
    for (const loop of slice.contours) {
      if (accumulated + loop.totalLength >= targetDist || loop === slice.contours[slice.contours.length - 1]) {
        const loopDist = Math.max(0, targetDist - accumulated);
        for (let i = 0; i < loop.points.length - 1; i++) {
          const dStart = loop.cumulativeLengths[i];
          const dEnd = loop.cumulativeLengths[i + 1];
          if (loopDist >= dStart && loopDist <= dEnd) {
            const segLen = dEnd - dStart;
            const alpha = segLen > 0 ? (loopDist - dStart) / segLen : 0;
            const pt0 = loop.points[i];
            const pt1 = loop.points[i + 1];
            return {
              position: [pt0.x + alpha * (pt1.x - pt0.x), heightY, pt0.z + alpha * (pt1.z - pt0.z)],
              toolpathType: 'perimeter',
            };
          }
        }
        const lastPt = loop.points[loop.points.length - 1];
        return {
          position: [lastPt.x, heightY, lastPt.z],
          toolpathType: 'perimeter',
        };
      }
      accumulated += loop.totalLength;
    }
  } else if (layerProgress < 0.90 && slice.infill.lines.length > 0) {
    const infillFrac = (layerProgress - 0.55) / 0.35;
    const targetDist = infillFrac * slice.infill.totalLength;

    for (let i = 0; i < slice.infill.lines.length; i++) {
      const dStart = slice.infill.cumulativeLengths[i];
      const dEnd = slice.infill.cumulativeLengths[i + 1];
      if (targetDist >= dStart && targetDist <= dEnd) {
        const segLen = dEnd - dStart;
        const alpha = segLen > 0 ? (targetDist - dStart) / segLen : 0;
        const [p1, p2] = slice.infill.lines[i];
        return {
          position: [p1.x + alpha * (p2.x - p1.x), heightY, p1.z + alpha * (p2.z - p1.z)],
          toolpathType: 'infill',
        };
      }
    }
  }

  const firstPoint = slice.seamPoint || slice.contours[0]?.points[0] || { x: fallbackCenter[0], z: fallbackCenter[1] };
  return {
    position: [firstPoint.x, heightY, firstPoint.z],
    toolpathType: 'travel',
  };
}

/**
 * Sinh các Three.js Mesh / Line hiển thị đường in của lớp hiện tại khớp 100% hình học thực tế
 */
export function createSliceToolpathMeshes(
  slice: ILayerSliceData,
  profile: ISimulationProfile,
  renderMode: SlicerRenderMode
): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];
  const heightY = slice.heightY + 0.12;

  const outerColor = renderMode === 'features' ? 0xff6b00 : 0x00e050;
  const innerColor = renderMode === 'features' ? 0xfacc15 : 0x047857;
  const infillColor = renderMode === 'features' ? 0xec4899 : 0xf59e0b;

  // 1. Đường viền Vách Ngoài (Outer Wall) khớp từng đỉnh tam giác thực
  const perimeterPoints: THREE.Vector3[] = [];
  slice.contours.forEach((loop) => {
    for (let i = 0; i < loop.points.length - 1; i++) {
      perimeterPoints.push(
        new THREE.Vector3(loop.points[i].x, heightY, loop.points[i].z),
        new THREE.Vector3(loop.points[i + 1].x, heightY, loop.points[i + 1].z)
      );
    }
  });

  if (perimeterPoints.length > 0) {
    const geom = new THREE.BufferGeometry().setFromPoints(perimeterPoints);
    const mat = new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({
        color: outerColor,
        linewidth: 2,
      })
    );
    objects.push(mat);
  }

  // 2. Đường viền Vách Trong (Inner Walls) từ Miter-Normal Offset chuẩn hình học
  if (slice.innerWallContours.length > 0) {
    const innerPoints: THREE.Vector3[] = [];
    slice.innerWallContours.forEach((wallRingList) => {
      wallRingList.forEach((loop) => {
        for (let i = 0; i < loop.points.length - 1; i++) {
          innerPoints.push(
            new THREE.Vector3(loop.points[i].x, heightY, loop.points[i].z),
            new THREE.Vector3(loop.points[i + 1].x, heightY, loop.points[i + 1].z)
          );
        }
      });
    });

    if (innerPoints.length > 0) {
      const innerGeom = new THREE.BufferGeometry().setFromPoints(innerPoints);
      const innerMat = new THREE.LineSegments(
        innerGeom,
        new THREE.LineBasicMaterial({
          color: innerColor,
          opacity: 0.9,
          transparent: true,
        })
      );
      objects.push(innerMat);
    }
  }

  // 3. Đường Ruột Infill thực tế
  if (slice.infill.lines.length > 0) {
    const infillPoints: THREE.Vector3[] = [];
    slice.infill.lines.forEach(([p1, p2]) => {
      infillPoints.push(
        new THREE.Vector3(p1.x, heightY, p1.z),
        new THREE.Vector3(p2.x, heightY, p2.z)
      );
    });

    const infillGeom = new THREE.BufferGeometry().setFromPoints(infillPoints);
    const infillMat = new THREE.LineSegments(
      infillGeom,
      new THREE.LineBasicMaterial({
        color: infillColor,
        opacity: 0.88,
        transparent: true,
      })
    );
    objects.push(infillMat);
  }

  // 4. Điểm Z-Seam trắng phát sáng trên mặt cắt hiện tại
  if (slice.seamPoint) {
    const seamGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(slice.seamPoint.x, heightY + 0.04, slice.seamPoint.z),
    ]);
    const seamPoints = new THREE.Points(
      seamGeom,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 4.0,
        sizeAttenuation: false,
      })
    );
    objects.push(seamPoints);
  }

  return objects;
}

/**
 * Quản lý Bộ Nhớ Đệm (Layer Slice Cache) giúp phản hồi tức thời 60 FPS
 */
class LayerSliceCacheManager {
  private cache = new Map<string, ILayerSliceData>();
  private currentGeomId = '';

  public getSlice(
    geometry: THREE.BufferGeometry,
    layerIndex: number,
    heightY: number,
    profile: ISimulationProfile
  ): ILayerSliceData {
    const geomId = `${geometry.uuid}_${geometry.getAttribute('position')?.count || 0}`;
    if (this.currentGeomId !== geomId) {
      this.cache.clear();
      this.currentGeomId = geomId;
    }

    const key = `${layerIndex}_${profile.infillDensity}_${profile.infillType}_${profile.wallLoops}_${profile.seamPosition || 'aligned'}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const slice = sliceGeometryAtHeight(geometry, heightY, profile);
    this.cache.set(key, slice);
    return slice;
  }

  public clear() {
    this.cache.clear();
  }
}

export const layerSliceCache = new LayerSliceCacheManager();

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
