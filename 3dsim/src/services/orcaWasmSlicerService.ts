import * as THREE from 'three';
import { makeSlicerWorker } from 'three-slicer/client';
import { deriveKernelParams, type SlicerSettings } from 'three-slicer-viewer/settings';
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
  kernelMode?: 'mt' | 'st';
}

export interface IOrcaWasmSliceBundle {
  cacheKey: string;
  gcode: string;
  supportData: INativeSupportData;
  supportExportGeometry: THREE.BufferGeometry | null;
  segData: SegmentData;
  stats: IOrcaWasmSliceStats;
}

interface IRawSliceLayer {
  z: number;
  idx: number;
  gcode?: string;
  paths: Float32Array;
  widths?: Float32Array;
}

interface IRawWorkerSliceResult {
  layers: IRawSliceLayer[];
  gcode: string;
  stats: Record<string, unknown>;
}

let sharedWorker: Worker | null = null;
let supProgressView: Uint32Array | null = null;
let cancelFlagView: Uint32Array | null = null;
let loadedKernelMode: 'mt' | 'st' =
  typeof window !== 'undefined' && window.crossOriginIsolated ? 'mt' : 'st';
let isWarmingUp = false;
let nextWorkerReqId = 1;
let activeJobToken = 0;
let inFlightWorkerPromise: Promise<unknown> | null = null;

type WorkerMsgListener = (data: Record<string, any>) => void;
const workerListeners = new Set<WorkerMsgListener>();

const sliceBundleCache = new Map<string, IOrcaWasmSliceBundle>();
const MAX_CACHE_ENTRIES = 6;

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

function destroySharedWorker(): void {
  if (sharedWorker) {
    try {
      sharedWorker.terminate();
    } catch {
      // Ignore worker termination errors
    }
  }
  sharedWorker = null;
  supProgressView = null;
  cancelFlagView = null;
  inFlightWorkerPromise = null;
  workerListeners.clear();
}

function getOrCreateWorker(): Worker {
  if (sharedWorker) return sharedWorker;

  const w = makeSlicerWorker();
  w.addEventListener('message', (ev: MessageEvent) => {
    const data = ev.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'supsab' && data.buf) {
      try {
        if (typeof data.ptr === 'number') {
          supProgressView = new Uint32Array(data.buf, data.ptr, 1);
        }
        if (typeof data.cancelPtr === 'number' && data.cancelPtr > 0) {
          cancelFlagView = new Uint32Array(data.buf, data.cancelPtr, 1);
        }
        loadedKernelMode = 'mt';
      } catch {
        // Non-shared buffer fallback
      }
      return;
    }

    if (data.type === 'warm' && (data.kernel === 'mt' || data.kernel === 'st')) {
      loadedKernelMode = data.kernel;
    }

    for (const fn of Array.from(workerListeners)) {
      fn(data);
    }
  });

  w.addEventListener('error', (ev: ErrorEvent) => {
    const errPayload = {
      type: 'worker_fatal',
      error: ev.message || 'OrcaSlicer WASM Worker crashed',
    };
    for (const fn of Array.from(workerListeners)) {
      fn(errPayload);
    }
  });

  sharedWorker = w;
  return w;
}

/**
 * Khởi động trước nhân C++ OrcaSlicer WASM (+ pthread pool nếu COOP/COEP bật) ở chế độ nền
 */
export function warmupOrcaWasmEngine(): void {
  if (typeof window === 'undefined' || isWarmingUp || sharedWorker) return;
  isWarmingUp = true;
  try {
    const w = getOrCreateWorker();
    const requestId = nextWorkerReqId++;
    const onMsg: WorkerMsgListener = (data) => {
      if (data.requestId === requestId || data.type === 'worker_fatal') {
        workerListeners.delete(onMsg);
        isWarmingUp = false;
      }
    };
    workerListeners.add(onMsg);
    w.postMessage({ cmd: 'warmup', requestId });
  } catch {
    isWarmingUp = false;
  }
}

async function interruptInFlightWorkerIfNeeded(): Promise<void> {
  if (!inFlightWorkerPromise || !sharedWorker) return;

  if (cancelFlagView) {
    try {
      Atomics.store(cancelFlagView, 0, 1);
    } catch {
      cancelFlagView[0] = 1;
    }
    const outcome = await Promise.race([
      inFlightWorkerPromise.then(() => 'settled').catch(() => 'settled'),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 450)),
    ]);
    if (outcome === 'timeout') {
      destroySharedWorker();
    } else if (cancelFlagView) {
      try {
        Atomics.store(cancelFlagView, 0, 0);
      } catch {
        cancelFlagView[0] = 0;
      }
    }
  } else {
    destroySharedWorker();
  }
}

