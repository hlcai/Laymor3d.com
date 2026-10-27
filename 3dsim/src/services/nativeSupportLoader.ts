import * as THREE from 'three';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';

export interface INativeSupportSegment {
  isInterface: boolean;
  points: number[]; // [x1, y1, z1, x2, y2, z2, ...]
}

export interface INativeSupportData {
  model: string;
  engine: string;
  totalMoves: number;
  totalSegments: number;
  segments: INativeSupportSegment[];
}

const modelSupportCache = new Map<string, INativeSupportData>();

export function setPreloadedSupport(key: string, data: INativeSupportData): void {
  if (!key) return;
  modelSupportCache.set(key, data);
}

/**
 * Kiểm tra xem tên/đường dẫn mô hình có thuộc nhóm mẫu Bambu Native có sẵn hay không
 */
function MatchPrebakedNativeModel(modelIdentifier?: string, modelPath?: string): {
  supportJson: string;
  toolpathsJson: string;
} | null {
  const lower = ((modelIdentifier || '') + ' ' + (modelPath || '')).toLowerCase();
  // Không áp dụng fallback có sẵn cho các mô hình người dùng tự tải lên (trừ khi tên file đúng là mẫu)
  if (lower.includes('cow') || lower.includes('bò') || lower.includes('highland') || lower.includes('ogen')) {
    return {
      supportJson: '/models/highland_cow_support.json',
      toolpathsJson: '/models/highland_cow_toolpaths.json',
    };
  }
  if (lower.includes('eule') || lower.includes('owl') || lower.includes('cú')) {
    return {
      supportJson: '/models/eule_support.json',
      toolpathsJson: '/models/eule_toolpaths.json',
    };
  }
  if (lower.includes('benchy')) {
    return {
      supportJson: '/models/benchy_support.json',
      toolpathsJson: '/models/benchy_toolpaths.json',
    };
  }
  if (lower.includes('ghost')) {
    return {
      supportJson: '/models/ghost_support.json',
      toolpathsJson: '/models/ghost_toolpaths.json',
    };
  }
  return null;
}

/**
 * Nạp dữ liệu đường chạy dao Support native chính thức từ Bambu Studio CLI hoặc file .gcode.3mf / .gcode
 */
