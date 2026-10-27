import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  ISimulationProfile,
  ISupportOverhangPatch,
  TreeSupportStyle,
} from '@/types/simulator';

interface IOverhangTriangle {
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

const VOXEL_GRID_RES = 100;
const VOXEL_CELL_MM = 3.0;
const VOXEL_HALF_SPAN = (VOXEL_GRID_RES * VOXEL_CELL_MM) / 2; // 150mm (-150..+150)
const VOXEL_HEIGHT_BITS = 30;

function worldToVoxelXZ(x: number, z: number): [number, number] {
  const gx = Math.max(0, Math.min(VOXEL_GRID_RES - 1, Math.floor((x + VOXEL_HALF_SPAN) / VOXEL_CELL_MM)));
  const gz = Math.max(0, Math.min(VOXEL_GRID_RES - 1, Math.floor((z + VOXEL_HALF_SPAN) / VOXEL_CELL_MM)));
  return [gx, gz];
}

function heightToBit(y: number, maxY: number): number {
  return Math.max(0, Math.min(VOXEL_HEIGHT_BITS - 1, Math.floor((Math.max(0, y) / Math.max(1, maxY)) * (VOXEL_HEIGHT_BITS - 1))));
}

/**
 * Kiểm tra điểm 2D (px, pz) có nằm trong tam giác 2D (ax, az)-(bx, bz)-(cx, cz) trên mặt phẳng XZ không,
 * nếu có trả về cao độ Y nội suy trên mặt phẳng tam giác đó.
 */
function sampleTriangleHeightAtXZ(
  px: number,
  pz: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number
): number | null {
  const v0x = cx - ax;
  const v0z = cz - az;
  const v1x = bx - ax;
  const v1z = bz - az;
  const v2x = px - ax;
  const v2z = pz - az;

  const dot00 = v0x * v0x + v0z * v0z;
  const dot01 = v0x * v1x + v0z * v1z;
  const dot02 = v0x * v2x + v0z * v2z;
  const dot11 = v1x * v1x + v1z * v1z;
  const dot12 = v1x * v2x + v1z * v2z;

  const denom = dot00 * dot11 - dot01 * dot01;
  if (Math.abs(denom) < 1e-8) return null;

  const invDenom = 1 / denom;
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

  if (u >= -0.02 && v >= -0.02 && u + v <= 1.02) {
    return ay + u * (cy - ay) + v * (by - ay);
  }
  return null;
}

/**
 * Cắt tam giác 3D bởi hình trụ đứng tâm (cx, cz) bán kính maxR để lớp đệm Support Interface
 * chỉ xuất hiện gọn gàng ngay tại đầu nhánh cây tiếp xúc và tuyệt đối không thò ra ngoài rìa mẫu.
 */
function clipTriangleToContactRadius(
  tri: IOverhangTriangle,
  contactX: number,
  contactY: number,
  contactZ: number,
  maxR: number
): {
  ax: number;
  ay: number;
  az: number;
  bx: number;
  by: number;
  bz: number;
  cx: number;
  cy: number;
  cz: number;
  nx: number;
  ny: number;
  nz: number;
} | null {
  const distM = Math.hypot(tri.mx - contactX, tri.mz - contactZ);
  const distY = Math.abs(tri.my - contactY);
  if (distM > maxR * 1.45 || distY > 2.2) return null;

  const clampVertexToRadius = (vx: number, vy: number, vz: number): [number, number, number] => {
    const dx = vx - contactX;
    const dz = vz - contactZ;
    const d = Math.hypot(dx, dz);
    if (d <= maxR) return [vx, vy, vz];
    const t = Math.min(0.82, (d - maxR) / Math.max(0.1, d));
    return [
      vx + (tri.mx - vx) * t,
      vy + (tri.my - vy) * t,
      vz + (tri.mz - vz) * t,
    ];
  };

  const [ax, ay, az] = clampVertexToRadius(tri.ax, tri.ay, tri.az);
  const [bx, by, bz] = clampVertexToRadius(tri.bx, tri.by, tri.bz);
  const [cx, cy, cz] = clampVertexToRadius(tri.cx, tri.cy, tri.cz);

  return {
    ax,
    ay,
    az,
    bx,
    by,
    bz,
    cx,
    cy,
    cz,
    nx: tri.nx,
    ny: tri.ny,
    nz: tri.nz,
  };
}

/**
 * 1. Quét chính xác các tam giác Overhang lộ ra bên ngoài mô hình 3D
 * Đồng thời xây dựng Lưới Voxel Bitmask 3D (100x100x30) để định tuyến nhánh cây
 * tuyệt đối KHÔNG BAO GIỜ đâm xuyên qua thân, cánh hoặc chi tiết mô hình.
 */
function extractExteriorOverhangData(
  geometry: THREE.BufferGeometry,
  thresholdDeg: number = 45
): {
  patches: IConformalOverhangPatch[];
  voxelGrid: Int32Array;
  hullRadialProfile: Float32Array;
  hullEnvelope: Float32Array;
  radialBins: number;
  heightBins: number;
  maxY: number;
  centerX: number;
  centerZ: number;
} {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const rawMinY = bbox.min.y;
  const rawMaxY = bbox.max.y;
  const yShift = -rawMinY;
  const minY = 0;
  const maxY = Math.max(1.0, rawMaxY - rawMinY);
  const centerX = (bbox.max.x + bbox.min.x) / 2;
  const centerZ = (bbox.max.z + bbox.min.z) / 2;

  const positions = geometry.getAttribute('position');
  const indexAttr = geometry.getIndex();
  const radialBins = 72;
  const heightBins = 32;
  const hullRadialProfile = new Float32Array(radialBins);
  const rawHullEnvelope = new Float32Array(radialBins * heightBins);
  const hullEnvelope = new Float32Array(radialBins * heightBins);
  const rawVoxelGrid = new Int32Array(VOXEL_GRID_RES * VOXEL_GRID_RES);
  const voxelGrid = new Int32Array(VOXEL_GRID_RES * VOXEL_GRID_RES);

  if (!positions) {
    return {
      patches: [],
      voxelGrid,
      hullRadialProfile,
      hullEnvelope,
      radialBins,
      heightBins,
      maxY,
      centerX,
      centerZ,
    };
  }

  const rad = (thresholdDeg * Math.PI) / 180;
  const normalThresholdY = -Math.cos(rad);

  const vertCount = indexAttr ? indexAttr.count : positions.count;
  const totalTriCount = Math.floor(vertCount / 3);
  const stride = Math.max(1, Math.floor(totalTriCount / 32000));

  interface IRawTri {
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
  }

  const allTris: IRawTri[] = [];
  const xzGridCell = Math.max(4.5, Math.min(9.0, maxY * 0.05));
  const spatialGrid = new Map<string, number[]>();

  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const pEdge2 = new THREE.Vector3();
  const cross = new THREE.Vector3();

  const recordEnvelopePoint = (px: number, py: number, pz: number) => {
    const dx = px - centerX;
    const dz = pz - centerZ;
    const r = Math.hypot(dx, dz);
    let angIdx = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * radialBins);
    angIdx = Math.max(0, Math.min(radialBins - 1, angIdx));
    let hIdx = Math.floor((Math.max(0, py) / maxY) * (heightBins - 1));
    hIdx = Math.max(0, Math.min(heightBins - 1, hIdx));
    const eIdx = angIdx * heightBins + hIdx;
    if (r > rawHullEnvelope[eIdx]) {
      rawHullEnvelope[eIdx] = r;
    }
    if (r > hullRadialProfile[angIdx]) {
      hullRadialProfile[angIdx] = r;
    }
  };

