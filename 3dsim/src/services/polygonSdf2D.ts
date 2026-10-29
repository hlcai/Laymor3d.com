/**
 * Bộ giải Toán học Đa giác 2D Signed Distance Field (2D SDF) & Marching Squares tốc độ cao O(N)
 * -----------------------------------------------------------------------------------------------
 * Giải quyết triệt để 4 bài toán cốt lõi của Slicer chuẩn Bambu Studio trên trình duyệt:
 * 1. Exact 2D Euclidean Distance Transform (Felzenszwalb & Huttenlocher 2012) thời gian tuyến tính O(W*H).
 * 2. Chịu lỗi 100% với lưới STL/OBJ hở mặt, chồng lớp hoặc non-manifold (Scanline Even-Odd Safe Pairing).
 * 3. Sinh tường trong (Inner Walls) bằng đường đồng mức lùi sâu SDF = -offset: TỰ ĐỘNG TRIỆT TIÊU ở vách mỏng
 *    (< 1.6mm như màng cánh rồng, móng vuốt), không bao giờ tự cắt hay đâm xuyên ra ngoài mô hình.
 * 4. Cắt biên chuẩn xác cho hàm sóng 3D Implicit Gyroid, lục giác Honeycomb, Top/Bottom Solid Surface
 *    và biên dạng rỗng ruột hữu cơ của Tree Support 2.0.
 */

const INF_DIST_SQ = 1e12;

export class SdfGrid2D {
  public readonly width: number;
  public readonly height: number;
  public minX: number = 0;
  public minZ: number = 0;
  public cellSize: number = 0.5;

  /** Mặt nạ nhị phân: 1 = bên trong mặt cắt mô hình, 0 = bên ngoài */
  public readonly mask: Uint8Array;
  /** Trường khoảng cách có dấu (mm): âm (< 0) = bên trong, dương (> 0) = bên ngoài, 0 = biên */
  public readonly sdf: Float32Array;
  /** Bộ đệm nháp tái sử dụng để tránh cấp phát GC (Zero-Allocation trong vòng lặp 1.000 lớp) */
  private readonly distOutSq: Float32Array;
  private readonly distInSq: Float32Array;
  private readonly tmpGrid: Float32Array;
  private readonly fBuf: Float32Array;
  private readonly dBuf: Float32Array;
  private readonly vBuf: Int32Array;
  private readonly zBuf: Float32Array;
  private readonly rowHits: Float64Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const total = width * height;
    this.mask = new Uint8Array(total);
    this.sdf = new Float32Array(total);
    this.distOutSq = new Float32Array(total);
    this.distInSq = new Float32Array(total);
    this.tmpGrid = new Float32Array(total);

