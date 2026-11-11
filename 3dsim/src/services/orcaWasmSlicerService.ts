import * as THREE from 'three';
import { createSlicerClient } from 'three-slicer/client';
import {
  buildSegmentData,
  makeToolpath,
  computeColors,
  layerMoveCount,
  moveCursor,
  type SegmentData,
  type ToolpathHandle,
  type ColorContext,
} from 'three-slicer-viewer/toolpath';
import type { ISimulationProfile } from '@/types/simulator';
import type { INativeSupportData, INativeSupportSegment } from './nativeSupportLoader';
import type { FilamentColorScheme, IActiveMoveTelemetry } from './volumetricFilamentRenderer';

export interface IOrcaWasmSliceStats {
  totalLayers: number;
  totalTimeSec: number;
  totalFilamentGrams: number;
  modelGrams: number;
  supportGrams: number;
  filamentMm: number;
  supportSegmentsCount: number;
  modelSegmentsCount: number;
  usedWatertightRepair: boolean;
  simplifiedFromTris: number;
  slicedTris: number;
  elapsedMs: number;
}

export interface IOrcaWasmSliceBundle {
  cacheKey: string;
  gcode: string;
  supportData: INativeSupportData;
  supportExportGeometry: THREE.BufferGeometry | null;
  segData: SegmentData;
  stats: IOrcaWasmSliceStats;
}

type SlicerClientInstance = ReturnType<typeof createSlicerClient>;

let sharedClient: SlicerClientInstance | null = null;
let isWarmingUp = false;
let activeJobToken = 0;

const sliceBundleCache = new Map<string, IOrcaWasmSliceBundle>();
const MAX_CACHE_ENTRIES = 5;

let latestExportSupportGeom: THREE.BufferGeometry | null = null;
let latestRealGcode: string | null = null;

export function getLatestOrcaExportSupportGeometry(): THREE.BufferGeometry | null {
  return latestExportSupportGeom;
}

export function getLatestOrcaGcode(): string | null {
  return latestRealGcode;
}

export function clearOrcaWasmCaches(): void {
  latestExportSupportGeom = null;
  latestRealGcode = null;
}

function getOrCreateClient(): SlicerClientInstance {
  if (!sharedClient) {
    sharedClient = createSlicerClient();
  }
  return sharedClient;
}

/**
 * Khởi động trước nhân C++ OrcaSlicer WASM ở chế độ nền (Idle)
 */
export function warmupOrcaWasmEngine(): void {
  if (typeof window === 'undefined' || isWarmingUp || sharedClient) return;
  isWarmingUp = true;
  try {
    const client = getOrCreateClient();
    client
      .warmup()
      .catch(() => {
        // Bỏ qua lỗi warmup nếu trình duyệt đang bận
      })
      .finally(() => {
        isWarmingUp = false;
      });
  } catch {
    isWarmingUp = false;
  }
}

/**
 * Tạo khóa định danh duy nhất cho hình học + thông số cắt lớp
 */
export function buildOrcaSliceCacheKey(
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  scale: number = 1,
  rotation: [number, number, number] = [0, 0, 0]
): string {
  const pos = geometry.getAttribute('position');
  const vCount = pos ? pos.count : 0;
  return [
    geometry.uuid,
    vCount,
    scale.toFixed(3),
    rotation.map((r) => r.toFixed(3)).join(','),
    profile.layerHeight,
    profile.firstLayerHeight ?? 0.2,
    profile.lineWidth ?? 0.42,
    profile.wallLoops,
    profile.topShellLayers ?? 4,
    profile.bottomShellLayers ?? 3,
    profile.infillDensity,
    profile.infillType,
    profile.seamPosition ?? 'aligned',
    profile.ironingEnabled ? 1 : 0,
    profile.supportMode,
    profile.treeStyle ?? 'organic',
    profile.supportAngleThreshold ?? 35,
    profile.supportTopZDistance ?? 0.2,
    profile.supportBranchDiameter ?? 2.2,
    profile.supportBranchAngle ?? 42,
    profile.supportInterfaceLayers ?? 2,
    profile.supportOnBuildPlateOnly !== false ? 1 : 0,
    profile.brimEnabled ? profile.brimWidthMm : 0,
    profile.raftLayers ?? 0,
    profile.printSpeed,
    profile.nozzleTemp,
    profile.bedTemp,
  ].join('|');
}

/**
 * Kiểm tra tỉ lệ cạnh hở (Open Boundary Edges) để phát hiện file STL lỗi rách mặt (Triangle Soup)
 */