  for (let t = 0; t < totalTriCount; t += stride) {
    const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    pA.fromBufferAttribute(positions, i0);
    pB.fromBufferAttribute(positions, i1);
    pC.fromBufferAttribute(positions, i2);
    pA.y += yShift;
    pB.y += yShift;
    pC.y += yShift;

    edge1.subVectors(pB, pA);
    pEdge2.subVectors(pC, pA);
    cross.crossVectors(edge1, pEdge2);
    const area = cross.length() * 0.5 * stride;
    if (area < 0.0008) continue;

    cross.normalize();
    const mx = (pA.x + pB.x + pC.x) / 3;
    const my = (pA.y + pB.y + pC.y) / 3;
    const mz = (pA.z + pB.z + pC.z) / 3;

    recordEnvelopePoint(pA.x, pA.y, pA.z);
    recordEnvelopePoint(pB.x, pB.y, pB.z);
    recordEnvelopePoint(pC.x, pC.y, pC.z);
    recordEnvelopePoint(mx, my, mz);

    // Đánh dấu Voxel 3D cho tam giác này (rasterize AABB của tam giác vào lưới 100x100x30)
    const [gxMin, gzMin] = worldToVoxelXZ(
      Math.min(pA.x, pB.x, pC.x),
      Math.min(pA.z, pB.z, pC.z)
    );
    const [gxMax, gzMax] = worldToVoxelXZ(
      Math.max(pA.x, pB.x, pC.x),
      Math.max(pA.z, pB.z, pC.z)
    );
    const bMin = heightToBit(Math.min(pA.y, pB.y, pC.y), maxY);
    const bMax = heightToBit(Math.max(pA.y, pB.y, pC.y), maxY);
    let triMask = 0;
    for (let b = bMin; b <= bMax; b++) {
      triMask |= 1 << b;
    }
    for (let gx = gxMin; gx <= gxMax; gx++) {
      const rowOffset = gx * VOXEL_GRID_RES;
      for (let gz = gzMin; gz <= gzMax; gz++) {
        rawVoxelGrid[rowOffset + gz] |= triMask;
      }
    }

    const triIdx = allTris.length;
    allTris.push({
      ax: pA.x,
      ay: pA.y,
      az: pA.z,
      bx: pB.x,
      by: pB.y,
      bz: pB.z,
      cx: pC.x,
      cy: pC.y,
      cz: pC.z,
      mx,
      my,
      mz,
      nx: cross.x,
      ny: cross.y,
      nz: cross.z,
      area,
    });

    const minGX = Math.floor(Math.min(pA.x, pB.x, pC.x) / xzGridCell);
    const maxGX = Math.floor(Math.max(pA.x, pB.x, pC.x) / xzGridCell);
    const minGZ = Math.floor(Math.min(pA.z, pB.z, pC.z) / xzGridCell);
    const maxGZ = Math.floor(Math.max(pA.z, pB.z, pC.z) / xzGridCell);

    for (let gx = minGX; gx <= maxGX; gx++) {
      for (let gz = minGZ; gz <= maxGZ; gz++) {
        const key = `${gx}_${gz}`;
        const bucket = spatialGrid.get(key);
        if (bucket) {
          if (bucket.length < 384) bucket.push(triIdx);
        } else {
          spatialGrid.set(key, [triIdx]);
        }
      }
    }
  }

  // Giãn nở (Dilate) lưới Voxel 1 ô (3mm) để thân cây luôn cách bề mặt mô hình >= 2.5mm
  // và lấp kín các khoang rỗng bên trong theo từng tia từ tâm ra ngoài
  for (let gx = 0; gx < VOXEL_GRID_RES; gx++) {
    for (let gz = 0; gz < VOXEL_GRID_RES; gz++) {
      let combined = rawVoxelGrid[gx * VOXEL_GRID_RES + gz];
      for (let dx = -1; dx <= 1; dx++) {
        const nx = gx + dx;
        if (nx < 0 || nx >= VOXEL_GRID_RES) continue;
        for (let dz = -1; dz <= 1; dz++) {
          const nz = gz + dz;
          if (nz < 0 || nz >= VOXEL_GRID_RES) continue;
          combined |= rawVoxelGrid[nx * VOXEL_GRID_RES + nz];
        }
      }
      voxelGrid[gx * VOXEL_GRID_RES + gz] = combined;
    }
  }

  // Làm mịn vỏ bao Hull Envelope theo góc phương vị và chiều cao
  for (let a = 0; a < radialBins; a++) {
    let maxColR = hullRadialProfile[a];
    for (let da = -2; da <= 2; da++) {
      const na = (a + da + radialBins) % radialBins;
      if (hullRadialProfile[na] > maxColR) maxColR = hullRadialProfile[na];
    }
    hullRadialProfile[a] = maxColR;

    for (let h = 0; h < heightBins; h++) {
      let localMax = 0;
      for (let da = -2; da <= 2; da++) {
        const na = (a + da + radialBins) % radialBins;
        for (let dh = -1; dh <= 1; dh++) {
          const nh = Math.max(0, Math.min(heightBins - 1, h + dh));
          const val = rawHullEnvelope[na * heightBins + nh];
          if (val > localMax) localMax = val;
        }
      }
      hullEnvelope[a * heightBins + h] = localMax;
    }
  }

  // Bỏ qua các mép vát sát mặt bàn in (Y < minOverhangY)
  const minOverhangY = Math.max(3.2, Math.min(8.5, maxY * 0.055));

  const validOverhangs: IOverhangTriangle[] = [];

  for (let idx = 0; idx < allTris.length; idx++) {
    const t = allTris[idx];
    if (t.ny >= normalThresholdY) continue;
    if (t.my <= minOverhangY) continue;

    // Loại bỏ các tam giác nằm chìm sâu bên trong lòng rỗng của mô hình
    const dx = t.mx - centerX;
    const dz = t.mz - centerZ;
    const distR = Math.hypot(dx, dz);
    let angIdx = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * radialBins);
    angIdx = Math.max(0, Math.min(radialBins - 1, angIdx));
    let hIdx = Math.floor((Math.max(0, t.my) / maxY) * (heightBins - 1));
    hIdx = Math.max(0, Math.min(heightBins - 1, hIdx));
    const localHullR = hullEnvelope[angIdx * heightBins + hIdx];
    if (localHullR > 8.0 && distR < localHullR * 0.45 && t.my < maxY * 0.88) {
      continue;
    }