    const maxDim = Math.max(width, height) + 2;
    this.fBuf = new Float32Array(maxDim);
    this.dBuf = new Float32Array(maxDim);
    this.vBuf = new Int32Array(maxDim);
    this.zBuf = new Float32Array(maxDim + 1);
    this.rowHits = new Float64Array(2048);
  }

  public configureBounds(minX: number, minZ: number, cellSize: number): void {
    this.minX = minX;
    this.minZ = minZ;
    this.cellSize = Math.max(0.05, cellSize);
  }

  public clearMask(): void {
    this.mask.fill(0);
  }

  /**
   * Điền mặt nạ 2D từ mảng đoạn giao tuyến phẳng [x1, z1, x2, z2, ...]
   * Sử dụng quy tắc nửa mở [zMin, zMax) chống đếm kép đỉnh và tự bỏ qua cạnh lẻ ở lưới thủng.
   */
  public rasterizeSegments(segmentsXZ: Float32Array | number[], segCount: number): number {
    this.mask.fill(0);
    if (segCount <= 0) return 0;

    const w = this.width;
    const h = this.height;
    const cs = this.cellSize;
    const invCs = 1 / cs;
    const minX = this.minX;
    const minZ = this.minZ;
    const hits = this.rowHits;
    let filledPixels = 0;

    for (let gz = 0; gz < h; gz++) {
      const zRow = minZ + (gz + 0.5) * cs;
      let hitCount = 0;

      for (let s = 0; s < segCount; s++) {
        const base = s * 4;
        const x1 = segmentsXZ[base];
        const z1 = segmentsXZ[base + 1];
        const x2 = segmentsXZ[base + 2];
        const z2 = segmentsXZ[base + 3];

        if ((z1 <= zRow && z2 > zRow) || (z2 <= zRow && z1 > zRow)) {
          const t = (zRow - z1) / (z2 - z1);
          const hx = x1 + t * (x2 - x1);
          if (hitCount < hits.length) {
            hits[hitCount++] = hx;
          }
        }
      }

      if (hitCount < 2) continue;

      // Insertion sort cực nhanh cho mảng giao điểm nhỏ trên mỗi dòng quét
      for (let i = 1; i < hitCount; i++) {
        const key = hits[i];
        let j = i - 1;
        while (j >= 0 && hits[j] > key) {
          hits[j + 1] = hits[j];
          j--;
        }
        hits[j + 1] = key;
      }

      // Khử các điểm trùng khít (< 0.0002mm) chỉ khi tổng số điểm bị lẻ do lỗi lưới chồng đỉnh
      let cleanCount = hitCount;
      if ((cleanCount & 1) === 1) {
        let writeIdx = 1;
        for (let i = 1; i < cleanCount; i++) {
          if (Math.abs(hits[i] - hits[writeIdx - 1]) > 2e-4) {
            hits[writeIdx++] = hits[i];
          }
        }
        cleanCount = writeIdx;
      }

      const pairLimit = cleanCount & ~1; // Đảm bảo chẵn cặp vào-ra, miễn nhiễm sọc ngang khi STL thủng
      const rowOffset = gz * w;

      for (let p = 0; p < pairLimit; p += 2) {
        const xEnter = hits[p];
        const xExit = hits[p + 1];
        if (xExit - xEnter < 1e-4) continue;

        let gxStart = Math.ceil((xEnter - minX) * invCs - 0.5);
        let gxEnd = Math.floor((xExit - minX) * invCs - 0.5);
        if (gxStart < 0) gxStart = 0;
        if (gxEnd >= w) gxEnd = w - 1;

        for (let gx = gxStart; gx <= gxEnd; gx++) {
          if (this.mask[rowOffset + gx] === 0) {
            this.mask[rowOffset + gx] = 1;
            filledPixels++;
          }
        }
      }
    }

    return filledPixels;
  }

  /**
   * Thuật toán biến đổi khoảng cách bình phương 1D chính xác O(N) (Felzenszwalb & Huttenlocher)
   */
  private edt1D(n: number): void {
    const f = this.fBuf;
    const d = this.dBuf;
    const v = this.vBuf;
    const z = this.zBuf;

    let k = 0;
    v[0] = 0;
    z[0] = -INF_DIST_SQ;
    z[1] = INF_DIST_SQ;

    for (let q = 1; q < n; q++) {
      let vk = v[k];
      let s = (f[q] + q * q - (f[vk] + vk * vk)) / (2 * q - 2 * vk);
      while (s <= z[k]) {
        k--;
        vk = v[k];
        s = (f[q] + q * q - (f[vk] + vk * vk)) / (2 * q - 2 * vk);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF_DIST_SQ;
    }

    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) {
        k++;
      }
      const dx = q - v[k];
      d[q] = dx * dx + f[v[k]];
    }
  }

  private runEdt2D(binaryTargetValue: number, outDistSq: Float32Array): void {
    const w = this.width;
    const h = this.height;
    const mask = this.mask;
    const tmp = this.tmpGrid;
    const f = this.fBuf;
    const d = this.dBuf;

    // Pass 1: Chạy EDT 1D theo từng hàng ngang X
    for (let gz = 0; gz < h; gz++) {
      const rowOff = gz * w;
      for (let gx = 0; gx < w; gx++) {
        f[gx] = mask[rowOff + gx] === binaryTargetValue ? 0 : INF_DIST_SQ;
      }
      this.edt1D(w);
      for (let gx = 0; gx < w; gx++) {
        tmp[rowOff + gx] = d[gx];
      }
    }

    // Pass 2: Chạy EDT 1D theo từng cột dọc Z
    for (let gx = 0; gx < w; gx++) {
      for (let gz = 0; gz < h; gz++) {
        f[gz] = tmp[gz * w + gx];
      }
      this.edt1D(h);
      for (let gz = 0; gz < h; gz++) {
        outDistSq[gz * w + gx] = d[gz];
      }
    }
  }

  /**
   * Tính trường khoảng cách Euclid có dấu (Signed Distance Field) tính theo đơn vị milimet:
   * - sdf < 0: Điểm nằm bên trong mặt cắt (giá trị tuyệt đối là khoảng cách tới biên gần nhất)
   * - sdf > 0: Điểm nằm bên ngoài mặt cắt (giá trị là khoảng cách tới bề mặt mô hình)
   */
  public computeSignedDistanceField(): void {
    const total = this.width * this.height;
    let hasInside = false;
    for (let i = 0; i < total; i++) {
      if (this.mask[i] === 1) {
        hasInside = true;
        break;
      }
    }

    if (!hasInside) {
      this.sdf.fill(1e4);
      return;
    }

    // distOutSq: khoảng cách tới ô bên trong gần nhất (bằng 0 nếu đang ở trong)
    this.runEdt2D(1, this.distOutSq);
    // distInSq: khoảng cách tới ô bên ngoài gần nhất (bằng 0 nếu đang ở ngoài)
    this.runEdt2D(0, this.distInSq);

    const cs = this.cellSize;
    const halfCs = 0.5 * cs;
    const outSdf = this.sdf;
    const dOut = this.distOutSq;
    const dIn = this.distInSq;
    const mask = this.mask;

    for (let i = 0; i < total; i++) {
      if (mask[i] === 1) {
        // Bên trong: ở tâm ô sát biên nhất dIn = 1 -> khoảng cách tới mép biên là 0.5 * cs
        outSdf[i] = -(Math.sqrt(dIn[i]) * cs - halfCs);
      } else {
        // Bên ngoài: ở tâm ô sát biên nhất dOut = 1 -> khoảng cách tới mép biên là 0.5 * cs
        outSdf[i] = Math.sqrt(dOut[i]) * cs - halfCs;
      }
    }
  }

  /**
   * Nội suy song tuyến tính giá trị SDF (mm) tại tọa độ thế giới (x, z) bất kỳ
   */
  public sampleSdfWorld(x: number, z: number): number {
    const fx = (x - this.minX) / this.cellSize - 0.5;
    const fz = (z - this.minZ) / this.cellSize - 0.5;
    const w = this.width;
    const h = this.height;

    if (fx < 0 || fz < 0 || fx >= w - 1 || fz >= h - 1) {
      // Ngoại suy tuyến tính mượt khi điểm nằm ngoài khung lưới SDF
      const cx = Math.max(0, Math.min(w - 1, Math.round(fx)));
      const cz = Math.max(0, Math.min(h - 1, Math.round(fz)));
      const edgeVal = this.sdf[cz * w + cx];
      const overX = fx < 0 ? -fx : fx > w - 1 ? fx - (w - 1) : 0;
      const overZ = fz < 0 ? -fz : fz > h - 1 ? fz - (h - 1) : 0;
      return edgeVal + Math.hypot(overX, overZ) * this.cellSize;
    }

    const x0 = Math.floor(fx);
    const z0 = Math.floor(fz);
    const tx = fx - x0;
    const tz = fz - z0;

    const row0 = z0 * w;
    const row1 = (z0 + 1) * w;
    const v00 = this.sdf[row0 + x0];
    const v10 = this.sdf[row0 + x0 + 1];
    const v01 = this.sdf[row1 + x0];
    const v11 = this.sdf[row1 + x0 + 1];

    const v0 = v00 + (v10 - v00) * tx;
    const v1 = v01 + (v11 - v01) * tx;
    return v0 + (v1 - v0) * tz;
  }

  /**
   * Tính vector gradient chuẩn hóa (hướng thoát ra xa bề mặt mô hình nhanh nhất) tại (x, z)
   */
  public sampleGradientWorld(x: number, z: number): [number, number] {
    const eps = this.cellSize * 0.75;
    const gx = this.sampleSdfWorld(x + eps, z) - this.sampleSdfWorld(x - eps, z);
    const gz = this.sampleSdfWorld(x, z + eps) - this.sampleSdfWorld(x, z - eps);
    const len = Math.hypot(gx, gz);
    if (len < 1e-6) return [0, 0];
    return [gx / len, gz / len];
  }
}