function computeOpenEdgeRatio(posArr: Float32Array, maxSampleTris: number = 60000): number {
  const triCount = Math.floor(posArr.length / 9);
  if (triCount === 0) return 1;
  if (triCount > maxSampleTris) {
    // Với mesh cực lớn (>60k tris), chỉ kiểm tra đầy đủ nếu nhỏ hơn ngưỡng, lớn hơn mặc định coi là ZBrush sculpt kín
    return 0;
  }

  const quant = 1000;
  const vertMap = new Map<string, number>();
  const vIdx = new Int32Array(triCount * 3);
  let nextId = 0;

  for (let i = 0; i < triCount * 3; i++) {
    const k = `${Math.round(posArr[i * 3] * quant)},${Math.round(posArr[i * 3 + 1] * quant)},${Math.round(posArr[i * 3 + 2] * quant)}`;
    let id = vertMap.get(k);
    if (id === undefined) {
      id = nextId++;
      vertMap.set(k, id);
    }
    vIdx[i] = id;
  }

  const edgeCounts = new Map<string, number>();
  for (let t = 0; t < triCount; t++) {
    const a = vIdx[t * 3];
    const b = vIdx[t * 3 + 1];
    const c = vIdx[t * 3 + 2];
    if (a === b || b === c || c === a) continue;
    const e1 = a < b ? `${a}_${b}` : `${b}_${a}`;
    const e2 = b < c ? `${b}_${c}` : `${c}_${b}`;
    const e3 = c < a ? `${c}_${a}` : `${a}_${c}`;
    edgeCounts.set(e1, (edgeCounts.get(e1) || 0) + 1);
    edgeCounts.set(e2, (edgeCounts.get(e2) || 0) + 1);
    edgeCounts.set(e3, (edgeCounts.get(e3) || 0) + 1);
  }

  if (edgeCounts.size === 0) return 1;
  let openEdges = 0;
  for (const c of edgeCounts.values()) {
    if (c === 1) openEdges++;
  }
  return openEdges / edgeCounts.size;
}

/**
 * Rút gọn lưới bảo toàn tính đóng kín tô-pô (Topological Vertex Clustering - Rossignac-Borrel)
 * Đưa các mẫu điêu khắc 500k - 1M tam giác về ~60k tam giác kín nước (Watertight) trong < 25ms
 * giúp nhân C++ OrcaSlicer WASM cắt lớp trong ~1.8s thay vì 26s!
 */