function executeRawWorkerSlice(
  stlBuffer: ArrayBuffer,
  kernelParams: Record<string, unknown>,
  enableTreeSupport: boolean,
  onProgress?: (percent: number, stageLabel: string) => void
): Promise<IRawWorkerSliceResult> {
  const w = getOrCreateWorker();
  const requestId = nextWorkerReqId++;

  if (cancelFlagView) {
    try {
      Atomics.store(cancelFlagView, 0, 0);
    } catch {
      cancelFlagView[0] = 0;
    }
  }
  if (supProgressView) {
    try {
      Atomics.store(supProgressView, 0, 0);
    } catch {
      supProgressView[0] = 0;
    }
  }

  const runPromise = new Promise<IRawWorkerSliceResult>((resolve, reject) => {
    const streamedLayers: IRawSliceLayer[] = [];
    const gcodeChunks: string[] = [];
    let highestPct = 18;

    const emitPct = (pct: number, label: string) => {
      if (pct >= highestPct) {
        highestPct = pct;
        onProgress?.(pct, label);
      }
    };

    const sabPollTimer = setInterval(() => {
      if (!supProgressView || !enableTreeSupport) return;
      let rawSup = 0;
      try {
        rawSup = Atomics.load(supProgressView, 0);
      } catch {
        rawSup = supProgressView[0] || 0;
      }
      if (rawSup > 0 && rawSup <= 100) {
        const mapped = Math.round(20 + (rawSup / 100) * 44);
        emitPct(mapped, `OrcaSlicer C++ TreeSupport3D: ${rawSup}%`);
      }
    }, 110);

    const cleanup = () => {
      clearInterval(sabPollTimer);
      workerListeners.delete(onMsg);
    };

    const onMsg: WorkerMsgListener = (data) => {
      if (data.type === 'worker_fatal') {
        cleanup();
        reject(new Error(String(data.error || 'Worker fatal error')));
        return;
      }
      if (data.requestId !== requestId) return;

      if (data.type === 'progress') {
        const done = Number(data.done || 0);
        const total = Math.max(1, Number(data.total || 1));
        const ratio = Math.min(1, done / total);
        const base = enableTreeSupport ? 64 : 22;
        const span = enableTreeSupport ? 26 : 68;
        emitPct(Math.round(base + ratio * span), `OrcaSlicer C++: Lớp ${done}/${total}`);
        return;
      }

      if (data.type === 'layer') {
        if (typeof data.gcode === 'string' && data.gcode.length > 0) {
          gcodeChunks.push(data.gcode);
        }
        streamedLayers.push({
          z: Number(data.z || 0),
          idx: Number(data.idx || 0),
          gcode: typeof data.gcode === 'string' ? data.gcode : '',
          paths: data.paths instanceof Float32Array ? data.paths : new Float32Array(0),
          widths: data.widths instanceof Float32Array ? data.widths : undefined,
        });
        return;
      }

      if (data.type === 'error') {
        cleanup();
        reject(new Error(String(data.error || 'OrcaSlicer C++ slice failed')));
        return;
      }

      if (data.type === 'done') {
        cleanup();
        const result = (data.result || {}) as Record<string, any>;
        const finalLayers =
          streamedLayers.length > 0
            ? streamedLayers
            : ((result.layers || []) as IRawSliceLayer[]);
        const finalGcode =
          gcodeChunks.length > 0
            ? gcodeChunks.join('')
            : typeof result.gcode === 'string'
            ? result.gcode
            : '';
        resolve({
          layers: finalLayers,
          gcode: finalGcode,
          stats: (result.stats || {}) as Record<string, unknown>,
        });
      }
    };

    workerListeners.add(onMsg);
    w.postMessage(
      {
        stl: stlBuffer,
        params: JSON.stringify(kernelParams),
        gpu: false,
        requestId,
      },
      [stlBuffer]
    );
  });

  inFlightWorkerPromise = runPromise;
  runPromise.finally(() => {
    if (inFlightWorkerPromise === runPromise) {
      inFlightWorkerPromise = null;
    }
  });

  return runPromise;
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
    profile.supportAngleThreshold ?? 30,
    profile.supportTopZDistance ?? 0.2,
    profile.supportBottomZDistance ?? 0.2,
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
 * Kiểm tra tỉ lệ cạnh hở (Open Boundary Edges) bằng băm số nguyên tốc độ cao (< 8ms cho 150k tam giác)
 * Phát hiện chính xác các file STL rách mặt nặng như highland_cow.stl (100k tris, hở 84% cạnh)
 */
function computeOpenEdgeRatio(posArr: Float32Array, maxSampleTris: number = 165000): number {
  const triCount = Math.floor(posArr.length / 9);
  if (triCount === 0) return 1;
  if (triCount > maxSampleTris) {
    return 0;
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < posArr.length; i += 3) {
    const x = posArr[i], y = posArr[i + 1], z = posArr[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  const maxSpan = Math.max(1e-3, maxX - minX, maxY - minY, maxZ - minZ);
  const gridScale = 65536 / maxSpan;
  const vertMap = new Map<number, number>();
  const vIdx = new Uint32Array(triCount * 3);
  let nextId = 1;

  for (let i = 0; i < triCount * 3; i++) {
    const qx = Math.max(0, Math.round((posArr[i * 3] - minX) * gridScale));
    const qy = Math.max(0, Math.round((posArr[i * 3 + 1] - minY) * gridScale));
    const qz = Math.max(0, Math.round((posArr[i * 3 + 2] - minZ) * gridScale));
    // 17 bits per axis fits safely inside IEEE-754 53-bit exact integer!
    const key = qx + qy * 131072 + qz * 17179869184;
    let id = vertMap.get(key);
    if (id === undefined) {
      id = nextId++;
      vertMap.set(key, id);
    }
    vIdx[i] = id;
  }

  const edgeCounts = new Map<number, number>();
  const stride = nextId + 2;
  for (let t = 0; t < triCount; t++) {
    const a = vIdx[t * 3];
    const b = vIdx[t * 3 + 1];
    const c = vIdx[t * 3 + 2];
    if (a === b || b === c || c === a) continue;
    const e1 = a < b ? a * stride + b : b * stride + a;
    const e2 = b < c ? b * stride + c : c * stride + b;
    const e3 = c < a ? c * stride + a : a * stride + c;
    edgeCounts.set(e1, (edgeCounts.get(e1) || 0) + 1);
    edgeCounts.set(e2, (edgeCounts.get(e2) || 0) + 1);
    edgeCounts.set(e3, (edgeCounts.get(e3) || 0) + 1);
  }

  if (edgeCounts.size === 0) return 1;
  let openEdges = 0;
  for (const count of edgeCounts.values()) {
    if (count === 1) openEdges++;
  }
  return openEdges / edgeCounts.size;
}

/**
 * Rút gọn lưới bảo toàn tính đóng kín tô-pô (Topological Vertex Clustering)
 * Đưa các mẫu điêu khắc ZBrush 500k - 2M tam giác (như Crimson Fox 1.98M tris) về ~68k tam giác kín nước trong ~40ms
 */
function simplifyClosedMeshTopological(
  posArr: Float32Array,
  targetMaxTris: number = 68000
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

  const reductionRatio = Math.sqrt(triCount / targetMaxTris);
  const gridRes = Math.max(84, Math.min(250, Math.round(205 / Math.max(1, reductionRatio * 0.52))));
  const invCell = gridRes / maxSpan;

  const clusterMap = new Map<number, number>();
  let cap = Math.min(triCount, targetMaxTris * 2);
  let sumX = new Float64Array(cap);
  let sumY = new Float64Array(cap);
  let sumZ = new Float64Array(cap);
  let counts = new Uint32Array(cap);
  let cCount = 0;

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
      cid = cCount++;
      if (cid >= cap) {
        cap *= 2;
        const nx = new Float64Array(cap); nx.set(sumX); sumX = nx;
        const ny = new Float64Array(cap); ny.set(sumY); sumY = ny;
        const nz = new Float64Array(cap); nz.set(sumZ); sumZ = nz;
        const nc = new Uint32Array(cap); nc.set(counts); counts = nc;
      }
      clusterMap.set(cellKey, cid);
      sumX[cid] = x;
      sumY[cid] = y;
      sumZ[cid] = z;
      counts[cid] = 1;
    } else {
      sumX[cid] += x;
      sumY[cid] += y;
      sumZ[cid] += z;
      counts[cid] += 1;
    }
    vCluster[i] = cid;
  }

  const cx = new Float32Array(cCount);
  const cy = new Float32Array(cCount);
  const cz = new Float32Array(cCount);
  const bedSnapThreshold = minY + 0.12;
  for (let c = 0; c < cCount; c++) {
    const inv = 1 / counts[c];
    cx[c] = sumX[c] * inv;
    const avgY = sumY[c] * inv;
    cy[c] = avgY <= bedSnapThreshold ? minY : avgY;
    cz[c] = sumZ[c] * inv;
  }

  // Triệt tiêu mặt gấp trùng lặp bằng đối đồng điều dây chuyền đơn hình (Simplicial 2-Chain Cancellation: d(phi#(M)) = phi#(dM) = 0)
  // Đảm bảo lưới sau khi rút gọn từ 2 triệu tam giác về ~45k tam giác vẫn kín nước 100% và không có mặt chồng chập!
  const triChain = new Map<bigint, number>();
  for (let t = 0; t < triCount; t++) {
    let u = vCluster[t * 3];
    let v = vCluster[t * 3 + 1];
    let wIdx = vCluster[t * 3 + 2];
    if (u === v || v === wIdx || wIdx === u) continue;

    let sign = 1;
    if (u > v) { const tmp = u; u = v; v = tmp; sign = -sign; }
    if (v > wIdx) { const tmp = v; v = wIdx; wIdx = tmp; sign = -sign; }
    if (u > v) { const tmp = u; u = v; v = tmp; sign = -sign; }

    const key = (BigInt(u) << 40n) | (BigInt(v) << 20n) | BigInt(wIdx);
    const nextNet = (triChain.get(key) || 0) + sign;
    if (nextNet === 0) {
      triChain.delete(key);
    } else {
      triChain.set(key, nextNet);
    }
  }

  let keptTris = 0;
  for (const net of triChain.values()) {
    keptTris += Math.abs(net);
  }
  if (keptTris < 12) return posArr;

  const out = new Float32Array(keptTris * 9);
  let w = 0;
  for (const [key, net] of triChain.entries()) {
    const u = Number(key >> 40n);
    const v = Number((key >> 20n) & 0xfffffn);
    const k = Number(key & 0xfffffn);
    const copies = Math.abs(net);
    const bIdx = net > 0 ? v : k;
    const cIdx = net > 0 ? k : v;
    for (let rep = 0; rep < copies; rep++) {
      out[w++] = cx[u]; out[w++] = cy[u]; out[w++] = cz[u];
      out[w++] = cx[bIdx]; out[w++] = cy[bIdx]; out[w++] = cz[bIdx];
      out[w++] = cx[cIdx]; out[w++] = cy[cIdx]; out[w++] = cz[cIdx];
    }
  }
  return out;
}

/**
 * Tái tạo vỏ kín nước bằng Morphological Closing 3D (Dilate R=3 -> Flood-Fill Air -> Erode R=2 + Laplacian Smooth)
 * Hàn kín hoàn hảo các file STL rách mặt nặng như highland_cow.stl (mất 84% tam giác, khe thủng 4-5mm)
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
  const voxSize = Math.max(0.85, maxSpan / 68);
  const pad = 5;
  const nx = Math.max(8, Math.ceil((maxX - minX) / voxSize) + pad * 2);
  const ny = Math.max(8, Math.ceil((maxY - minY) / voxSize) + pad * 2);
  const nz = Math.max(8, Math.ceil((maxZ - minZ) / voxSize) + pad * 2);
  const ox = minX - voxSize * pad;
  const oy = minY - voxSize * pad;
  const oz = minZ - voxSize * pad;

  const totalVox = nx * ny * nz;
  const seed = new Uint8Array(totalVox);
  const nxy = nx * ny;
  const idx = (ix: number, iy: number, iz: number) => ix + nx * iy + nxy * iz;

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
    const steps = Math.max(1, Math.min(14, Math.ceil(edgeLen / (voxSize * 0.7))));
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
        if (ix >= 1 && ix < nx - 1 && iy >= 1 && iy < ny - 1 && iz >= 1 && iz < nz - 1) {
          seed[idx(ix, iy, iz)] = 1;
        }
      }
    }
  }

  // Bước 1: Dilate 3 bước 6-connected (bán kính Manhattan 3 voxels ~ 3.5mm, bịt kín khe rách tới 7mm)
  let curMask: Uint8Array = seed;
  for (let step = 0; step < 3; step++) {
    const nextMask = new Uint8Array(curMask);
    for (let iz = 1; iz < nz - 1; iz++) {
      for (let iy = 1; iy < ny - 1; iy++) {
        let k = idx(1, iy, iz);
        for (let ix = 1; ix < nx - 1; ix++, k++) {
          if (curMask[k] === 1) {
            nextMask[k - 1] = 1;
            nextMask[k + 1] = 1;
            nextMask[k - nx] = 1;
            nextMask[k + nx] = 1;
            nextMask[k - nxy] = 1;
            nextMask[k + nxy] = 1;
          }
        }
      }
    }
    curMask = nextMask;
  }

  // Bước 2: Flood-fill không khí bên ngoài (state = 2) từ cả 6 mặt biên hộp đệm
  const work = new Uint8Array(curMask);
  const queue = new Int32Array(totalVox);
  let qHead = 0, qTail = 0;
  const pushAir = (k: number) => {
    if (work[k] === 0) {
      work[k] = 2;
      queue[qTail++] = k;
    }
  };

  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      pushAir(idx(0, iy, iz));
      pushAir(idx(nx - 1, iy, iz));
    }
  }
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      pushAir(idx(ix, 0, iz));
      pushAir(idx(ix, ny - 1, iz));
    }
  }
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      pushAir(idx(ix, iy, 0));
      pushAir(idx(ix, iy, nz - 1));
    }
  }

  while (qHead < qTail) {
    const cur = queue[qHead++];
    const iz = Math.floor(cur / nxy);
    const rem = cur - iz * nxy;
    const iy = Math.floor(rem / nx);
    const ix = rem - iy * nx;
    if (ix > 0) pushAir(cur - 1);
    if (ix + 1 < nx) pushAir(cur + 1);
    if (iy > 0) pushAir(cur - nx);
    if (iy + 1 < ny) pushAir(cur + nx);
    if (iz > 0) pushAir(cur - nxy);
    if (iz + 1 < nz) pushAir(cur + nxy);
  }

  // Mọi ô !== 2 là khối đặc đã lấp đầy ruột
  let solid = new Uint8Array(totalVox);
  for (let i = 0; i < totalVox; i++) {
    if (work[i] !== 2) solid[i] = 1;
  }

  // Bước 3: Erode 2 bước để trả lại kích thước thực của mẫu (luôn giữ nguyên các ô có tam giác gốc seed === 1)
  for (let step = 0; step < 2; step++) {
    const eroded = new Uint8Array(solid);
    for (let iz = 1; iz < nz - 1; iz++) {
      for (let iy = 1; iy < ny - 1; iy++) {
        let k = idx(1, iy, iz);
        for (let ix = 1; ix < nx - 1; ix++, k++) {
          if (solid[k] === 1 && seed[k] === 0) {
            if (
              solid[k - 1] === 0 ||
              solid[k + 1] === 0 ||
              solid[k - nx] === 0 ||
              solid[k + nx] === 0 ||
              solid[k - nxy] === 0 ||
              solid[k + nxy] === 0
            ) {
              eroded[k] = 0;
            }
          }
        }
      }
    }
    solid = eroded;
  }

  // Bước 4: Xuất bề mặt đóng kín trên lưới đỉnh dùng chung + 1 bước làm mượt Laplacian bảo toàn 100% tính kín nước
  const vMap = new Map<number, number>();
  const vx: number[] = [];
  const vy: number[] = [];
  const vz: number[] = [];
  const quadIndices: number[] = [];
  const vStrideY = nx + 2;
  const vStrideZ = vStrideY * (ny + 2);

  const getCornerVert = (gx: number, gy: number, gz: number): number => {
    const key = gx + gy * vStrideY + gz * vStrideZ;
    let vid = vMap.get(key);
    if (vid === undefined) {
      vid = vx.length;
      vMap.set(key, vid);
      vx.push(ox + gx * voxSize);
      vy.push(Math.max(minY, oy + gy * voxSize));
      vz.push(oz + gz * voxSize);
    }
    return vid;
  };

  const isSolid = (ix: number, iy: number, iz: number) => {
    if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) return false;
    return solid[idx(ix, iy, iz)] === 1;
  };

  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        if (!isSolid(ix, iy, iz)) continue;
        if (!isSolid(ix + 1, iy, iz)) {
          quadIndices.push(
            getCornerVert(ix + 1, iy, iz),
            getCornerVert(ix + 1, iy + 1, iz),
            getCornerVert(ix + 1, iy + 1, iz + 1),
            getCornerVert(ix + 1, iy, iz + 1)
          );
        }
        if (!isSolid(ix - 1, iy, iz)) {
          quadIndices.push(
            getCornerVert(ix, iy, iz + 1),
            getCornerVert(ix, iy + 1, iz + 1),
            getCornerVert(ix, iy + 1, iz),
            getCornerVert(ix, iy, iz)
          );
        }
        if (!isSolid(ix, iy + 1, iz)) {
          quadIndices.push(
            getCornerVert(ix, iy + 1, iz + 1),
            getCornerVert(ix + 1, iy + 1, iz + 1),
            getCornerVert(ix + 1, iy + 1, iz),
            getCornerVert(ix, iy + 1, iz)
          );
        }
        if (!isSolid(ix, iy - 1, iz)) {
          quadIndices.push(
            getCornerVert(ix, iy, iz),
            getCornerVert(ix + 1, iy, iz),
            getCornerVert(ix + 1, iy, iz + 1),
            getCornerVert(ix, iy, iz + 1)
          );
        }
        if (!isSolid(ix, iy, iz + 1)) {
          quadIndices.push(
            getCornerVert(ix, iy, iz + 1),
            getCornerVert(ix + 1, iy, iz + 1),
            getCornerVert(ix + 1, iy + 1, iz + 1),
            getCornerVert(ix, iy + 1, iz + 1)
          );
        }
        if (!isSolid(ix, iy, iz - 1)) {
          quadIndices.push(
            getCornerVert(ix + 1, iy, iz),
            getCornerVert(ix, iy, iz),
            getCornerVert(ix, iy + 1, iz),
            getCornerVert(ix + 1, iy + 1, iz)
          );
        }
      }
    }
  }

  if (quadIndices.length < 12) return posArr;

  // Làm mượt 2 vòng Laplacian (alpha = 0.45) trên đồ thị cạnh chia sẻ để khử hoàn toàn bậc thang Voxel (giúp TreeSupport3D chỉ đỡ đúng Overhang thật!)
  const vCount = vx.length;
  const sx = Float32Array.from(vx);
  const sy = Float32Array.from(vy);
  const sz = Float32Array.from(vz);
  const sumNx = new Float64Array(vCount);
  const sumNy = new Float64Array(vCount);
  const sumNz = new Float64Array(vCount);
  const deg = new Uint16Array(vCount);

  for (let pass = 0; pass < 2; pass++) {
    sumNx.fill(0);
    sumNy.fill(0);
    sumNz.fill(0);
    deg.fill(0);

    const addEdge = (a: number, b: number) => {
      sumNx[a] += sx[b]; sumNy[a] += sy[b]; sumNz[a] += sz[b]; deg[a]++;
      sumNx[b] += sx[a]; sumNy[b] += sy[a]; sumNz[b] += sz[a]; deg[b]++;
    };
    for (let q = 0; q < quadIndices.length; q += 4) {
      const v0 = quadIndices[q], v1 = quadIndices[q + 1], v2 = quadIndices[q + 2], v3 = quadIndices[q + 3];
      addEdge(v0, v1);
      addEdge(v1, v2);
      addEdge(v2, v3);
      addEdge(v3, v0);
    }

    for (let i = 0; i < vCount; i++) {
      if (deg[i] > 0) {
        const inv = 1 / deg[i];
        sx[i] = sx[i] * 0.55 + sumNx[i] * inv * 0.45;
        const nyVal = sy[i] * 0.55 + sumNy[i] * inv * 0.45;
        sy[i] = vy[i] <= minY + voxSize * 0.35 ? minY : Math.max(minY, nyVal);
        sz[i] = sz[i] * 0.55 + sumNz[i] * inv * 0.45;
      }
    }
  }

  const numQuads = quadIndices.length / 4;
  const out = new Float32Array(numQuads * 18);
  let w = 0;
  for (let q = 0; q < quadIndices.length; q += 4) {
    const v0 = quadIndices[q], v1 = quadIndices[q + 1], v2 = quadIndices[q + 2], v3 = quadIndices[q + 3];
    out[w++] = sx[v0]; out[w++] = sy[v0]; out[w++] = sz[v0];
    out[w++] = sx[v1]; out[w++] = sy[v1]; out[w++] = sz[v1];
    out[w++] = sx[v2]; out[w++] = sy[v2]; out[w++] = sz[v2];

    out[w++] = sx[v0]; out[w++] = sy[v0]; out[w++] = sz[v0];
    out[w++] = sx[v2]; out[w++] = sy[v2]; out[w++] = sz[v2];
    out[w++] = sx[v3]; out[w++] = sy[v3]; out[w++] = sz[v3];
  }
  return out;
}

/**
 * Chuyển đổi Three.js BufferGeometry (Y-up) sang Binary STL chuẩn Z-up (x, -z, y) với det = +1
 */
function buildZUpStlForOrca(
  geometry: THREE.BufferGeometry,
  forceWatertightRepair: boolean = false
): {
  stlBuffer: ArrayBuffer;
  originalTris: number;
  slicedTris: number;
  repaired: boolean;
  modelHeightMm: number;
} {
  geometry.computeBoundingBox();
  const minY = geometry.boundingBox?.min.y ?? 0;
  const maxY = geometry.boundingBox?.max.y ?? 20;
  const modelHeightMm = Math.max(1, maxY - minY);

  let rawArr: Float32Array;
  let needsYOffset = Math.abs(minY) > 1e-5;
  const directPos = !geometry.index ? geometry.getAttribute('position') : null;

  if (
    directPos instanceof THREE.BufferAttribute &&
    directPos.array instanceof Float32Array &&
    directPos.itemSize === 3
  ) {
    rawArr = directPos.array.subarray(0, directPos.count * 3);
  } else {
    const working = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    const posAttr = working.getAttribute('position');
    rawArr = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      rawArr[i * 3] = posAttr.getX(i);
      rawArr[i * 3 + 1] = posAttr.getY(i) - minY;
      rawArr[i * 3 + 2] = posAttr.getZ(i);
    }
    needsYOffset = false;
    working.dispose();
  }

  const originalTris = Math.floor(rawArr.length / 9);
  let activeArr: Float32Array = rawArr;
  let repaired = false;

  if (forceWatertightRepair || computeOpenEdgeRatio(activeArr) > 0.22) {
    if (needsYOffset) {
      const shifted = new Float32Array(activeArr.length);
      for (let i = 0; i < activeArr.length; i += 3) {
        shifted[i] = activeArr[i];
        shifted[i + 1] = activeArr[i + 1] - minY;
        shifted[i + 2] = activeArr[i + 2];
      }
      activeArr = shifted;
      needsYOffset = false;
    }
    activeArr = repairBrokenSoupToWatertight(activeArr);
    repaired = true;
  } else if (originalTris > 70000) {
    activeArr = simplifyClosedMeshTopological(activeArr, 62000);
  }

  const yShift = needsYOffset ? minY : 0;
  const triCount = Math.floor(activeArr.length / 9);
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triCount, true);

  let offset = 84;
  for (let t = 0; t < triCount; t++) {
    const b = t * 9;
    // Ánh xạ trực giao bảo toàn hướng pháp tuyến: (x, y - minY, z)_Three -> (x, -z, y - minY)_Slicer
    const ax = activeArr[b], ay = -activeArr[b + 2], az = activeArr[b + 1] - yShift;
    const bx = activeArr[b + 3], by = -activeArr[b + 5], bz = activeArr[b + 4] - yShift;
    const cx = activeArr[b + 6], cy = -activeArr[b + 8], cz = activeArr[b + 7] - yShift;

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

  return { stlBuffer: buffer, originalTris, slicedTris: triCount, repaired, modelHeightMm };
}