/**
 * Hàm hợp trơn đa thức (Polynomial Smooth-Min - Inigo Quilez) giúp các nhánh Tree Support 2.0
 * tự hòa quyện tiết diện mượt như rễ cây sinh học (2 hình tròn -> củ lạc -> bầu dục) không cần khớp cầu!
 */
export function sminPoly(a: number, b: number, k: number): number {
  if (k <= 1e-5) return a < b ? a : b;
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return (a < b ? a : b) - h * h * k * 0.25;
}

/**
 * Bảng cạnh cho 16 trường hợp của thuật toán Marching Squares 2D
 * Cạnh 0: Top (00->10), Cạnh 1: Right (10->11), Cạnh 2: Bottom (01->11), Cạnh 3: Left (00->01)
 */
const MS_EDGE_PAIRS: ReadonlyArray<ReadonlyArray<number>> = [
  [],
  [3, 0], // 1: v00 < iso
  [0, 1], // 2: v10 < iso
  [3, 1], // 3: v00, v10
  [1, 2], // 4: v11 < iso
  [3, 2, 0, 1], // 5: Saddle
  [0, 2], // 6: v10, v11
  [3, 2], // 7: v00, v10, v11
  [2, 3], // 8: v01 < iso
  [2, 0], // 9: v00, v01
  [0, 3, 2, 1], // 10: Saddle
  [2, 1], // 11: v00, v10, v01
  [1, 3], // 12: v11, v01
  [1, 0], // 13: v00, v11, v01
  [0, 3], // 14: v10, v11, v01
  [], // 15: all inside
];