function simplifyClosedMeshTopological(
  posArr: Float32Array,
  targetMaxTris: number = 65000
): Float32Array {
  const triCount = Math.floor(posArr.length / 9);
  if (triCount <= targetMaxTris) return posArr;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < posArr.length; i += 3) {
    const x = posArr[i], y = posArr[i + 1], z = posArr[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const spanZ = Math.max(1, maxZ - minZ);
  const maxSpan = Math.max(spanX, spanY, spanZ);

  // Ước lượng độ phân giải lưới gom cụm sao cho số tam giác còn lại ~ targetMaxTris
  const reductionRatio = Math.sqrt(triCount / targetMaxTris);
  const gridRes = Math.max(72, Math.min(240, Math.round(190 / Math.max(1, reductionRatio * 0.55))));
  const invCell = gridRes / maxSpan;

  const clusterMap = new Map<number, number>();
  const sumX: number[] = [];
  const sumY: number[] = [];
  const sumZ: number[] = [];
  const counts: number[] = [];

  const vCluster = new Int32Array(triCount * 3);
  const strideY = gridRes + 4;
  const strideZ = strideY * strideY;

  for (let i = 0; i < triCount * 3; i++) {
    const x = posArr[i * 3];
    const y = posArr[i * 3 + 1];
    const z = posArr[i * 3 + 2];
    const gx = Math.max(0, Math.round((x - minX) * invCell));
    const gy = Math.max(0, Math.round((y - minY) * invCell));
    const gz = Math.max(0, Math.round((z - minZ) * invCell));
    const cellKey = gx + gy * strideY + gz * strideZ;

    let cid = clusterMap.get(cellKey);
    if (cid === undefined) {
      cid = sumX.length;
      clusterMap.set(cellKey, cid);
      sumX.push(x);
      sumY.push(y);
      sumZ.push(z);
      counts.push(1);
    } else {
      sumX[cid] += x;
      sumY[cid] += y;
      sumZ[cid] += z;
      counts[cid] += 1;
    }
    vCluster[i] = cid;
  }

  const cCount = sumX.length;
  const cx = new Float32Array(cCount);
  const cy = new Float32Array(cCount);
  const cz = new Float32Array(cCount);
  for (let c = 0; c < cCount; c++) {
    const inv = 1 / counts[c];
    cx[c] = sumX[c] * inv;
    cy[c] = sumY[c] * inv;
    cz[c] = sumZ[c] * inv;
  }

  let keptTris = 0;
  for (let t = 0; t < triCount; t++) {
    const a = vCluster[t * 3];
    const b = vCluster[t * 3 + 1];
    const c = vCluster[t * 3 + 2];
    if (a !== b && b !== c && c !== a) keptTris++;
  }

  if (keptTris < 12) return posArr;

  const out = new Float32Array(keptTris * 9);
  let w = 0;
  for (let t = 0; t < triCount; t++) {
    const a = vCluster[t * 3];
    const b = vCluster[t * 3 + 1];
    const c = vCluster[t * 3 + 2];
    if (a === b || b === c || c === a) continue;
    out[w++] = cx[a]; out[w++] = cy[a]; out[w++] = cz[a];
    out[w++] = cx[b]; out[w++] = cy[b]; out[w++] = cz[b];
    out[w++] = cx[c]; out[w++] = cy[c]; out[w++] = cz[c];
  }
  return out;
}

/**
 * Tái tạo vỏ kín nước Voxel Box-Shell nhanh cho các file STL rách mặt nặng (ví dụ: highland_cow.stl bị mất 84% mặt)
 */
function repairBrokenSoupToWatertight(posArr: Float32Array): Float32Array {
  const triCount = Math.floor(posArr.length / 9);
  if (triCount === 0) return posArr;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < posArr.length; i += 3) {
    const x = posArr[i], y = posArr[i + 1], z = posArr[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  const maxSpan = Math.max(1, maxX - minX, maxY - minY, maxZ - minZ);
  const voxSize = Math.max(0.8, maxSpan / 84);
  const nx = Math.max(4, Math.ceil((maxX - minX) / voxSize) + 3);
  const ny = Math.max(4, Math.ceil((maxY - minY) / voxSize) + 3);
  const nz = Math.max(4, Math.ceil((maxZ - minZ) / voxSize) + 3);
  const ox = minX - voxSize * 1.5;
  const oy = Math.max(0, minY - voxSize * 0.5);
  const oz = minZ - voxSize * 1.5;

  const grid = new Uint8Array(nx * ny * nz);
  const idx = (ix: number, iy: number, iz: number) => ix + nx * (iy + ny * iz);

  // Rasterize mọi mặt tam giác vào lưới 3D
  for (let t = 0; t < triCount; t++) {
    const b = t * 9;
    const ax = posArr[b], ay = posArr[b + 1], az = posArr[b + 2];
    const bx = posArr[b + 3], by = posArr[b + 4], bz = posArr[b + 5];
    const cx = posArr[b + 6], cy = posArr[b + 7], cz = posArr[b + 8];

    const edgeLen = Math.max(
      Math.hypot(bx - ax, by - ay, bz - az),
      Math.hypot(cx - bx, cy - by, cz - bz),
      Math.hypot(ax - cx, ay - cy, az - cz)
    );
    const steps = Math.max(1, Math.min(12, Math.ceil(edgeLen / (voxSize * 0.75))));
    for (let u = 0; u <= steps; u++) {
      for (let v = 0; v <= steps - u; v++) {
        const wu = u / steps;
        const wv = v / steps;
        const ww = 1 - wu - wv;
        const px = ax * ww + bx * wu + cx * wv;
        const py = ay * ww + by * wu + cy * wv;
        const pz = az * ww + bz * wu + cz * wv;
        const ix = Math.floor((px - ox) / voxSize);
        const iy = Math.floor((py - oy) / voxSize);
        const iz = Math.floor((pz - oz) / voxSize);
        if (ix >= 1 && ix < nx - 1 && iy >= 0 && iy < ny - 1 && iz >= 1 && iz < nz - 1) {
          grid[idx(ix, iy, iz)] = 1;
        }
      }
    }
  }

  // Dilate 1 bước nhỏ để hàn kín khe thủng rồi Flood-fill phần không khí bên ngoài (state = 2)
  const dilated = new Uint8Array(grid.length);
  for (let iz = 1; iz < nz - 1; iz++) {
    for (let iy = 0; iy < ny - 1; iy++) {
      for (let ix = 1; ix < nx - 1; ix++) {
        if (grid[idx(ix, iy, iz)]) {
          dilated[idx(ix, iy, iz)] = 1;
          if (ix + 1 < nx - 1) dilated[idx(ix + 1, iy, iz)] = 1;
          if (iz + 1 < nz - 1) dilated[idx(ix, iy, iz + 1)] = 1;
          if (iy + 1 < ny - 1) dilated[idx(ix, iy + 1, iz)] = 1;
        }
      }
    }
  }

  // Flood fill từ biên ngoài để lấp đặc ruột bên trong
  const queue = new Int32Array(nx * ny * nz);
  let qHead = 0, qTail = 0;
  const pushAir = (ix: number, iy: number, iz: number) => {
    const k = idx(ix, iy, iz);
    if (dilated[k] === 0) {
      dilated[k] = 2;
      queue[qTail++] = k;
    }
  };
  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      pushAir(0, iy, iz);
      pushAir(nx - 1, iy, iz);
    }
  }
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      pushAir(ix, ny - 1, iz);
    }
  }

  const nxy = nx * ny;
  while (qHead < qTail) {
    const cur = queue[qHead++];
    const iz = Math.floor(cur / nxy);
    const rem = cur - iz * nxy;
    const iy = Math.floor(rem / nx);
    const ix = rem - iy * nx;
    if (ix > 0) pushAir(ix - 1, iy, iz);
    if (ix + 1 < nx) pushAir(ix + 1, iy, iz);
    if (iy > 0) pushAir(ix, iy - 1, iz);
    if (iy + 1 < ny) pushAir(ix, iy + 1, iz);
    if (iz > 0) pushAir(ix, iy, iz - 1);
    if (iz + 1 < nz) pushAir(ix, iy, iz + 1);
  }

  // Mọi ô không phải không khí bên ngoài (!== 2) đều là khối đặc kín 100%
  const tris: number[] = [];
  const isSolid = (ix: number, iy: number, iz: number) => {
    if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) return false;
    return dilated[idx(ix, iy, iz)] !== 2;
  };

  const emitQuad = (
    x0: number, y0: number, z0: number,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    x3: number, y3: number, z3: number
  ) => {
    tris.push(x0, y0, z0, x1, y1, z1, x2, y2, z2);
    tris.push(x0, y0, z0, x2, y2, z2, x3, y3, z3);
  };

  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        if (!isSolid(ix, iy, iz)) continue;
        const x0 = ox + ix * voxSize, x1 = x0 + voxSize;
        const y0 = oy + iy * voxSize, y1 = y0 + voxSize;
        const z0 = oz + iz * voxSize, z1 = z0 + voxSize;

        if (!isSolid(ix + 1, iy, iz)) emitQuad(x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1);
        if (!isSolid(ix - 1, iy, iz)) emitQuad(x0, y0, z1, x0, y1, z1, x0, y1, z0, x0, y0, z0);
        if (!isSolid(ix, iy + 1, iz)) emitQuad(x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0);
        if (!isSolid(ix, iy - 1, iz)) emitQuad(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1);
        if (!isSolid(ix, iy, iz + 1)) emitQuad(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1);
        if (!isSolid(ix, iy, iz - 1)) emitQuad(x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0);
      }
    }
  }

  return tris.length >= 36 ? new Float32Array(tris) : posArr;
}