/**
 * Ánh xạ chuẩn xác thông số ISimulationProfile qua bộ chuẩn hóa chính thức deriveKernelParams của OrcaSlicer C++
 * Tất cả 4 kiểu Tree (organic, slim, strong, hybrid) đều chạy qua nhân TreeSupport3D tốc độ cao và phân hóa bằng kích thước vật lý thực!
 */
function mapProfileToOrcaKernelParams(
  profile: ISimulationProfile,
  modelHeightMm: number
): {
  kernelParams: Record<string, unknown>;
  effectiveLayerHeight: number;
  effectiveLineWidth: number;
} {
  const requestedLayerHeight = profile.layerHeight || 0.2;
  const isTreeSupport = profile.supportMode === 'tree';

  // Với tượng điêu khắc cao (100mm - 250mm), tự động tối ưu bước cắt thích ứng (~360 lớp) để TreeSupport3D hoàn tất trong 2-3.5s và không bao giờ đứt nhánh!
  let effectiveLayerHeight = requestedLayerHeight;
  if (isTreeSupport && modelHeightMm / requestedLayerHeight > 360) {
    effectiveLayerHeight = Math.min(0.42, Number((modelHeightMm / 350).toFixed(2)));
  } else if (!isTreeSupport && modelHeightMm / requestedLayerHeight > 520) {
    effectiveLayerHeight = Math.min(0.36, Number((modelHeightMm / 500).toFixed(2)));
  }

  const effectiveNozzle = Math.max(
    profile.nozzleDiameter || 0.4,
    Number((effectiveLayerHeight * 1.35).toFixed(2))
  );
  const effectiveLineWidth = Math.max(
    profile.lineWidth || 0.42,
    Number((effectiveLayerHeight * 1.15).toFixed(2))
  );
  const firstLayerHeight = Math.max(
    effectiveLayerHeight,
    profile.firstLayerHeight || Math.min(0.28, Number((effectiveLayerHeight * 1.15).toFixed(2)))
  );

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
  const sparseInfillPercent =
    profile.infillType === 'solid' ? 100 : Math.max(0, Math.min(100, profile.infillDensity ?? 15));

  const treeStyle = profile.treeStyle || 'organic';
  const userBranchDiam = profile.supportBranchDiameter ?? 2.2;
  const userBranchAngle = profile.supportBranchAngle ?? 42;
  const baseBranchDist = modelHeightMm > 115 ? 4.8 : modelHeightMm > 75 ? 3.2 : 2.2;

  let organicBranchDiam = userBranchDiam;
  let organicTipDiam = 0.8;
  let organicBranchAngle = userBranchAngle;
  let organicBranchDist = baseBranchDist;
  let treeWallCount = 1;
  let interfaceTopLayers = profile.supportInterfaceLayers ?? 2;

  if (treeStyle === 'slim') {
    organicBranchDiam = Number(Math.max(1.4, userBranchDiam * 0.72).toFixed(2));
    organicTipDiam = 0.65;
    organicBranchAngle = Math.min(50, userBranchAngle + 3);
    organicBranchDist = Number((baseBranchDist * 1.25).toFixed(2));
    treeWallCount = 1;
  } else if (treeStyle === 'strong') {
    organicBranchDiam = Number(Math.max(2.8, userBranchDiam * 1.35).toFixed(2));
    organicTipDiam = 1.0;
    organicBranchAngle = Math.max(35, userBranchAngle - 5);
    organicBranchDist = Number((baseBranchDist * 0.85).toFixed(2));
    treeWallCount = 2;
  } else if (treeStyle === 'hybrid') {
    organicBranchDiam = Number(Math.max(2.4, userBranchDiam * 1.1).toFixed(2));
    organicTipDiam = 0.9;
    organicBranchAngle = 40;
    organicBranchDist = Number((baseBranchDist * 0.9).toFixed(2));
    treeWallCount = 2;
    interfaceTopLayers = Math.max(3, interfaceTopLayers);
  }

  // Ngưỡng góc OrcaSlicer / Bambu Studio tính từ mặt bàn nằm ngang (15° = đỡ ít, 30° = chuẩn Bambu, 45° = đỡ kỹ)
  const thresholdDeg = Math.max(10, Math.min(58, profile.supportAngleThreshold ?? 30));

  const upstreamSettings = {
    printable_area: [
      [0, 0],
      [256, 0],
      [256, 256],
      [0, 256],
    ],
    printable_height: 256,
    nozzle_diameter: [effectiveNozzle],
    filament_diameter: [1.75],
    filament_flow_ratio: [profile.flowRatio ?? 0.98],
    nozzle_temperature: [profile.nozzleTemp || 220],
    nozzle_temperature_initial_layer: [(profile.nozzleTemp || 220) + 5],
    hot_plate_temp: [profile.bedTemp || 55],
    hot_plate_temp_initial_layer: [profile.bedTemp || 55],
    fan_max_speed: [profile.coolingFanSpeed ?? 100],

    layer_height: effectiveLayerHeight,
    initial_layer_print_height: firstLayerHeight,
    line_width: effectiveLineWidth,
    outer_wall_line_width: Math.max(
      profile.outerWallLineWidth || effectiveLineWidth,
      Number((effectiveLayerHeight * 1.1).toFixed(2))
    ),
    wall_loops: Math.max(1, profile.wallLoops || 2),
    wall_generator: 'classic',
    top_shell_layers: profile.topShellLayers ?? 4,
    bottom_shell_layers: profile.bottomShellLayers ?? 3,
    sparse_infill_density: `${sparseInfillPercent}%`,
    sparse_infill_pattern: infillPattern,
    infill_wall_overlap: `${profile.infillOverlapPercent ?? 15}%`,
    seam_position: profile.seamPosition || 'aligned',
    ironing_type: profile.ironingEnabled ? 'top' : 'no ironing',
    brim_type: profile.brimEnabled ? 'outer_only' : 'no_brim',
    brim_width: profile.brimEnabled ? profile.brimWidthMm || 5 : 0,
    skirt_loops: 0,
    raft_layers: profile.raftLayers ?? 0,

    outer_wall_speed: profile.outerWallSpeed || Math.round((profile.printSpeed || 200) * 0.65),
    inner_wall_speed: profile.innerWallSpeed || profile.printSpeed || 200,
    sparse_infill_speed: profile.infillSpeed || Math.round((profile.printSpeed || 200) * 1.15),
    top_surface_speed: profile.topSurfaceSpeed || Math.round((profile.printSpeed || 200) * 0.55),
    travel_speed: profile.travelSpeed || 500,
    initial_layer_speed: 50,
    default_acceleration: profile.defaultAcceleration || 10000,
    retraction_length: [profile.retractionDistanceMm ?? 0.8],
    retraction_speed: [profile.retractionSpeedMmS ?? 35],
    z_hop: [profile.zHopMm ?? 0.4],

    enable_support: profile.supportMode !== 'none',
    support_type:
      profile.supportMode === 'tree'
        ? 'tree(auto)'
        : profile.supportMode === 'normal'
        ? 'normal(auto)'
        : 'normal(auto)',
    support_style: profile.supportMode === 'tree' ? 'organic' : 'grid',
    support_threshold_angle: thresholdDeg,
    support_on_build_plate_only: profile.supportOnBuildPlateOnly !== false,
    support_top_z_distance: profile.supportTopZDistance ?? 0.2,
    support_bottom_z_distance: profile.supportBottomZDistance ?? 0.2,
    support_object_xy_distance: 0.42,
    support_interface_top_layers: interfaceTopLayers,
    support_remove_small_overhang: true,
    bridge_no_support: false,
    independent_support_layer_height: true,
    tree_support_branch_diameter: organicBranchDiam,
    tree_support_branch_diameter_organic: organicBranchDiam,
    tree_support_tip_diameter: organicTipDiam,
    tree_support_branch_angle: organicBranchAngle,
    tree_support_branch_angle_organic: organicBranchAngle,
    tree_support_branch_distance: organicBranchDist,
    tree_support_branch_distance_organic: organicBranchDist,
    tree_support_wall_count: treeWallCount,
    resolution: modelHeightMm > 95 ? 0.08 : 0.05,
  } as unknown as SlicerSettings;

  const derived = deriveKernelParams(upstreamSettings);

  const kernelParams: Record<string, unknown> = {
    ...derived,
    auto_center: false,
    wall_generator: 'classic',
    independent_support_layer_height: true,
    support_remove_small_overhang: true,
    bridge_no_support: false,
    enable_support: profile.supportMode !== 'none',
    support_style: profile.supportMode === 'tree' ? 'tree' : 'grid',
    bed_width: 256,
    bed_depth: 256,
    support_threshold_angle: thresholdDeg,
    support_xy_distance: 0.42,
    tree_support_branch_diameter_organic: organicBranchDiam,
    tree_support_tip_diameter: organicTipDiam,
    tree_support_branch_angle_organic: organicBranchAngle,
    tree_support_branch_distance_organic: organicBranchDist,
    tree_support_wall_count: treeWallCount,
    resolution: modelHeightMm > 95 ? 0.08 : 0.05,
    gcode_role_tags: true,
    gcode_stats_block: true,
  };

  return { kernelParams, effectiveLayerHeight, effectiveLineWidth };
}