    const key = `${Math.floor(t.mx / xzGridCell)}_${Math.floor(t.mz / xzGridCell)}`;
    const candidates = spatialGrid.get(key) || [];

    let highestHitBelowY = -Infinity;
    let lowestHitAboveY = Infinity;

    for (const cIdx of candidates) {
      if (cIdx === idx) continue;
      const other = allTris[cIdx];

      const hitY = sampleTriangleHeightAtXZ(
        t.mx,
        t.mz,
        other.ax,
        other.ay,
        other.az,
        other.bx,
        other.by,
        other.bz,
        other.cx,
        other.cy,
        other.cz
      );
      if (hitY === null) continue;

      if (hitY < t.my - 0.5 && hitY > highestHitBelowY) {
        highestHitBelowY = hitY;
      }
      if (hitY > t.my + 0.2 && hitY < lowestHitAboveY) {
        lowestHitAboveY = hitY;
      }
    }

    // Nếu mặt này nằm bên trong khối đặc (không có bề mặt trên đóng kín hoặc khoảng hở dưới quá hẹp < 4.5mm), bỏ qua!
    if (highestHitBelowY > -Infinity) {
      const verticalClearance = t.my - highestHitBelowY;
      if (verticalClearance < 4.5) {
        continue;
      }
    }

    const angleWithVertical = Math.acos(Math.max(-1, Math.min(1, -t.ny))) * (180 / Math.PI);
    const angleDeg = 90 - angleWithVertical;
    const floorY = highestHitBelowY > minY + 0.5 ? highestHitBelowY : 0;

    validOverhangs.push({
      ...t,
      angleDeg,
      floorY,
    });
  }

  if (validOverhangs.length === 0) {
    return {
      patches: [],
      voxelGrid,
      hullRadialProfile,
      hullEnvelope,
      radialBins,
      heightBins,
      maxY,
      centerX,
      centerZ,
    };
  }

  // Gom cụm các tam giác Overhang theo ô lưới tỉ lệ với kích thước mô hình
  const patchCell = Math.max(6.5, Math.min(16.0, maxY * 0.085));
  const patchHeightCell = Math.max(9.0, Math.min(22.0, maxY * 0.12));
  const clusterMap = new Map<string, IOverhangTriangle[]>();

  for (const tri of validOverhangs) {
    const kx = Math.floor(tri.mx / patchCell);
    const kz = Math.floor(tri.mz / patchCell);
    const ky = Math.floor(tri.my / patchHeightCell);
    const key = `${kx}_${ky}_${kz}`;
    const list = clusterMap.get(key);
    if (list) list.push(tri);
    else clusterMap.set(key, [tri]);
  }

  const candidatePatches: Array<{ patch: IConformalOverhangPatch; score: number; sector: number }> = [];
  let patchId = 1;
  const numSectors = 12;

  clusterMap.forEach((tris) => {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let totalArea = 0;
    let minAngle = 90;
    let sumAngle = 0;

    for (const t of tris) {
      sumX += t.mx * t.area;
      sumY += t.my * t.area;
      sumZ += t.mz * t.area;
      totalArea += t.area;
      if (t.angleDeg < minAngle) minAngle = t.angleDeg;
      sumAngle += t.angleDeg * t.area;
    }

    if (totalArea < 0.85) return;

    const avgX = sumX / totalArea;
    const avgY = sumY / totalArea;
    const avgZ = sumZ / totalArea;
    const avgAngle = sumAngle / totalArea;

    let bestTri = tris[0];
    let bestDistSq = Infinity;
    for (const t of tris) {
      const dSq = (t.mx - avgX) ** 2 + (t.my - avgY) ** 2 + (t.mz - avgZ) ** 2;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestTri = t;
      }
    }

    const severity = minAngle < 20 ? 'critical' : minAngle < 35 ? 'moderate' : 'mild';
    const dx = bestTri.mx - centerX;
    const dz = bestTri.mz - centerZ;
    const distR = Math.hypot(dx, dz);
    let sector = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * numSectors);
    sector = Math.max(0, Math.min(numSectors - 1, sector));

    const priorityScore =
      totalArea * (1.2 + Math.max(0, -bestTri.ny) * 1.5) * (0.7 + distR / Math.max(12, maxY * 0.35));

    candidatePatches.push({
      sector,
      score: priorityScore,
      patch: {
        id: `patch-${patchId++}`,
        center: [
          Number(bestTri.mx.toFixed(2)),
          Number(bestTri.my.toFixed(2)),
          Number(bestTri.mz.toFixed(2)),
        ],
        normal: [bestTri.nx, bestTri.ny, bestTri.nz],
        floorY: bestTri.floorY,
        triangles: tris,
        areaMm2: Number(totalArea.toFixed(1)),
        minAngleDeg: Number(minAngle.toFixed(1)),
        avgAngleDeg: Number(avgAngle.toFixed(1)),
        severity,
        requiresSupport: true,
        isBridge: minAngle < 15 && totalArea > 8.0,
      },
    });
  });

  const sectorBuckets: IConformalOverhangPatch[][] = Array.from({ length: numSectors }, () => []);
  candidatePatches.sort((a, b) => b.score - a.score);
  for (const item of candidatePatches) {
    sectorBuckets[item.sector].push(item.patch);
  }

  const balancedPatches: IConformalOverhangPatch[] = [];
  const maxTotalPatches = 26;
  let round = 0;
  while (balancedPatches.length < maxTotalPatches) {
    let addedInRound = false;
    for (let s = 0; s < numSectors; s++) {
      if (round < sectorBuckets[s].length) {
        balancedPatches.push(sectorBuckets[s][round]);
        addedInRound = true;
        if (balancedPatches.length >= maxTotalPatches) break;
      }
    }
    if (!addedInRound) break;
    round++;
  }

  return {
    patches: balancedPatches,
    voxelGrid,
    hullRadialProfile,
    hullEnvelope,
    radialBins,
    heightBins,
    maxY,
    centerX,
    centerZ,
  };
}

/**
 * API tương thích cho Preflight Analyzer & các dịch vụ kiểm tra Overhang
 */
export function detectOverhangPatches(
  geometry: THREE.BufferGeometry,
  thresholdDeg: number = 45,
  _buildPlateOnly: boolean = true
): ISupportOverhangPatch[] {
  return extractExteriorOverhangData(geometry, thresholdDeg).patches;
}

/**
 * 2. Dựng lớp đệm tiếp xúc (Support Interface Layer #d946ef) ÔM SÁT 100% TAM GIÁC MÔ HÌNH TẠI ĐẦU NHÁNH CÂY
 */