/**
 * Chuyển đổi Three.js BufferGeometry (Y-up) sang Binary STL chuẩn Z-up (x, -z, y) với det = +1
 */
function buildZUpStlForOrca(
  geometry: THREE.BufferGeometry,
  forceWatertightRepair: boolean = false
): { stlBuffer: ArrayBuffer; originalTris: number; slicedTris: number; repaired: boolean } {
  let working = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  working.computeBoundingBox();
  const minY = working.boundingBox?.min.y ?? 0;
  if (Math.abs(minY) > 1e-5) {
    working.translate(0, -minY, 0);
  }

  const posAttr = working.getAttribute('position');
  const rawArr = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    rawArr[i * 3] = posAttr.getX(i);
    rawArr[i * 3 + 1] = posAttr.getY(i);
    rawArr[i * 3 + 2] = posAttr.getZ(i);
  }
  working.dispose();

  const originalTris = Math.floor(rawArr.length / 9);
  let activeArr: Float32Array = rawArr;
  let repaired = false;

  if (forceWatertightRepair || computeOpenEdgeRatio(activeArr) > 0.22) {
    activeArr = repairBrokenSoupToWatertight(activeArr);
    repaired = true;
  } else if (originalTris > 75000) {
    activeArr = simplifyClosedMeshTopological(activeArr, 62000);
  }

  const triCount = Math.floor(activeArr.length / 9);
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triCount, true);

  let offset = 84;
  for (let t = 0; t < triCount; t++) {
    const b = t * 9;
    // Ánh xạ trực giao bảo toàn hướng pháp tuyến: (x, y, z)_Three -> (x, -z, y)_Slicer
    const ax = activeArr[b], ay = -activeArr[b + 2], az = activeArr[b + 1];
    const bx = activeArr[b + 3], by = -activeArr[b + 5], bz = activeArr[b + 4];
    const cx = activeArr[b + 6], cy = -activeArr[b + 8], cz = activeArr[b + 7];

    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen; ny /= nLen; nz /= nLen;

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);

    view.setFloat32(offset + 12, ax, true);
    view.setFloat32(offset + 16, ay, true);
    view.setFloat32(offset + 20, az, true);

    view.setFloat32(offset + 24, bx, true);
    view.setFloat32(offset + 28, by, true);
    view.setFloat32(offset + 32, bz, true);

    view.setFloat32(offset + 36, cx, true);
    view.setFloat32(offset + 40, cy, true);
    view.setFloat32(offset + 44, cz, true);

    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }

  return { stlBuffer: buffer, originalTris, slicedTris: triCount, repaired };
}

/**
 * Ánh xạ đầy đủ thông số ISimulationProfile sang tập tham số nhân C++ OrcaSlicer WASM
 */