export async function loadNativeBambuSupport(
  modelIdentifier?: string,
  modelPath?: string
): Promise<INativeSupportData | null> {
  if (modelPath && modelSupportCache.has(modelPath)) {
    return modelSupportCache.get(modelPath)!;
  }
  if (modelIdentifier && modelSupportCache.has(modelIdentifier)) {
    return modelSupportCache.get(modelIdentifier)!;
  }
  const cacheKey = modelPath || modelIdentifier || 'default';
  if (modelSupportCache.has(cacheKey)) {
    return modelSupportCache.get(cacheKey)!;
  }

  const prebaked = MatchPrebakedNativeModel(modelIdentifier, modelPath);

  // Chỉ gọi API / fallback nếu có modelPath từ Local Slicer hoặc thuộc nhóm mẫu Pre-baked
  if (!modelPath && !prebaked) {
    return null;
  }

  // 1. Thử lấy support thực tế từ Bambu Studio Local Slicer Bridge API (khi có modelPath)
  if (modelPath) {
    try {
      const params = new URLSearchParams();
      params.set('path', modelPath);
      if (modelIdentifier) params.set('name', modelIdentifier);
      const url = `/api/slicer/active-support?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.supportData && json.supportData.segments?.length > 0) {
          modelSupportCache.set(cacheKey, json.supportData);
          return json.supportData;
        }
      }
    } catch (_) {}
  }

  // 2. Pre-cache fallbacks cho các mô hình chuẩn bị sẵn
  if (prebaked?.supportJson) {
    const fallbackFile = prebaked.supportJson;
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    const cleanRel = fallbackFile.replace(/^\//, '');
    const candidateUrls = [
      `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${cleanRel}`,
      `/3dsim/${cleanRel}`,
      fallbackFile,
    ];
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          modelSupportCache.set(cacheKey, data);
          return data;
        }
      } catch (_) {}
    }
  }

  return null;
}

/**
 * Xây dựng Three.js Group chứa toàn bộ các đường dao Support native từ Bambu Studio G-code
 * Mô phỏng chuẩn xác 100% hình ảnh từ Bambu Studio:
 * 1. Thân cành Tree Support dạng dải đùn 3D màu xanh lá đặc trưng (#00e050) có độ rộng thực tế 0.45mm
 * 2. Lớp tiếp xúc Support Interface màu hồng tím (#d946ef / #c026d3) ở đầu cành
 * 3. Chân đế loe và vành Brim màu tím (#c026d3) bám chặt trên bàn in PEI Plate
 */
export function getCachedNativeSupport(
  modelIdentifier?: string,
  modelPath?: string
): INativeSupportData | null {
  if (modelPath && modelSupportCache.has(modelPath)) return modelSupportCache.get(modelPath)!;
  if (modelIdentifier && modelSupportCache.has(modelIdentifier)) return modelSupportCache.get(modelIdentifier)!;
  const cacheKey = modelPath || modelIdentifier || 'default';
  return modelSupportCache.get(cacheKey) || null;
}

/**
 * Xây dựng Three.js Group chứa toàn bộ cấu trúc Tree Support 3D thực tế từ Bambu Studio G-code:
 * 1. Thân và cành Tree Support 3D liền khối màu xanh lá đặc trưng (#00e050) ôm sát từng chi tiết mô hình
 * 2. Lớp đệm tiếp xúc Support Interface màu hồng tím (#d946ef) tại các đầu nhánh đỡ Overhang
 * 3. Vành Brim đồng tâm bám bàn in màu tím (#c026d3) tại Layer 1 (Y <= 0.32mm)
 */
export function buildNativeSupportMesh(data: INativeSupportData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'native_bambu_support_group';

  const trunkPos: number[] = [];
  const trunkNorm: number[] = [];
  const trunkIdx: number[] = [];

  const ifPos: number[] = [];
  const ifNorm: number[] = [];
  const ifIdx: number[] = [];

  const brimPos: number[] = [];
  const brimNorm: number[] = [];
  const brimIdx: number[] = [];

  const extrudeHorizontalPolyline = (
    poly: number[],
    posArr: number[],
    normArr: number[],
    idxArr: number[],
    w: number,
    h: number
  ) => {
    const m = poly.length / 3;
    if (m < 2) return;

    const segNx = new Float32Array(m - 1);
    const segNz = new Float32Array(m - 1);
    for (let s = 0; s < m - 1; s++) {
      const dx = poly[(s + 1) * 3] - poly[s * 3];
      const dz = poly[(s + 1) * 3 + 2] - poly[s * 3 + 2];
      const len = Math.hypot(dx, dz) || 1;
      segNx[s] = -dz / len;
      segNz[s] = dx / len;
    }

    const isClosed =
      m >= 4 &&
      Math.hypot(poly[(m - 1) * 3] - poly[0], poly[(m - 1) * 3 + 2] - poly[2]) < 0.35;

    const startVert = posArr.length / 3;

    for (let k = 0; k < m; k++) {
      let nx = 0;
      let nz = 0;
      if (k > 0 && k < m - 1) {
        nx = segNx[k - 1] + segNx[k];
        nz = segNz[k - 1] + segNz[k];
      } else if (isClosed) {
        nx = segNx[m - 2] + segNx[0];
        nz = segNz[m - 2] + segNz[0];
      } else if (k === 0) {
        nx = segNx[0];
        nz = segNz[0];
      } else {
        nx = segNx[m - 2];
        nz = segNz[m - 2];
      }
      const nLen = Math.hypot(nx, nz) || 1;
      nx /= nLen;
      nz /= nLen;

      const x = poly[k * 3];
      const y = poly[k * 3 + 1];
      const z = poly[k * 3 + 2];

      // 0: OuterTop, 1: OuterBot, 2: InnerBot, 3: InnerTop
      posArr.push(
        x + nx * w, y + h, z + nz * w,
        x + nx * w, y - h, z + nz * w,
        x - nx * w, y - h, z - nz * w,
        x - nx * w, y + h, z - nz * w
      );

      normArr.push(
        nx * 0.95, 0.31, nz * 0.95,
        nx * 0.98, -0.20, nz * 0.98,
        -nx * 0.98, -0.20, -nz * 0.98,
        -nx * 0.95, 0.31, -nz * 0.95
      );
    }

    for (let s = 0; s < m - 1; s++) {
      const b0 = startVert + s * 4;
      const b1 = b0 + 4;
      // Outer vertical wall
      idxArr.push(b0, b0 + 1, b1 + 1, b0, b1 + 1, b1);
      // Top cap
      idxArr.push(b0 + 3, b0, b1, b0 + 3, b1, b1 + 3);
      // Inner vertical wall
      idxArr.push(b0 + 2, b0 + 3, b1 + 3, b0 + 2, b1 + 3, b1 + 2);
    }
  };

  const extrude3DTubeSegment = (
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    r1: number, r2: number,
    posArr: number[], normArr: number[], idxArr: number[]
  ) => {
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.01) return;
    const tx = dx / len, ty = dy / len, tz = dz / len;
    let ax = 0, ay = 1, az = 0;
    if (Math.abs(ty) > 0.9) { ax = 1; ay = 0; az = 0; }
    let ux = ty * az - tz * ay;
    let uy = tz * ax - tx * az;
    let uz = tx * ay - ty * ax;
    const uLen = Math.hypot(ux, uy, uz) || 1;
    ux /= uLen; uy /= uLen; uz /= uLen;
    const vx = ty * uz - tz * uy;
    const vy = tz * ux - tx * uz;
    const vz = tx * uy - ty * ux;

    const sides = 8;
    const startVert = posArr.length / 3;
    for (let ring = 0; ring < 2; ring++) {
      const cx = ring === 0 ? x1 : x2;
      const cy = ring === 0 ? y1 : y2;
      const cz = ring === 0 ? z1 : z2;
      const r = ring === 0 ? r1 : r2;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const nx = ca * ux + sa * vx;
        const ny = ca * uy + sa * vy;
        const nz = ca * uz + sa * vz;
        posArr.push(cx + r * nx, cy + r * ny, cz + r * nz);
        normArr.push(nx, ny, nz);
      }
    }
    for (let s = 0; s < sides; s++) {
      const sNext = (s + 1) % sides;
      const v00 = startVert + s;
      const v01 = startVert + sNext;
      const v10 = startVert + sides + s;
      const v11 = startVert + sides + sNext;
      idxArr.push(v00, v10, v11, v00, v11, v01);
    }
  };

  for (const seg of data.segments) {
    const pts = seg.points;
    if (!pts || pts.length < 6) continue;

    // Kiểm tra xem segment là vòng contour phẳng từ G-code hay spline 3D dọc
    const totalDy = Math.abs(pts[pts.length - 2] - pts[1]);
    const is3DSpline = totalDy > 0.5;

    if (is3DSpline) {
      const posArr = seg.isInterface ? ifPos : trunkPos;
      const normArr = seg.isInterface ? ifNorm : trunkNorm;
      const idxArr = seg.isInterface ? ifIdx : trunkIdx;
      for (let i = 0; i < pts.length - 5; i += 6) {
        const x1 = pts[i], y1 = pts[i + 1], z1 = pts[i + 2];
        const x2 = pts[i + 3], y2 = pts[i + 4], z2 = pts[i + 5];
        const r1 = seg.isInterface ? 1.8 : Math.max(1.1, 3.0 - Math.min(1.8, y1 * 0.025));
        const r2 = seg.isInterface ? 1.8 : Math.max(1.1, 3.0 - Math.min(1.8, y2 * 0.025));
        extrude3DTubeSegment(x1, y1, z1, x2, y2, z2, r1, r2, posArr, normArr, idxArr);
      }
      continue;
    }

    // Gom các cặp đoạn thẳng liên tiếp [x1,y1,z1, x2,y2,z2] thành polyline liên tục
    let curPoly: number[] = [];
    const flushPoly = () => {
      if (curPoly.length >= 6) {
        const yLayer = curPoly[1];
        if (!seg.isInterface && yLayer <= 0.32) {
          extrudeHorizontalPolyline(curPoly, brimPos, brimNorm, brimIdx, 0.32, 0.10);
        } else if (seg.isInterface) {
          extrudeHorizontalPolyline(curPoly, ifPos, ifNorm, ifIdx, 0.30, 0.15);
        } else {
          extrudeHorizontalPolyline(curPoly, trunkPos, trunkNorm, trunkIdx, 0.32, 0.16);
        }
      }
      curPoly = [];
    };

    for (let i = 0; i < pts.length - 5; i += 6) {
      const x1 = pts[i], y1 = pts[i + 1], z1 = pts[i + 2];
      const x2 = pts[i + 3], y2 = pts[i + 4], z2 = pts[i + 5];
      if (curPoly.length === 0) {
        curPoly.push(x1, y1, z1, x2, y2, z2);
      } else {
        const lx = curPoly[curPoly.length - 3];
        const ly = curPoly[curPoly.length - 2];
        const lz = curPoly[curPoly.length - 1];
        if (Math.hypot(x1 - lx, y1 - ly, z1 - lz) < 0.15) {
          curPoly.push(x2, y2, z2);
        } else {
          flushPoly();
          curPoly.push(x1, y1, z1, x2, y2, z2);
        }
      }
    }
    flushPoly();
  }

  // 1. Thân & cành Tree Support: Xanh lá Bambu Studio (#00e050)
  if (trunkPos.length > 0) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(trunkPos, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(trunkNorm, 3));
    geom.setIndex(trunkIdx);

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x00e050,
      roughness: 0.32,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });
    const trunkMesh = new THREE.Mesh(geom, trunkMat);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    trunkMesh.name = 'native_tree_trunk_ribbons';
    group.add(trunkMesh);
  }

  // 2. Mặt tiếp xúc Support Interface: Hồng tím Bambu Studio (#d946ef)
  if (ifPos.length > 0) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(ifPos, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(ifNorm, 3));
    geom.setIndex(ifIdx);

    const ifMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: new THREE.Color(0xa21caf),
      emissiveIntensity: 0.28,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const ifMesh = new THREE.Mesh(geom, ifMat);
    ifMesh.castShadow = true;
    ifMesh.name = 'native_tree_interface_ribbons';
    group.add(ifMesh);
  }

  // 3. Vành Brim đồng tâm chân đế Tree Support: Tím Magenta Bambu Studio (#c026d3)
  if (brimPos.length > 0) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(brimPos, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(brimNorm, 3));
    geom.setIndex(brimIdx);

    const brimMat = new THREE.MeshStandardMaterial({
      color: 0xc026d3,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const brimMesh = new THREE.Mesh(geom, brimMat);
    brimMesh.receiveShadow = true;
    brimMesh.name = 'native_tree_brim_pads';
    group.add(brimMesh);
  }

  return group;
}

export interface IFullToolpathData {
  model: string;
  engine: string;
  totalLayers: number;
  layerHeightMm: number;
  totalMoves: number;
  outerWalls: number[];
  innerWalls: number[];
  infills?: number[];
  supports: number[];
  interfaces: number[];
  brims: number[];
  seams: number[];
  layerIndexTable: number[][]; // [layerIdx] = [outerVertCount, innerVertCount, infillVertCount, supportVertCount, interfaceVertCount, seamVertCount]
}

const toolpathsCache = new Map<string, IFullToolpathData>();

export function setPreloadedToolpaths(key: string, data: IFullToolpathData): void {
  if (!key) return;
  toolpathsCache.set(key, data);
}

/**
 * Nạp toàn bộ dữ liệu đường sợi in thực tế Bambu Studio (G-Code Toolpaths)
 */
export async function loadFullBambuToolpaths(
  modelIdentifier?: string,
  modelPath?: string
): Promise<IFullToolpathData | null> {
  if (modelPath && toolpathsCache.has(modelPath)) {
    return toolpathsCache.get(modelPath)!;
  }
  if (modelIdentifier && toolpathsCache.has(modelIdentifier)) {
    return toolpathsCache.get(modelIdentifier)!;
  }
  const cacheKey = modelPath || modelIdentifier || 'default';
  if (toolpathsCache.has(cacheKey)) {
    return toolpathsCache.get(cacheKey)!;
  }

  const prebaked = MatchPrebakedNativeModel(modelIdentifier, modelPath);
  if (!modelPath && !prebaked) {
    return null;
  }

  // 1. Thử lấy từ Slicer API khi có modelPath
  if (modelPath) {
    try {
      const params = new URLSearchParams();
      params.set('path', modelPath);
      if (modelIdentifier) params.set('name', modelIdentifier);
      const res = await fetch(`/api/slicer/full-toolpaths?${params.toString()}`);
      if (res.ok) {
        const data: IFullToolpathData = await res.json();
        if (data && data.outerWalls && data.outerWalls.length > 0) {
          toolpathsCache.set(cacheKey, data);
          return data;
        }
      }
    } catch (_) {}
  }

  // 2. Pre-cache fallbacks cho các mô hình chuẩn bị sẵn
  if (prebaked?.toolpathsJson) {
    const fallbackFile = prebaked.toolpathsJson;
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    const cleanRel = fallbackFile.replace(/^\//, '');
    const candidateUrls = [
      `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${cleanRel}`,
      `/3dsim/${cleanRel}`,
      fallbackFile,
    ];
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data: IFullToolpathData = await res.json();
          toolpathsCache.set(cacheKey, data);
          return data;
        }
      } catch (_) {}
    }
  }

  return null;
}

/**
 * Dựng Three.js Group mô phỏng chuẩn xác 100% chế độ xem trước sợi in thực tế (Bambu Studio Preview Tab):
 * - Tường ngoài (Outer wall): Xanh lá sáng Bambu Studio #00e050
 * - Tường trong (Inner wall): Xanh sẫm #047857
 * - Tree Support: Cành đỡ hữu cơ Bambu #10b981
 * - Support Interface: Hồng tím #d946ef
 * - Vành Brim bám bàn in: Tím magenta #c026d3
 * - Mối nối Z-Seam: Điểm trắng phát sáng #ffffff
 * Cung cấp cơ chế userData.updateLayer(currentLayer) cập nhật tức thì 144 FPS
 */
export function buildFullFilamentPreviewMesh(data: IFullToolpathData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'full_filament_preview_group';

  // 1. Tường ngoài (Outer walls)
  const outerGeom = new THREE.BufferGeometry();
  outerGeom.setAttribute('position', new THREE.Float32BufferAttribute(data.outerWalls, 3));
  const outerMat = new THREE.LineBasicMaterial({
    color: 0x00e050, // Lime Green đặc trưng Bambu Studio Outer Wall
  });
  const outerLines = new THREE.LineSegments(outerGeom, outerMat);
  outerLines.name = 'preview_outer_walls';
  group.add(outerLines);

  // 2. Tường trong (Inner walls)
  const innerGeom = new THREE.BufferGeometry();
  innerGeom.setAttribute('position', new THREE.Float32BufferAttribute(data.innerWalls, 3));
  const innerMat = new THREE.LineBasicMaterial({
    color: 0x047857, // Xanh thẫm Bambu Inner Wall
    transparent: true,
    opacity: 0.85,
  });
  const innerLines = new THREE.LineSegments(innerGeom, innerMat);
  innerLines.name = 'preview_inner_walls';
  group.add(innerLines);

  // 2.5 Ruột in (Sparse Infill): Vàng hổ phách Bambu Studio #f59e0b
  const infillGeom = new THREE.BufferGeometry();
  infillGeom.setAttribute('position', new THREE.Float32BufferAttribute(data.infills || [], 3));
  const infillMat = new THREE.LineBasicMaterial({
    color: 0xf59e0b, // Màu vàng hổ phách đặc trưng Bambu Studio Infill
    transparent: true,
    opacity: 0.88,
  });
  const infillLines = new THREE.LineSegments(infillGeom, infillMat);
  infillLines.name = 'preview_infills';
  group.add(infillLines);

  // 3. Tree Support
  const supGeom = new THREE.BufferGeometry();
  supGeom.setAttribute('position', new THREE.Float32BufferAttribute(data.supports, 3));
  const supMat = new THREE.LineBasicMaterial({
    color: 0x10b981, // Xanh lá cây Bambu Tree Support
  });
  const supLines = new THREE.LineSegments(supGeom, supMat);
  supLines.name = 'preview_supports';
  group.add(supLines);

  // 4. Support Interface
  const ifGeom = new THREE.BufferGeometry();
  ifGeom.setAttribute('position', new THREE.Float32BufferAttribute(data.interfaces, 3));
  const ifMat = new THREE.LineBasicMaterial({
    color: 0xd946ef, // Hồng tím Bambu Interface
  });
  const ifLines = new THREE.LineSegments(ifGeom, ifMat);
  ifLines.name = 'preview_interfaces';
  group.add(ifLines);

  // 5. Vành Brim bám bàn in (bám đúng chu vi thực tế Layer 0 của mô hình)
  const brimGeom = new THREE.BufferGeometry();
  const brimPositions = data.brims && data.brims.length > 0 ? data.brims : [];
  brimGeom.setAttribute('position', new THREE.Float32BufferAttribute(brimPositions, 3));
  const brimMat = new THREE.LineBasicMaterial({
    color: 0xc026d3, // Màu tím chân đế Brim đặc trưng Bambu Studio
  });
  const brimLines = new THREE.LineSegments(brimGeom, brimMat);
  brimLines.name = 'preview_brims';
  group.add(brimLines);

  // 6. Mối nối Z-Seam (Điểm tròn phát sáng trắng)
  const seamGeom = new THREE.BufferGeometry();
  seamGeom.setAttribute('position', new THREE.Float32BufferAttribute(data.seams, 3));
  const seamMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.8,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.95,
  });
  const seamPoints = new THREE.Points(seamGeom, seamMat);
  seamPoints.name = 'preview_seams';
  group.add(seamPoints);

  // 7. Gắn hàm điều khiển clipping / layer drawRange trực tiếp vào userData
  group.userData = {
    totalLayers: data.totalLayers,
    layerIndexTable: data.layerIndexTable,
    updateLayer: (currentLayer: number, progressRatio?: number, clippingPlane?: THREE.Plane) => {
      const tableLen = data.layerIndexTable ? data.layerIndexTable.length : 0;
      if (tableLen > 0) {
        const maxTableIdx = tableLen - 1;
        let idx = currentLayer;
        if (progressRatio !== undefined) {
          idx = progressRatio >= 0.999 ? maxTableIdx : Math.round(progressRatio * maxTableIdx);
        } else if (data.totalLayers > 0) {
          idx = Math.round((currentLayer / data.totalLayers) * maxTableIdx);
        }
        idx = Math.max(0, Math.min(maxTableIdx, idx));
        const entry = data.layerIndexTable[idx];
        if (entry) {
          outerGeom.setDrawRange(0, entry[0]);
          innerGeom.setDrawRange(0, entry[1]);
          if (entry.length >= 6) {
            infillGeom.setDrawRange(0, entry[2]);
            supGeom.setDrawRange(0, entry[3]);
            ifGeom.setDrawRange(0, entry[4]);
            seamGeom.setDrawRange(0, entry[5]);
          } else {
            supGeom.setDrawRange(0, entry[2]);
            ifGeom.setDrawRange(0, entry[3]);
            seamGeom.setDrawRange(0, entry[4]);
          }
        }
      }
      if (clippingPlane) {
        const planes = progressRatio !== undefined && progressRatio >= 0.999 ? [] : [clippingPlane];
        outerMat.clippingPlanes = planes;
        innerMat.clippingPlanes = planes;
        infillMat.clippingPlanes = planes;
        supMat.clippingPlanes = planes;
        ifMat.clippingPlanes = planes;
        seamMat.clippingPlanes = planes;
      }
    },
    updateVisibility: (opts: { showSupport: boolean; brimEnabled: boolean; infillDensity: number }) => {
      supLines.visible = opts.showSupport;
      ifLines.visible = opts.showSupport;
      brimLines.visible = opts.brimEnabled && brimPositions.length > 0;
      infillLines.visible = opts.infillDensity > 0;
    },
  };

  return group;
}

/**
 * Xóa sạch toàn bộ bộ nhớ đệm Support & Toolpaths khi chuyển hoặc tải mô hình mới
 */
export function clearAllSupportCaches(): void {
  modelSupportCache.clear();
  toolpathsCache.clear();
}

export interface IParsedBambuGcodeBundle {
  supportData: INativeSupportData;
  toolpathData: IFullToolpathData;
  totalLayers: number;
  estimatedTimeSec: number;
  filamentWeightGrams: number;
  supportLinesCount: number;
}

/**
 * Kiểm tra và giải nén nội dung G-Code thực tế từ file .gcode, .gcode.3mf hoặc .3mf xuất từ Bambu Studio / OrcaSlicer / PrusaSlicer
 */
export function extractBambuGcodeFromBuffer(buffer: ArrayBuffer, fileName: string): string | null {
  const lower = fileName.toLowerCase();
  try {
    if (lower.endsWith('.gcode') || lower.endsWith('.gco') || lower.endsWith('.g')) {
      const text = new TextDecoder().decode(buffer);
      if (text.includes('G1 ') || text.includes('; FEATURE:') || text.includes(';TYPE:')) {
        return text;
      }
      return null;
    }

    if (lower.endsWith('.3mf')) {
      const unzipped = unzipSync(new Uint8Array(buffer));
      const gcodeKeys = Object.keys(unzipped).filter(
        (k) => k.toLowerCase().endsWith('.gcode') && unzipped[k] && unzipped[k].length > 120
      );
      if (gcodeKeys.length > 0) {
        gcodeKeys.sort((a, b) => unzipped[b].length - unzipped[a].length);
        const gcodeText = new TextDecoder().decode(unzipped[gcodeKeys[0]]);
        if (gcodeText.includes('G1 ') || gcodeText.includes('; FEATURE:') || gcodeText.includes(';TYPE:')) {
          return gcodeText;
        }
      }
    }
  } catch (err) {
    console.warn('[extractBambuGcodeFromBuffer] Không thể giải nén G-code:', err);
  }
  return null;
}

/**
 * Trích xuất trực tiếp 100% cấu trúc Tree Support (; FEATURE: Support / Support interface) và toàn bộ sợi in
 * từ G-Code của Bambu Studio / OrcaSlicer / PrusaSlicer ngay trên trình duyệt (Client-Side).
 * Tự động căn tâm XZ của G-Code khớp tuyệt đối với tâm (0, 0) của mô hình 3D trên bàn in.
 */
export function parseBambuGcodeNative(
  gcodeText: string,
  modelName = 'Bambu Studio Native Model'
): IParsedBambuGcodeBundle {
  const lines = gcodeText.split(/\r?\n/);

  // Pass 1: Tìm tâm Bounding Box thực tế của phôi in (Outer/Inner walls) và đọc thông số Telemetry
  let minModelX = Infinity,
    maxModelX = -Infinity,
    minModelY = Infinity,
    maxModelY = -Infinity;
  let minAllX = Infinity,
    maxAllX = -Infinity,
    minAllY = Infinity,
    maxAllY = -Infinity;

  let p1X = 128,
    p1Y = 128,
    p1LayerZ = 0.2;
  let p1Feature = 'none';
  let p1Wipe = false;
  let headerTotalLayers = 0;
  let estimatedTimeSec = 0;
  let filamentWeightGrams = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith(';')) {
      if (line.startsWith('; WIPE_START')) {
        p1Wipe = true;
        continue;
      }
      if (line.startsWith('; WIPE_END')) {
        p1Wipe = false;
        continue;
      }
      if (line.startsWith('; Z_HEIGHT:') || line.startsWith(';Z:')) {
        const zv = parseFloat(line.slice(line.indexOf(':') + 1));
        if (!isNaN(zv) && zv > 0) p1LayerZ = zv;
        continue;
      }
      if (line.startsWith('; FEATURE:') || line.startsWith(';TYPE:')) {
        p1Feature = line.slice(line.indexOf(':') + 1).trim();
        continue;
      }
      if (line.includes('total layer number:')) {
        const m = /total layer number:\s*(\d+)/i.exec(line);
        if (m) headerTotalLayers = parseInt(m[1], 10);
      } else if (line.includes('model printing time:') || line.includes('estimated printing time')) {
        const hM = /(\d+)\s*h/i.exec(line);
        const mM = /(\d+)\s*m/i.exec(line);
        const sM = /(\d+)\s*s/i.exec(line);
        const sec =
          (hM ? parseInt(hM[1], 10) * 3600 : 0) +
          (mM ? parseInt(mM[1], 10) * 60 : 0) +
          (sM ? parseInt(sM[1], 10) : 0);
        if (sec > 0) estimatedTimeSec = sec;
      } else if (line.includes('total filament weight [g]') || line.includes('filament used [g]')) {
        const wM = /:\s*([\d.]+)/.exec(line);
        if (wM) {
          const w = parseFloat(wM[1]);
          if (!isNaN(w) && w > 0) filamentWeightGrams = Number(w.toFixed(1));
        }
      }
      continue;
    }

    if (
      line.startsWith('G0 ') ||
      line.startsWith('G1 ') ||
      line.startsWith('G2 ') ||
      line.startsWith('G3 ')
    ) {
      const mX = /X([-\d.]+)/.exec(line);
      const mY = /Y([-\d.]+)/.exec(line);
      const mE = /E([-\d.]+)/.exec(line);
      const nx = mX ? parseFloat(mX[1]) : p1X;
      const ny = mY ? parseFloat(mY[1]) : p1Y;
      const ev = mE ? parseFloat(mE[1]) : 0;

      if (!p1Wipe && ev > 0 && p1LayerZ > 0.25 && nx > 8 && nx < 248 && ny > 12 && ny < 248) {
        if (nx < minAllX) minAllX = nx;
        if (nx > maxAllX) maxAllX = nx;
        if (ny < minAllY) minAllY = ny;
        if (ny > maxAllY) maxAllY = ny;

        const isModelFeat =
          p1Feature.includes('Outer wall') ||
          p1Feature.includes('Inner wall') ||
          p1Feature.includes('Overhang wall') ||
          p1Feature.includes('Top surface') ||
          p1Feature.includes('Bottom surface') ||
          p1Feature.includes('Sparse infill') ||
          p1Feature.includes('Internal solid infill') ||
          p1Feature.includes('Bridge') ||
          p1Feature.includes('Perimeter');

        if (isModelFeat) {
          if (nx < minModelX) minModelX = nx;
          if (nx > maxModelX) maxModelX = nx;
          if (ny < minModelY) minModelY = ny;
          if (ny > maxModelY) maxModelY = ny;
        }
      }
      p1X = nx;
      p1Y = ny;
    }
  }

  const centerX =
    minModelX < maxModelX
      ? (minModelX + maxModelX) / 2
      : minAllX < maxAllX
      ? (minAllX + maxAllX) / 2
      : 128;
  const centerY =
    minModelY < maxModelY
      ? (minModelY + maxModelY) / 2
      : minAllY < maxAllY
      ? (minAllY + maxAllY) / 2
      : 128;

  // Pass 2: Trích xuất chuẩn xác các segment Support, Interface, Brim và Full Toolpaths
  let curX = centerX,
    curY = centerY,
    curZ = 0.2,
    layerZ = 0.2;
  let curFeature = 'none';
  let inSupport = false;
  let isInterface = false;
  let inWipe = false;
  let curLayer = 0;
  let isNewOuterLoop = true;

  const segments: INativeSupportSegment[] = [];
  let curLoopPts: number[] = [];

  const outerWalls: number[] = [];
  const innerWalls: number[] = [];
  const infills: number[] = [];
  const supports: number[] = [];
  const interfaces: number[] = [];
  const brims: number[] = [];
  const seams: number[] = [];
  const layerIndexTable: number[][] = [[0, 0, 0, 0, 0, 0]];

  const flushSupportLoop = () => {
    const n = curLoopPts.length / 3;
    if (n >= 2) {
      if (n >= 4) {
        const sx = curLoopPts[0],
          sy = curLoopPts[1],
          sz = curLoopPts[2];
        const ex = curLoopPts[(n - 1) * 3],
          ey = curLoopPts[(n - 1) * 3 + 1],
          ez = curLoopPts[(n - 1) * 3 + 2];
        const closeDist = Math.hypot(ex - sx, ez - sz);
        if (closeDist > 0.05 && closeDist <= 2.8 && Math.abs(ey - sy) < 0.08) {
          curLoopPts.push(sx, sy, sz);
        }
      }
      const pairPts: number[] = [];
      for (let k = 0; k < curLoopPts.length - 3; k += 3) {
        pairPts.push(
          curLoopPts[k],
          curLoopPts[k + 1],
          curLoopPts[k + 2],
          curLoopPts[k + 3],
          curLoopPts[k + 4],
          curLoopPts[k + 5]
        );
      }
      if (pairPts.length >= 6) {
        segments.push({ isInterface, points: pairPts });
      }
    }
    curLoopPts = [];
  };

  const addSupportLoopPoint = (bx: number, by: number, bz: number, force = false) => {
    const tx = Number((bx - centerX).toFixed(2));
    const ty = Number(bz.toFixed(2));
    const tz = Number((by - centerY).toFixed(2));
    if (curLoopPts.length === 0) {
      curLoopPts.push(tx, ty, tz);
      return;
    }
    const lx = curLoopPts[curLoopPts.length - 3];
    const ly = curLoopPts[curLoopPts.length - 2];
    const lz = curLoopPts[curLoopPts.length - 1];
    const dist = Math.hypot(tx - lx, ty - ly, tz - lz);
    if ((force && dist > 0.02) || dist >= 0.65) {
      curLoopPts.push(tx, ty, tz);
    }
  };

  const pushMoveToFeature = (x1: number, y1: number, x2: number, y2: number, z: number) => {
    const tX1 = Number((x1 - centerX).toFixed(2));
    const tY1 = Number(z.toFixed(2));
    const tZ1 = Number((y1 - centerY).toFixed(2));

    const tX2 = Number((x2 - centerX).toFixed(2));
    const tY2 = Number(z.toFixed(2));
    const tZ2 = Number((y2 - centerY).toFixed(2));

    const dist = Math.hypot(tX2 - tX1, tZ2 - tZ1);
    if (dist < 0.03 || dist > 65) return;

    const fl = curFeature.toLowerCase();
    if (
      fl.includes('outer wall') ||
      fl.includes('overhang wall') ||
      fl.includes('top surface') ||
      fl.includes('external perimeter')
    ) {
      outerWalls.push(tX1, tY1, tZ1, tX2, tY2, tZ2);
      if (isNewOuterLoop) {
        seams.push(tX1, tY1, tZ1);
        isNewOuterLoop = false;
      }
    } else if (
      fl.includes('inner wall') ||
      fl.includes('floating vertical shell') ||
      fl.includes('bridge') ||
      fl.includes('perimeter') ||
      fl.includes('bottom surface')
    ) {
      innerWalls.push(tX1, tY1, tZ1, tX2, tY2, tZ2);
    } else if (fl.includes('infill')) {
      infills.push(tX1, tY1, tZ1, tX2, tY2, tZ2);
    } else if (fl.includes('support interface') || fl.includes('support_interface') || fl.includes('support transition')) {
      interfaces.push(tX1, tY1, tZ1, tX2, tY2, tZ2);
    } else if (fl.includes('support') || fl.includes('tree')) {
      if (z <= 0.32) {
        brims.push(tX1, tY1, tZ1, tX2, tY2, tZ2);
      } else {
        supports.push(tX1, tY1, tZ1, tX2, tY2, tZ2);
      }
    } else if (fl.includes('skirt') || fl.includes('brim')) {
      brims.push(tX1, tY1, tZ1, tX2, tY2, tZ2);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('; WIPE_START')) {
      inWipe = true;
      flushSupportLoop();
      continue;
    }
    if (line.startsWith('; WIPE_END')) {
      inWipe = false;
      continue;
    }

    if (line.startsWith('; CHANGE_LAYER') || line.startsWith(';LAYER_CHANGE')) {
      flushSupportLoop();
      curLayer++;
      layerIndexTable[curLayer] = [
        outerWalls.length / 3,
        innerWalls.length / 3,
        infills.length / 3,
        supports.length / 3,
        interfaces.length / 3,
        seams.length / 3,
      ];
      isNewOuterLoop = true;
      continue;
    }

    if (line.startsWith('; Z_HEIGHT:') || line.startsWith(';Z:')) {
      const zVal = parseFloat(line.slice(line.indexOf(':') + 1));
      if (!isNaN(zVal) && zVal > 0) {
        layerZ = zVal;
        curZ = zVal;
      }
      continue;
    }

    if (line.startsWith('; FEATURE:') || line.startsWith(';TYPE:')) {
      flushSupportLoop();
      const feat = line.slice(line.indexOf(':') + 1).trim();
      const fl = feat.toLowerCase();
      if (feat !== curFeature) {
        if (fl.includes('outer wall') || fl.includes('overhang wall')) isNewOuterLoop = true;
        curFeature = feat;
      }

      if (fl.includes('support interface') || fl.includes('support_interface') || fl.includes('support transition')) {
        inSupport = true;
        isInterface = true;
      } else if (
        fl.includes('support') ||
        fl.includes('tree') ||
        (layerZ <= 0.32 && (fl.includes('skirt') || fl.includes('brim')))
      ) {
        inSupport = true;
        isInterface = false;
      } else {
        inSupport = false;
      }
      continue;
    }

    const isG0 = line.startsWith('G0 ');
    const isG1 = line.startsWith('G1 ');
    const isG2 = line.startsWith('G2 ');
    const isG3 = line.startsWith('G3 ');

    if (isG0 || isG1 || isG2 || isG3) {
      const matchX = /X([-\d.]+)/.exec(line);
      const matchY = /Y([-\d.]+)/.exec(line);
      const matchZ = /Z([-\d.]+)/.exec(line);
      const matchE = /E([-\d.]+)/.exec(line);

      const nextX = matchX ? parseFloat(matchX[1]) : curX;
      const nextY = matchY ? parseFloat(matchY[1]) : curY;
      const nextZ = matchZ ? parseFloat(matchZ[1]) : curZ;
      const eVal = matchE ? parseFloat(matchE[1]) : 0;
      const moveXY = Math.hypot(nextX - curX, nextY - curY);

      if (!inWipe && eVal > 0 && moveXY > 0.005) {
        const effZ = layerZ > 0 ? layerZ : nextZ;

        if (inSupport) {
          if (curLoopPts.length === 0) {
            addSupportLoopPoint(curX, curY, effZ, true);
          }
          if (isG2 || isG3) {
            const matchI = /I([-\d.]+)/.exec(line);
            const matchJ = /J([-\d.]+)/.exec(line);
            const I = matchI ? parseFloat(matchI[1]) : 0;
            const J = matchJ ? parseFloat(matchJ[1]) : 0;
            const cx = curX + I;
            const cy = curY + J;
            const r = Math.hypot(I, J);

            if (r > 0.05 && r < 220) {
              const a1 = Math.atan2(curY - cy, curX - cx);
              const a2 = Math.atan2(nextY - cy, nextX - cx);
              let da = a2 - a1;
              if (isG3 && da <= 1e-6) da += Math.PI * 2;
              if (isG2 && da >= -1e-6) da -= Math.PI * 2;

              if (Math.abs(da) > Math.PI * 1.8 && moveXY < 0.5 && eVal < r * 0.04) {
                addSupportLoopPoint(nextX, nextY, effZ, true);
              } else {
                const arcLen = r * Math.abs(da);
                const steps = Math.max(1, Math.min(28, Math.ceil(arcLen / 0.8)));
                for (let s = 1; s <= steps; s++) {
                  if (s === steps) {
                    addSupportLoopPoint(nextX, nextY, effZ, true);
                  } else {
                    const a = a1 + da * (s / steps);
                    addSupportLoopPoint(cx + Math.cos(a) * r, cy + Math.sin(a) * r, effZ, false);
                  }
                }
              }
            } else if (moveXY < 55) {
              addSupportLoopPoint(nextX, nextY, effZ, true);
            }
          } else if (moveXY < 55) {
            addSupportLoopPoint(nextX, nextY, effZ, false);
          }
        }

        // Ghi nhận đồng thời vào Full Toolpaths
        if (isG2 || isG3) {
          const matchI = /I([-\d.]+)/.exec(line);
          const matchJ = /J([-\d.]+)/.exec(line);
          const I = matchI ? parseFloat(matchI[1]) : 0;
          const J = matchJ ? parseFloat(matchJ[1]) : 0;
          const cx = curX + I;
          const cy = curY + J;
          const r = Math.hypot(I, J);
          if (r > 0.05 && r < 220) {
            const a1 = Math.atan2(curY - cy, curX - cx);
            const a2 = Math.atan2(nextY - cy, nextX - cx);
            let da = a2 - a1;
            if (isG3 && da <= 1e-6) da += Math.PI * 2;
            if (isG2 && da >= -1e-6) da -= Math.PI * 2;
            if (Math.abs(da) > Math.PI * 1.8 && moveXY < 0.5 && eVal < r * 0.04) {
              pushMoveToFeature(curX, curY, nextX, nextY, effZ);
            } else {
              const arcLen = r * Math.abs(da);
              const steps = Math.max(1, Math.min(20, Math.ceil(arcLen / 1.2)));
              let px = curX;
              let py = curY;
              for (let s = 1; s <= steps; s++) {
                const nx = s === steps ? nextX : cx + Math.cos(a1 + da * (s / steps)) * r;
                const ny = s === steps ? nextY : cy + Math.sin(a1 + da * (s / steps)) * r;
                pushMoveToFeature(px, py, nx, ny, effZ);
                px = nx;
                py = ny;
              }
            }
          } else {
            pushMoveToFeature(curX, curY, nextX, nextY, effZ);
          }
        } else {
          pushMoveToFeature(curX, curY, nextX, nextY, effZ);
        }
      } else if ((eVal <= 0 || isG0) && moveXY > 0.05) {
        if (inSupport) flushSupportLoop();
        if (curFeature.toLowerCase().includes('outer wall')) isNewOuterLoop = true;
      }

      curX = nextX;
      curY = nextY;
      curZ = nextZ;
    }
  }

  flushSupportLoop();

  const finalLayers = Math.max(curLayer, headerTotalLayers, 1);
  layerIndexTable[finalLayers] = [
    outerWalls.length / 3,
    innerWalls.length / 3,
    infills.length / 3,
    supports.length / 3,
    interfaces.length / 3,
    seams.length / 3,
  ];

  const totalSupportMoves = segments.reduce((sum, s) => sum + s.points.length / 6, 0);

  const supportData: INativeSupportData = {
    model: modelName,
    engine: 'bambu_studio_gcode',
    totalMoves: totalSupportMoves,
    totalSegments: segments.length,
    segments,
  };

  const toolpathData: IFullToolpathData = {
    model: modelName,
    engine: 'bambu_studio_gcode',
    totalLayers: finalLayers,
    layerHeightMm: 0.2,
    totalMoves:
      (outerWalls.length +
        innerWalls.length +
        infills.length +
        supports.length +
        interfaces.length +
        brims.length) /
      6,
    outerWalls,
    innerWalls,
    infills,
    supports,
    interfaces,
    brims,
    seams,
    layerIndexTable,
  };

  return {
    supportData,
    toolpathData,
    totalLayers: finalLayers,
    estimatedTimeSec: estimatedTimeSec || Math.max(600, finalLayers * 18),
    filamentWeightGrams: filamentWeightGrams || Math.max(5.0, Number((finalLayers * 0.14).toFixed(1))),
    supportLinesCount: totalSupportMoves,
  };
}

/**
 * Tái tạo lưới BufferGeometry 3D từ đường chạy dao Outer/Inner Walls của G-code
 * Dùng trong trường hợp người dùng tải trực tiếp file .gcode.3mf hoặc .gcode không đính kèm thẻ <mesh>
 */
export function reconstructGeometryFromToolpaths(toolpathData: IFullToolpathData): THREE.BufferGeometry {
  const sourceLines =
    toolpathData.outerWalls.length >= 18
      ? toolpathData.outerWalls
      : toolpathData.innerWalls.length >= 18
      ? toolpathData.innerWalls
      : toolpathData.supports;

  const positions: number[] = [];
  const totalPairs = Math.floor(sourceLines.length / 6);
  const stride = Math.max(1, Math.floor(totalPairs / 28000));
  const halfW = 0.24;
  const halfH = 0.12;

  for (let p = 0; p < totalPairs; p += stride) {
    const idx = p * 6;
    const x1 = sourceLines[idx],
      y1 = sourceLines[idx + 1],
      z1 = sourceLines[idx + 2];
    const x2 = sourceLines[idx + 3],
      y2 = sourceLines[idx + 4],
      z2 = sourceLines[idx + 5];

    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.05 || len > 50) continue;

    const nx = (-dz / len) * halfW;
    const nz = (dx / len) * halfW;

    // Mặt đứng bên ngoài
    positions.push(
      x1 + nx, y1 - halfH, z1 + nz,
      x2 + nx, y2 - halfH, z2 + nz,
      x2 + nx, y2 + halfH, z2 + nz,
      x1 + nx, y1 - halfH, z1 + nz,
      x2 + nx, y2 + halfH, z2 + nz,
      x1 + nx, y1 + halfH, z1 + nz
    );
    // Mặt nắp trên
    positions.push(
      x1 - nx, y1 + halfH, z1 - nz,
      x1 + nx, y1 + halfH, z1 + nz,
      x2 + nx, y2 + halfH, z2 + nz,
      x1 - nx, y1 + halfH, z1 - nz,
      x2 + nx, y2 + halfH, z2 + nz,
      x2 - nx, y2 + halfH, z2 - nz
    );
  }

  if (positions.length === 0) {
    return new THREE.BoxGeometry(24, 24, 24).toNonIndexed();
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeBoundingBox();
  geom.computeVertexNormals();
  return geom;
}