/**
 * Trích xuất các đoạn đường đồng mức mượt mà tại field == isoValue bằng Marching Squares nội suy tuyến tính.
 * Hỗ trợ giới hạn vùng ROI (gxMin..gxMax, gzMin..gzMax) và mặt nạ cắt biên (clipSdf / maxClipSdf).
 */
export function extractMarchingSquaresSegments(
  field: Float32Array,
  width: number,
  height: number,
  minX: number,
  minZ: number,
  cellSize: number,
  isoValue: number,
  renderY: number,
  outCoords: number[],
  options?: {
    gxMin?: number;
    gxMax?: number;
    gzMin?: number;
    gzMax?: number;
    clipSdf?: Float32Array;
    maxClipVal?: number;
  }
): number {
  const xStart = Math.max(0, options?.gxMin ?? 0);
  const xEnd = Math.min(width - 2, options?.gxMax ?? width - 2);
  const zStart = Math.max(0, options?.gzMin ?? 0);
  const zEnd = Math.min(height - 2, options?.gzMax ?? height - 2);

  const clipSdf = options?.clipSdf;
  const maxClipVal = options?.maxClipVal ?? 0;
  let emittedMm = 0;

  for (let gz = zStart; gz <= zEnd; gz++) {
    const row0 = gz * width;
    const row1 = (gz + 1) * width;
    const z0World = minZ + (gz + 0.5) * cellSize;
    const z1World = z0World + cellSize;

    for (let gx = xStart; gx <= xEnd; gx++) {
      if (clipSdf) {
        const c00 = clipSdf[row0 + gx];
        const c10 = clipSdf[row0 + gx + 1];
        const c01 = clipSdf[row1 + gx];
        const c11 = clipSdf[row1 + gx + 1];
        // Chỉ giữ đoạn ruột in nằm trọn bên trong vùng tường trong cùng
        if (c00 > maxClipVal && c10 > maxClipVal && c01 > maxClipVal && c11 > maxClipVal) {
          continue;
        }
        const avgClip = (c00 + c10 + c01 + c11) * 0.25;
        if (avgClip > maxClipVal) continue;
      }

      const v00 = field[row0 + gx] - isoValue;
      const v10 = field[row0 + gx + 1] - isoValue;
      const v11 = field[row1 + gx + 1] - isoValue;
      const v01 = field[row1 + gx] - isoValue;

      let mask = 0;
      if (v00 < 0) mask |= 1;
      if (v10 < 0) mask |= 2;
      if (v11 < 0) mask |= 4;
      if (v01 < 0) mask |= 8;

      if (mask === 0 || mask === 15) continue;

      const edges = MS_EDGE_PAIRS[mask];
      const x0World = minX + (gx + 0.5) * cellSize;
      const x1World = x0World + cellSize;

      for (let e = 0; e < edges.length; e += 2) {
        const eA = edges[e];
        const eB = edges[e + 1];

        let ax = x0World,
          az = z0World;
        if (eA === 0) {
          const t = v00 / (v00 - v10 || 1e-6);
          ax = x0World + Math.max(0, Math.min(1, t)) * cellSize;
          az = z0World;
        } else if (eA === 1) {
          const t = v10 / (v10 - v11 || 1e-6);
          ax = x1World;
          az = z0World + Math.max(0, Math.min(1, t)) * cellSize;
        } else if (eA === 2) {
          const t = v01 / (v01 - v11 || 1e-6);
          ax = x0World + Math.max(0, Math.min(1, t)) * cellSize;
          az = z1World;
        } else {
          const t = v00 / (v00 - v01 || 1e-6);
          ax = x0World;
          az = z0World + Math.max(0, Math.min(1, t)) * cellSize;
        }

        let bx = x0World,
          bz = z0World;
        if (eB === 0) {
          const t = v00 / (v00 - v10 || 1e-6);
          bx = x0World + Math.max(0, Math.min(1, t)) * cellSize;
          bz = z0World;
        } else if (eB === 1) {
          const t = v10 / (v10 - v11 || 1e-6);
          bx = x1World;
          bz = z0World + Math.max(0, Math.min(1, t)) * cellSize;
        } else if (eB === 2) {
          const t = v01 / (v01 - v11 || 1e-6);
          bx = x0World + Math.max(0, Math.min(1, t)) * cellSize;
          bz = z1World;
        } else {
          const t = v00 / (v00 - v01 || 1e-6);
          bx = x0World;
          bz = z0World + Math.max(0, Math.min(1, t)) * cellSize;
        }

        const segLen = Math.hypot(bx - ax, bz - az);
        if (segLen < 0.015) continue;

        outCoords.push(ax, renderY, az, bx, renderY, bz);
        emittedMm += segLen;
      }
    }
  }

  return emittedMm;
}