function buildPatchConformalCapGeometry(
  patch: IConformalOverhangPatch,
  capRadius: number,
  topZDistanceMm: number = 0.2,
  interfaceLayers: number = 2
): THREE.BufferGeometry | null {
  const [cx, cy, cz] = patch.center;
  const positions: number[] = [];
  const topOffset = Math.max(0.01, Math.min(0.18, topZDistanceMm * 0.25));
  const thickness = Math.max(0.14, Math.min(0.45, interfaceLayers * 0.1));

  const pushTri = (
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number
  ) => {
    positions.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
  };

  let addedCount = 0;
  for (const rawTri of patch.triangles) {
    if (addedCount >= 16) break;
    const clipped = clipTriangleToContactRadius(rawTri, cx, cy, cz, capRadius);
    if (!clipped) continue;
    addedCount++;

    const { ax, ay, az, bx, by, bz, cx: tx, cy: ty, cz: tz, nx, ny, nz } = clipped;

    const a1x = ax + nx * topOffset,
      a1y = ay + ny * topOffset,
      a1z = az + nz * topOffset;
    const b1x = bx + nx * topOffset,
      b1y = by + ny * topOffset,
      b1z = bz + nz * topOffset;
    const c1x = tx + nx * topOffset,
      c1y = ty + ny * topOffset,
      c1z = tz + nz * topOffset;

    const botOffset = topOffset + thickness;
    const a2x = ax + nx * botOffset,
      a2y = ay + ny * botOffset,
      a2z = az + nz * botOffset;
    const b2x = bx + nx * botOffset,
      b2y = by + ny * botOffset,
      b2z = bz + nz * botOffset;
    const c2x = tx + nx * botOffset,
      c2y = ty + ny * botOffset,
      c2z = tz + nz * botOffset;

    pushTri(a1x, a1y, a1z, c1x, c1y, c1z, b1x, b1y, b1z);
    pushTri(a2x, a2y, a2z, b2x, b2y, b2z, c2x, c2y, c2z);

    pushTri(a1x, a1y, a1z, b1x, b1y, b1z, b2x, b2y, b2z);
    pushTri(a1x, a1y, a1z, b2x, b2y, b2z, a2x, a2y, a2z);

    pushTri(b1x, b1y, b1z, c1x, c1y, c1z, c2x, c2y, c2z);
    pushTri(b1x, b1y, b1z, c2x, c2y, c2z, b2x, b2y, b2z);

    pushTri(c1x, c1y, c1z, a1x, a1y, a1z, a2x, a2y, a2z);
    pushTri(c1x, c1y, c1z, a2x, a2y, a2z, c2x, c2y, c2z);
  }

  if (positions.length === 0) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}

/**
 * 3. Tạo hình học thân/nhánh cây hữu cơ uốn lượn mượt mà (Catmull-Rom Spline Tube)
 */