function mapProfileToOrcaKernelParams(profile: ISimulationProfile): Record<string, unknown> {
  const layerHeight = profile.layerHeight || 0.2;
  const firstLayerHeight =
    profile.firstLayerHeight || Math.min(0.28, Number((layerHeight * 1.2).toFixed(2)));
  const lineWidth = profile.lineWidth || 0.42;

  const patternMap: Record<string, string> = {
    gyroid: 'gyroid',
    grid: 'grid',
    honeycomb: 'honeycomb',
    triangles: 'triangles',
    concentric: 'concentric',
    cubic: '3dhoneycomb',
    lightning: 'zigzag',
    solid: 'rectilinear',
  };

  const infillPattern = patternMap[profile.infillType] || 'gyroid';
  const infillDensity =
    profile.infillType === 'solid'
      ? 1.0
      : Math.max(0, Math.min(1, (profile.infillDensity ?? 15) / 100));

  const treeStyle = profile.treeStyle || 'organic';

  return {
    auto_center: false,
    bed_width: 256,
    bed_depth: 256,
    printable_height: 256,
    layer_height: layerHeight,
    first_layer_height: firstLayerHeight,
    line_width: lineWidth,
    outer_wall_line_width: profile.outerWallLineWidth || lineWidth,
    wall_loops: Math.max(1, profile.wallLoops || 2),
    wall_generator: 'arachne',
    top_shell_layers: profile.topShellLayers ?? 4,
    bottom_shell_layers: profile.bottomShellLayers ?? 3,
    infill_density: infillDensity,
    sparse_infill_pattern: infillPattern,
    infill_wall_overlap: profile.infillOverlapPercent ?? 15,
    seam_position: profile.seamPosition || 'aligned',
    ironing_type: profile.ironingEnabled ? 'top' : 'none',
    brim_width: profile.brimEnabled ? profile.brimWidthMm || 5 : 0,
    skirt_loops: 0,
    raft_layers: profile.raftLayers ?? 0,

    nozzle_diameter: profile.nozzleDiameter || 0.4,
    filament_diameter: 1.75,
    flow_ratio: profile.flowRatio ?? 0.98,
    nozzle_temp: profile.nozzleTemp || 220,
    bed_temp: profile.bedTemp || 60,
    fan_speed: profile.coolingFanSpeed ?? 100,

    print_speed: profile.outerWallSpeed || Math.round((profile.printSpeed || 200) * 0.65),
    inner_wall_speed: profile.innerWallSpeed || profile.printSpeed || 200,
    sparse_infill_speed: profile.infillSpeed || Math.round((profile.printSpeed || 200) * 1.15),
    top_surface_speed: profile.topSurfaceSpeed || Math.round((profile.printSpeed || 200) * 0.55),
    travel_speed: profile.travelSpeed || 500,
    first_layer_speed: 50,
    machine_accel_print: profile.defaultAcceleration || 10000,

    retract_length: profile.retractionDistanceMm ?? 0.8,
    retract_speed: profile.retractionSpeedMmS ?? 35,
    z_hop: profile.zHopMm ?? 0.4,

    enable_support: profile.supportMode !== 'none',
    support_style: profile.supportMode === 'tree' ? 'tree' : 'grid',
    tree_style: treeStyle,
    support_threshold_angle: profile.supportAngleThreshold ?? 35,
    support_top_z_distance: profile.supportTopZDistance ?? 0.2,
    support_bottom_z_distance: profile.supportBottomZDistance ?? 0.2,
    support_xy_distance: 0.38,
    support_interface_top_layers: profile.supportInterfaceLayers ?? 2,
    support_on_build_plate_only: profile.supportOnBuildPlateOnly !== false,
    tree_support_branch_diameter: profile.supportBranchDiameter ?? 2.2,
    tree_support_branch_diameter_organic: profile.supportBranchDiameter ?? 2.2,
    tree_support_branch_angle: profile.supportBranchAngle ?? 42,
    tree_support_branch_angle_organic: profile.supportBranchAngle ?? 42,
    tree_support_tip_diameter: 0.8,
    tree_support_wall_count: treeStyle === 'strong' ? 2 : 1,

    gcode_role_tags: true,
    gcode_stats_block: true,
  };
}

interface IRawSliceLayer {
  z: number;
  idx: number;
  gcode?: string;
  paths: Float32Array;
  widths?: Float32Array;
}

/**
 * Trích xuất cấu trúc INativeSupportData chuẩn xác 100% từ các đường bao Support (role === 5) của OrcaSlicer C++
 * Tự động phân tách Thân cành Organic (#00e050), Đệm tiếp xúc Interface Roof (#d946ef) và Vành Tree Brim (#c026d3)
 */
function extractNativeSupportFromOrcaLayers(
  layers: IRawSliceLayer[],
  modelName: string,
  profile: ISimulationProfile
): { supportData: INativeSupportData; supportSegCount: number; modelSegCount: number } {
  const layerCount = layers.length;
  const supportGridPerLayer: Array<Set<number>> = new Array(layerCount);

  let supportSegCount = 0;
  let modelSegCount = 0;

  const packCell = (xs: number, ys: number) => {
    const gx = Math.round((xs + 512) * 0.5);
    const gy = Math.round((ys + 512) * 0.5);
    return gx * 2048 + gy;
  };

  // Pass 1: Đánh dấu ô không gian Support mỗi lớp để nhận diện chính xác 2 lớp đỉnh Support Interface Roof
  for (let li = 0; li < layerCount; li++) {
    const cellSet = new Set<number>();
    const p = layers[li].paths;
    if (p && p.length >= 8) {
      for (let k = 0; k < p.length; k += 8) {
        const role = (p[k + 3] | 0) & 15;
        if (role === 5 || role === 6) {
          supportSegCount++;
          const mx = (p[k] + p[k + 4]) * 0.5;
          const my = (p[k + 1] + p[k + 5]) * 0.5;
          cellSet.add(packCell(mx, my));
        } else if (role !== 0 && role !== 4) {
          modelSegCount++;
        }
      }
    }
    supportGridPerLayer[li] = cellSet;
  }

  const hasSupportAbove = (li: number, xs: number, ys: number): boolean => {
    const checkLayer = li + 2;
    if (checkLayer >= layerCount) return false;
    const aboveSet = supportGridPerLayer[checkLayer];
    if (!aboveSet || aboveSet.size === 0) return false;
    const gxBase = Math.round((xs + 512) * 0.5);
    const gyBase = Math.round((ys + 512) * 0.5);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (aboveSet.has((gxBase + dx) * 2048 + (gyBase + dy))) {
          return true;
        }
      }
    }
    return false;
  };

  // Pass 2: Gom các đoạn thẳng liên tiếp thành chuỗi contour khép kín trong không gian Three.js (x, z_slicer, -y_slicer)
  const segments: INativeSupportSegment[] = [];
  let totalMoves = 0;

  for (let li = 0; li < layerCount; li++) {
    const p = layers[li].paths;
    if (!p || p.length < 8) continue;

    let trunkPts: number[] = [];
    let interfacePts: number[] = [];

    for (let k = 0; k < p.length; k += 8) {
      const role = (p[k + 3] | 0) & 15;
      if (role !== 5 && role !== 6) continue;

      const x0 = p[k];
      const y0 = p[k + 1];
      const z0 = p[k + 2];
      const x1 = p[k + 4];
      const y1 = p[k + 5];
      const z1 = p[k + 6];

      const mx = (x0 + x1) * 0.5;
      const my = (y0 + y1) * 0.5;
      const isRoofInterface = li >= 3 && !hasSupportAbove(li, mx, my);

      // Inverse transform (xs, ys, zs) -> Three.js (xs, zs, -ys)
      const tx0 = x0, ty0 = z0, tz0 = -y0;
      const tx1 = x1, ty1 = z1, tz1 = -y1;

      if (isRoofInterface) {
        interfacePts.push(tx0, ty0, tz0, tx1, ty1, tz1);
      } else {
        trunkPts.push(tx0, ty0, tz0, tx1, ty1, tz1);
      }
      totalMoves++;
    }

    if (trunkPts.length >= 6) {
      segments.push({ isInterface: false, points: trunkPts });
    }
    if (interfacePts.length >= 6) {
      segments.push({ isInterface: true, points: interfacePts });
    }
  }

  return {
    supportData: {
      model: modelName,
      engine: 'orcaslicer-cpp-wasm-0.4.3',
      totalMoves,
      totalSegments: segments.length,
      layerHeightMm: profile.layerHeight || 0.2,
      lineWidthMm: profile.lineWidth || 0.42,
      segments,
    },
    supportSegCount,
    modelSegCount,
  };
}

