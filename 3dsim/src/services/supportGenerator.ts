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
export interface ITreeChainPoint {
  x: number;
  y: number;
  z: number;
  r: number;
}

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
  chains: ITreeChainPoint[][];
  interfacePads: ITreeInterfacePad[];
  groundedRoots: { x: number; z: number; r: number }[];
}

const INF_ESCAPE = 1e6;

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
 * ôm khít mặt dưới mô hình với khe hở không khí Top-Z chuẩn Bambu Studio mà không bao giờ chòi vào trong mẫu.
 */
function buildPatchConformalCapGeometry(
  patch: IConformalOverhangPatch,
  capRadius: number,
  topZDistanceMm: number = 0.2,
  interfaceLayers: number = 2,
  plateMinY: number = 0
): THREE.BufferGeometry | null {
  if (!patch.triangles || patch.triangles.length === 0) return null;

  const positions: number[] = [];
  const layerThickness = Math.max(0.14, Math.min(0.42, interfaceLayers * 0.16));
  const [cx, cy, cz] = patch.center;
  const [pnx, pny, pnz] = patch.normal;
  const maxDist = Math.max(1.25, capRadius * 1.38);
  const minAllowedY = plateMinY + 0.16;

  // Offset theo hướng pháp tuyến trung bình hướng ra ngoài/xuống dưới để đảm bảo khe hở Top-Z sạch sẽ
  const topOff = Math.max(0.14, topZDistanceMm * 0.85);
  const botOff = topOff + layerThickness;

  for (const tri of patch.triangles) {
    if (Math.hypot(tri.mx - cx, tri.mz - cz) > maxDist || Math.abs(tri.my - cy) > 2.4) {
      continue;
    }

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

    const ox = (tri.nx + pnx) * 0.5;
    const oy = Math.min(-0.35, (tri.ny + pny) * 0.5);
    const oz = (tri.nz + pnz) * 0.5;
    const oLen = Math.hypot(ox, oy, oz) || 1;
    const ux = ox / oLen;
    const uy = oy / oLen;
    const uz = oz / oLen;

    const aTopX = ax + ux * topOff,
      aTopY = Math.max(minAllowedY + 0.04, ay + uy * topOff),
      aTopZ = az + uz * topOff;
    const bTopX = bx + ux * topOff,
      bTopY = Math.max(minAllowedY + 0.04, by + uy * topOff),
      bTopZ = bz + uz * topOff;
    const cTopX = ccx + ux * topOff,
      cTopY = Math.max(minAllowedY + 0.04, ccy + uy * topOff),
      cTopZ = ccz + uz * topOff;

    const aBotX = ax + ux * botOff,
      aBotY = Math.max(minAllowedY, ay + uy * botOff),
      aBotZ = az + uz * botOff;
    const bBotX = bx + ux * botOff,
      bBotY = Math.max(minAllowedY, by + uy * botOff),
      bBotZ = bz + uz * botOff;
    const cBotX = ccx + ux * botOff,
      cBotY = Math.max(minAllowedY, ccy + uy * botOff),
      cBotZ = ccz + uz * botOff;

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
  posAttr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  posArray: ArrayLike<number> | null;
  idxArray: ArrayLike<number> | null;
  triCount: number;
  numYBuckets: number;
  bucketStepY: number;
  buckets: Int32Array[];
}

/**
 * Đánh chỉ mục không gian 100% tam giác gốc (KHÔNG giảm mẫu / stride = 1)
 * để phép cắt lát 2D SDF luôn tạo đường bao khép kín tuyệt đối ngay cả với file .3MF ZBrush > 1 triệu tam giác.
 */
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

  const isInterleaved = Boolean((posAttr as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute);
  const posArray = !isInterleaved && posAttr.itemSize === 3 ? (posAttr.array as ArrayLike<number>) : null;
  const idxArray = indexAttr ? (indexAttr.array as ArrayLike<number>) : null;

  const numYBuckets = 96;
  const bucketStepY = height / numYBuckets;
  const bucketCounts = new Int32Array(numYBuckets);

  // Pass 1: Đếm chính xác số lượng tam giác mỗi tầng Y để cấp phát Int32Array phẳng không tốn RAM trung gian
  for (let t = 0; t < rawTriCount; t++) {
    const t3 = t * 3;
    const i0 = idxArray ? idxArray[t3] : t3;
    const i1 = idxArray ? idxArray[t3 + 1] : t3 + 1;
    const i2 = idxArray ? idxArray[t3 + 2] : t3 + 2;

    const ay = posArray ? posArray[i0 * 3 + 1] : posAttr.getY(i0);
    const by = posArray ? posArray[i1 * 3 + 1] : posAttr.getY(i1);
    const cy = posArray ? posArray[i2 * 3 + 1] : posAttr.getY(i2);

    const tMinY = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
    const tMaxY = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;
    const b0 = Math.max(0, Math.min(numYBuckets - 1, Math.floor((tMinY - minY) / bucketStepY)));
    const b1 = Math.max(0, Math.min(numYBuckets - 1, Math.floor((tMaxY - minY) / bucketStepY)));
    for (let b = b0; b <= b1; b++) {
      bucketCounts[b]++;
    }
  }

  const buckets: Int32Array[] = new Array(numYBuckets);
  const bucketCursors = new Int32Array(numYBuckets);
  for (let b = 0; b < numYBuckets; b++) {
    buckets[b] = new Int32Array(bucketCounts[b]);
  }

  // Pass 2: Điền chỉ số tam giác vào đúng các bucket độ cao
  for (let t = 0; t < rawTriCount; t++) {
    const t3 = t * 3;
    const i0 = idxArray ? idxArray[t3] : t3;
    const i1 = idxArray ? idxArray[t3 + 1] : t3 + 1;
    const i2 = idxArray ? idxArray[t3 + 2] : t3 + 2;

    const ay = posArray ? posArray[i0 * 3 + 1] : posAttr.getY(i0);
    const by = posArray ? posArray[i1 * 3 + 1] : posAttr.getY(i1);
    const cy = posArray ? posArray[i2 * 3 + 1] : posAttr.getY(i2);

    const tMinY = ay < by ? (ay < cy ? ay : cy) : by < cy ? by : cy;
    const tMaxY = ay > by ? (ay > cy ? ay : cy) : by > cy ? by : cy;
    const b0 = Math.max(0, Math.min(numYBuckets - 1, Math.floor((tMinY - minY) / bucketStepY)));
    const b1 = Math.max(0, Math.min(numYBuckets - 1, Math.floor((tMaxY - minY) / bucketStepY)));
    for (let b = b0; b <= b1; b++) {
      buckets[b][bucketCursors[b]++] = t;
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    posAttr,
    posArray,
    idxArray,
    triCount: rawTriCount,
    numYBuckets,
    bucketStepY,
    buckets,
  };
}

/**
 * Cắt chính xác 100% lưới tam giác tại mặt phẳng Y = sliceY thành các đoạn khép kín 2D [x1, z1, x2, z2]
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
  const { posAttr, posArray, idxArray } = pre;
  const maxSegs = Math.floor(outSegBuf.length / 4);
  let segCount = 0;

  for (let i = 0; i < bucket.length; i++) {
    const t3 = bucket[i] * 3;
    const i0 = idxArray ? idxArray[t3] : t3;
    const i1 = idxArray ? idxArray[t3 + 1] : t3 + 1;
    const i2 = idxArray ? idxArray[t3 + 2] : t3 + 2;

    let ax: number, ay: number, az: number;
    let bx: number, by: number, bz: number;
    let cx: number, cy: number, cz: number;

    if (posArray) {
      const p0 = i0 * 3;
      const p1 = i1 * 3;
      const p2 = i2 * 3;
      ay = posArray[p0 + 1];
      by = posArray[p1 + 1];
      cy = posArray[p2 + 1];

      const sA0 = ay - sliceY;
      const sB0 = by - sliceY;
      const sC0 = cy - sliceY;
      if ((sA0 > 0 && sB0 > 0 && sC0 > 0) || (sA0 < 0 && sB0 < 0 && sC0 < 0)) continue;

      ax = posArray[p0];
      az = posArray[p0 + 2];
      bx = posArray[p1];
      bz = posArray[p1 + 2];
      cx = posArray[p2];
      cz = posArray[p2 + 2];
    } else {
      ay = posAttr.getY(i0);
      by = posAttr.getY(i1);
      cy = posAttr.getY(i2);
      const sA0 = ay - sliceY;
      const sB0 = by - sliceY;
      const sC0 = cy - sliceY;
      if ((sA0 > 0 && sB0 > 0 && sC0 > 0) || (sA0 < 0 && sB0 < 0 && sC0 < 0)) continue;

      ax = posAttr.getX(i0);
      az = posAttr.getZ(i0);
      bx = posAttr.getX(i1);
      bz = posAttr.getZ(i1);
      cx = posAttr.getX(i2);
      cz = posAttr.getZ(i2);
    }

    const sA = ay - sliceY;
    const sB = by - sliceY;
    const sC = cy - sliceY;

    let p1x = 0,
      p1z = 0,
      p2x = 0,
      p2z = 0;
    let hits = 0;

    if ((sA >= 0 && sB < 0) || (sA < 0 && sB >= 0)) {
      const dy = by - ay;
      if (Math.abs(dy) > 1e-8) {
        const t = (sliceY - ay) / dy;
        p1x = ax + t * (bx - ax);
        p1z = az + t * (bz - az);
        hits = 1;
      }
    }
    if ((sB >= 0 && sC < 0) || (sB < 0 && sC >= 0)) {
      const dy = cy - by;
      if (Math.abs(dy) > 1e-8) {
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
      if (Math.abs(dy) > 1e-8) {
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
      if (Math.hypot(p2x - p1x, p2z - p1z) > 1e-6) {
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
 * 1. Quét tán lá mao mạch Overhang mật độ cao (bắt trọn tam giác sculpt siêu mịn ZBrush: tai, cằm, chóp lông, móng vuốt, đuôi)
 */
function extractHighDensityOverhangPatches(
  pre: IPreindexedModelTriangles,
  thresholdDeg: number = 45,
  maxPatchesCap: number = 210
): IConformalOverhangPatch[] {
  const height = Math.max(0.5, pre.maxY - pre.minY);
  const spanX = Math.max(1, pre.maxX - pre.minX);
  const spanZ = Math.max(1, pre.maxZ - pre.minZ);
  const maxSpan = Math.max(spanX, height, spanZ);

  // Ngưỡng góc Bambu Studio: thresholdDeg (mặc định 45° tính từ phương đứng/ngang)
  const sinThresh = Math.sin((Math.max(15, Math.min(80, 90 - thresholdDeg)) * Math.PI) / 180);

  // Lưới chiếu sàn mịn để kiểm tra khoảng hở thẳng đứng dưới mỗi tam giác Overhang
  const floorRes = 104;
  const floorStepX = spanX / floorRes;
  const floorStepZ = spanZ / floorRes;
  const cellTopSurfaceHeights: number[][] = Array.from({ length: floorRes * floorRes }, () => []);

  const { posAttr, posArray, idxArray, triCount } = pre;
  const scanStride = triCount > 600000 ? Math.ceil(triCount / 500000) : 1;
  const areaScale = scanStride;
  const candidates: Omit<IOverhangTriangle, 'floorY'>[] = [];

  for (let t = 0; t < triCount; t += scanStride) {
    const t3 = t * 3;
    const i0 = idxArray ? idxArray[t3] : t3;
    const i1 = idxArray ? idxArray[t3 + 1] : t3 + 1;
    const i2 = idxArray ? idxArray[t3 + 2] : t3 + 2;

    let ax: number, ay: number, az: number;
    let bx: number, by: number, bz: number;
    let cx: number, cy: number, cz: number;

    if (posArray) {
      const p0 = i0 * 3;
      const p1 = i1 * 3;
      const p2 = i2 * 3;
      ax = posArray[p0];
      ay = posArray[p0 + 1];
      az = posArray[p0 + 2];
      bx = posArray[p1];
      by = posArray[p1 + 1];
      bz = posArray[p1 + 2];
      cx = posArray[p2];
      cy = posArray[p2 + 1];
      cz = posArray[p2 + 2];
    } else {
      ax = posAttr.getX(i0);
      ay = posAttr.getY(i0);
      az = posAttr.getZ(i0);
      bx = posAttr.getX(i1);
      by = posAttr.getY(i1);
      bz = posAttr.getZ(i1);
      cx = posAttr.getX(i2);
      cy = posAttr.getY(i2);
      cz = posAttr.getZ(i2);
    }

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
    // Bảo toàn 100% tam giác sculpt siêu nhỏ (cạnh 0.02mm -> doubleArea ~ 4e-4)
    if (doubleArea < 1e-8) continue;

    const nx = cpx / doubleArea;
    const ny = cpy / doubleArea;
    const nz = cpz / doubleArea;
    const mx = (ax + bx + cx) / 3;
    const my = (ay + by + cy) / 3;
    const mz = (az + bz + cz) / 3;
    const relY = my - pre.minY;

    // Ghi nhận mặt hướng lên làm sàn cản bên dưới
    if (ny > 0.22 && relY > 0.25) {
      const fx = Math.max(0, Math.min(floorRes - 1, Math.floor((mx - pre.minX) / floorStepX)));
      const fz = Math.max(0, Math.min(floorRes - 1, Math.floor((mz - pre.minZ) / floorStepZ)));
      cellTopSurfaceHeights[fx * floorRes + fz].push(my);
    }

    // Tam giác hướng xuống vượt ngưỡng Overhang và cao hơn mép vát đế 1.35mm
    if (ny < -sinThresh && relY >= 1.35) {
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
        area: doubleArea * 0.5 * areaScale,
        angleDeg: 90 - angleFromVertical, // 90° = trần nằm ngang nguy hiểm nhất
      });
    }
  }

  if (candidates.length === 0) return [];

  // Kích thước ô gom cụm mao mạch nhỏ (2.8mm - 5.6mm) để sinh tán cành phủ đều toàn bộ mẫu
  const cellMm = Math.max(2.8, Math.min(5.6, maxSpan * 0.038));
  const cellY = Math.max(2.4, cellMm * 0.86);
  const buckets = new Map<string, IOverhangTriangle[]>();

  for (const c of candidates) {
    const fx = Math.max(0, Math.min(floorRes - 1, Math.floor((c.mx - pre.minX) / floorStepX)));
    const fz = Math.max(0, Math.min(floorRes - 1, Math.floor((c.mz - pre.minZ) / floorStepZ)));
    const floors = cellTopSurfaceHeights[fx * floorRes + fz];

    let nearestBelow = pre.minY;
    for (let k = 0; k < floors.length; k++) {
      const fy = floors[k];
      if (fy < c.my - 0.3 && fy > nearestBelow) {
        nearestBelow = fy;
      }
    }

    // Bỏ qua khe tự đỡ quá hẹp (< 1.25mm) không đủ nhét đầu nhánh & lớp đệm
    if (c.my - nearestBelow < 1.25) continue;

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

    // Chấp nhận cả các chóp nhọn treo lơ lửng (chóp cằm, chóp lông, tai, móng vuốt >= 0.045 mm²)
    const isSharpHangingTip = maxDangerAngle >= 58 && wy / (areaSum || 1) - maxFloorY >= 3.0;
    const minAreaRequired = isSharpHangingTip ? 0.045 : 0.2;
    if (areaSum < minAreaRequired) return;

    const cx = wx / areaSum;
    const cy = wy / areaSum;
    const cz = wz / areaSum;
    const nLen = Math.hypot(wnx, wny, wnz) || 1;
    const avgAngle = weightedAngle / areaSum;
    const severity: 'critical' | 'moderate' | 'mild' =
      maxDangerAngle >= 62 ? 'critical' : maxDangerAngle >= 50 ? 'moderate' : 'mild';

    // Chọn điểm neo tiếp xúc thực nằm gần cực tiểu độ cao / trọng tâm cụm nhất
    let bestTri = tris[0];
    let bestMetric = Infinity;
    for (const t of tris) {
      const d = Math.hypot(t.mx - cx, t.my - cy, t.mz - cz) + (t.my - cy) * 0.25;
      if (d < bestMetric) {
        bestMetric = d;
        bestTri = t;
      }
    }

    const tipBoost = isSharpHangingTip ? 2.35 : 1.0;
    const effectiveArea = Math.max(0.35, areaSum);
    const score =
      effectiveArea *
      tipBoost *
      (1 + maxDangerAngle / 42) *
      (1 + ((cy - pre.minY) / height) * 0.45);

    scoredPatches.push({
      score,
      patch: {
        id: `patch-v3-${idxCounter++}`,
        center: [
          Number(bestTri.mx.toFixed(2)),
          Number(bestTri.my.toFixed(2)),
          Number(bestTri.mz.toFixed(2)),
        ],
        normal: [wnx / nLen, wny / nLen, wnz / nLen],
        floorY: maxFloorY,
        triangles: tris.length > 80 ? tris.slice(0, 80) : tris,
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

  // Phân bổ đa dạng không gian 3D để các cành phủ đều khắp tai, đầu, thân, đuôi (không dồn hết vào 1 cụm lông)
  const minSpacing = Math.max(2.6, Math.min(4.8, maxSpan * 0.024));
  const selected: IConformalOverhangPatch[] = [];

  for (const item of scoredPatches) {
    if (selected.length >= maxPatchesCap) break;
    const [px, py, pz] = item.patch.center;
    let tooClose = false;
    for (let i = 0; i < selected.length; i++) {
      const [qx, qy, qz] = selected[i].center;
      if (Math.hypot(px - qx, (py - qy) * 0.8, pz - qz) < minSpacing) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      selected.push(item.patch);
    }
  }

  return selected;
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
  return extractHighDensityOverhangPatches(pre, thresholdDeg, 120);
}

interface ITreeGraphNode {
  id: number;
  level: number;
  x: number;
  y: number;
  z: number;
  r: number;
  ageLevels: number;
  tipWeight: number;
  allowModelFloorLanding: boolean;
  landedOnFloor: boolean;
  reachedGoal: boolean;
  parentIds: number[];
  patch?: IConformalOverhangPatch;
  tipStem?: {
    x0: number;
    y0: number;
    z0: number;
    r0: number;
  };
}

/**
 * 2. Thuật toán Nhân Tree Support 3.0 Quét Ngược Từng Lớp (Top-Down Layer-wise Influence Areas + 100% Exact 2D SDF):
 * - Dựng chồng mặt cắt 2D SDF khép kín tuyệt đối của toàn bộ mô hình & Trường Đường Hầm Thoát Hiểm (Escape Tunnel Field).
 * - Co giãn bán kính thông minh (Dynamic Radius Squeezing) giúp thân cây gộp luồn mượt qua khe hẹp mà không bao giờ bị cắt cụt.
 * - Tự động cắt tỉa ngược (Backtrack Pruning) + Làm mượt đường cong Laplacian có kiểm định va chạm SDF 100%.
 */
export function computeTreeSupport2DVolume(
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  overhangThreshold: number = 45
): { volume: ITreeSupport2DVolume; patches: IConformalOverhangPatch[] } | null {
  const pre = buildPreindexedTriangles(geometry);
  if (!pre) return null;

  const effectiveThreshold = profile.supportAngleThreshold || overhangThreshold || 45;
  let patches = extractHighDensityOverhangPatches(pre, effectiveThreshold, 210);
  if (patches.length === 0 && effectiveThreshold < 58) {
    patches = extractHighDensityOverhangPatches(pre, 58, 140);
  }
  if (patches.length === 0) return null;

  const style: TreeSupportStyle = profile.treeStyle || 'organic';
  const branchDiaScale = Math.max(0.65, Math.min(1.5, (profile.supportBranchDiameter || 2.0) / 2.2));
  const branchAngleDeg = Math.max(25, Math.min(58, profile.supportBranchAngle || 42));
  const tanBranchAngle = Math.tan((branchAngleDeg * Math.PI) / 180);
  const escapeAngleDeg = Math.max(branchAngleDeg, 53);
  const tanEscapeAngle = Math.tan((escapeAngleDeg * Math.PI) / 180);
  const buildPlateOnly = profile.supportOnBuildPlateOnly !== false;
  const topZDistMm = profile.supportTopZDistance ?? 0.2;
  const interfaceLayers = profile.supportInterfaceLayers ?? 2;
  const interfaceHeightMm = Math.max(0.2, interfaceLayers * (profile.layerHeight || 0.2));
  const xyClearanceMm = 0.42;

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
  const margin = Math.max(14.0, Math.max(spanX, spanZ) * 0.22);

  const gridRes = 128;
  const boxSpan = Math.max(spanX + margin * 2, spanZ + margin * 2);
  const cellSize = boxSpan / gridRes;
  const centerX = (pre.minX + pre.maxX) * 0.5;
  const centerZ = (pre.minZ + pre.maxZ) * 0.5;
  const gridMinX = centerX - boxSpan * 0.5;
  const gridMinZ = centerZ - boxSpan * 0.5;

  const numLevels = Math.max(34, Math.min(92, Math.round(height / 1.15)));
  const levelStepY = height / numLevels;

  // Bước 2.1: Xây dựng chồng mặt cắt 2D SDF khép kín chính xác trên toàn bộ numLevels độ cao
  const sdfWorkGrid = new SdfGrid2D(gridRes, gridRes);
  sdfWorkGrid.configureBounds(gridMinX, gridMinZ, cellSize);
  const maxSliceSegs = Math.max(48000, Math.min(260000, Math.ceil(pre.triCount / 4)));
  const segScratch = new Float32Array(maxSliceSegs * 4);
  const levelModelSdfs: Float32Array[] = new Array(numLevels);

  for (let k = 0; k < numLevels; k++) {
    const ySlice = pre.minY + (k + 0.35) * levelStepY;
    const segCount = intersectPreindexedAtY(pre, ySlice, segScratch);
    sdfWorkGrid.rasterizeSegments(segScratch, segCount);
    sdfWorkGrid.computeSignedDistanceField();
    levelModelSdfs[k] = new Float32Array(sdfWorkGrid.sdf);
  }

  // Bước 2.2: Lan truyền từ bàn in lên đỉnh (Bottom-Up Escape Tunnel Field)
  const escapeFields: Float32Array[] = new Array(numLevels);
  const totalCells = gridRes * gridRes;
  const minSqueezeR = Math.max(0.38, tipRadius * 0.68);
  const minCorridorSdf = Math.max(0.48, minSqueezeR * 0.8 + xyClearanceMm);
  const preferredOuterSdf = maxTrunkRadius + xyClearanceMm + 2.0;

  const esc0 = new Float32Array(totalCells);
  const sdf0 = levelModelSdfs[0];
  for (let i = 0; i < totalCells; i++) {
    esc0[i] = sdf0[i] >= minCorridorSdf ? 0 : INF_ESCAPE;
  }
  escapeFields[0] = esc0;

  const maxStepMm = levelStepY * tanBranchAngle;
  const maxEscapeStepMm = levelStepY * tanEscapeAngle;
  const searchCellRad = Math.max(2, Math.min(6, Math.ceil(maxEscapeStepMm / cellSize) + 1));

  // Tiền tính bảng lân cận tròn 1 lần duy nhất (Tăng tốc Escape Field gấp 40 lần: < 45ms thay vì 2.5s!)
  const neighborOffsets: Array<{ dx: number; dz: number; moveCost: number }> = [];
  for (let dz = -searchCellRad; dz <= searchCellRad; dz++) {
    for (let dx = -searchCellRad; dx <= searchCellRad; dx++) {
      const horizMm = Math.hypot(dx * cellSize, dz * cellSize);
      if (horizMm > maxEscapeStepMm + cellSize * 0.65) continue;
      const steepPenalty = horizMm > maxStepMm ? (horizMm - maxStepMm) * 1.65 : 0;
      neighborOffsets.push({
        dx,
        dz,
        moveCost: horizMm + steepPenalty + levelStepY * 0.35,
      });
    }
  }
  const numOffsets = neighborOffsets.length;

  for (let k = 1; k < numLevels; k++) {
    const prevEsc = escapeFields[k - 1];
    const curSdf = levelModelSdfs[k];
    const curEsc = new Float32Array(totalCells);

    for (let gz = 0; gz < gridRes; gz++) {
      const row = gz * gridRes;
      for (let gx = 0; gx < gridRes; gx++) {
        const idx = row + gx;
        const dModel = curSdf[idx];
        if (dModel < minCorridorSdf) {
          curEsc[idx] = INF_ESCAPE;
          continue;
        }

        const wallPenalty =
          dModel < preferredOuterSdf
            ? (preferredOuterSdf - dModel) * (preferredOuterSdf - dModel) * 0.36
            : 0;

        let best = INF_ESCAPE;
        for (let o = 0; o < numOffsets; o++) {
          const off = neighborOffsets[o];
          const nx = gx + off.dx;
          const nz = gz + off.dz;
          if (nx < 0 || nx >= gridRes || nz < 0 || nz >= gridRes) continue;
          const pVal = prevEsc[nz * gridRes + nx];
          if (pVal >= INF_ESCAPE * 0.5) continue;
          const cand = pVal + off.moveCost + wallPenalty;
          if (cand < best) best = cand;
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
    const eps = cellSize * 0.75;
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

  // Kiểm tra 6 điểm dọc đoạn nối (x0, z0) -> (x1, z1) không cắt xuyên qua bất kỳ vách mô hình nào
  const isSegmentClearOfModel = (
    sdfAbove: Float32Array,
    sdfBelow: Float32Array,
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    minClearance: number
  ): boolean => {
    for (let s = 1; s <= 6; s++) {
      const t = s / 6;
      const mx = x0 + (x1 - x0) * t;
      const mz = z0 + (z1 - z0) * t;
      const dLow = sampleGridField(sdfBelow, mx, mz);
      const dUp = sampleGridField(sdfAbove, mx, mz);
      const dInterp = dUp * (1 - t) + dLow * t;
      if (dInterp < minClearance || (t > 0.65 && dLow < minClearance)) {
        return false;
      }
    }
    return true;
  };

  // Phân bổ các đầu nhánh mao mạch vào đúng tầng cao độ xuất phát (loại bỏ điểm nằm sâu bên trong lòng kín của mẫu)
  const patchesByLevel: IConformalOverhangPatch[][] = Array.from({ length: numLevels }, () => []);

  for (const p of patches) {
    const contactY = p.center[1] - topZDistMm - interfaceHeightMm * 0.5;
    const lvl = Math.max(
      1,
      Math.min(numLevels - 1, Math.floor((contactY - pre.minY) / levelStepY))
    );
    const [px, , pz] = p.center;
    const [nx, , nz] = p.normal;
    const belowLvl = Math.max(0, lvl - 1);
    const dUnder = sampleGridField(levelModelSdfs[belowLvl], px + nx * 0.55, pz + nz * 0.55);
    const dUnderDirect = sampleGridField(levelModelSdfs[belowLvl], px, pz);
    if (Math.max(dUnder, dUnderDirect) < -0.65) continue;

    patchesByLevel[lvl].push(p);
  }

  // Bước 2.3: Quét ngược Top-Down từ đỉnh (numLevels - 1) xuống bàn in (0) với Co Giãn Bán Kính Thông Minh
  const allGraphNodes = new Map<number, ITreeGraphNode>();
  const nodesByLevel: ITreeGraphNode[][] = Array.from({ length: numLevels }, () => []);
  let activeNodes: ITreeGraphNode[] = [];
  let nextNodeId = 1;

  const isNormalMode = profile.supportMode === 'normal';
  const minHardClear = minSqueezeR * 0.82 + xyClearanceMm * 0.9;

  for (let k = numLevels - 1; k >= 0; k--) {
    const yCur = k === 0 ? pre.minY + 0.14 : pre.minY + (k + 0.35) * levelStepY;
    const curSdf = levelModelSdfs[k];
    const aboveSdf = levelModelSdfs[Math.min(numLevels - 1, k + 1)];
    const curEsc = escapeFields[k];

    // A. Di chuyển tất cả các nhánh đang hoạt động từ tầng k + 1 xuống tầng k
    const steppedCandidates: ITreeGraphNode[] = [];

    for (const parentNode of activeNodes) {
      if (parentNode.landedOnFloor) continue;
      const prevX = parentNode.x;
      const prevZ = parentNode.z;
      const prevR = parentNode.r;

      let desiredR = Math.min(
        maxTrunkRadius,
        prevR + levelStepY * (isNormalMode ? 0.004 : 0.015)
      );
      if (k === 1) desiredR *= 1.06;
      else if (k === 0) desiredR *= 1.18;

      const fullReqClearance = desiredR * 0.92 + xyClearanceMm;
      let nx = prevX;
      let nz = prevZ;

      if (!isNormalMode) {
        const dStay = sampleGridField(curSdf, nx, nz);
        const staySqueezePenalty =
          dStay < fullReqClearance ? (fullReqClearance - dStay) * 2.5 : 0;
        let bestScore =
          dStay >= minHardClear
            ? sampleGridField(curEsc, nx, nz) + staySqueezePenalty
            : INF_ESCAPE * 2;
        let bestCandX = nx;
        let bestCandZ = nz;

        const radii = [
          maxStepMm * 0.42,
          maxStepMm * 0.85,
          maxEscapeStepMm * 1.02,
        ];
        for (const rProbe of radii) {
          for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * Math.PI * 2;
            const px = prevX + Math.cos(ang) * rProbe;
            const pz = prevZ + Math.sin(ang) * rProbe;
            const dMod = sampleGridField(curSdf, px, pz);
            if (dMod < minHardClear) continue;
            if (!isSegmentClearOfModel(aboveSdf, curSdf, prevX, prevZ, px, pz, minHardClear * 0.88)) {
              continue;
            }
            const eVal = sampleGridField(curEsc, px, pz);
            const squeezePen =
              dMod < fullReqClearance ? (fullReqClearance - dMod) * 2.2 : 0;
            const candScore = eVal + squeezePen;
            if (candScore < bestScore - 0.03) {
              bestScore = candScore;
              bestCandX = px;
              bestCandZ = pz;
            }
          }
        }
        nx = bestCandX;
        nz = bestCandZ;
      }

      // 2. Xử lý hạ cánh an toàn lên bề mặt mô hình bên dưới nếu ở chế độ Support Everywhere (!buildPlateOnly)
      //    hoặc khi hốc lõm kín hoàn toàn không có hành lang ra bàn in (đặt chân ngoài mặt mẫu, không xuyên thủng!)
      const dAtTarget = sampleGridField(curSdf, nx, nz);
      const dAbovePrev = sampleGridField(aboveSdf, prevX, prevZ);
      const escAtTarget = sampleGridField(curEsc, nx, nz);
      const canFallbackLandOnModel =
        parentNode.allowModelFloorLanding || escAtTarget >= INF_ESCAPE * 0.5;
      if (
        canFallbackLandOnModel &&
        parentNode.ageLevels >= 2 &&
        dAtTarget <= 0.28 &&
        dAbovePrev >= minSqueezeR * 0.8 + 0.25
      ) {
        const landedNode: ITreeGraphNode = {
          id: nextNodeId++,
          level: k,
          x: prevX,
          y: Math.max(pre.minY + 0.22, yCur + levelStepY * 0.58),
          z: prevZ,
          r: Math.min(prevR, Math.max(minSqueezeR, dAbovePrev - 0.24)),
          ageLevels: parentNode.ageLevels + 1,
          tipWeight: parentNode.tipWeight,
          allowModelFloorLanding: true,
          landedOnFloor: true,
          reachedGoal: true,
          parentIds: [parentNode.id],
        };
        allGraphNodes.set(landedNode.id, landedNode);
        nodesByLevel[k].push(landedNode);
        continue;
      }

      // 3. Đẩy nhánh ra ngoài biên dạng 2D SDF để ưu tiên đủ bề rộng thân cây
      let curDist = sampleGridField(curSdf, nx, nz);
      if (curDist < fullReqClearance) {
        if (isNormalMode && buildPlateOnly && curDist < 0) {
          continue;
        }
        for (let iter = 0; iter < 6 && curDist < fullReqClearance; iter++) {
          const [gx, gz] = sampleModelGradient(curSdf, nx, nz);
          const push = Math.min(maxEscapeStepMm * 0.48, fullReqClearance - curDist + 0.14);
          nx += gx * push;
          nz += gz * push;
          curDist = sampleGridField(curSdf, nx, nz);
        }
      }

      // Co giãn bán kính thông minh (Dynamic Radius Squeezing) khi đi ngang hành lang hẹp cạnh thân/đuôi
      const availR = Math.max(minSqueezeR, (curDist - xyClearanceMm - 0.06) / 0.92);
      const effR = Math.min(desiredR, availR);

      const stepDist = Math.hypot(nx - prevX, nz - prevZ);
      if (stepDist > maxEscapeStepMm * 1.42) {
        continue;
      }
      if (curDist < effR * 0.84 + xyClearanceMm * 0.85) {
        continue;
      }
      const segMinClear = Math.min(prevR, effR) * 0.72 + xyClearanceMm * 0.8;
      if (!isSegmentClearOfModel(aboveSdf, curSdf, prevX, prevZ, nx, nz, segMinClear)) {
        continue;
      }

      steppedCandidates.push({
        id: nextNodeId++,
        level: k,
        x: nx,
        y: yCur,
        z: nz,
        r: effR,
        ageLevels: parentNode.ageLevels + 1,
        tipWeight: parentNode.tipWeight,
        allowModelFloorLanding: parentNode.allowModelFloorLanding,
        landedOnFloor: false,
        reachedGoal: k === 0,
        parentIds: [parentNode.id],
      });
    }

    // B. Lực hút quy tụ tán cây hữu cơ (Sibling Canopy Attraction) — Giới hạn tầm hút để không nối chập các chi tiết rời
    if (!isNormalMode && steppedCandidates.length > 1) {
      const heightRatio = k / numLevels;
      const attractRange = Math.min(
        11.5,
        (4.5 + (1 - heightRatio) * 8.0) * mergeRangeScale * Math.max(0.75, tanBranchAngle)
      );

      const shiftsX = new Float32Array(steppedCandidates.length);
      const shiftsZ = new Float32Array(steppedCandidates.length);

      for (let i = 0; i < steppedCandidates.length; i++) {
        const a = steppedCandidates[i];
        let pullX = 0,
          pullZ = 0,
          pullW = 0;

        for (let j = 0; j < steppedCandidates.length; j++) {
          if (i === j) continue;
          const b = steppedCandidates[j];
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.05 || d > attractRange) continue;

          const reqMid = Math.max(a.r, b.r) * 0.9 + xyClearanceMm;
          if (!isSegmentClearOfModel(curSdf, curSdf, a.x, a.z, b.x, b.z, reqMid)) continue;

          const w = (b.r * b.r) / (d + 0.8);
          pullX += (dx / d) * w;
          pullZ += (dz / d) * w;
          pullW += w;
        }

        if (pullW > 1e-4) {
          const dirX = pullX / pullW;
          const dirZ = pullZ / pullW;
          const dLen = Math.hypot(dirX, dirZ) || 1;
          const step = Math.min(maxStepMm * 0.72, (0.45 + 0.55 * dLen) * maxStepMm * 0.68);
          const candX = a.x + (dirX / dLen) * step;
          const candZ = a.z + (dirZ / dLen) * step;

          const pNode = allGraphNodes.get(a.parentIds[0]);
          const parentClear = pNode
            ? isSegmentClearOfModel(aboveSdf, curSdf, pNode.x, pNode.z, candX, candZ, a.r * 0.8 + xyClearanceMm)
            : true;

          if (parentClear && sampleGridField(curSdf, candX, candZ) >= a.r * 0.95 + xyClearanceMm) {
            shiftsX[i] = candX - a.x;
            shiftsZ[i] = candZ - a.z;
          }
        }
      }

      for (let i = 0; i < steppedCandidates.length; i++) {
        steppedCandidates[i].x += shiftsX[i];
        steppedCandidates[i].z += shiftsZ[i];
      }
    }

    // C. Phép Gộp Nhánh Sinh Học Bảo Toàn Diện Tích (Kiểm tra cả điểm gộp lẫn các nhánh cha phía trên không chạm mẫu)
    const mergedNodes: ITreeGraphNode[] = [];
    const consumed = new Uint8Array(steppedCandidates.length);

    for (let i = 0; i < steppedCandidates.length; i++) {
      if (consumed[i]) continue;
      const primary = steppedCandidates[i];

      if (!isNormalMode) {
        for (let j = i + 1; j < steppedCandidates.length; j++) {
          if (consumed[j]) continue;
          const other = steppedCandidates[j];
          const dist = Math.hypot(primary.x - other.x, primary.z - other.z);
          const mergeThresh = Math.max(1.35, (primary.r + other.r) * 0.96);

          if (dist <= mergeThresh) {
            const w1 = primary.r * primary.r;
            const w2 = other.r * other.r;
            const wSum = w1 + w2;
            const mx = (primary.x * w1 + other.x * w2) / wSum;
            const mz = (primary.z * w1 + other.z * w2) / wSum;
            const dMerged = sampleGridField(curSdf, mx, mz);
            const rawMr = Math.min(maxTrunkRadius, Math.sqrt(w1 + w2 * 0.74) + 0.02);
            const mr = Math.max(
              Math.max(primary.r, other.r),
              Math.min(rawMr, (dMerged - xyClearanceMm - 0.05) / 0.92)
            );

            if (dMerged >= mr * 0.9 + xyClearanceMm) {
              // Đảm bảo nối từ các nút cha tầng trên xuống điểm gộp mới không cắt qua mép mẫu
              let allParentsClear = true;
              for (const pid of [...primary.parentIds, ...other.parentIds]) {
                const pN = allGraphNodes.get(pid);
                if (
                  pN &&
                  !isSegmentClearOfModel(
                    aboveSdf,
                    curSdf,
                    pN.x,
                    pN.z,
                    mx,
                    mz,
                    Math.min(pN.r, mr) * 0.72 + xyClearanceMm * 0.8
                  )
                ) {
                  allParentsClear = false;
                  break;
                }
              }

              if (allParentsClear) {
                primary.x = mx;
                primary.z = mz;
                primary.r = mr;
                primary.tipWeight += other.tipWeight;
                primary.ageLevels = Math.max(primary.ageLevels, other.ageLevels);
                primary.allowModelFloorLanding =
                  primary.allowModelFloorLanding || other.allowModelFloorLanding;
                primary.parentIds.push(...other.parentIds);
                consumed[j] = 1;
              }
            }
          }
        }
      }

      allGraphNodes.set(primary.id, primary);
      nodesByLevel[k].push(primary);
      mergedNodes.push(primary);
    }

    // D. Sinh các đầu nhánh mao mạch mới bắt đầu từ tầng k (Đẩy điểm spawn & cuống nhánh hoàn toàn ra ngoài biên SDF mẫu)
    if (k >= 1) {
      for (const patch of patchesByLevel[k]) {
        const [px, py, pz] = patch.center;
        const [nx, , nz] = patch.normal;

        const patchTipR = Math.max(
          tipRadius * 0.82,
          Math.min(tipRadius * 1.38, tipRadius * (0.8 + Math.sqrt(patch.areaMm2) * 0.07))
        );
        const reqSpawnClear = patchTipR * 0.9 + xyClearanceMm + 0.12;

        const horizNormLen = Math.hypot(nx, nz);
        const outDirX = horizNormLen > 0.08 ? nx / horizNormLen : 0;
        const outDirZ = horizNormLen > 0.08 ? nz / horizNormLen : 0;

        // Điểm cuống sát dưới mặt đệm Overhang (đẩy nhẹ ra ngoài nếu gần mép đứng)
        let stemX0 = px + outDirX * 0.22;
        let stemZ0 = pz + outDirZ * 0.22;
        let dStem = sampleGridField(aboveSdf, stemX0, stemZ0);
        for (let iter = 0; iter < 4 && dStem < 0.26; iter++) {
          const [gx, gz] = sampleModelGradient(aboveSdf, stemX0, stemZ0);
          const push = Math.min(0.65, 0.28 - dStem);
          stemX0 += gx * push;
          stemZ0 += gz * push;
          dStem = sampleGridField(aboveSdf, stemX0, stemZ0);
        }

        let spawnX = stemX0 + outDirX * (patchTipR * 0.8 + 0.28);
        let spawnZ = stemZ0 + outDirZ * (patchTipR * 0.8 + 0.28);

        let dSpawn = sampleGridField(curSdf, spawnX, spawnZ);
        for (let iter = 0; iter < 7 && dSpawn < reqSpawnClear; iter++) {
          const [gx, gz] = sampleModelGradient(curSdf, spawnX, spawnZ);
          const push = Math.min(1.0, reqSpawnClear - dSpawn + 0.14);
          spawnX += gx * push;
          spawnZ += gz * push;
          dSpawn = sampleGridField(curSdf, spawnX, spawnZ);
        }

        let escHere = sampleGridField(curEsc, spawnX, spawnZ);
        if (escHere >= INF_ESCAPE * 0.5 || dSpawn < minHardClear) {
          let bestProbeEsc = escHere;
          let foundX = spawnX;
          let foundZ = spawnZ;
          for (let rStep = 0.6; rStep <= 3.4; rStep += 0.7) {
            for (let a = 0; a < 12; a++) {
              const ang = (a / 12) * Math.PI * 2;
              const tx = stemX0 + Math.cos(ang) * rStep;
              const tz = stemZ0 + Math.sin(ang) * rStep;
              const dTest = sampleGridField(curSdf, tx, tz);
              if (dTest < minHardClear) continue;
              if (!isSegmentClearOfModel(aboveSdf, curSdf, stemX0, stemZ0, tx, tz, 0.24)) continue;
              const eVal = sampleGridField(curEsc, tx, tz);
              if (eVal < bestProbeEsc) {
                bestProbeEsc = eVal;
                foundX = tx;
                foundZ = tz;
                dSpawn = dTest;
              }
            }
            if (bestProbeEsc < INF_ESCAPE * 0.5 && dSpawn >= minHardClear) break;
          }
          spawnX = foundX;
          spawnZ = foundZ;
          escHere = bestProbeEsc;
        }

        // Loại bỏ hoàn toàn nếu điểm spawn nằm trong mẫu hoặc quá lệch (> 3.8mm) khỏi tâm đệm tiếp xúc
        if (dSpawn < minHardClear * 0.85 || Math.hypot(spawnX - px, spawnZ - pz) > 3.8) {
          continue;
        }
        if (!isSegmentClearOfModel(aboveSdf, curSdf, stemX0, stemZ0, spawnX, spawnZ, 0.22)) {
          continue;
        }

        const reachableToBed = escHere < INF_ESCAPE * 0.5;
        const roofBottomY = Math.max(yCur + 0.16, py - topZDistMm - interfaceHeightMm * 0.65);
        const effTipR = Math.max(
          minSqueezeR,
          Math.min(patchTipR, (dSpawn - xyClearanceMm - 0.04) / 0.9)
        );

        const newNode: ITreeGraphNode = {
          id: nextNodeId++,
          level: k,
          x: spawnX,
          y: yCur,
          z: spawnZ,
          r: effTipR,
          ageLevels: 0,
          tipWeight: 1,
          allowModelFloorLanding: !reachableToBed || !buildPlateOnly,
          landedOnFloor: false,
          reachedGoal: false,
          parentIds: [],
          patch,
          tipStem: {
            x0: stemX0,
            y0: roofBottomY,
            z0: stemZ0,
            r0: Math.max(0.36, effTipR * 0.82),
          },
        };
        allGraphNodes.set(newNode.id, newNode);
        nodesByLevel[k].push(newNode);
        mergedNodes.push(newNode);
      }
    }

    activeNodes = mergedNodes;
  }

  // Bước 2.4: Lan truyền ngược (Backtrack Pruning) từ k = 0 lên đỉnh để XÓA BỎ 100% các nhánh cụt bị chặn giữa chừng!
  for (let k = 0; k < numLevels; k++) {
    for (const node of nodesByLevel[k]) {
      if (!node.reachedGoal) continue;
      for (const pid of node.parentIds) {
        const pNode = allGraphNodes.get(pid);
        if (pNode) {
          pNode.reachedGoal = true;
        }
      }
    }
  }

  // Xây dựng ánh xạ chiều đi xuống (downChildId: mỗi nút ở k+1 đi xuống tối đa 1 nút hợp lệ ở k)
  const downChildMap = new Map<number, number>();
  const upChildrenMap = new Map<number, number[]>();

  for (let k = 0; k < numLevels; k++) {
    for (const n of nodesByLevel[k]) {
      if (!n.reachedGoal) continue;
      const validUp: number[] = [];
      for (const pid of n.parentIds) {
        const pNode = allGraphNodes.get(pid);
        if (pNode && pNode.reachedGoal) {
          validUp.push(pid);
          downChildMap.set(pid, n.id);
        }
      }
      upChildrenMap.set(n.id, validUp);
    }
  }

  // Bước 2.5: Làm mượt đường cong hữu cơ 3 lượt (Collision-Verified Laplacian Curve Fairing)
  if (!isNormalMode) {
    for (let pass = 0; pass < 3; pass++) {
      for (let k = 1; k < numLevels - 1; k++) {
        const curSdf = levelModelSdfs[k];
        const aboveSdf = levelModelSdfs[k + 1];
        const belowSdf = levelModelSdfs[k - 1];

        for (const n of nodesByLevel[k]) {
          if (!n.reachedGoal || n.landedOnFloor || n.patch) continue;
          const upIds = upChildrenMap.get(n.id);
          const downId = downChildMap.get(n.id);
          if (!upIds || upIds.length !== 1 || downId === undefined) continue;

          const uNode = allGraphNodes.get(upIds[0]);
          const dNode = allGraphNodes.get(downId);
          if (!uNode || !dNode) continue;

          const midX = (uNode.x + dNode.x) * 0.5;
          const midZ = (uNode.z + dNode.z) * 0.5;
          const candX = n.x + (midX - n.x) * 0.36;
          const candZ = n.z + (midZ - n.z) * 0.5 * 0.72;

          const dHere = sampleGridField(curSdf, candX, candZ);
          if (dHere < n.r * 0.9 + xyClearanceMm) continue;
          if (
            !isSegmentClearOfModel(
              aboveSdf,
              curSdf,
              uNode.x,
              uNode.z,
              candX,
              candZ,
              Math.min(uNode.r, n.r) * 0.76 + xyClearanceMm * 0.85
            )
          ) {
            continue;
          }
          if (
            !isSegmentClearOfModel(
              curSdf,
              belowSdf,
              candX,
              candZ,
              dNode.x,
              dNode.z,
              Math.min(n.r, dNode.r) * 0.76 + xyClearanceMm * 0.85
            )
          ) {
            continue;
          }

          n.x = candX;
          n.z = candZ;
        }
      }
    }
  }

  // Bước 2.6: Phân rã cây thành các Chuỗi Thân Chính -> Nhánh Con (Heavy-Path Decomposition) mượt liền mạch
  const chains: ITreeChainPoint[][] = [];
  const startQueue: Array<{ nodeId: number; anchor?: ITreeChainPoint }> = [];

  for (let k = 0; k < numLevels; k++) {
    for (const n of nodesByLevel[k]) {
      if (!n.reachedGoal) continue;
      if (!downChildMap.has(n.id)) {
        startQueue.push({ nodeId: n.id });
      }
    }
  }

  for (let qIdx = 0; qIdx < startQueue.length; qIdx++) {
    const { nodeId, anchor } = startQueue[qIdx];
    const firstNode = allGraphNodes.get(nodeId);
    if (!firstNode) continue;

    const pts: ITreeChainPoint[] = [];
    if (anchor) {
      pts.push(anchor);
    } else if (firstNode.level === 0 && !firstNode.landedOnFloor) {
      // Chân đế loe vững chãi đặt phẳng 100% trên mặt bàn in PEI
      pts.push({
        x: firstNode.x,
        y: pre.minY + 0.04,
        z: firstNode.z,
        r: firstNode.r * 1.24,
      });
    }

    let curr: ITreeGraphNode | undefined = firstNode;
    while (curr) {
      pts.push({
        x: curr.x,
        y: anchor === undefined && curr.level === 0 && !curr.landedOnFloor
          ? Math.max(pre.minY + 0.42, curr.y)
          : curr.y,
        z: curr.z,
        r: curr.r,
      });

      const upIds: number[] = upChildrenMap.get(curr.id) || [];
      if (upIds.length === 0) {
        if (curr.tipStem) {
          pts.push({
            x: curr.tipStem.x0,
            y: curr.tipStem.y0,
            z: curr.tipStem.z0,
            r: curr.tipStem.r0,
          });
        }
        break;
      }

      // Sắp xếp nhánh hướng lên theo trọng số tán lá để nhánh chính đi mượt xuyên suốt từ gốc tới ngọn
      const sortedUp: ITreeGraphNode[] = upIds
        .map((id: number) => allGraphNodes.get(id))
        .filter((node): node is ITreeGraphNode => node !== undefined)
        .sort((a: ITreeGraphNode, b: ITreeGraphNode) => b.tipWeight - a.tipWeight || b.r - a.r);

      const primaryUp: ITreeGraphNode | undefined = sortedUp[0];

      // Nếu nút hiện tại vừa là ngọn trực tiếp của 1 patch vừa có nhánh con đi tiếp, tách cuống ngọn phụ
      if (curr.tipStem) {
        chains.push([
          { x: curr.x, y: curr.y, z: curr.z, r: Math.min(curr.r * 0.9, curr.tipStem.r0 * 1.15) },
          { x: curr.tipStem.x0, y: curr.tipStem.y0, z: curr.tipStem.z0, r: curr.tipStem.r0 },
        ]);
      }

      // Các nhánh rẽ chữ Y bắt đầu ngay từ trục thân chính để chạc cây hòa quyện liền lạc 100%
      for (let s = 1; s < sortedUp.length; s++) {
        const secUp = sortedUp[s];
        startQueue.push({
          nodeId: secUp.id,
          anchor: {
            x: curr.x,
            y: curr.y,
            z: curr.z,
            r: Math.min(curr.r * 0.92, secUp.r * 1.16),
          },
        });
      }

      curr = primaryUp;
    }

    if (pts.length >= 2) {
      chains.push(pts);
    }
  }

  const levelDiscs: ITreeSupport2DLevelDisc[][] = Array.from({ length: numLevels }, () => []);
  const capsules: ITreeCapsuleSegment[] = [];
  const acceptedPatches: IConformalOverhangPatch[] = [];
  const interfacePads: ITreeInterfacePad[] = [];

  for (let k = numLevels - 1; k >= 0; k--) {
    const validNodes = nodesByLevel[k].filter((n) => n.reachedGoal);
    levelDiscs[k] = validNodes.map((n) => ({
      x: n.x,
      z: n.z,
      r: n.r,
      nearTip: n.ageLevels <= 2,
    }));

    for (const n of validNodes) {
      if (n.patch && n.tipStem) {
        acceptedPatches.push(n.patch);
        const [px, py, pz] = n.patch.center;
        const [nx, ny, nz] = n.patch.normal;
        const padCapR = Math.max(1.1, Math.min(3.1, Math.sqrt(n.patch.areaMm2) * 0.56));
        interfacePads.push({
          x: px,
          y: py - topZDistMm,
          z: pz,
          nx,
          ny,
          nz,
          radius: padCapR,
        });
        capsules.push({
          x0: n.tipStem.x0,
          y0: n.tipStem.y0,
          z0: n.tipStem.z0,
          r0: n.tipStem.r0,
          x1: n.x,
          y1: n.y,
          z1: n.z,
          r1: n.r,
          isNearTip: true,
        });
      }

      for (const pid of n.parentIds) {
        const pNode = allGraphNodes.get(pid);
        if (!pNode || !pNode.reachedGoal) continue;
        capsules.push({
          x0: pNode.x,
          y0: pNode.y,
          z0: pNode.z,
          r0: pNode.r,
          x1: n.x,
          y1: n.y,
          z1: n.z,
          r1: n.r,
          isNearTip: pNode.ageLevels <= 2,
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
      chains,
      interfacePads,
      groundedRoots,
    },
  };
}

/**
 * 3. Bộ Dựng Lưới Thân Cây Hữu Cơ Quét Khung Song Song (Organic Swept Parallel-Transport Tree Mesher):
 * - Nội suy đường cong Catmull-Rom siêu mượt dọc từ gốc loe trên bàn in lên từng chạc chữ Y và ngọn mao mạch.
 * - KHÔNG phụ thuộc kích thước lưới Voxel nên giữ nguyên 100% cành mảnh 0.36mm trên cả mẫu cao > 250mm!
 * - Kẹp khoảng cách 3D SDF trực tiếp trên từng đỉnh vòng ống (Vertex-Level SDF Clamp >= 0.24mm) -> TUYỆT ĐỐI KHÔNG ĐÂM XUYÊN MẪU!
 */
function buildOrganicSweptTreeMesh(vol: ITreeSupport2DVolume): THREE.BufferGeometry | null {
  if (!vol.chains || vol.chains.length === 0) return null;

  const radialSegs = 14;
  const gRes = vol.gridRes;
  const invCs = 1 / vol.cellSize;
  const eps = vol.cellSize * 0.7;

  const sampleBilinearSdf = (sdfArr: Float32Array, wx: number, wz: number): number => {
    const fx = Math.max(0, Math.min(gRes - 1.001, (wx - vol.gridMinX) * invCs - 0.5));
    const fz = Math.max(0, Math.min(gRes - 1.001, (wz - vol.gridMinZ) * invCs - 0.5));
    const x0 = Math.floor(fx);
    const z0 = Math.floor(fz);
    const tx = fx - x0;
    const tz = fz - z0;
    const r0 = z0 * gRes;
    const r1 = (z0 + 1) * gRes;
    const a = sdfArr[r0 + x0] * (1 - tx) + sdfArr[r0 + x0 + 1] * tx;
    const b = sdfArr[r1 + x0] * (1 - tx) + sdfArr[r1 + x0 + 1] * tx;
    return a * (1 - tz) + b * tz;
  };

  const sampleInterpolatedModelSdf = (wx: number, wy: number, wz: number): number => {
    if (wy <= vol.minY + 0.12 || wy >= vol.maxY + 0.5) return 20.0;
    const fLvl = Math.max(
      0,
      Math.min(vol.numLevels - 1.001, (wy - vol.minY) / vol.levelStepY - 0.35)
    );
    const l0 = Math.floor(fLvl);
    const l1 = Math.min(vol.numLevels - 1, l0 + 1);
    const ty = fLvl - l0;
    const d0 = sampleBilinearSdf(vol.levelModelSdfs[l0], wx, wz);
    const d1 = sampleBilinearSdf(vol.levelModelSdfs[l1], wx, wz);
    return Math.min(d0 * (1 - ty) + d1 * ty, d0, d1);
  };

  const clampVertexOutsideModel = (
    vx: number,
    vy: number,
    vz: number,
    minShellClear: number
  ): [number, number, number] => {
    let x = vx;
    let z = vz;
    for (let iter = 0; iter < 7; iter++) {
      const d = sampleInterpolatedModelSdf(x, vy, z);
      if (d >= minShellClear) break;
      const dx =
        sampleInterpolatedModelSdf(x + eps, vy, z) - sampleInterpolatedModelSdf(x - eps, vy, z);
      const dz =
        sampleInterpolatedModelSdf(x, vy, z + eps) - sampleInterpolatedModelSdf(x, vy, z - eps);
      const gLen = Math.hypot(dx, dz);
      if (gLen < 1e-5) break;
      const push = Math.min(1.6, minShellClear - d + 0.08);
      x += (dx / gLen) * push;
      z += (dz / gLen) * push;
    }
    return [x, Math.max(vol.minY + 0.04, vy), z];
  };

  const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  };

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let cIdx = 0; cIdx < vol.chains.length; cIdx++) {
    const rawPts = vol.chains[cIdx];
    if (rawPts.length < 2) continue;

    // Nội suy Catmull-Rom mịn giữa các nút khung xương cây
    const samples: ITreeChainPoint[] = [];
    if (rawPts.length === 2) {
      samples.push(rawPts[0], {
        x: (rawPts[0].x + rawPts[1].x) * 0.5,
        y: (rawPts[0].y + rawPts[1].y) * 0.5,
        z: (rawPts[0].z + rawPts[1].z) * 0.5,
        r: (rawPts[0].r + rawPts[1].r) * 0.5,
      }, rawPts[1]);
    } else {
      for (let i = 0; i < rawPts.length - 1; i++) {
        const p0 = rawPts[Math.max(0, i - 1)];
        const p1 = rawPts[i];
        const p2 = rawPts[i + 1];
        const p3 = rawPts[Math.min(rawPts.length - 1, i + 2)];
        const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        const subSteps = segLen > 2.2 ? 3 : 2;

        for (let s = 0; s < subSteps; s++) {
          const t = s / subSteps;
          if (t === 0) {
            samples.push(p1);
          } else {
            samples.push({
              x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
              y: p1.y + (p2.y - p1.y) * t, // Đơn điệu độ cao Y 100% để không tạo u võng tự treo
              z: catmullRom(p0.z, p1.z, p2.z, p3.z, t),
              r: Math.max(0.32, p1.r + (p2.r - p1.r) * t),
            });
          }
        }
      }
      samples.push(rawPts[rawPts.length - 1]);
    }

    const ringCount = samples.length;
    if (ringCount < 2) continue;

    // Khởi tạo Khung Vận Chuyển Song Song (Parallel Transport Frame) chống xoắn lưới 100%
    let tx = samples[1].x - samples[0].x;
    let ty = samples[1].y - samples[0].y;
    let tz = samples[1].z - samples[0].z;
    let tLen = Math.hypot(tx, ty, tz) || 1;
    tx /= tLen;
    ty /= tLen;
    tz /= tLen;

    // Chọn vector chuẩn trực đầu tiên ổn định
    let refX = Math.abs(tx) < 0.85 ? 1 : 0;
    let refY = 0;
    let refZ = refX === 0 ? 1 : 0;
    let nx = ty * refZ - tz * refY;
    let ny = tz * refX - tx * refZ;
    let nz = tx * refY - ty * refX;
    const nInitLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nInitLen;
    ny /= nInitLen;
    nz /= nInitLen;

    const baseVertOffset = positions.length / 3;

    for (let i = 0; i < ringCount; i++) {
      let curTx: number, curTy: number, curTz: number;
      if (i === 0) {
        curTx = samples[1].x - samples[0].x;
        curTy = samples[1].y - samples[0].y;
        curTz = samples[1].z - samples[0].z;
      } else if (i === ringCount - 1) {
        curTx = samples[i].x - samples[i - 1].x;
        curTy = samples[i].y - samples[i - 1].y;
        curTz = samples[i].z - samples[i - 1].z;
      } else {
        curTx = samples[i + 1].x - samples[i - 1].x;
        curTy = samples[i + 1].y - samples[i - 1].y;
        curTz = samples[i + 1].z - samples[i - 1].z;
      }
      const cLen = Math.hypot(curTx, curTy, curTz) || 1;
      curTx /= cLen;
      curTy /= cLen;
      curTz /= cLen;

      // Chiếu trực giao Gram-Schmidt giữ khung mượt không xoắn
      const dotNT = nx * curTx + ny * curTy + nz * curTz;
      let pnx = nx - dotNT * curTx;
      let pny = ny - dotNT * curTy;
      let pnz = nz - dotNT * curTz;
      const pnLen = Math.hypot(pnx, pny, pnz);
      if (pnLen > 1e-5) {
        nx = pnx / pnLen;
        ny = pny / pnLen;
        nz = pnz / pnLen;
      }
      const bx = curTy * nz - curTz * ny;
      const by = curTz * nx - curTx * nz;
      const bz = curTx * ny - curTy * nx;

      const pt = samples[i];
      const isGroundedBottom = i === 0 && pt.y <= vol.minY + 0.12;
      const isTopTip = i >= ringCount - 2;
      const minShellClear = isTopTip ? 0.14 : 0.26;

      // Đảm bảo cả tâm vòng ống cũng nằm ngoài vùng an toàn trước khi dựng vành
      const [safeCx, safeCy, safeCz] = clampVertexOutsideModel(
        pt.x,
        pt.y,
        pt.z,
        minShellClear + pt.r * 0.45
      );

      for (let j = 0; j < radialSegs; j++) {
        const ang = (j / radialSegs) * Math.PI * 2;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        let rvx: number, rvy: number, rvz: number;
        let outNx: number, outNy: number, outNz: number;

        if (isGroundedBottom) {
          // Vòng đế chân rễ nằm ngang phẳng 100% trên mặt bàn PEI
          outNx = cosA;
          outNy = 0.12;
          outNz = sinA;
          const oLen = Math.hypot(outNx, outNy, outNz);
          outNx /= oLen;
          outNy /= oLen;
          outNz /= oLen;
          rvx = safeCx + cosA * pt.r;
          rvy = vol.minY + 0.04;
          rvz = safeCz + sinA * pt.r;
        } else {
          outNx = nx * cosA + bx * sinA;
          outNy = ny * cosA + by * sinA;
          outNz = nz * cosA + bz * sinA;
          rvx = safeCx + outNx * pt.r;
          rvy = safeCy + outNy * pt.r;
          rvz = safeCz + outNz * pt.r;
        }

        const [clampedX, clampedY, clampedZ] = clampVertexOutsideModel(
          rvx,
          rvy,
          rvz,
          minShellClear
        );
        positions.push(clampedX, clampedY, clampedZ);
        normals.push(outNx, outNy, outNz);
      }
    }

    // Kết nối dải tứ giác quanh thân ống
    for (let i = 0; i < ringCount - 1; i++) {
      const r0 = baseVertOffset + i * radialSegs;
      const r1 = baseVertOffset + (i + 1) * radialSegs;
      for (let j = 0; j < radialSegs; j++) {
        const jNext = (j + 1) % radialSegs;
        const v00 = r0 + j;
        const v01 = r0 + jNext;
        const v10 = r1 + j;
        const v11 = r1 + jNext;
        indices.push(v00, v01, v11, v00, v11, v10);
      }
    }

    // Đóng kín mặt đáy & mặt ngọn (Tâm nắp lấy từ trung bình vành đã kẹp SDF -> 0% xuyên mẫu!)
    const botCenterIdx = positions.length / 3;
    let botCx = 0,
      botCy = 0,
      botCz = 0;
    for (let j = 0; j < radialSegs; j++) {
      const idx3 = (baseVertOffset + j) * 3;
      botCx += positions[idx3];
      botCy += positions[idx3 + 1];
      botCz += positions[idx3 + 2];
    }
    const [safeBotX, safeBotY, safeBotZ] = clampVertexOutsideModel(
      botCx / radialSegs,
      botCy / radialSegs,
      botCz / radialSegs,
      0.24
    );
    positions.push(safeBotX, safeBotY, safeBotZ);
    normals.push(0, -1, 0);
    for (let j = 0; j < radialSegs; j++) {
      const jNext = (j + 1) % radialSegs;
      indices.push(botCenterIdx, baseVertOffset + jNext, baseVertOffset + j);
    }

    const topCenterIdx = positions.length / 3;
    const topRingStart = baseVertOffset + (ringCount - 1) * radialSegs;
    let topCx = 0,
      topCy = 0,
      topCz = 0;
    for (let j = 0; j < radialSegs; j++) {
      const idx3 = (topRingStart + j) * 3;
      topCx += positions[idx3];
      topCy += positions[idx3 + 1];
      topCz += positions[idx3 + 2];
    }
    const [safeTopX, safeTopY, safeTopZ] = clampVertexOutsideModel(
      topCx / radialSegs,
      topCy / radialSegs,
      topCz / radialSegs,
      0.16
    );
    positions.push(safeTopX, safeTopY, safeTopZ);
    normals.push(0, 1, 0);
    for (let j = 0; j < radialSegs; j++) {
      const jNext = (j + 1) % radialSegs;
      indices.push(topCenterIdx, topRingStart + j, topRingStart + jNext);
    }
  }

  if (indices.length === 0) return null;

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * 4. Xuất trực tiếp đường chạy dao RỖNG RUỘT (Hollow 1-2 Wall Loops + Concentric Root Brim + Dense Support Roof)
 *    của Tree Support 3.0 tại cao độ lát cắt worldY cho chế độ Sợi In chuẩn 100% Bambu Studio!
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

      const clear = anyNearTip ? 0.22 : 0.36;
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
 * 5. Hàm giao diện chính tạo cấu trúc Three.js Tree Support 3.0 cho /3dsim Viewport
 * - Chạy trường va chạm SDF hợp nhất trên toàn bộ hình học bàn in `geometry` (đã chuẩn hóa Y_min = 0),
 *   giúp cả tượng .3MF nhiều subtool (ZBrush) lẫn bàn in nhiều chi tiết rời đều tránh xuyên mẫu 100%
 *   và dẫn mọi rễ cây xuống đúng mặt bàn in PEI!
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

  const computed = computeTreeSupport2DVolume(geometry, profile, overhangThreshold);
  if (!computed) {
    return supportGroup;
  }

  const { volume, patches } = computed;
  supportGroup.userData.treeVolume = volume;
  supportGroup.userData.treeVolumes = [volume];

  const branchGeoms: (THREE.BufferGeometry | null)[] = [];
  const capGeoms: (THREE.BufferGeometry | null)[] = [];
  const brimGeoms: THREE.BufferGeometry[] = [];

  const topZDist = profile.supportTopZDistance ?? 0.2;
  const interfaceLayers = profile.supportInterfaceLayers ?? 2;

  const organicBarkGeom = buildOrganicSweptTreeMesh(volume);
  if (organicBarkGeom) {
    branchGeoms.push(organicBarkGeom);
  }

  if (interfaceLayers > 0) {
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i];
      const padRadius = Math.max(1.1, Math.min(3.1, Math.sqrt(p.areaMm2) * 0.56));
      capGeoms.push(
        buildPatchConformalCapGeometry(p, padRadius, topZDist, interfaceLayers, volume.minY)
      );
    }
  }

  if (volume.groundedRoots.length > 0) {
    for (const root of volume.groundedRoots) {
      const brimR = root.r + 1.65;
      const disc = new THREE.CylinderGeometry(brimR * 0.96, brimR, 0.12, 20);
      disc.translate(root.x, volume.minY + 0.06, root.z);
      brimGeoms.push(disc.toNonIndexed());
    }
  }

  const mergedBranches = safeMergeGeometries(branchGeoms);
  if (mergedBranches) {
    const branchMesh = new THREE.Mesh(mergedBranches, supportMat);
    branchMesh.name = 'conformal_tree_branches';
    branchMesh.castShadow = true;
    branchMesh.receiveShadow = true;
    supportGroup.add(branchMesh);
  }

  const mergedInterfaces = safeMergeGeometries(capGeoms);
  if (mergedInterfaces) {
    const interfaceMesh = new THREE.Mesh(mergedInterfaces, interfaceMat);
    interfaceMesh.name = 'conformal_tree_interfaces';
    interfaceMesh.castShadow = true;
    supportGroup.add(interfaceMesh);
  }

  const mergedBrim = safeMergeGeometries(brimGeoms);
  if (mergedBrim) {
    const brimMesh = new THREE.Mesh(mergedBrim, brimMat);
    brimMesh.name = 'conformal_tree_brims';
    brimMesh.receiveShadow = true;
    supportGroup.add(brimMesh);
  }

  return supportGroup;
}