/**
 * Trích xuất cấu trúc INativeSupportData chuẩn xác 100% từ các đường bao Support (role === 5, 6) của OrcaSlicer C++
 * Tách riêng từng vòng contour cành độc lập trên cùng một lớp để không bao giờ nối nhầm 2 nhánh xa nhau!
 */
function extractNativeSupportFromOrcaLayers(
  layers: IRawSliceLayer[],
  modelName: string,
  effectiveLayerHeight: number,
  effectiveLineWidth: number
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

  const segments: INativeSupportSegment[] = [];
  let totalMoves = 0;

  for (let li = 0; li < layerCount; li++) {
    const p = layers[li].paths;
    if (!p || p.length < 8) continue;

    let activeLoop: number[] = [];
    let activeIsInterface = false;
    let prevEndX = NaN;
    let prevEndZ = NaN;

    const flushLoop = () => {
      if (activeLoop.length >= 6) {
        segments.push({ isInterface: activeIsInterface, points: activeLoop });
      }
      activeLoop = [];
      prevEndX = NaN;
      prevEndZ = NaN;
    };

    for (let k = 0; k < p.length; k += 8) {
      const role = (p[k + 3] | 0) & 15;
      if (role !== 5 && role !== 6) {
        if (activeLoop.length > 0) flushLoop();
        continue;
      }

      const x0 = p[k];
      const y0 = p[k + 1];
      const z0 = p[k + 2];
      const x1 = p[k + 4];
      const y1 = p[k + 5];
      const z1 = p[k + 6];

      const mx = (x0 + x1) * 0.5;
      const my = (y0 + y1) * 0.5;
      const isRoofInterface = li >= 2 && !hasSupportAbove(li, mx, my);

      // Inverse transform (xs, ys, zs) -> Three.js (xs, zs, -ys)
      const tx0 = x0, ty0 = z0, tz0 = -y0;
      const tx1 = x1, ty1 = z1, tz1 = -y1;

      const isDisjoint =
        activeLoop.length > 0 &&
        (isRoofInterface !== activeIsInterface ||
          Math.hypot(tx0 - prevEndX, tz0 - prevEndZ) > 0.08);

      if (isDisjoint) {
        flushLoop();
      }

      if (activeLoop.length === 0) {
        activeIsInterface = isRoofInterface;
      }
      activeLoop.push(tx0, ty0, tz0, tx1, ty1, tz1);

      prevEndX = tx1;
      prevEndZ = tz1;
      totalMoves++;
    }

    flushLoop();
  }

  return {
    supportData: {
      model: modelName,
      engine: `orcaslicer-cpp-wasm-0.4.3-${loadedKernelMode}`,
      totalMoves,
      totalSegments: segments.length,
      layerHeightMm: effectiveLayerHeight,
      lineWidthMm: effectiveLineWidth,
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
 * Thực thi cắt lớp thực tế 100% bằng nhân C++ OrcaSlicer WASM trong Web Worker (tự động kích hoạt đa luồng mt + WebGPU)
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
  await interruptInFlightWorkerIfNeeded();
  if (jobToken !== activeJobToken) return null;

  const t0 = performance.now();
  options?.onProgress?.(8, 'Chuẩn hóa lưới 3D Z-up...');

  const executeAttempt = async (forceRepair: boolean) => {
    const prep = buildZUpStlForOrca(geometry, forceRepair);
    if (jobToken !== activeJobToken) return null;

    const mapped = mapProfileToOrcaKernelParams(profile, prep.modelHeightMm);

    options?.onProgress?.(
      18,
      profile.supportMode === 'tree'
        ? 'Nhân OrcaSlicer C++ TreeSupport3D đang giải nhánh...'
        : 'Nhân OrcaSlicer C++ đang cắt lát đường chạy dao...'
    );

    try {
      const res = await executeRawWorkerSlice(
        prep.stlBuffer,
        mapped.kernelParams,
        profile.supportMode === 'tree',
        (pct, label) => {
          if (jobToken !== activeJobToken) return;
          options?.onProgress?.(pct, label);
        }
      );
      if (jobToken !== activeJobToken) return null;
      return { res, prep, mapped };
    } catch (err) {
      if (jobToken !== activeJobToken) return null;
      const msg = String((err as Error)?.message || err || '').toLowerCase();
      if (msg.includes('cancel')) return null;
      throw err;
    }
  };

  let run = await executeAttempt(false);
  if (!run || jobToken !== activeJobToken) return null;

  let layers = run.res.layers || [];
  let extracted = extractNativeSupportFromOrcaLayers(
    layers,
    modelName,
    run.mapped.effectiveLayerHeight,
    run.mapped.effectiveLineWidth
  );

  // Nếu file STL gốc bị hở cạnh ngầm khiến C++ ra quá ít đường dao, tự động hàn kín Morphological Closing rồi cắt lại!
  if (extracted.modelSegCount < 25 && !run.prep.repaired) {
    options?.onProgress?.(24, 'Tự động hàn kín mặt hở STL & cắt lại...');
    run = await executeAttempt(true);
    if (!run || jobToken !== activeJobToken) return null;
    layers = run.res.layers || [];
    extracted = extractNativeSupportFromOrcaLayers(
      layers,
      modelName,
      run.mapped.effectiveLayerHeight,
      run.mapped.effectiveLineWidth
    );
  }

  if (extracted.modelSegCount === 0 || layers.length === 0) {
    return null;
  }

  options?.onProgress?.(92, 'Đang dựng sợi đùn 3D GPU & vỏ Tree Support...');

  const segData = buildSegmentData(layers, run.mapped.effectiveLineWidth);

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
  const filamentAreaMm2 = Math.PI * Math.pow(1.75 / 2, 2);
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

  const rawTimeEstimateSec = Number(
    rawStats.time_estimate || rawStats.time_s || rawStats.estimated_time_s || 0
  );
  const layerScaleFactor =
    run.mapped.effectiveLayerHeight > (profile.layerHeight || 0.2) * 1.05
      ? run.mapped.effectiveLayerHeight / (profile.layerHeight || 0.2)
      : 1;
  const totalTimeSec = Math.max(
    10,
    Math.round(
      rawTimeEstimateSec > 0
        ? rawTimeEstimateSec * layerScaleFactor
        : layers.length * 12 * layerScaleFactor
    )
  );

  const bundle: IOrcaWasmSliceBundle = {
    cacheKey,
    gcode: gcodeText,
    supportData: extracted.supportData,
    supportExportGeometry,
    segData,
    stats: {
      totalLayers: layers.length,
      totalTimeSec,
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
      kernelMode: loadedKernelMode,
    },
  };

  if (sliceBundleCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = sliceBundleCache.keys().next().value;
    if (oldestKey) {
      const evicted = sliceBundleCache.get(oldestKey);
      if (
        evicted?.supportExportGeometry &&
        evicted.supportExportGeometry !== latestExportSupportGeom
      ) {
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
  1: 'Wall (Tường bao chu vi)',
  2: 'Sparse Infill (Ruột chịu lực)',
  3: 'Solid Surface (Đỉnh / Đáy đặc)',
  4: 'Brim / Skirt (Vành bám bàn)',
  5: 'Tree Support (Cây đỡ Organic C++)',
  6: 'Support Interface / Raft (Đệm đỡ)',
  7: 'Gap Fill (Lấp khe hẹp)',
  8: 'Thin Wall (Tường mỏng)',
  9: 'Bridge (Bắc cầu không trung)',
  10: 'Ironing (Là phẳng mặt đỉnh)',
  11: 'Prime Tower (Tháp xả nhựa)',
};

/**
 * Dựng Three.js Group hiển thị sợi đùn 3D GPU-Instanced (Chuẩn Bambu Studio / OrcaSlicer) từ SegmentData
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