function createSmoothOrganicBranchGeom(
  points: THREE.Vector3[],
  rBottom: number,
  rTop: number,
  numRings = 22,
  radialSegments = 14,
  tipContact?: { point: THREE.Vector3; normal: THREE.Vector3 },
  isGroundedTrunk = false
): THREE.BufferGeometry | null {
  if (points.length < 2) return null;

  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const ringCenters: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];

  for (let i = 0; i <= numRings; i++) {
    const t = i / numRings;
    ringCenters.push(curve.getPointAt(t));
    tangents.push(curve.getTangentAt(t).normalize());
  }

  const positions: number[] = [];
  const indices: number[] = [];
  const refVec = new THREE.Vector3(1, 0, 0);
  const altRef = new THREE.Vector3(0, 0, 1);

  const inwardSurfNormal = tipContact
    ? new THREE.Vector3(-tipContact.normal.x, -tipContact.normal.y, -tipContact.normal.z).normalize()
    : null;

  for (let i = 0; i <= numRings; i++) {
    const t = i / numRings;
    let currentRadius = rBottom * Math.pow(1 - t, 0.85) + rTop * Math.pow(t, 0.85);

    const center = ringCenters[i];
    if (isGroundedTrunk && center.y < 1.2) {
      const rootFactor = Math.max(0, (1.2 - center.y) / 1.2);
      currentRadius *= 1.0 + 0.14 * rootFactor * rootFactor;
    }

    const T = tangents[i].clone();
    if (inwardSurfNormal && t > 0.72) {
      const blend = (t - 0.72) / 0.28;
      T.lerp(inwardSurfNormal, blend * 0.88).normalize();
    }

    let N = new THREE.Vector3()
      .crossVectors(T, Math.abs(T.x) < 0.85 ? refVec : altRef)
      .normalize();
    if (N.lengthSq() < 0.001) {
      N = new THREE.Vector3(0, 0, 1);
    }
    const B = new THREE.Vector3().crossVectors(T, N).normalize();

    for (let j = 0; j < radialSegments; j++) {
      const angle = (j * Math.PI * 2) / radialSegments;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let vx = center.x + currentRadius * (cosA * N.x + sinA * B.x);
      let vy = center.y + currentRadius * (cosA * N.y + sinA * B.y);
      let vz = center.z + currentRadius * (cosA * N.z + sinA * B.z);

      if (tipContact && inwardSurfNormal && t > 0.62) {
        const dx = vx - tipContact.point.x;
        const dy = vy - tipContact.point.y;
        const dz = vz - tipContact.point.z;
        const signedPenetration =
          dx * inwardSurfNormal.x + dy * inwardSurfNormal.y + dz * inwardSurfNormal.z;
        if (signedPenetration > -0.02) {
          const pushBack = signedPenetration + 0.02;
          vx -= pushBack * inwardSurfNormal.x;
          vy -= pushBack * inwardSurfNormal.y;
          vz -= pushBack * inwardSurfNormal.z;
        }
      }

      if (vy < 0.12) vy = 0.12;
      positions.push(vx, vy, vz);
    }
  }

  for (let i = 0; i < numRings; i++) {
    const ring1 = i * radialSegments;
    const ring2 = (i + 1) * radialSegments;

    for (let j = 0; j < radialSegments; j++) {
      const nextJ = (j + 1) % radialSegments;
      const v00 = ring1 + j;
      const v01 = ring1 + nextJ;
      const v10 = ring2 + j;
      const v11 = ring2 + nextJ;

      indices.push(v00, v10, v11);
      indices.push(v00, v11, v01);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom.toNonIndexed();
}

function safeMergeGeometries(geoms: (THREE.BufferGeometry | null)[]): THREE.BufferGeometry | null {
  const valid = geoms.filter(
    (g): g is THREE.BufferGeometry =>
      g !== null &&
      g !== undefined &&
      g.getAttribute('position') !== undefined &&
      g.getAttribute('position').count > 0
  );
  if (valid.length === 0) return null;

  const normalized = valid.map((g) => {
    const target = g.index ? g.toNonIndexed() : g;
    const cleanGeom = new THREE.BufferGeometry();
    cleanGeom.setAttribute('position', target.getAttribute('position').clone());
    return cleanGeom;
  });

  const merged = BufferGeometryUtils.mergeGeometries(normalized, false);
  if (merged) {
    merged.computeVertexNormals();
  }
  return merged;
}

/**
 * Đẩy điểm điều khiển spline ra ngoài Voxel mô hình & vỏ Hull tại độ cao Y tương ứng
 * Đảm bảo nhánh cây uốn cong vòng qua bên ngoài mô hình thay vì đâm xuyên qua thân/cánh.
 */
function pushPointOutsideModelCollision(
  pt: THREE.Vector3,
  clearance: number,
  centerX: number,
  centerZ: number,
  maxY: number,
  voxelGrid: Int32Array,
  hullEnvelope: Float32Array,
  radialBins: number,
  heightBins: number,
  outwardDirX: number,
  outwardDirZ: number
): THREE.Vector3 {
  let x = pt.x;
  let z = pt.z;
  const y = pt.y;

  const bit = heightToBit(y, maxY);
  const checkMask =
    (1 << bit) |
    (bit > 0 ? 1 << (bit - 1) : 0) |
    (bit < VOXEL_HEIGHT_BITS - 1 ? 1 << (bit + 1) : 0);

  // 1. Kiểm tra nếu điểm hiện tại chạm vào Voxel của mô hình ở độ cao Y -> đẩy tịnh tiến theo hướng ra ngoài (outwardDir)
  for (let step = 0; step < 16; step++) {
    const [gx, gz] = worldToVoxelXZ(x, z);
    if ((voxelGrid[gx * VOXEL_GRID_RES + gz] & checkMask) === 0) {
      break;
    }
    x += outwardDirX * 2.4;
    z += outwardDirZ * 2.4;
  }

  // 2. Kiểm tra thêm với Hull Envelope cục bộ tại độ cao Y để đường cong mượt mà
  const dx = x - centerX;
  const dz = z - centerZ;
  const dist = Math.hypot(dx, dz);
  const dirX = dist > 0.25 ? dx / dist : outwardDirX;
  const dirZ = dist > 0.25 ? dz / dist : outwardDirZ;

  let angIdx = Math.floor(((Math.atan2(dirZ, dirX) + Math.PI) / (Math.PI * 2)) * radialBins);
  angIdx = ((angIdx % radialBins) + radialBins) % radialBins;
  const hIdx = Math.max(0, Math.min(heightBins - 1, Math.floor((y / Math.max(1, maxY)) * (heightBins - 1))));

  const localHullR = hullEnvelope[angIdx * heightBins + hIdx];
  if (localHullR > 1.0 && dist < localHullR + clearance) {
    const targetR = localHullR + clearance;
    // Chỉ đẩy ra tới biên vỏ ngoài nếu điểm vốn đang bị chìm trong vỏ
    if (targetR - dist <= 32.0) {
      x = centerX + dirX * targetR;
      z = centerZ + dirZ * targetR;
    }
  }

  return new THREE.Vector3(x, y, z);
}

/**
 * Tìm vị trí đặt gốc cây (Root Position) chuẩn vật lý Bambu Studio:
 * - Dùng lưới Voxel Bitmask 3D kiểm tra toàn bộ cột không gian thẳng đứng từ mặt bàn in (Y = 0)
 *   lên đến độ cao tách nhánh (minClusterY - 3mm) phải HOÀN TOÀN TRỐNG (không vướng chân đế, đuôi, thân hay cánh dưới).
 * - Gốc cây trên bàn in luôn được đặt BÊN NGOÀI hình chiếu thân mô hình (cách mép >= 3mm) để thân chính mọc ngoài mô hình
 *   rồi mới uốn cành nghiêng vào đỡ điểm Overhang.
 */
function findOptimalRootPosition(
  avgX: number,
  avgZ: number,
  minClusterY: number,
  maxClusterFloorY: number,
  centerX: number,
  centerZ: number,
  maxY: number,
  voxelGrid: Int32Array,
  hullRadialProfile: Float32Array,
  radialBins: number,
  buildPlateOnly: boolean,
  branchAngleDeg: number = 45
): {
  canReach: boolean;
  rootX: number;
  rootY: number;
  rootZ: number;
  normX: number;
  normZ: number;
  isGroundedOnBed: boolean;
} {
  const dx = avgX - centerX;
  const dz = avgZ - centerZ;
  const dist = Math.hypot(dx, dz);
  const normX = dist > 0.05 ? dx / dist : 0;
  const normZ = dist > 0.05 ? dz / dist : 1;

  // Mask kiểm tra toàn bộ cột thẳng đứng từ Y = 0 lên đến ngay dưới cụm Overhang (minClusterY - 3.0mm)
  const topCheckBit = Math.max(1, heightToBit(Math.max(0.5, minClusterY - 3.2), maxY));
  let columnMask = 0;
  for (let b = 0; b <= topCheckBit; b++) {
    columnMask |= 1 << b;
  }

  // Khoảng vươn ngang tối đa theo góc nghiêng nhánh Tree Support (mặc định ~45° -> tan <= 1.0)
  const maxTan = Math.tan((Math.min(54, Math.max(30, branchAngleDeg)) * Math.PI) / 180);
  const maxHorizontalReach = Math.min(56.0, Math.max(14.0, minClusterY * maxTan * 0.85));

  // Quét 16 hướng ưu tiên hướng vươn ra ngoài tâm mô hình để tìm hành lang thẳng đứng hoàn toàn trống
  const baseAngle = Math.atan2(normZ, normX);
  const angleOffsets = [
    0,
    0.22,
    -0.22,
    0.45,
    -0.45,
    0.7,
    -0.7,
    0.95,
    -0.95,
    1.25,
    -1.25,
    1.6,
    -1.6,
    2.0,
    -2.0,
    Math.PI,
  ];

  let bestBedX = 0;
  let bestBedZ = 0;
  let bestCost = Infinity;
  let bestDirX = normX;
  let bestDirZ = normZ;

  for (const dAng of angleOffsets) {
    const ang = baseAngle + dAng;
    const ux = Math.cos(ang);
    const uz = Math.sin(ang);

    // Tìm bán kính vỏ bao ngoài theo hướng này để ưu tiên đặt gốc cây bên ngoài chu vi mẫu
    let angIdx = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * radialBins);
    angIdx = ((angIdx % radialBins) + radialBins) % radialBins;

    for (let r = 3.5; r <= maxHorizontalReach; r += 2.5) {
      const tx = avgX + ux * r;
      const tz = avgZ + uz * r;
      if (Math.abs(tx) > 122 || Math.abs(tz) > 122) break;

      const [gx, gz] = worldToVoxelXZ(tx, tz);
      // Cột không gian từ mặt bàn (bit 0) lên tới topCheckBit phải hoàn toàn không vướng mô hình!
      if ((voxelGrid[gx * VOXEL_GRID_RES + gz] & columnMask) === 0) {
        const distFromCenter = Math.hypot(tx - centerX, tz - centerZ);
        const anglePenalty = Math.abs(dAng) * 5.5;
        const cost = r + anglePenalty - Math.min(6.0, distFromCenter * 0.08);
        if (cost < bestCost) {
          bestCost = cost;
          // Dịch thêm 1.5mm ra ngoài để gốc cây thoáng đãng
          bestBedX = tx + ux * 1.5;
          bestBedZ = tz + uz * 1.5;
          bestDirX = ux;
          bestDirZ = uz;
        }
        break;
      }
    }
  }

  if (bestCost < Infinity) {
    return {
      canReach: true,
      rootX: bestBedX,
      rootY: 0.14,
      rootZ: bestBedZ,
      normX: bestDirX,
      normZ: bestDirZ,
      isGroundedOnBed: true,
    };
  }

  // Nếu người dùng TẮT "Chỉ bám bàn in" (Support Everywhere = buildPlateOnly: false)
  // và có bề mặt mô hình bên dưới đủ thấp, cho phép đặt chân nhánh ngắn trên bề mặt đó nếu khoảng giữa trống
  if (!buildPlateOnly && maxClusterFloorY > 0.5 && minClusterY - maxClusterFloorY >= 6.0) {
    const floorBit = heightToBit(maxClusterFloorY + 2.5, maxY);
    let midMask = 0;
    for (let b = floorBit; b <= topCheckBit; b++) {
      midMask |= 1 << b;
    }
    const [gx, gz] = worldToVoxelXZ(avgX, avgZ);
    if ((voxelGrid[gx * VOXEL_GRID_RES + gz] & midMask) === 0) {
      return {
        canReach: true,
        rootX: avgX + normX * 1.0,
        rootY: maxClusterFloorY + 0.18,
        rootZ: avgZ + normZ * 1.0,
        normX,
        normZ,
        isGroundedOnBed: false,
      };
    }
  }

  // Nếu không thể tiếp cận từ bên ngoài mà không đâm xuyên qua mô hình -> Bỏ qua cụm này!
  return {
    canReach: false,
    rootX: avgX,
    rootY: 0.14,
    rootZ: avgZ,
    normX,
    normZ,
    isGroundedOnBed: true,
  };
}