/**
 * Sinh đường chạy dao Ruột in Sóng 3D Gyroid Thực Tế (True 3D Implicit Minimal Surface Gyroid):
 * sin(k*x)*cos(k*z) + sin(k*z)*cos(k*y) + sin(k*y)*cos(k*x) = 0
 * Tự động dịch pha uốn lượn liên tục giữa các lớp Z và bị cắt gọn 100% bên trong tường trong cùng!
 */
export function extractTrue3DGyroidInfill(
  sdfGrid: SdfGrid2D,
  worldY: number,
  renderY: number,
  infillDensityPercent: number,
  infillClipMarginMm: number,
  scratchField: Float32Array,
  outInfills: number[],
  excludeMask?: Uint8Array
): number {
  const density = Math.max(5, Math.min(90, infillDensityPercent));
  // Bước sóng Gyroid thực tế trong Bambu Studio: 15% ~ chu kỳ ~8.5mm, 25% ~ chu kỳ ~5.2mm
  const periodMm = Math.max(3.2, Math.min(18.0, 130 / density));
  const freq = (Math.PI * 2) / periodMm;

  const w = sdfGrid.width;
  const h = sdfGrid.height;
  const minX = sdfGrid.minX;
  const minZ = sdfGrid.minZ;
  const cs = sdfGrid.cellSize;
  const sdf = sdfGrid.sdf;
  const clipThresh = -Math.max(0.15, infillClipMarginMm);

  const ky = worldY * freq;
  const sinY = Math.sin(ky);
  const cosY = Math.cos(ky);

  let hasActiveCell = false;
  for (let gz = 0; gz < h; gz++) {
    const row = gz * w;
    const kz = (minZ + (gz + 0.5) * cs) * freq;
    const sinZ = Math.sin(kz);
    const cosZ = Math.cos(kz);

    for (let gx = 0; gx < w; gx++) {
      const idx = row + gx;
      if (sdf[idx] <= clipThresh + cs * 1.5 && (!excludeMask || excludeMask[idx] === 0)) {
        hasActiveCell = true;
        const kx = (minX + (gx + 0.5) * cs) * freq;
        scratchField[idx] =
          Math.sin(kx) * cosZ + sinZ * cosY + sinY * Math.cos(kx);
      } else {
        scratchField[idx] = 1.0;
      }
    }
  }

  if (!hasActiveCell) return 0;

  // Xây dựng mặt nạ cắt kết hợp (loại trừ vùng đã lấp Top/Bottom Solid Shell)
  let clipArray = sdf;
  if (excludeMask) {
    // Đánh dấu những ô thuộc Top/Bottom Solid Shell thành dương để Gyroid nhường chỗ cho nắp đặc
    const combined = new Float32Array(w * h);
    for (let i = 0; i < combined.length; i++) {
      combined[i] = excludeMask[i] ? 10.0 : sdf[i];
    }
    clipArray = combined;
  }

  return extractMarchingSquaresSegments(
    scratchField,
    w,
    h,
    minX,
    minZ,
    cs,
    0.0,
    renderY,
    outInfills,
    {
      clipSdf: clipArray,
      maxClipVal: clipThresh,
    }
  );
}

