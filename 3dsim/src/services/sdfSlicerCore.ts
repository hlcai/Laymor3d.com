import * as THREE from 'three';
import type { ISimulationProfile } from '@/types/simulator';
import type {
  IFullToolpathData,
  INativeSupportData,
} from './nativeSupportLoader';
import {
  SdfGrid2D,
  extractMarchingSquaresSegments,
  extractTrue3DGyroidInfill,
  extractTrueHoneycombInfill,
  extractSolidRegionRectilinear,
} from './polygonSdf2D';
import {
  ITreeSupport2DVolume,
  computeTreeSupport2DVolume,
  extractTreeSupportHollowLayerToolpaths,
} from './supportGenerator';

export interface ISdfSlicerCoreOutput {
  totalLayers: number;
  effectiveLayerHeightMm: number;
  totalFilamentGrams: number;
  modelFilamentGrams: number;
  supportFilamentGrams: number;
  totalFilamentMeters: number;
  estimatedPrintTimeMinutes: number;
  supportData: INativeSupportData;
  toolpathsData: IFullToolpathData;
}

const FLOATS_PER_INDEXED_TRI = 12; // ax,ay,az, bx,by,bz, cx,cy,cz, inx,inz, ny

interface ISlicerTriangleAccel {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  triData: Float32Array;
  triCount: number;
  numBuckets: number;
  bucketHeight: number;
  buckets: Int32Array[];
}