interface IBranchTargetTip {
  tipPoint: THREE.Vector3;
  tipNormal: THREE.Vector3;
  floorY: number;
}

/**
 * Tách một mảng Overhang (Patch) thành 1–3 điểm đầu nhánh (Twig Tips) tùy diện tích
 */
function extractTargetTipsFromPatch(
  patch: IConformalOverhangPatch,
  allowMultiTips: boolean
): IBranchTargetTip[] {
  const [cx, cy, cz] = patch.center;
  const [nx, ny, nz] = patch.normal;
  const baseNormal = new THREE.Vector3(nx, ny, nz).normalize();

  if (!allowMultiTips || patch.triangles.length < 4) {
    return [
      {
        tipPoint: new THREE.Vector3(cx, cy, cz),
        tipNormal: baseNormal,
        floorY: patch.floorY,
      },
    ];
  }

  let farIdx1 = 0;
  let maxD1 = -1;
  for (let i = 0; i < patch.triangles.length; i++) {
    const t = patch.triangles[i];
    const d = Math.hypot(t.mx - cx, t.my - cy, t.mz - cz);
    if (d > maxD1) {
      maxD1 = d;
      farIdx1 = i;
    }
  }

  const t1 = patch.triangles[farIdx1];
  let farIdx2 = 0;
  let maxD2 = -1;
  for (let i = 0; i < patch.triangles.length; i++) {
    const t = patch.triangles[i];
    const d = Math.hypot(t.mx - t1.mx, t.my - t1.my, t.mz - t1.mz);
    if (d > maxD2) {
      maxD2 = d;
      farIdx2 = i;
    }
  }
  const t2 = patch.triangles[farIdx2];

  if (maxD2 < 2.2) {
    return [
      {
        tipPoint: new THREE.Vector3(cx, cy, cz),
        tipNormal: baseNormal,
        floorY: patch.floorY,
      },
    ];
  }

  return [
    {
      tipPoint: new THREE.Vector3(t1.mx, t1.my, t1.mz),
      tipNormal: new THREE.Vector3(t1.nx, t1.ny, t1.nz).normalize(),
      floorY: patch.floorY,
    },
    {
      tipPoint: new THREE.Vector3(t2.mx, t2.my, t2.mz),
      tipNormal: new THREE.Vector3(t2.nx, t2.ny, t2.nz).normalize(),
      floorY: patch.floorY,
    },
  ];
}