/**
 * Sinh đường chạy dao Ruột Tổ Ong Lục Giác Thực (True Hexagonal Honeycomb) bị cắt gọn bên trong tường trong
 */
export function extractTrueHoneycombInfill(
  sdfGrid: SdfGrid2D,
  renderY: number,
  infillDensityPercent: number,
  infillClipMarginMm: number,
  outInfills: number[],
  excludeMask?: Uint8Array
): number {
  const density = Math.max(5, Math.min(85, infillDensityPercent));
  const hexSize = Math.max(2.0, Math.min(11.0, 75 / density));
  const dxStep = hexSize * 1.5;
  const dzStep = hexSize * Math.sqrt(3);

  const w = sdfGrid.width;
  const h = sdfGrid.height;
  const maxX = sdfGrid.minX + w * sdfGrid.cellSize;
  const maxZ = sdfGrid.minZ + h * sdfGrid.cellSize;
  const clipThresh = -Math.max(0.15, infillClipMarginMm);
  const invCs = 1 / sdfGrid.cellSize;

  let emittedMm = 0;

  const tryEmitClippedEdge = (x1: number, z1: number, x2: number, z2: number) => {
    const mx = (x1 + x2) * 0.5;
    const mz = (z1 + z2) * 0.5;
    const gx = Math.floor((mx - sdfGrid.minX) * invCs);
    const gz = Math.floor((mz - sdfGrid.minZ) * invCs);
    if (gx < 0 || gz < 0 || gx >= w || gz >= h) return;
    if (excludeMask && excludeMask[gz * w + gx] === 1) return;

    const s1 = sdfGrid.sampleSdfWorld(x1, z1);
    const s2 = sdfGrid.sampleSdfWorld(x2, z2);
    if (s1 > clipThresh && s2 > clipThresh) return;

    let ax = x1,
      az = z1,
      bx = x2,
      bz = z2;
    if (s1 > clipThresh) {
      const t = (clipThresh - s1) / (s2 - s1 || 1e-6);
      ax = x1 + t * (x2 - x1);
      az = z1 + t * (z2 - z1);
    } else if (s2 > clipThresh) {
      const t = (clipThresh - s1) / (s2 - s1 || 1e-6);
      bx = x1 + t * (x2 - x1);
      bz = z1 + t * (z2 - z1);
    }

    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.05) return;
    outInfills.push(ax, renderY, az, bx, renderY, bz);
    emittedMm += len;
  };

  const colStart = Math.floor(sdfGrid.minX / dxStep) - 1;
  const colEnd = Math.ceil(maxX / dxStep) + 1;
  const rowStart = Math.floor(sdfGrid.minZ / dzStep) - 1;
  const rowEnd = Math.ceil(maxZ / dzStep) + 1;
  const halfH = dzStep * 0.5;

  for (let col = colStart; col <= colEnd; col++) {
    const cx = col * dxStep;
    const zShift = (col & 1) !== 0 ? halfH : 0;

    for (let row = rowStart; row <= rowEnd; row++) {
      const cz = row * dzStep + zShift;
      // Vẽ 3 cạnh dương của mỗi ô tổ ong để không trùng cạnh với ô kế bên
      const v0x = cx - hexSize * 0.5,
        v0z = cz - halfH;
      const v1x = cx + hexSize * 0.5,
        v1z = cz - halfH;
      const v2x = cx + hexSize,
        v2z = cz;
      const v3x = cx + hexSize * 0.5,
        v3z = cz + halfH;

      tryEmitClippedEdge(v0x, v0z, v1x, v1z);
      tryEmitClippedEdge(v1x, v1z, v2x, v2z);
      tryEmitClippedEdge(v2x, v2z, v3x, v3z);
    }
  }

  return emittedMm;
}