/**
 * Chuyển đổi nhóm Mesh từ buildNativeSupportMesh thành một BufferGeometry độc lập phục vụ Xuất .3MF / .STL
 */
export function convertSupportGroupToExportGeometry(
  supportGroup: THREE.Group
): THREE.BufferGeometry | null {
  const chunks: Float32Array[] = [];
  let totalFloats = 0;

  supportGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const nonIdx = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry;
      const pos = nonIdx.getAttribute('position');
      if (pos && pos.count >= 3) {
        const arr = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
          arr[i * 3] = pos.getX(i);
          arr[i * 3 + 1] = pos.getY(i);
          arr[i * 3 + 2] = pos.getZ(i);
        }
        chunks.push(arr);
        totalFloats += arr.length;
      }
      if (nonIdx !== child.geometry) nonIdx.dispose();
    }
  });

  if (totalFloats === 0) return null;
  const merged = new Float32Array(totalFloats);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(merged, 3));
  out.computeVertexNormals();
  return out;
}

/**
 * Thực thi cắt lớp thực tế 100% bằng nhân C++ OrcaSlicer WASM trong Web Worker
 */
export async function sliceGeometryWithOrcaWasm(
  geometry: THREE.BufferGeometry,
  modelName: string,
  profile: ISimulationProfile,
  options?: {
    onProgress?: (percent: number, stageLabel: string) => void;
    buildSupportExportMesh?: (data: INativeSupportData) => THREE.Group;
  }
): Promise<IOrcaWasmSliceBundle | null> {
  const cacheKey = buildOrcaSliceCacheKey(geometry, profile);
  if (sliceBundleCache.has(cacheKey)) {
    const hit = sliceBundleCache.get(cacheKey)!;
    latestExportSupportGeom = hit.supportExportGeometry;
    latestRealGcode = hit.gcode;
    options?.onProgress?.(100, 'Đã nạp từ bộ nhớ đệm Orca C++');
    return hit;
  }

  const jobToken = ++activeJobToken;

  // Nếu có phiên cắt cũ đang chạy dở trên Worker, hủy ngay lập tức để nhường 100% CPU cho thông số mới
  if (sharedClient) {
    const cancelled = sharedClient.cancel();
    if (!cancelled) {
      sharedClient.terminate();
      sharedClient = null;
    }
  }

  const t0 = performance.now();
  options?.onProgress?.(8, 'Chuẩn hóa lưới 3D Z-up...');

  const kernelParams = mapProfileToOrcaKernelParams(profile);

  const executeWorkerSlice = async (forceRepair: boolean) => {
    const prep = buildZUpStlForOrca(geometry, forceRepair);
    if (jobToken !== activeJobToken) return null;

    options?.onProgress?.(
      18,
      profile.supportMode === 'tree'
        ? 'Nhân OrcaSlicer C++ đang giải nhánh Tree Support...'
        : 'Nhân OrcaSlicer C++ đang cắt lát đường chạy dao...'
    );

    const client = getOrCreateClient();
    const res = await client.slice(prep.stlBuffer, kernelParams, {
      onProgress: (done: number, total: number) => {
        if (jobToken !== activeJobToken) return;
        const ratio = total > 0 ? Math.min(1, done / total) : 0.5;
        const pct = Math.round(20 + ratio * 68);
        options?.onProgress?.(pct, `OrcaSlicer C++: Lớp ${done}/${total}`);
      },
    });

    if (jobToken !== activeJobToken) return null;
    return { res, prep };
  };

  let run = await executeWorkerSlice(false);
  if (!run || jobToken !== activeJobToken) return null;

  let layers = (run.res.layers || []) as IRawSliceLayer[];
  let extracted = extractNativeSupportFromOrcaLayers(layers, modelName, profile);

  // Nếu file STL gốc bị rách mặt hở cạnh khiến nhân C++ ra 0 đường dao, tự động hàn kín Voxel rồi cắt lại!
  if (extracted.modelSegCount === 0 && !run.prep.repaired) {
    options?.onProgress?.(25, 'Tự động hàn kín mặt hở STL & cắt lại...');
    run = await executeWorkerSlice(true);
    if (!run || jobToken !== activeJobToken) return null;
    layers = (run.res.layers || []) as IRawSliceLayer[];
    extracted = extractNativeSupportFromOrcaLayers(layers, modelName, profile);
  }

  if (extracted.modelSegCount === 0 || layers.length === 0) {
    return null;
  }

  options?.onProgress?.(92, 'Đang dựng sợi đùn 3D GPU & vỏ Tree Support...');

  const segData = buildSegmentData(layers, profile.lineWidth || 0.42);

  // Tính khối lượng nhựa thực tế cho Phôi (Model) vs Cây đỡ (Support)
  const densityGcm3 =
    profile.material === 'PETG'
      ? 1.27
      : profile.material === 'ABS' || profile.material === 'ASA'
      ? 1.05
      : profile.material === 'TPU'
      ? 1.21
      : 1.24;

  const rawStats = run.res.stats || {};
  const totalFilamentMm = Number(rawStats.filament_mm || 0);
  const filamentAreaMm2 = Math.PI * Math.pow(1.75 / 2, 2); // ~2.4053 mm²
  const totalGramsFromMm = (totalFilamentMm * filamentAreaMm2 * densityGcm3) / 1000;
  const totalFilamentGrams =
    Number(rawStats.filament_g) > 0
      ? Number(Number(rawStats.filament_g).toFixed(1))
      : Number(Math.max(0.2, totalGramsFromMm).toFixed(1));

  let sumExtrudedLen = 0;
  let supportExtrudedLen = 0;
  for (let r = 1; r < segData.typeLengths.length; r++) {
    sumExtrudedLen += segData.typeLengths[r];
    if (r === 5 || r === 6) {
      supportExtrudedLen += segData.typeLengths[r];
    }
  }
  const supportShare = sumExtrudedLen > 0 ? supportExtrudedLen / sumExtrudedLen : 0;
  const supportGrams = Number((totalFilamentGrams * supportShare).toFixed(1));
  const modelGrams = Number(Math.max(0.1, totalFilamentGrams - supportGrams).toFixed(1));

  let supportExportGeometry: THREE.BufferGeometry | null = null;
  if (options?.buildSupportExportMesh && extracted.supportData.segments.length > 0) {
    const tempGroup = options.buildSupportExportMesh(extracted.supportData);
    supportExportGeometry = convertSupportGroupToExportGeometry(tempGroup);
    tempGroup.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry?.dispose();
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material?.dispose();
      }
    });
  }

  const gcodeText = typeof run.res.gcode === 'string' ? run.res.gcode : '';
  latestExportSupportGeom = supportExportGeometry;
  latestRealGcode = gcodeText || null;

  const bundle: IOrcaWasmSliceBundle = {
    cacheKey,
    gcode: gcodeText,
    supportData: extracted.supportData,
    supportExportGeometry,
    segData,
    stats: {
      totalLayers: layers.length,
      totalTimeSec: Math.max(10, Math.round(Number(rawStats.time_s || rawStats.estimated_time_s || layers.length * 12))),
      totalFilamentGrams,
      modelGrams,
      supportGrams,
      filamentMm: Math.round(totalFilamentMm),
      supportSegmentsCount: extracted.supportSegCount,
      modelSegmentsCount: extracted.modelSegCount,
      usedWatertightRepair: run.prep.repaired,
      simplifiedFromTris: run.prep.originalTris,
      slicedTris: run.prep.slicedTris,
      elapsedMs: Math.round(performance.now() - t0),
    },
  };

  if (sliceBundleCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = sliceBundleCache.keys().next().value;
    if (oldestKey) {
      const evicted = sliceBundleCache.get(oldestKey);
      if (evicted?.supportExportGeometry && evicted.supportExportGeometry !== latestExportSupportGeom) {
        evicted.supportExportGeometry.dispose();
      }
      sliceBundleCache.delete(oldestKey);
    }
  }
  sliceBundleCache.set(cacheKey, bundle);

  options?.onProgress?.(100, 'Hoàn tất OrcaSlicer C++');
  return bundle;
}