/**
 * 4. Khởi tạo cụm cấu trúc Tree Support chuẩn kỹ thuật Bambu Studio:
 * - Gốc cây đặt ở hành lang trống BÊN NGOÀI thân mô hình trên bàn in PEI.
 * - Thân cây uốn cong vòng qua vỏ bao 3D (Voxel + Hull Avoidance) rồi phân nhánh chữ Y đỡ đúng các mặt nghiêng Overhang.
 * - Tuyệt đối không tạo các cột thẳng đứng đâm xuyên qua thân hay cánh mô hình.
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

  const effectiveThreshold = profile.supportAngleThreshold || overhangThreshold || 45;
  let overhangData = extractExteriorOverhangData(geometry, effectiveThreshold);
  if (overhangData.patches.length === 0 && effectiveThreshold < 58) {
    overhangData = extractExteriorOverhangData(geometry, 58);
  }
  const {
    patches,
    voxelGrid,
    hullRadialProfile,
    hullEnvelope,
    radialBins,
    heightBins,
    centerX,
    centerZ,
    maxY,
  } = overhangData;

  if (patches.length === 0) {
    return supportGroup;
  }

  const supportMat = new THREE.MeshStandardMaterial({
    color: 0x00e050,
    roughness: 0.34,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const interfaceMat = new THREE.MeshStandardMaterial({
    color: 0xd946ef,
    roughness: 0.25,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const brimMat = new THREE.MeshStandardMaterial({
    color: 0xc026d3,
    roughness: 0.38,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const style: TreeSupportStyle = profile.treeStyle || 'organic';
  const branchDiameterScale = Math.max(0.65, Math.min(1.5, (profile.supportBranchDiameter || 2.0) / 2.2));
  const branchAngleDeg = profile.supportBranchAngle || 45;
  const branchAngleScale = branchAngleDeg / 45;

  let dMerge = Math.min(20.0, Math.max(10.0, maxY * 0.14)) * branchAngleScale;
  let tipRadius = 0.65 * branchDiameterScale;
  let maxTrunkRadius = 1.95 * branchDiameterScale;

  if (style === 'slim') {
    dMerge = Math.min(16.0, Math.max(8.5, maxY * 0.12)) * branchAngleScale;
    tipRadius = 0.52 * branchDiameterScale;
    maxTrunkRadius = 1.55 * branchDiameterScale;
  } else if (style === 'strong') {
    dMerge = Math.min(24.0, Math.max(12.0, maxY * 0.16)) * branchAngleScale;
    tipRadius = 0.82 * branchDiameterScale;
    maxTrunkRadius = 2.45 * branchDiameterScale;
  } else if (style === 'hybrid') {
    dMerge = Math.min(21.0, Math.max(11.0, maxY * 0.15)) * branchAngleScale;
    tipRadius = 0.72 * branchDiameterScale;
    maxTrunkRadius = 2.15 * branchDiameterScale;
  }

  const topZDist = profile.supportTopZDistance ?? 0.2;
  const interfaceLayers = profile.supportInterfaceLayers ?? 2;
  const buildPlateOnly = profile.supportOnBuildPlateOnly !== false;

  const branchGeoms: THREE.BufferGeometry[] = [];
  const junctionGeoms: THREE.BufferGeometry[] = [];
  const interfaceGeoms: THREE.BufferGeometry[] = [];
  const brimGeoms: THREE.BufferGeometry[] = [];

  if (profile.supportMode === 'tree') {
    const visited = new Set<number>();
    const clusters: IConformalOverhangPatch[][] = [];
    const maxYMerge = Math.min(24.0, Math.max(10.0, maxY * 0.22));

    for (let i = 0; i < patches.length; i++) {
      if (visited.has(i)) continue;
      const cluster = [patches[i]];
      visited.add(i);

      const p1 = patches[i].center;

      for (let j = i + 1; j < patches.length; j++) {
        if (visited.has(j) || cluster.length >= 4) continue;
        const p2 = patches[j].center;
        const distXZ = Math.hypot(p1[0] - p2[0], p1[2] - p2[2]);
        const distY = Math.abs(p1[1] - p2[1]);

        if (distXZ <= dMerge && distY <= maxYMerge) {
          cluster.push(patches[j]);
          visited.add(j);
        }
      }
      clusters.push(cluster);
    }

    const rootPoints: { x: number; z: number; r: number }[] = [];

    for (const cluster of clusters) {
      const avgX = cluster.reduce((sum, p) => sum + p.center[0], 0) / cluster.length;
      const avgZ = cluster.reduce((sum, p) => sum + p.center[2], 0) / cluster.length;
      const minClusterY = Math.min(...cluster.map((p) => p.center[1]));
      const maxClusterFloorY = Math.max(...cluster.map((p) => p.floorY));
      const totalArea = cluster.reduce((sum, p) => sum + p.areaMm2, 0);

      if (minClusterY < 3.0) continue;

      const {
        canReach,
        rootX,
        rootY,
        rootZ,
        normX,
        normZ,
        isGroundedOnBed,
      } = findOptimalRootPosition(
        avgX,
        avgZ,
        minClusterY,
        maxClusterFloorY,
        centerX,
        centerZ,
        maxY,
        voxelGrid,
        hullRadialProfile,
        radialBins,
        buildPlateOnly,
        branchAngleDeg
      );

      if (!canReach) continue;

      const verticalSpan = minClusterY - rootY;
      if (verticalSpan < 2.5) continue;

      const targetTips: IBranchTargetTip[] = [];
      for (const patch of cluster) {
        const capGeom = buildPatchConformalCapGeometry(
          patch,
          tipRadius * 1.65,
          topZDist,
          interfaceLayers
        );
        if (capGeom) interfaceGeoms.push(capGeom);

        const tips = extractTargetTipsFromPatch(
          patch,
          cluster.length <= 2 && patch.triangles.length >= 6
        );
        targetTips.push(...tips);
      }

      const rootR = Math.min(
        maxTrunkRadius,
        Math.max(1.25, Math.sqrt(totalArea) * 0.14 + 0.95)
      );
      if (isGroundedOnBed) {
        rootPoints.push({ x: rootX, z: rootZ, r: rootR });
      }

      // Điểm chạc cây chính (Primary Bifurcation Node):
      // Giữ thân cây mọc ở hành lang BÊN NGOÀI mô hình (~72% về phía rootX/rootZ) rồi mới uốn cành vào ở trên cao!
      const splitY = rootY + Math.max(1.8, Math.min(verticalSpan - 1.5, verticalSpan * 0.68));
      const rawSplitPoint = new THREE.Vector3(
        rootX * 0.68 + avgX * 0.32,
        splitY,
        rootZ * 0.68 + avgZ * 0.32
      );
      const splitPoint = pushPointOutsideModelCollision(
        rawSplitPoint,
        rootR + 1.5,
        centerX,
        centerZ,
        maxY,
        voxelGrid,
        hullEnvelope,
        radialBins,
        heightBins,
        normX,
        normZ
      );

      const trunkMid1 = pushPointOutsideModelCollision(
        new THREE.Vector3(
          rootX * 0.92 + splitPoint.x * 0.08,
          rootY + (splitY - rootY) * 0.35,
          rootZ * 0.92 + splitPoint.z * 0.08
        ),
        rootR + 1.6,
        centerX,
        centerZ,
        maxY,
        voxelGrid,
        hullEnvelope,
        radialBins,
        heightBins,
        normX,
        normZ
      );

      const trunkMid2 = pushPointOutsideModelCollision(
        new THREE.Vector3(
          rootX * 0.65 + splitPoint.x * 0.35,
          rootY + (splitY - rootY) * 0.7,
          rootZ * 0.65 + splitPoint.z * 0.35
        ),
        rootR + 1.5,
        centerX,
        centerZ,
        maxY,
        voxelGrid,
        hullEnvelope,
        radialBins,
        heightBins,
        normX,
        normZ
      );

      const splitR = rootR * 0.74;
      const trunkPoints = [
        new THREE.Vector3(rootX, rootY, rootZ),
        trunkMid1,
        trunkMid2,
        splitPoint.clone(),
      ];

      const trunkGeom = createSmoothOrganicBranchGeom(
        trunkPoints,
        rootR,
        splitR,
        18,
        14,
        undefined,
        isGroundedOnBed
      );
      if (trunkGeom) branchGeoms.push(trunkGeom);

      const jointGeom = new THREE.SphereGeometry(splitR * 0.88, 10, 8);
      jointGeom.translate(splitPoint.x, splitPoint.y, splitPoint.z);
      junctionGeoms.push(jointGeom.toNonIndexed());

      const buildTwigFromNode = (
        startNode: THREE.Vector3,
        startRadius: number,
        target: IBranchTargetTip
      ) => {
        const { tipPoint, tipNormal } = target;
        const tx = tipPoint.x;
        const ty = tipPoint.y;
        const tz = tipPoint.z;

        const endPt = new THREE.Vector3(
          tx + tipNormal.x * 0.06,
          ty + tipNormal.y * 0.06,
          tz + tipNormal.z * 0.06
        );
        const branchSpanY = Math.max(0.6, ty - startNode.y);
        const neckDist = Math.min(1.4, Math.max(0.4, branchSpanY * 0.22));
        const neckPt = new THREE.Vector3(
          tx + tipNormal.x * neckDist * 0.65 + normX * 0.35,
          Math.min(ty - 0.2, Math.max(startNode.y + 0.25, ty - neckDist)),
          tz + tipNormal.z * neckDist * 0.65 + normZ * 0.35
        );

        const rawMidPt = new THREE.Vector3(
          startNode.x * 0.58 + neckPt.x * 0.42,
          startNode.y + (neckPt.y - startNode.y) * 0.55,
          startNode.z * 0.58 + neckPt.z * 0.42
        );
        const midPt = pushPointOutsideModelCollision(
          rawMidPt,
          startRadius + 1.0,
          centerX,
          centerZ,
          maxY,
          voxelGrid,
          hullEnvelope,
          radialBins,
          heightBins,
          normX,
          normZ
        );

        const subBranchPoints = [startNode.clone(), midPt, neckPt, endPt];

        const subTubeGeom = createSmoothOrganicBranchGeom(
          subBranchPoints,
          startRadius,
          tipRadius,
          14,
          12,
          { point: tipPoint, normal: tipNormal },
          false
        );
        if (subTubeGeom) branchGeoms.push(subTubeGeom);
      };

      if (targetTips.length >= 4) {
        const sortedTips = [...targetTips].sort(
          (a, b) =>
            Math.atan2(a.tipPoint.z - splitPoint.z, a.tipPoint.x - splitPoint.x) -
            Math.atan2(b.tipPoint.z - splitPoint.z, b.tipPoint.x - splitPoint.x)
        );
        const midIdx = Math.ceil(sortedTips.length / 2);
        const subGroups = [sortedTips.slice(0, midIdx), sortedTips.slice(midIdx)];

        for (const group of subGroups) {
          if (group.length === 1) {
            buildTwigFromNode(splitPoint, splitR * 0.84, group[0]);
            continue;
          }

          const gAvgX = group.reduce((s, t) => s + t.tipPoint.x, 0) / group.length;
          const gAvgY = Math.min(...group.map((t) => t.tipPoint.y));
          const gAvgZ = group.reduce((s, t) => s + t.tipPoint.z, 0) / group.length;

          const secY = Math.max(
            splitPoint.y + 0.6,
            Math.min(gAvgY - 0.6, splitPoint.y + (gAvgY - splitPoint.y) * 0.48)
          );
          const rawSecPoint = new THREE.Vector3(
            splitPoint.x * 0.58 + gAvgX * 0.42,
            secY,
            splitPoint.z * 0.58 + gAvgZ * 0.42
          );
          const secPoint = pushPointOutsideModelCollision(
            rawSecPoint,
            splitR + 1.1,
            centerX,
            centerZ,
            maxY,
            voxelGrid,
            hullEnvelope,
            radialBins,
            heightBins,
            normX,
            normZ
          );

          const secR = splitR * 0.72;
          const secBranchPts = [
            splitPoint.clone(),
            new THREE.Vector3(
              (splitPoint.x + secPoint.x) * 0.5,
              (splitPoint.y + secPoint.y) * 0.52,
              (splitPoint.z + secPoint.z) * 0.5
            ),
            secPoint.clone(),
          ];

          const secGeom = createSmoothOrganicBranchGeom(
            secBranchPts,
            splitR * 0.88,
            secR,
            12,
            12,
            undefined,
            false
          );
          if (secGeom) branchGeoms.push(secGeom);

          const secJoint = new THREE.SphereGeometry(secR * 0.88, 10, 8);
          secJoint.translate(secPoint.x, secPoint.y, secPoint.z);
          junctionGeoms.push(secJoint.toNonIndexed());

          for (const target of group) {
            buildTwigFromNode(secPoint, secR * 0.85, target);
          }
        }
      } else {
        for (const target of targetTips) {
          buildTwigFromNode(splitPoint, splitR * 0.85, target);
        }
      }
    }

    // Vành đế Tree Support Brim lớp 1 mỏng nhẹ chuẩn Bambu Studio
    rootPoints.forEach((root) => {
      const baseRootR = root.r * 1.15;
      const brimOuterR = baseRootR + 1.3;
      const brimPad = new THREE.CylinderGeometry(brimOuterR * 0.96, brimOuterR, 0.14, 20);
      brimPad.translate(root.x, 0.07, root.z);
      brimGeoms.push(brimPad.toNonIndexed());
    });
  } else {
    patches.forEach((patch) => {
      const [targetX, targetY, targetZ] = patch.center;
      const [nx, ny, nz] = patch.normal;
      if (targetY < 2.5) return;

      const {
        canReach,
        rootX,
        rootY,
        rootZ,
        isGroundedOnBed,
      } = findOptimalRootPosition(
        targetX,
        targetZ,
        targetY,
        patch.floorY,
        centerX,
        centerZ,
        maxY,
        voxelGrid,
        hullRadialProfile,
        radialBins,
        buildPlateOnly,
        25
      );
      if (!canReach) return;

      const colRadius = Math.max(0.9, Math.min(1.8, Math.sqrt(patch.areaMm2) * 0.24));
      const capGeom = buildPatchConformalCapGeometry(
        patch,
        colRadius * 1.35,
        topZDist,
        interfaceLayers
      );
      if (capGeom) interfaceGeoms.push(capGeom);

      const tipPoint = new THREE.Vector3(targetX, targetY, targetZ);
      const tipNormal = new THREE.Vector3(nx, ny, nz).normalize();

      const colPoints = [
        new THREE.Vector3(rootX, rootY, rootZ),
        new THREE.Vector3((rootX + targetX) * 0.5, (rootY + targetY) * 0.5, (rootZ + targetZ) * 0.5),
        new THREE.Vector3(
          targetX + tipNormal.x * 0.08,
          targetY + tipNormal.y * 0.08,
          targetZ + tipNormal.z * 0.08
        ),
      ];

      const colGeom = createSmoothOrganicBranchGeom(
        colPoints,
        colRadius,
        colRadius * 0.85,
        12,
        12,
        { point: tipPoint, normal: tipNormal },
        isGroundedOnBed
      );
      if (colGeom) branchGeoms.push(colGeom);

      if (isGroundedOnBed) {
        const footPad = new THREE.CylinderGeometry(colRadius + 1.0, colRadius + 1.1, 0.14, 16);
        footPad.translate(rootX, 0.07, rootZ);
        brimGeoms.push(footPad.toNonIndexed());
      }
    });
  }

  const mergedBranches = safeMergeGeometries([...branchGeoms, ...junctionGeoms]);
  if (mergedBranches) {
    const branchMesh = new THREE.Mesh(mergedBranches, supportMat);
    branchMesh.name = 'conformal_tree_branches';
    branchMesh.castShadow = true;
    branchMesh.receiveShadow = true;
    supportGroup.add(branchMesh);
  }

  const mergedInterfaces = safeMergeGeometries(interfaceGeoms);
  if (mergedInterfaces && (profile.supportInterfaceLayers ?? 2) > 0) {
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