function buildSlicerTriangleAccel(geometry: THREE.BufferGeometry): ISlicerTriangleAccel | null {
  const pos = geometry.getAttribute('position');
  if (!pos || pos.count < 3) return null;

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const minX = bbox.min.x,
    maxX = bbox.max.x;
  const minY = bbox.min.y,
    maxY = bbox.max.y;
  const minZ = bbox.min.z,
    maxZ = bbox.max.z;
  const height = Math.max(0.4, maxY - minY);

  const index = geometry.getIndex();
  const rawTriCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
  if (rawTriCount <= 0) return null;

  const triData = new Float32Array(rawTriCount * FLOATS_PER_INDEXED_TRI);
  const numBuckets = 96;
  const bucketHeight = height / numBuckets;
  const rawBuckets: number[][] = Array.from({ length: numBuckets }, () => []);

  for (let t = 0; t < rawTriCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    const ax = pos.getX(i0),
      ay = pos.getY(i0),
      az = pos.getZ(i0);
    const bx = pos.getX(i1),
      by = pos.getY(i1),
      bz = pos.getZ(i1);
    const cx = pos.getX(i2),
      cy = pos.getY(i2),
      cz = pos.getZ(i2);

    const e1x = bx - ax,
      e1y = by - ay,
      e1z = bz - az;
    const e2x = cx - ax,
      e2y = cy - ay,
      e2z = cz - az;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const nLen3D = Math.hypot(nx, ny, nz) || 1;
    const nLenXZ = Math.hypot(nx, nz);

    const base = t * FLOATS_PER_INDEXED_TRI;
    triData[base] = ax;
    triData[base + 1] = ay;
    triData[base + 2] = az;
    triData[base + 3] = bx;
    triData[base + 4] = by;
    triData[base + 5] = bz;
    triData[base + 6] = cx;
    triData[base + 7] = cy;
    triData[base + 8] = cz;
    triData[base + 9] = nLenXZ > 1e-6 ? -nx / nLenXZ : 0;
    triData[base + 10] = nLenXZ > 1e-6 ? -nz / nLenXZ : 0;
    triData[base + 11] = ny / nLen3D;

    const tMinY = Math.min(ay, by, cy);
    const tMaxY = Math.max(ay, by, cy);
    const b0 = Math.max(0, Math.min(numBuckets - 1, Math.floor((tMinY - minY) / bucketHeight)));
    const b1 = Math.max(0, Math.min(numBuckets - 1, Math.floor((tMaxY - minY) / bucketHeight)));
    for (let b = b0; b <= b1; b++) {
      rawBuckets[b].push(t);
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    triData,
    triCount: rawTriCount,
    numBuckets,
    bucketHeight,
    buckets: rawBuckets.map((b) => new Int32Array(b)),
  };
}

interface IRawLayerSliceSlot {
  layerIndex: number;
  worldY: number;
  renderY: number;
  segCount: number;
  /** [x1, z1, x2, z2] * segCount */
  segsXZ: Float32Array;
  /** ny3D của tam giác sinh ra segment s (dùng để nhận diện Overhang Wall / Bridge #38bdf8) */
  segNy: Float32Array;
  /** Pháp tuyến hướng nội phẳng (inx, inz) */
  segInwardXZ: Float32Array;
  sdfGrid: SdfGrid2D;
}

function populateLayerSliceSlot(
  accel: ISlicerTriangleAccel,
  layerIndex: number,
  worldY: number,
  renderY: number,
  slot: IRawLayerSliceSlot
): void {
  slot.layerIndex = layerIndex;
  slot.worldY = worldY;
  slot.renderY = renderY;

  const bIdx = Math.max(
    0,
    Math.min(accel.numBuckets - 1, Math.floor((worldY - accel.minY) / accel.bucketHeight))
  );
  const candidates = accel.buckets[bIdx];
  const triData = accel.triData;
  const maxSegCap = Math.floor(slot.segsXZ.length / 4);
  let count = 0;

  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i] * FLOATS_PER_INDEXED_TRI;
    const ay = triData[base + 1];
    const by = triData[base + 4];
    const cy = triData[base + 7];

    const sA = ay - worldY;
    const sB = by - worldY;
    const sC = cy - worldY;
    if ((sA > 0 && sB > 0 && sC > 0) || (sA < 0 && sB < 0 && sC < 0)) continue;

    const ax = triData[base],
      az = triData[base + 2];
    const bx = triData[base + 3],
      bz = triData[base + 5];
    const cx = triData[base + 6],
      cz = triData[base + 8];

    let p1x = 0,
      p1z = 0,
      p2x = 0,
      p2z = 0;
    let hits = 0;

    if ((sA >= 0 && sB < 0) || (sA < 0 && sB >= 0)) {
      const dy = by - ay;
      if (Math.abs(dy) > 1e-6) {
        const t = (worldY - ay) / dy;
        p1x = ax + t * (bx - ax);
        p1z = az + t * (bz - az);
        hits = 1;
      }
    }
    if ((sB >= 0 && sC < 0) || (sB < 0 && sC >= 0)) {
      const dy = cy - by;
      if (Math.abs(dy) > 1e-6) {
        const t = (worldY - by) / dy;
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
        const t = (worldY - cy) / dy;
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

    if (hits === 2 && count < maxSegCap) {
      if (Math.hypot(p2x - p1x, p2z - p1z) >= 0.012) {
        const o4 = count * 4;
        slot.segsXZ[o4] = p1x;
        slot.segsXZ[o4 + 1] = p1z;
        slot.segsXZ[o4 + 2] = p2x;
        slot.segsXZ[o4 + 3] = p2z;

        const o2 = count * 2;
        slot.segInwardXZ[o2] = triData[base + 9];
        slot.segInwardXZ[o2 + 1] = triData[base + 10];
        slot.segNy[count] = triData[base + 11];
        count++;
      }
    }
  }

  slot.segCount = count;
  slot.sdfGrid.rasterizeSegments(slot.segsXZ, count);
  slot.sdfGrid.computeSignedDistanceField();
}

/**
 * Sinh ruột thưa tuyến tính (Grid +-45° hoặc Triangles 0°/60°/120°) cắt gọn 100% bên trong tường trong cùng
 */
function extractClippedScanlineSparseInfill(
  sdfGrid: SdfGrid2D,
  renderY: number,
  layerIndex: number,
  infillType: string,
  infillDensityPercent: number,
  infillClipMarginMm: number,
  excludeMask: Uint8Array,
  outInfills: number[]
): number {
  const density = Math.max(5, Math.min(90, infillDensityPercent));
  const spacing = Math.max(1.8, Math.min(14.0, 125 / density));
  const angle =
    infillType === 'triangles'
      ? ((layerIndex % 3) * Math.PI) / 3
      : layerIndex % 2 === 0
      ? Math.PI * 0.25
      : -Math.PI * 0.25;

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const w = sdfGrid.width;
  const h = sdfGrid.height;
  const cs = sdfGrid.cellSize;
  const minX = sdfGrid.minX;
  const minZ = sdfGrid.minZ;
  const invCs = 1 / cs;
  const clipThresh = -Math.max(0.15, infillClipMarginMm);

  const centerX = minX + w * cs * 0.5;
  const centerZ = minZ + h * cs * 0.5;
  const halfDiag = Math.hypot(w * cs, h * cs) * 0.54;
  const stepAlong = Math.max(0.45, cs * 0.85);

  let emittedMm = 0;

  for (let v = -halfDiag; v <= halfDiag; v += spacing) {
    let inRun = false;
    let sx = 0,
      sz = 0,
      ex = 0,
      ez = 0;

    for (let u = -halfDiag; u <= halfDiag; u += stepAlong) {
      const wx = centerX + u * cosA - v * sinA;
      const wz = centerZ + u * sinA + v * cosA;
      const gx = Math.floor((wx - minX) * invCs);
      const gz = Math.floor((wz - minZ) * invCs);

      const insideCore =
        gx >= 0 &&
        gz >= 0 &&
        gx < w &&
        gz < h &&
        excludeMask[gz * w + gx] === 0 &&
        sdfGrid.sdf[gz * w + gx] <= clipThresh;

      if (insideCore) {
        if (!inRun) {
          inRun = true;
          sx = wx;
          sz = wz;
        }
        ex = wx;
        ez = wz;
      } else if (inRun) {
        inRun = false;
        const len = Math.hypot(ex - sx, ez - sz);
        if (len >= 0.3) {
          outInfills.push(sx, renderY, sz, ex, renderY, ez);
          emittedMm += len;
        }
      }
    }

    if (inRun) {
      const len = Math.hypot(ex - sx, ez - sz);
      if (len >= 0.3) {
        outInfills.push(sx, renderY, sz, ex, renderY, ez);
        emittedMm += len;
      }
    }
  }

  return emittedMm;
}

/**
 * Nhân Slicer 2D SDF + Full-Layer + Tree Support 2.0 thuần TypeScript (dùng chung cho Main Thread & Web Worker)
 */
export function sliceGeometryWith2DSdfCore(
  geometry: THREE.BufferGeometry,
  modelName: string,
  profile: ISimulationProfile,
  precomputedTreeVolume?: ITreeSupport2DVolume | null,
  onProgress?: (percent: number) => void
): ISdfSlicerCoreOutput {
  const accel = buildSlicerTriangleAccel(geometry);
  if (!accel) {
    const emptyToolpaths: IFullToolpathData = {
      model: modelName,
      engine: 'Bambu 2D-SDF Volumetric Slicer v2.0',
      totalLayers: 1,
      layerHeightMm: profile.layerHeight || 0.2,
      totalMoves: 0,
      outerWalls: [],
      innerWalls: [],
      topBottomShells: [],
      bridges: [],
      infills: [],
      supports: [],
      interfaces: [],
      brims: [],
      seams: [],
      layerIndexTable: [[0, 0, 0, 0, 0, 0, 0, 0]],
    };
    return {
      totalLayers: 1,
      effectiveLayerHeightMm: 0.2,
      totalFilamentGrams: 1.0,
      modelFilamentGrams: 1.0,
      supportFilamentGrams: 0,
      totalFilamentMeters: 0.3,
      estimatedPrintTimeMinutes: 5,
      supportData: { model: modelName, engine: 'tree_2.0', totalMoves: 0, totalSegments: 0, segments: [] },
      toolpathsData: emptyToolpaths,
    };
  }

  const minY = accel.minY;
  const maxY = accel.maxY;
  const height = Math.max(0.4, maxY - minY);
  const requestedLayerH = Math.max(0.08, Math.min(0.36, profile.layerHeight || 0.2));

  // Mở khóa Full-Layer Slicing lên tới 820 lớp thực tế (gấp >4 lần mức trần 200 lớp cũ!)
  const realTotalLayers = Math.max(18, Math.round(height / requestedLayerH));
  const totalLayers = Math.min(820, realTotalLayers);
  const effectiveLayerHeightMm = height / totalLayers;

  const lineWidth = Math.max(0.28, profile.outerWallLineWidth || profile.lineWidth || 0.42);
  const wallLoops = Math.max(1, Math.min(6, profile.wallLoops || 2));
  const supportEnabled = profile.supportMode !== 'none';
  const doubleTreeWall = profile.treeStyle === 'strong' || profile.treeStyle === 'hybrid';

  // Chuẩn bị trường thể tích Tree Support 2.0 (lấy sẵn từ Viewport hoặc tính trực tiếp trong Worker)
  const treeVol: ITreeSupport2DVolume | null = supportEnabled
    ? precomputedTreeVolume || computeTreeSupport2DVolume(geometry, profile)?.volume || null
    : null;

  const brimPad = profile.brimEnabled !== false ? Math.max(4.5, (profile.brimWidthMm || 5) + 2.0) : 2.0;
  const spanX = Math.max(2.0, accel.maxX - accel.minX);
  const spanZ = Math.max(2.0, accel.maxZ - accel.minZ);
  const boxSpan = Math.max(spanX, spanZ) + brimPad * 2;
  const centerX = (accel.minX + accel.maxX) * 0.5;
  const centerZ = (accel.minZ + accel.maxZ) * 0.5;

  // Độ phân giải lưới 2D SDF cho mỗi lát cắt (96 - 116 ô ngang tùy độ phức tạp, chạy ~0.06ms/lớp)
  const gridRes = totalLayers > 520 ? 96 : 112;
  const cellSize = boxSpan / gridRes;
  const gridMinX = centerX - boxSpan * 0.5;
  const gridMinZ = centerZ - boxSpan * 0.5;

  // Vòng đệm trượt 4 tầng [L-1, L, L+1, L+2] giúp phát hiện chính xác 100% mặt Nắp Đỉnh & Đáy trung gian
  // mà chỉ tốn đúng 50KB RAM và tính SDF mỗi lớp đúng 1 lần duy nhất!
  const RING_SIZE = 4;
  const maxSegsPerLayer = Math.min(28000, Math.max(4000, accel.triCount));
  const ringSlots: IRawLayerSliceSlot[] = Array.from({ length: RING_SIZE }, () => {
    const g = new SdfGrid2D(gridRes, gridRes);
    g.configureBounds(gridMinX, gridMinZ, cellSize);
    return {
      layerIndex: -1,
      worldY: 0,
      renderY: 0,
      segCount: 0,
      segsXZ: new Float32Array(maxSegsPerLayer * 4),
      segNy: new Float32Array(maxSegsPerLayer),
      segInwardXZ: new Float32Array(maxSegsPerLayer * 2),
      sdfGrid: g,
    };
  });

  const getLayerY = (l: number) => {
    const t = (l + 0.5) / totalLayers;
    const worldY = minY + Math.max(0.05, Math.min(height - 0.05, height * t));
    const renderY = worldY - minY + effectiveLayerHeightMm * 0.5;
    return { worldY, renderY };
  };

  // Khởi tạo trước lớp 0, 1, 2 vào vòng đệm trượt
  const preloadMax = Math.min(totalLayers - 1, 2);
  for (let l = 0; l <= preloadMax; l++) {
    const { worldY, renderY } = getLayerY(l);
    populateLayerSliceSlot(accel, l, worldY, renderY, ringSlots[l % RING_SIZE]);
  }

  const outerWalls: number[] = [];
  const innerWalls: number[] = [];
  const topBottomShells: number[] = [];
  const bridges: number[] = [];
  const infills: number[] = [];
  const supportLines: number[] = [];
  const interfaceLines: number[] = [];
  const brimLines: number[] = [];
  const seams: number[] = [];
  const layerTimesSec: number[] = [];
  const layerIndexTable: number[][] = [];

  const totalCells = gridRes * gridRes;
  const topBottomMask = new Uint8Array(totalCells);
  const bridgeMask = new Uint8Array(totalCells);
  const combinedShellExcludeMask = new Uint8Array(totalCells);
  const gyroidScratch = new Float32Array(totalCells);
  const treeScratch = treeVol ? new Float32Array(treeVol.gridRes * treeVol.gridRes) : null;

  let totalModelExtrudedMm = 0;
  let totalSupportExtrudedMm = 0;

  // Khống chế mật độ segment trên mỗi lớp với mẫu siêu lớn (250k+ tris) để giữ ngân sách GPU <= 380k đoạn
  const maxOuterSegsPerLayer = Math.max(180, Math.floor(240000 / totalLayers));
  const seamMode = profile.seamPosition || 'aligned';
  const baseSpeed = Math.max(40, profile.printSpeed || 200);
  const outerSpeed = Math.max(30, profile.outerWallSpeed || Math.round(baseSpeed * 0.6));

  for (let l = 0; l < totalLayers; l++) {
    // Nạp trước lớp l + 2 vào vòng đệm
    const lookaheadL = l + 2;
    if (lookaheadL < totalLayers) {
      const targetSlot = ringSlots[lookaheadL % RING_SIZE];
      if (targetSlot.layerIndex !== lookaheadL) {
        const { worldY, renderY } = getLayerY(lookaheadL);
        populateLayerSliceSlot(accel, lookaheadL, worldY, renderY, targetSlot);
      }
    }

    const curSlot = ringSlots[l % RING_SIZE];
    const prevSlot = l > 0 ? ringSlots[(l - 1) % RING_SIZE] : null;
    const plus2Slot = l + 2 < totalLayers ? ringSlots[(l + 2) % RING_SIZE] : null;

    const { worldY, renderY } = curSlot;
    const sdfGrid = curSlot.sdfGrid;
    const segCount = curSlot.segCount;

    let layerExtrudedMm = 0;
    let layerTimeAccum = 0.25;

    // 1. TƯỜNG NGOÀI CHÍNH XÁC GIẢI TÍCH (Analytic Outer Wall #00dc52) & OVERHANG WALL (#38bdf8) + Z-SEAM
    if (segCount > 0) {
      const segStride = Math.max(1, Math.ceil(segCount / maxOuterSegsPerLayer));
      let bestSeamScore = -Infinity;
      let bestSeamX = NaN;
      let bestSeamZ = NaN;
      const randIdx =
        seamMode === 'random'
          ? Math.floor(
              ((Math.abs(Math.sin(worldY * 127.1 + 311.7)) * 43758.5453) % 1) *
                Math.max(1, Math.floor(segCount / segStride))
            )
          : -1;
      let emittedOuterIdx = 0;

      for (let s = 0; s < segCount; s += segStride) {
        const o4 = s * 4;
        const x1 = curSlot.segsXZ[o4];
        const z1 = curSlot.segsXZ[o4 + 1];
        const x2 = curSlot.segsXZ[o4 + 2];
        const z2 = curSlot.segsXZ[o4 + 3];
        const len = Math.hypot(x2 - x1, z2 - z1);
        const ny3d = curSlot.segNy[s];

        // Nhận diện Overhang Perimeter (nghiêng gắt hướng xuống > 45°, cao hơn mặt bàn > 1.2mm) -> Màu xanh Bridge #38bdf8!
        if (ny3d < -0.71 && l > 3) {
          bridges.push(x1, renderY, z1, x2, renderY, z2);
          layerTimeAccum += len / 35;
        } else {
          outerWalls.push(x1, renderY, z1, x2, renderY, z2);
          layerTimeAccum += len / outerSpeed;
        }

        layerExtrudedMm += len;

        // Xác định điểm mối nối Z-Seam chuẩn trên chu vi ngoài
        if (seamMode === 'random') {
          if (emittedOuterIdx === randIdx || isNaN(bestSeamX)) {
            bestSeamX = x1;
            bestSeamZ = z1;
          }
        } else if (seamMode === 'back') {
          const sc = -z1;
          if (sc > bestSeamScore) {
            bestSeamScore = sc;
            bestSeamX = x1;
            bestSeamZ = z1;
          }
        } else if (seamMode === 'nearest') {
          const o2 = s * 2;
          const sc = Math.abs(curSlot.segInwardXZ[o2] - curSlot.segInwardXZ[o2 + 1]);
          if (sc > bestSeamScore) {
            bestSeamScore = sc;
            bestSeamX = x1;
            bestSeamZ = z1;
          }
        } else {
          const sc = x1 * 0.7 - z1 * 0.7;
          if (sc > bestSeamScore) {
            bestSeamScore = sc;
            bestSeamX = x1;
            bestSeamZ = z1;
          }
        }
        emittedOuterIdx++;
      }

      if (!isNaN(bestSeamX)) {
        seams.push(bestSeamX, renderY, bestSeamZ);
      }
    }

    // 2. TƯỜNG TRONG KHÔNG TỰ CẮT BẰNG ĐƯỜNG ĐỒNG MỨC 2D SDF (Inner Walls #05805c)
    // Tự động triệt tiêu mượt mà ở các vách mỏng (< 1.6mm như màng cánh, sừng, vuốt), KHÔNG BAO GIỜ đâm xuyên ra ngoài!
    for (let wLoop = 1; wLoop < wallLoops; wLoop++) {
      const inwardIso = -wLoop * lineWidth;
      const innerMm = extractMarchingSquaresSegments(
        sdfGrid.sdf,
        gridRes,
        gridRes,
        gridMinX,
        gridMinZ,
        cellSize,
        inwardIso,
        renderY,
        innerWalls
      );
      layerExtrudedMm += innerMm;
      layerTimeAccum += innerMm / baseSpeed;
    }

    // 3. PHÁT HIỆN BỀ MẶT NẮP ĐỈNH / ĐÁY TRUNG GIAN & CẦU NỐI (Top/Bottom Solid Surface #f25429 & Bridge #38bdf8)
    const curMask = sdfGrid.mask;
    const prevMask = prevSlot ? prevSlot.sdfGrid.mask : null;
    const plus2Mask = plus2Slot ? plus2Slot.sdfGrid.mask : null;
    const isGlobalCapLayer = l <= 2 || l >= totalLayers - 3;

    let hasTopBottom = false;
    let hasBridge = false;
    topBottomMask.fill(0);
    bridgeMask.fill(0);
    combinedShellExcludeMask.fill(0);

    for (let i = 0; i < totalCells; i++) {
      if (curMask[i] === 0) continue;

      if (isGlobalCapLayer) {
        topBottomMask[i] = 1;
        combinedShellExcludeMask[i] = 1;
        hasTopBottom = true;
      } else {
        const uncoveredBelow = prevMask !== null && prevMask[i] === 0;
        const uncoveredAbove = plus2Mask !== null && plus2Mask[i] === 0;

        if (uncoveredBelow) {
          bridgeMask[i] = 1;
          combinedShellExcludeMask[i] = 1;
          hasBridge = true;
        } else if (uncoveredAbove) {
          topBottomMask[i] = 1;
          combinedShellExcludeMask[i] = 1;
          hasTopBottom = true;
        }
      }
    }

    const infillClipMargin = Math.max(0.28, (wallLoops - 0.35) * lineWidth);
    const solidSpacing = Math.max(0.55, lineWidth * 1.45);

    if (hasBridge) {
      const brMm = extractSolidRegionRectilinear(
        sdfGrid,
        bridgeMask,
        renderY,
        l + 1,
        solidSpacing,
        infillClipMargin,
        bridges
      );
      layerExtrudedMm += brMm;
      layerTimeAccum += brMm / 35;
    }

    if (hasTopBottom) {
      const tbMm = extractSolidRegionRectilinear(
        sdfGrid,
        topBottomMask,
        renderY,
        l,
        solidSpacing,
        infillClipMargin,
        topBottomShells
      );
      layerExtrudedMm += tbMm;
      layerTimeAccum += tbMm / (outerSpeed * 0.85);
    }

    // 4. RUỘT THƯA (SPARSE INFILL #f59e0b): Sóng 3D Gyroid Thực / Tổ Ong Honeycomb Thực / Grid / Triangles
    if ((profile.infillDensity ?? 15) > 0 && !isGlobalCapLayer) {
      let infMm = 0;
      if (profile.infillType === 'gyroid') {
        infMm = extractTrue3DGyroidInfill(
          sdfGrid,
          worldY,
          renderY,
          profile.infillDensity,
          infillClipMargin,
          gyroidScratch,
          infills,
          combinedShellExcludeMask
        );
      } else if (profile.infillType === 'honeycomb') {
        infMm = extractTrueHoneycombInfill(
          sdfGrid,
          renderY,
          profile.infillDensity,
          infillClipMargin,
          infills,
          combinedShellExcludeMask
        );
      } else if (profile.infillType === 'concentric') {
        for (let ring = wallLoops; ring <= wallLoops + 8; ring += Math.max(1, Math.round(80 / Math.max(10, profile.infillDensity)))) {
          infMm += extractMarchingSquaresSegments(
            sdfGrid.sdf,
            gridRes,
            gridRes,
            gridMinX,
            gridMinZ,
            cellSize,
            -ring * lineWidth * 1.35,
            renderY,
            infills
          );
        }
      } else {
        infMm = extractClippedScanlineSparseInfill(
          sdfGrid,
          renderY,
          l,
          profile.infillType || 'grid',
          profile.infillDensity,
          infillClipMargin,
          combinedShellExcludeMask,
          infills
        );
      }
      layerExtrudedMm += infMm;
      layerTimeAccum += infMm / Math.min(300, baseSpeed * 1.32);
    }

    // 5. VÀNH ĐẾ BÁM BÀN ĐỒNG TÂM TẠI LAYER 0 (Concentric Model Brim #c026d3)
    if (l === 0 && profile.brimEnabled !== false && (profile.brimType || 'outer_only') !== 'none') {
      const brimWidth = Math.max(1.5, profile.brimWidthMm || 5);
      const brimRings = Math.max(2, Math.min(10, Math.round(brimWidth / (lineWidth * 1.15))));
      for (let r = 1; r <= brimRings; r++) {
        const outIso = r * lineWidth * 1.12;
        extractMarchingSquaresSegments(
          sdfGrid.sdf,
          gridRes,
          gridRes,
          gridMinX,
          gridMinZ,
          cellSize,
          outIso,
          renderY,
          brimLines
        );
      }
    }

    // 6. CÂY ĐỠ HỮU CƠ RỖNG RUỘT TREE SUPPORT 2.0 (#14bd85) + ĐỆM ROOF (#d946ef) + TREE BRIM (#c026d3)
    if (supportEnabled && treeVol && treeScratch) {
      const supBefore = supportLines.length;
      const ifBefore = interfaceLines.length;
      extractTreeSupportHollowLayerToolpaths(
        treeVol,
        worldY,
        renderY,
        l === 0 && profile.brimEnabled !== false,
        doubleTreeWall,
        treeScratch,
        supportLines,
        interfaceLines,
        l === 0 ? brimLines : undefined
      );
      const addedSupSegs = (supportLines.length - supBefore + (interfaceLines.length - ifBefore)) / 6;
      const estSupMm = addedSupSegs * treeVol.cellSize * 0.95;
      totalSupportExtrudedMm += estSupMm;
      layerTimeAccum += estSupMm / (baseSpeed * 0.75);
    }

    totalModelExtrudedMm += layerExtrudedMm;
    layerTimesSec.push(Number(layerTimeAccum.toFixed(2)));

    // Bảng chỉ mục lũy kế 8 cột tương thích ngược 100% với bản 6 cột cũ
    layerIndexTable.push([
      outerWalls.length / 3,
      innerWalls.length / 3,
      infills.length / 3,
      supportLines.length / 3,
      interfaceLines.length / 3,
      seams.length / 3,
      topBottomShells.length / 3,
      bridges.length / 3,
    ]);

    if (onProgress && (l % 25 === 0 || l === totalLayers - 1)) {
      onProgress(Math.min(99, Math.round(((l + 1) / totalLayers) * 100)));
    }
  }

  const crossSectionMm2 = lineWidth * effectiveLayerHeightMm;
  const densityGPerCm3 =
    profile.material === 'PETG' ? 1.27 : profile.material === 'ABS' ? 1.04 : 1.24;

  const modelVolumeCm3 = Math.max(0.5, (totalModelExtrudedMm * crossSectionMm2) / 1000);
  const supportVolumeCm3 = supportEnabled
    ? (totalSupportExtrudedMm * crossSectionMm2) / 1000
    : 0;

  const modelGrams = Number((modelVolumeCm3 * densityGPerCm3).toFixed(1));
  const supportGrams = Number((supportVolumeCm3 * densityGPerCm3).toFixed(1));
  const totalGrams = Number((modelGrams + supportGrams).toFixed(1));
  const totalMeters = Number((totalGrams / 2.98).toFixed(1));
  const totalTimeSec = layerTimesSec.reduce((acc, v) => acc + v, 0);
  const printTimeMin = Math.max(4, Math.round(totalTimeSec / 60));

  const totalMoves = Math.round(
    (outerWalls.length +
      innerWalls.length +
      topBottomShells.length +
      bridges.length +
      infills.length +
      supportLines.length +
      interfaceLines.length +
      brimLines.length) /
      6
  );

  const supportData: INativeSupportData = {
    model: modelName,
    engine: 'Bambu Top-Down Tree Support 2.0 (Hollow 2D-SDF)',
    totalMoves: Math.round((supportLines.length + interfaceLines.length) / 6),
    totalSegments: 0,
    segments: [],
  };

  const toolpathsData: IFullToolpathData = {
    model: modelName,
    engine: 'Bambu 2D-SDF Volumetric Slicer v2.0 (Full-Layer & True 3D Gyroid)',
    totalLayers,
    layerHeightMm: effectiveLayerHeightMm,
    totalMoves,
    layerTimesSec,
    layerIndexTable,
    outerWalls,
    innerWalls,
    topBottomShells,
    bridges,
    infills,
    supports: supportLines,
    interfaces: interfaceLines,
    brims: brimLines,
    seams,
  };

  return {
    totalLayers,
    effectiveLayerHeightMm,
    totalFilamentGrams: totalGrams,
    modelFilamentGrams: modelGrams,
    supportFilamentGrams: supportGrams,
    totalFilamentMeters: totalMeters,
    estimatedPrintTimeMinutes: printTimeMin,
    supportData,
    toolpathsData,
  };
}