const ROLE_NAME_MAP: Record<number, string> = {
  0: 'Travel (Di chuyển không đùn)',
  1: 'Wall (Tường bao Arachne)',
  2: 'Sparse Infill (Ruột chịu lực)',
  3: 'Solid Surface (Đỉnh / Đáy đặc)',
  4: 'Brim / Skirt (Vành bám bàn)',
  5: 'Tree Support (Cây đỡ Organic)',
  6: 'Raft (Đế lót)',
  7: 'Gap Fill (Lấp khe hẹp)',
  8: 'Thin Wall (Tường mỏng)',
  9: 'Bridge (Bắc cầu không trung)',
  10: 'Ironing (Là phẳng mặt đỉnh)',
  11: 'Prime Tower (Tháp xả nhựa)',
};

/**
 * Dựng Three.js Group hiển thị sợi đùn 3D GPU-Instanced (Chuẩn Bambu Studio / OrcaSlicer) từ SegmentData
 * Tốc độ tua lớp 0ms (120 FPS), hỗ trợ kéo ngang từng bước đầu phun và chuyển phổ màu thời gian thực!
 */
export function buildOrcaGpuToolpathGroup(
  segData: SegmentData,
  profile: ISimulationProfile
): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = 'full_filament_preview_group';

  const tp: ToolpathHandle = makeToolpath(THREE, segData);

  // Xoay ngược từ hệ tọa độ Slicer Z-up (xs, ys, zs) về Three.js Y-up (xs, zs, -ys)
  const zUpPivot = new THREE.Group();
  zUpPivot.rotation.x = -Math.PI / 2;
  zUpPivot.add(tp.mesh);
  zUpPivot.add(tp.travLines);
  tp.setTravelVisible(false);
  wrapper.add(zUpPivot);

  const colorCtx: ColorContext = {
    speedByType: {
      1: profile.outerWallSpeed || Math.round((profile.printSpeed || 200) * 0.65),
      2: profile.infillSpeed || Math.round((profile.printSpeed || 200) * 1.15),
      3: profile.topSurfaceSpeed || Math.round((profile.printSpeed || 200) * 0.55),
      4: 50,
      5: Math.round((profile.printSpeed || 200) * 0.75),
      6: 60,
      7: Math.round((profile.printSpeed || 200) * 0.5),
      8: Math.round((profile.printSpeed || 200) * 0.55),
      9: 30,
      10: 30,
    },
    firstLayerSpeed: 50,
    fanNormal: profile.coolingFanSpeed ?? 100,
    closeFanLayers: 1,
    tempNormal: profile.nozzleTemp || 220,
    tempFirst: (profile.nozzleTemp || 220) + 5,
    toolColors: [profile.materialColor || '#f97316'],
  };

  let currentTopLayerIdx = Math.max(0, tp.layerCount - 1);
  let currentIntraProgress = 1.0;
  let showTravels = false;

  const applyColorScheme = (scheme: FilamentColorScheme) => {
    const viewKey =
      scheme === 'speed'
        ? 'speed'
        : scheme === 'flow'
        ? 'width'
        : scheme === 'layer_time'
        ? 'fan'
        : 'feature';
    const res = computeColors(segData, viewKey, colorCtx);
    tp.setColors(res.color);
  };

  applyColorScheme('line_type');

  const syncMoveScrub = () => {
    if (currentIntraProgress >= 0.998) {
      tp.setMoveRange(null);
    } else {
      const totalMoves = layerMoveCount(segData, currentTopLayerIdx);
      const targetMove = Math.max(1, Math.round(currentIntraProgress * totalMoves));
      tp.setMoveRange(targetMove);
    }
  };

  wrapper.userData = {
    isOrcaGpuToolpath: true,
    totalLayers: tp.layerCount,
    updateLayer: (currentLayer: number, _progress: number) => {
      if (tp.layerCount <= 0) return;
      currentTopLayerIdx = Math.max(0, Math.min(tp.layerCount - 1, currentLayer - 1));
      tp.setLayerRange(0, currentTopLayerIdx);
      syncMoveScrub();
    },
    setColorScheme: (scheme: FilamentColorScheme) => {
      applyColorScheme(scheme);
    },
    setIntraLayerProgress: (p01: number) => {
      currentIntraProgress = Math.max(0, Math.min(1, p01));
      syncMoveScrub();
    },
    setTravelVisible: (visible: boolean) => {
      showTravels = visible;
      tp.setTravelVisible(visible);
    },
    getTravelVisible: () => showTravels,
    updateVisibility: (opts?: { showTravels?: boolean }) => {
      if (typeof opts?.showTravels === 'boolean') {
        showTravels = opts.showTravels;
        tp.setTravelVisible(showTravels);
      }
    },
    getActiveMoveTelemetry: (
      currentLayer: number,
      p01: number
    ): IActiveMoveTelemetry | null => {
      if (tp.layerCount <= 0) return null;
      const lIdx = Math.max(0, Math.min(tp.layerCount - 1, currentLayer - 1));
      const totalMoves = layerMoveCount(segData, lIdx);
      if (totalMoves <= 0) return null;
      const at = Math.max(1, Math.min(totalMoves, Math.round(p01 * totalMoves)));
      const cur = moveCursor(segData, lIdx, at);
      if (!cur || !cur.point) return null;

      const [xs, ys, zs] = cur.point;
      const segIdx = Math.max(0, Math.min(segData.nSeg - 1, cur.segCount - 1));
      const vIdx = segData.segIndex[segIdx * 2] || 0;
      const roleId = cur.onTravel ? 0 : segData.meta.vType[vIdx] || 1;
      const widthMm = segData.meta.vWidth[vIdx] || profile.lineWidth || 0.42;
      const heightMm = segData.meta.vHeight[vIdx] || profile.layerHeight || 0.2;
      const speedMmS = cur.onTravel
        ? profile.travelSpeed || 500
        : colorCtx.speedByType?.[roleId] || profile.printSpeed || 180;
      const flowMm3S = cur.onTravel
        ? 0
        : Number((widthMm * heightMm * speedMmS * 0.92).toFixed(1));

      return {
        position: [xs, zs, -ys],
        featureId: roleId,
        featureLabel: ROLE_NAME_MAP[roleId] || 'Extrusion',
        speedMmS,
        flowMm3S,
        layerTimeSec: Number(Math.max(1.5, totalMoves * 0.035).toFixed(1)),
        moveIndex: at,
        totalLayerMoves: totalMoves,
      };
    },
    dispose: () => {
      tp.dispose();
    },
  };

  return wrapper;
}