/**
 * Sinh đường lấp đầy đặc Monotonic +-45° cho vùng Nắp Đỉnh (Top Solid Surface), Đáy (Bottom Surface) hoặc Cầu Nối (Bridge)
 */
export function extractSolidRegionRectilinear(
  sdfGrid: SdfGrid2D,
  regionMask: Uint8Array,
  renderY: number,
  layerIndex: number,
  lineSpacingMm: number,
  infillClipMarginMm: number,
  outCoords: number[]
): number {
  const w = sdfGrid.width;
  const h = sdfGrid.height;
  const cs = sdfGrid.cellSize;
  const minX = sdfGrid.minX;
  const minZ = sdfGrid.minZ;
  const clipThresh = -Math.max(0.12, infillClipMarginMm);

  const angle = layerIndex % 2 === 0 ? Math.PI * 0.25 : -Math.PI * 0.25;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const centerX = minX + w * cs * 0.5;
  const centerZ = minZ + h * cs * 0.5;
  const halfDiag = Math.hypot(w * cs, h * cs) * 0.55;
  const spacing = Math.max(0.42, lineSpacingMm);
  const stepAlong = Math.max(0.35, cs * 0.75);
  const invCs = 1 / cs;

  let emittedMm = 0;

  for (let v = -halfDiag; v <= halfDiag; v += spacing) {
    let inRun = false;
    let runStartX = 0;
    let runStartZ = 0;
    let prevX = 0;
    let prevZ = 0;

    for (let u = -halfDiag; u <= halfDiag; u += stepAlong) {
      const wx = centerX + u * cosA - v * sinA;
      const wz = centerZ + u * sinA + v * cosA;
      const gx = Math.floor((wx - minX) * invCs);
      const gz = Math.floor((wz - minZ) * invCs);

      const isActive =
        gx >= 0 &&
        gz >= 0 &&
        gx < w &&
        gz < h &&
        regionMask[gz * w + gx] === 1 &&
        sdfGrid.sdf[gz * w + gx] <= clipThresh;

      if (isActive) {
        if (!inRun) {
          inRun = true;
          runStartX = wx;
          runStartZ = wz;
        }
        prevX = wx;
        prevZ = wz;
      } else if (inRun) {
        inRun = false;
        const len = Math.hypot(prevX - runStartX, prevZ - runStartZ);
        if (len >= 0.25) {
          outCoords.push(runStartX, renderY, runStartZ, prevX, renderY, prevZ);
          emittedMm += len;
        }
      }
    }

    if (inRun) {
      const len = Math.hypot(prevX - runStartX, prevZ - runStartZ);
      if (len >= 0.25) {
        outCoords.push(runStartX, renderY, runStartZ, prevX, renderY, prevZ);
        emittedMm += len;
      }
    }
  }

  return emittedMm;
}
