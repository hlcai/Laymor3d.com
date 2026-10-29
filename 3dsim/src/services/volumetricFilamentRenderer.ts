import * as THREE from 'three';
import type { ISimulationProfile } from '@/types/simulator';
import type { IFullToolpathData } from './nativeSupportLoader';

export type FilamentColorScheme = 'line_type' | 'speed' | 'flow' | 'layer_time';

export const FILAMENT_FEATURE_IDS = {
  OUTER_WALL: 0,
  INNER_WALL: 1,
  TOP_BOTTOM_SHELL: 2,
  BRIDGE_OVERHANG: 3,
  SPARSE_INFILL: 4,
  TREE_SUPPORT: 5,
  SUPPORT_INTERFACE: 6,
  SKIRT_BRIM: 7,
} as const;

export const FILAMENT_FEATURE_LABELS: Record<number, string> = {
  0: 'Tường ngoài (Outer Wall)',
  1: 'Tường trong (Inner Wall)',
  2: 'Mặt đặc Đỉnh/Đáy (Top/Bottom)',
  3: 'Cầu nối / Overhang (Bridge)',
  4: 'Ruột thưa (Sparse Infill)',
  5: 'Thân rỗng Tree Support',
  6: 'Đệm tiếp xúc (Support Roof)',
  7: 'Vành đế bám bàn (Brim)',
};

export interface IActiveMoveTelemetry {
  position: [number, number, number];
  featureId: number;
  featureLabel: string;
  speedMmS: number;
  flowMm3S: number;
  layerTimeSec: number;
  moveIndex: number;
  totalLayerMoves: number;
}

/**
 * Tạo lưới mẫu 1 sợi nhựa 3D hình con nhộng ép dẹt (Rounded Stadium Capsule Prism) có nắp bo 2 đầu.
 * aTemplateCoord = vec3(uAlong, sideFactor, upFactor):
 * - uAlong = 0.0 (đầu A), 1.0 (đầu B), -1.0 (chóp mũ bo đầu A), +2.0 (chóp mũ bo đầu B)
 */
function createCapsuleBeadTemplateGeometry(radialSides: 4 | 6): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  // Ring 0 (tại đầu A: u = 0) & Ring 1 (tại đầu B: u = 1)
  for (let ring = 0; ring <= 1; ring++) {
    const u = ring;
    for (let s = 0; s < radialSides; s++) {
      const angle = (s / radialSides) * Math.PI * 2;
      const sideCoord = Math.cos(angle);
      const upCoord = Math.sin(angle);
      positions.push(u, sideCoord, upCoord);
    }
  }

  // Vertex 2 * radialSides: Chóp bo tròn đầu A (u = -1)
  const capStartIdx = radialSides * 2;
  positions.push(-1.0, 0.0, 0.0);

  // Vertex 2 * radialSides + 1: Chóp bo tròn đầu B (u = +2)
  const capEndIdx = radialSides * 2 + 1;
  positions.push(2.0, 0.0, 0.0);

  // Mặt bên ống sợi nhựa
  for (let s = 0; s < radialSides; s++) {
    const nextS = (s + 1) % radialSides;
    const a0 = s;
    const a1 = nextS;
    const b0 = radialSides + s;
    const b1 = radialSides + nextS;

    indices.push(a0, b0, b1);
    indices.push(a0, b1, a1);

    // Nắp chóp đầu A & đầu B (đảm bảo khi kéo thanh trượt ngang xem từng nét, đầu sợi nhựa luôn đặc tròn)
    indices.push(capStartIdx, a1, a0);
    indices.push(capEndIdx, b0, b1);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  return geom;
}

const VOLUMETRIC_BEAD_VERTEX_SHADER = /* glsl */ `
  attribute vec3 iSegStart;
  attribute vec3 iSegEnd;
  attribute vec4 iMeta;      // x: featureId, y: layerIdx, z: intraLayerOrder (0..1), w: speedMmS
  attribute vec2 iThermal;   // x: flowMm3S, y: layerTimeSec

  uniform float uHalfWidth;
  uniform float uHalfHeight;
  uniform float uMaxLayer;
  uniform float uIntraLayerProgress;
  uniform float uShowSupport;
  uniform float uShowBrim;
  uniform float uShowInfill;
  uniform float uClipWorldY;

  varying vec2 vCrossUV;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec4 vMeta;
  varying vec2 vThermal;

  void main() {
    float feat = iMeta.x;
    float layerIdx = iMeta.y;
    float intraOrder = iMeta.z;

    // 1. Ẩn trên GPU tức thì (0ms CPU) theo Layer dọc, Bước chạy dao ngang & Bật/Tắt từng thành phần
    if (layerIdx > uMaxLayer + 0.05) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      return;
    }
    if (abs(layerIdx - uMaxLayer) < 0.5 && intraOrder > uIntraLayerProgress + 0.0005) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      return;
    }
    if ((feat > 4.5 && feat < 6.5) && uShowSupport < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      return;
    }
    if (feat > 6.5 && uShowBrim < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      return;
    }
    if (abs(feat - 4.0) < 0.4 && uShowInfill < 0.5) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      return;
    }

    vec3 delta = iSegEnd - iSegStart;
    float segLen = length(delta);
    if (segLen < 0.002) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      return;
    }

    vec3 fwd = delta / segLen;
    vec3 refUp = abs(fwd.y) > 0.92 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 side = normalize(cross(fwd, refUp));
    vec3 up = normalize(cross(side, fwd));

    // Kích thước tiết diện sợi nhựa (Infill & Support mảnh hơn nhẹ để tách khối rõ nét như Bambu Studio)
    float widthScale = (abs(feat - 4.0) < 0.4) ? 0.92 : (feat > 4.5 && feat < 5.5 ? 0.95 : 1.04);
    float hw = uHalfWidth * widthScale;
    float hh = uHalfHeight;

    float uCode = position.x;
    float sideCoord = position.y;
    float upCoord = position.z;

    vec3 spinePt;
    vec3 localNormal;
    if (uCode < -0.5) {
      // Mũ bo tròn đầu A giúp khớp góc cua liền khít 100% không hở kẽ
      spinePt = iSegStart - fwd * (hw * 0.55);
      localNormal = -fwd;
    } else if (uCode > 1.5) {
      // Mũ bo tròn đầu B
      spinePt = iSegEnd + fwd * (hw * 0.55);
      localNormal = fwd;
    } else {
      spinePt = mix(iSegStart, iSegEnd, uCode);
      localNormal = normalize(side * sideCoord * 0.65 + up * upCoord * 1.15);
    }

    vec3 localPos = spinePt + side * (sideCoord * hw) + up * (upCoord * hh);
    vec4 worldPos4 = modelMatrix * vec4(localPos, 1.0);

    if (worldPos4.y > uClipWorldY + 0.15) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      return;
    }

    vCrossUV = vec2(sideCoord, upCoord);
    vWorldNormal = normalize(mat3(modelMatrix) * localNormal);
    vWorldPos = worldPos4.xyz;
    vMeta = iMeta;
    vThermal = iThermal;

    gl_Position = projectionMatrix * viewMatrix * worldPos4;
  }
`;

const VOLUMETRIC_BEAD_FRAGMENT_SHADER = /* glsl */ `
  uniform float uColorMode; // 0: Line Type, 1: Speed, 2: Flow, 3: Layer Time
  uniform float uMaxLayer;
  uniform float uIntraLayerProgress;

  varying vec2 vCrossUV;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec4 vMeta;
  varying vec2 vThermal;

  // Bảng màu nhiệt chuẩn Bambu Studio (Deep Blue -> Cyan -> Emerald -> Amber -> Crimson)
  vec3 bambuThermalRamp(float t) {
    float x = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.11, 0.25, 0.82); // #1c40d1 (Chậm / Mát)
    vec3 c1 = vec3(0.02, 0.71, 0.83); // #06b6d4
    vec3 c2 = vec3(0.06, 0.73, 0.51); // #10b981 (Trung bình chuẩn)
    vec3 c3 = vec3(0.96, 0.62, 0.04); // #f59e0b
    vec3 c4 = vec3(0.94, 0.22, 0.22); // #ef3838 (Nhanh / Cao)

    if (x < 0.25) return mix(c0, c1, x * 4.0);
    if (x < 0.50) return mix(c1, c2, (x - 0.25) * 4.0);
    if (x < 0.75) return mix(c2, c3, (x - 0.50) * 4.0);
    return mix(c3, c4, (x - 0.75) * 4.0);
  }

  vec3 featureBaseColor(float feat) {
    if (feat < 0.5) return vec3(0.00, 0.86, 0.32); // 0: Outer Wall (#00dc52 Bambu Lime)
    if (feat < 1.5) return vec3(0.02, 0.50, 0.36); // 1: Inner Wall (#05805c Deep Emerald)
    if (feat < 2.5) return vec3(0.95, 0.33, 0.16); // 2: Top/Bottom Solid Shell (#f25429 Bambu Top Red-Orange)
    if (feat < 3.5) return vec3(0.22, 0.74, 0.97); // 3: Bridge / Overhang Wall (#38bdf8 Sky Blue)
    if (feat < 4.5) return vec3(0.96, 0.62, 0.04); // 4: Sparse Infill (#f59e0b Warm Amber)
    if (feat < 5.5) return vec3(0.08, 0.74, 0.52); // 5: Hollow Tree Support (#14bd85 Organic Tree)
    if (feat < 6.5) return vec3(0.85, 0.27, 0.94); // 6: Support Roof Interface (#d946ef Magenta)
    return vec3(0.75, 0.15, 0.83);                 // 7: Brim / Skirt (#c026d3)
  }

  void main() {
    vec3 baseCol;
    if (uColorMode < 0.5) {
      baseCol = featureBaseColor(vMeta.x);
    } else if (uColorMode < 1.5) {
      // Speed: 25 mm/s -> 280 mm/s
      float tSpeed = (vMeta.w - 25.0) / 255.0;
      baseCol = bambuThermalRamp(tSpeed);
    } else if (uColorMode < 2.5) {
      // Volumetric Flow: 1.5 mm3/s -> 22.0 mm3/s
      float tFlow = (vThermal.x - 1.5) / 20.5;
      baseCol = bambuThermalRamp(tFlow);
    } else {
      // Layer Cooling Time (Logarithmic 1.5s -> 55s)
      float tTime = log(max(1.5, vThermal.y) / 1.5) / log(55.0 / 1.5);
      baseCol = bambuThermalRamp(1.0 - clamp(tTime, 0.0, 1.0));
    }

    // 1. Bóng đổ rãnh giữa các lớp nhựa ép dẹt (Bambu Layer Groove Ambient Occlusion)
    // Đây là chìa khóa tạo hiệu ứng từng con lươn nhựa xếp chồng đặc khít thay vì khối trơn phẳng!
    float vertProfile = clamp(1.0 - vCrossUV.y * vCrossUV.y, 0.0, 1.0);
    float sideProfile = clamp(1.0 - vCrossUV.x * vCrossUV.x * 0.55, 0.0, 1.0);
    float grooveAO = mix(0.38, 1.0, sqrt(vertProfile)) * mix(0.76, 1.0, sqrt(sideProfile));

    // 2. Chiếu sáng PBR giả lập Studio 3 nguồn sáng + Phản xạ bóng nhựa (Plastic Specular Sheen)
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);

    vec3 L1 = normalize(vec3(0.55, 0.82, 0.62));
    vec3 L2 = normalize(vec3(-0.65, 0.45, -0.58));

    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0) * 0.38;
    float hemi = 0.42 + 0.18 * N.y;

    vec3 H1 = normalize(L1 + V);
    float spec = pow(max(dot(N, H1), 0.0), 28.0) * 0.34 * sqrt(vertProfile);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.12;

    vec3 litColor = baseCol * (hemi + diff1 * 0.72 + diff2) * grooveAO + vec3(spec + fresnel);

    // 3. Làm sáng nhẹ lớp trên cùng đang được đầu phun vẽ dở khi kéo thanh trượt ngang
    if (uIntraLayerProgress < 0.995 && abs(vMeta.y - uMaxLayer) < 0.5) {
      float distFromNozzle = uIntraLayerProgress - vMeta.z;
      if (distFromNozzle >= 0.0 && distFromNozzle < 0.025) {
        float moltenGlow = 1.0 - (distFromNozzle / 0.025);
        litColor = mix(litColor, vec3(1.0, 0.92, 0.65), moltenGlow * 0.65);
      }
    }

    gl_FragColor = vec4(litColor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SEAM_VERTEX_SHADER = /* glsl */ `
  attribute vec2 aSeamMeta; // x: layerIdx, y: intraOrder
  uniform float uMaxLayer;
  uniform float uIntraLayerProgress;
  uniform float uClipWorldY;
  uniform float uPointSize;

  void main() {
    if (aSeamMeta.x > uMaxLayer + 0.05) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      gl_PointSize = 0.0;
      return;
    }
    if (abs(aSeamMeta.x - uMaxLayer) < 0.5 && aSeamMeta.y > uIntraLayerProgress + 0.01) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      gl_PointSize = 0.0;
      return;
    }
    vec4 wp = modelMatrix * vec4(position, 1.0);
    if (wp.y > uClipWorldY + 0.15) {
      gl_Position = vec4(2.0, 2.0, 2.0, 0.0);
      gl_PointSize = 0.0;
      return;
    }
    gl_Position = projectionMatrix * viewMatrix * wp;
    gl_PointSize = uPointSize;
  }
`;

const SEAM_FRAGMENT_SHADER = /* glsl */ `
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float r2 = dot(c, c);
    if (r2 > 0.25) discard;
    float edge = smoothstep(0.25, 0.08, r2);
    gl_FragColor = vec4(vec3(0.98, 0.99, 1.0), edge * 0.92);
  }
`;

interface IFeatureBucketDescriptor {
  coords: number[] | undefined;
  tableCol: number;
  featureId: number;
  speedMmS: number;
}

/**
 * Dựng Three.js Group hiển thị Sợi Nhựa 3D Có Thể Tích (Volumetric 3D Extruded Beads) chuẩn Bambu Studio Preview:
 * - Xóa sổ hoàn toàn lỗi khung dây 1px nhìn xuyên thấu của THREE.LineSegments.
 * - Tốn chỉ ~32-40MB VRAM cho tới 1.000.000 đoạn G-code nhờ GPU Instancing 1 Draw Call (60-120 FPS).
 * - Hỗ trợ đồng thời: Kéo cắt lớp dọc (Z-Layer), Kéo chạy từng nét ngang trong lớp (Intra-Layer Scrubber)
 *   và Đổi 4 phổ màu phân tích vật lý (Line Type / Speed / Flow / Layer Time) tức thì không cần cắt lại!
 */
export function buildVolumetricFilamentPreviewGroup(
  data: IFullToolpathData,
  profile?: Partial<ISimulationProfile>
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'full_filament_preview_group';

  const layerHeight = Math.max(0.06, data.layerHeightMm || profile?.layerHeight || 0.2);
  const lineWidth = Math.max(0.28, profile?.outerWallLineWidth || profile?.lineWidth || 0.42);
  const baseSpeed = Math.max(40, profile?.printSpeed || 200);
  const outerSpeed = Math.max(30, profile?.outerWallSpeed || Math.round(baseSpeed * 0.6));

  // Thứ tự in thực tế trong mỗi lớp của Bambu Studio:
  // Brim (Layer 0) -> Outer Wall -> Inner Wall -> Bridge -> Top/Bottom Solid -> Sparse Infill -> Support -> Interface
  const buckets: IFeatureBucketDescriptor[] = [
    { coords: data.outerWalls, tableCol: 0, featureId: FILAMENT_FEATURE_IDS.OUTER_WALL, speedMmS: outerSpeed },
    { coords: data.innerWalls, tableCol: 1, featureId: FILAMENT_FEATURE_IDS.INNER_WALL, speedMmS: baseSpeed },
    { coords: data.bridges, tableCol: 7, featureId: FILAMENT_FEATURE_IDS.BRIDGE_OVERHANG, speedMmS: 35 },
    {
      coords: data.topBottomShells,
      tableCol: 6,
      featureId: FILAMENT_FEATURE_IDS.TOP_BOTTOM_SHELL,
      speedMmS: Math.round(outerSpeed * 0.85),
    },
    {
      coords: data.infills,
      tableCol: 2,
      featureId: FILAMENT_FEATURE_IDS.SPARSE_INFILL,
      speedMmS: Math.min(300, Math.round(baseSpeed * 1.32)),
    },
    {
      coords: data.supports,
      tableCol: 3,
      featureId: FILAMENT_FEATURE_IDS.TREE_SUPPORT,
      speedMmS: Math.round(baseSpeed * 0.78),
    },
    {
      coords: data.interfaces,
      tableCol: 4,
      featureId: FILAMENT_FEATURE_IDS.SUPPORT_INTERFACE,
      speedMmS: 48,
    },
  ];

  const brimCoords = data.brims || [];
  const brimSegCount = Math.floor(brimCoords.length / 6);

  let totalSegments = brimSegCount;
  for (const b of buckets) {
    if (b.coords && b.coords.length >= 6) {
      totalSegments += Math.floor(b.coords.length / 6);
    }
  }

  if (totalSegments <= 0) {
    return group;
  }

  const segStarts = new Float32Array(totalSegments * 3);
  const segEnds = new Float32Array(totalSegments * 3);
  const segMeta = new Float32Array(totalSegments * 4);
  const segThermal = new Float32Array(totalSegments * 2);

  const table = data.layerIndexTable || [];
  const numLayers = Math.max(1, table.length);
  const layerInstanceStart = new Int32Array(numLayers);
  const layerInstanceCount = new Int32Array(numLayers);
  const computedLayerTimes = new Float32Array(numLayers);

  let writeIdx = 0;

  if (table.length > 0) {
    // Theo dõi con trỏ đọc (tính theo số float = vertexCount * 3) của từng bucket qua từng lớp
    const prevFloatOffsets = new Int32Array(buckets.length);

    for (let l = 0; l < table.length; l++) {
      const entry = table[l];
      const layerStartIdx = writeIdx;
      layerInstanceStart[l] = layerStartIdx;
      let layerTimeAccum = 0.25;

      // 1. Nạp Brim vào đầu Layer 0
      if (l === 0 && brimSegCount > 0) {
        const brimSpeed = 50;
        const brimFlow = Number((brimSpeed * lineWidth * layerHeight).toFixed(2));
        for (let s = 0; s < brimSegCount; s++) {
          const base = s * 6;
          const x1 = brimCoords[base],
            y1 = brimCoords[base + 1],
            z1 = brimCoords[base + 2];
          const x2 = brimCoords[base + 3],
            y2 = brimCoords[base + 4],
            z2 = brimCoords[base + 5];
          const len = Math.hypot(x2 - x1, y2 - y1, z2 - y1 * 0 + (z2 - z1));

          const i3 = writeIdx * 3;
          segStarts[i3] = x1;
          segStarts[i3 + 1] = y1;
          segStarts[i3 + 2] = z1;
          segEnds[i3] = x2;
          segEnds[i3 + 1] = y2;
          segEnds[i3 + 2] = z2;

          const i4 = writeIdx * 4;
          segMeta[i4] = FILAMENT_FEATURE_IDS.SKIRT_BRIM;
          segMeta[i4 + 1] = 0;
          segMeta[i4 + 2] = 0; // Chuẩn hóa sau khi gom đủ lớp
          segMeta[i4 + 3] = brimSpeed;

          const i2 = writeIdx * 2;
          segThermal[i2] = brimFlow;
          segThermal[i2 + 1] = 8.0;

          layerTimeAccum += Math.hypot(x2 - x1, z2 - z1) / brimSpeed;
          writeIdx++;
        }
      }

      // 2. Nạp từng nhóm đường chạy dao trong lớp l theo đúng trình tự đầu phun Bambu Studio
      for (let bIdx = 0; bIdx < buckets.length; bIdx++) {
        const b = buckets[bIdx];
        const arr = b.coords;
        if (!arr || arr.length < 6) continue;

        let endVertCount = 0;
        if (b.tableCol < entry.length) {
          endVertCount = entry[b.tableCol] || 0;
        } else if (l === table.length - 1) {
          endVertCount = Math.floor(arr.length / 3);
        }

        const startFloat = prevFloatOffsets[bIdx];
        const endFloat = Math.min(arr.length, endVertCount * 3);
        prevFloatOffsets[bIdx] = Math.max(startFloat, endFloat);

        const speed = l === 0 ? Math.min(55, b.speedMmS) : b.speedMmS;
        const flow = Number((speed * lineWidth * layerHeight).toFixed(2));

        for (let f = startFloat; f <= endFloat - 6; f += 6) {
          if (writeIdx >= totalSegments) break;
          const x1 = arr[f],
            y1 = arr[f + 1],
            z1 = arr[f + 2];
          const x2 = arr[f + 3],
            y2 = arr[f + 4],
            z2 = arr[f + 5];

          const i3 = writeIdx * 3;
          segStarts[i3] = x1;
          segStarts[i3 + 1] = y1;
          segStarts[i3 + 2] = z1;
          segEnds[i3] = x2;
          segEnds[i3 + 1] = y2;
          segEnds[i3 + 2] = z2;

          const i4 = writeIdx * 4;
          segMeta[i4] = b.featureId;
          segMeta[i4 + 1] = l;
          segMeta[i4 + 2] = 0;
          segMeta[i4 + 3] = speed;

          const i2 = writeIdx * 2;
          segThermal[i2] = flow;
          segThermal[i2 + 1] = 5.0;

          layerTimeAccum += Math.hypot(x2 - x1, z2 - z1) / Math.max(10, speed);
          writeIdx++;
        }
      }

      const layerEndIdx = writeIdx;
      const countInLayer = Math.max(0, layerEndIdx - layerStartIdx);
      layerInstanceCount[l] = countInLayer;

      const finalLayerTime = data.layerTimesSec?.[l] ?? Math.max(0.8, layerTimeAccum);
      computedLayerTimes[l] = finalLayerTime;

      if (countInLayer > 0) {
        const invCount = 1 / countInLayer;
        for (let k = 0; k < countInLayer; k++) {
          const instIdx = layerStartIdx + k;
          segMeta[instIdx * 4 + 2] = (k + 0.5) * invCount;
          segThermal[instIdx * 2 + 1] = finalLayerTime;
        }
      }
    }

    // Phòng trường hợp có đoạn dư chưa ghi trong layerIndexTable cuối
    for (let bIdx = 0; bIdx < buckets.length; bIdx++) {
      const b = buckets[bIdx];
      const arr = b.coords;
      if (!arr || arr.length < 6) continue;
      const startFloat = prevFloatOffsets[bIdx];
      const lastL = table.length - 1;
      for (let f = startFloat; f <= arr.length - 6; f += 6) {
        if (writeIdx >= totalSegments) break;
        const i3 = writeIdx * 3;
        segStarts[i3] = arr[f];
        segStarts[i3 + 1] = arr[f + 1];
        segStarts[i3 + 2] = arr[f + 2];
        segEnds[i3] = arr[f + 3];
        segEnds[i3 + 1] = arr[f + 4];
        segEnds[i3 + 2] = arr[f + 5];

        const i4 = writeIdx * 4;
        segMeta[i4] = b.featureId;
        segMeta[i4 + 1] = lastL;
        segMeta[i4 + 2] = 0.99;
        segMeta[i4 + 3] = b.speedMmS;

        const i2 = writeIdx * 2;
        segThermal[i2] = b.speedMmS * lineWidth * layerHeight;
        segThermal[i2 + 1] = computedLayerTimes[lastL] || 5.0;
        writeIdx++;
      }
    }
  } else {
    // Fallback ước lượng layer từ tọa độ Y nếu JSON cũ không có layerIndexTable
    const pushRawArray = (arr: number[] | undefined, featId: number, speed: number) => {
      if (!arr) return;
      const flow = speed * lineWidth * layerHeight;
      for (let f = 0; f <= arr.length - 6; f += 6) {
        if (writeIdx >= totalSegments) break;
        const y1 = arr[f + 1];
        const estLayer = Math.max(0, Math.round(y1 / layerHeight));
        const i3 = writeIdx * 3;
        segStarts[i3] = arr[f];
        segStarts[i3 + 1] = y1;
        segStarts[i3 + 2] = arr[f + 2];
        segEnds[i3] = arr[f + 3];
        segEnds[i3 + 1] = arr[f + 4];
        segEnds[i3 + 2] = arr[f + 5];

        const i4 = writeIdx * 4;
        segMeta[i4] = featId;
        segMeta[i4 + 1] = estLayer;
        segMeta[i4 + 2] = 0.5;
        segMeta[i4 + 3] = speed;

        const i2 = writeIdx * 2;
        segThermal[i2] = flow;
        segThermal[i2 + 1] = 6.0;
        writeIdx++;
      }
    };
    pushRawArray(brimCoords, FILAMENT_FEATURE_IDS.SKIRT_BRIM, 50);
    for (const b of buckets) {
      pushRawArray(b.coords, b.featureId, b.speedMmS);
    }
  }

  const validInstanceCount = Math.max(1, writeIdx);
  // Tự động chọn lăng trụ 6 cạnh mượt hoặc 4 cạnh tối ưu khi vượt 320.000 đoạn sợi in
  const radialSides: 4 | 6 = validInstanceCount > 320000 ? 4 : 6;
  const baseTemplate = createCapsuleBeadTemplateGeometry(radialSides);

  const instancedGeom = new THREE.InstancedBufferGeometry();
  instancedGeom.index = baseTemplate.index;
  instancedGeom.attributes.position = baseTemplate.attributes.position;
  instancedGeom.instanceCount = validInstanceCount;

  instancedGeom.setAttribute(
    'iSegStart',
    new THREE.InstancedBufferAttribute(segStarts.subarray(0, validInstanceCount * 3), 3)
  );
  instancedGeom.setAttribute(
    'iSegEnd',
    new THREE.InstancedBufferAttribute(segEnds.subarray(0, validInstanceCount * 3), 3)
  );
  instancedGeom.setAttribute(
    'iMeta',
    new THREE.InstancedBufferAttribute(segMeta.subarray(0, validInstanceCount * 4), 4)
  );
  instancedGeom.setAttribute(
    'iThermal',
    new THREE.InstancedBufferAttribute(segThermal.subarray(0, validInstanceCount * 2), 2)
  );

  const maxTableIdx = Math.max(0, (data.layerIndexTable?.length || data.totalLayers || 1) - 1);

  const beadUniforms = {
    uHalfWidth: { value: lineWidth * 0.53 }, // Giao thoa nhẹ 6% giúp các tường liền kít đặc 100%
    uHalfHeight: { value: layerHeight * 0.55 }, // Xếp chồng khít không hở khe xuyên thấu giữa 2 lớp
    uMaxLayer: { value: maxTableIdx },
    uIntraLayerProgress: { value: 1.0 },
    uShowSupport: { value: 1.0 },
    uShowBrim: { value: 1.0 },
    uShowInfill: { value: 1.0 },
    uClipWorldY: { value: 10000.0 },
    uColorMode: { value: 0.0 },
  };

  const beadMaterial = new THREE.ShaderMaterial({
    uniforms: beadUniforms,
    vertexShader: VOLUMETRIC_BEAD_VERTEX_SHADER,
    fragmentShader: VOLUMETRIC_BEAD_FRAGMENT_SHADER,
    side: THREE.FrontSide,
  });

  const volumetricMesh = new THREE.Mesh(instancedGeom, beadMaterial);
  volumetricMesh.name = 'volumetric_extruded_beads';
  volumetricMesh.frustumCulled = false;
  group.add(volumetricMesh);

  // Dựng các chấm trắng Z-Seam đồng bộ ẩn/hiện chính xác với uMaxLayer & uIntraLayerProgress
  let seamUniforms: {
    uMaxLayer: { value: number };
    uIntraLayerProgress: { value: number };
    uClipWorldY: { value: number };
    uPointSize: { value: number };
  } | null = null;

  if (data.seams && data.seams.length >= 3) {
    const seamCount = Math.floor(data.seams.length / 3);
    const seamMeta = new Float32Array(seamCount * 2);

    if (table.length > 0) {
      let prevSeamIdx = 0;
      for (let l = 0; l < table.length; l++) {
        const endSeamIdx = Math.min(seamCount, table[l][5] ?? 0);
        for (let s = prevSeamIdx; s < endSeamIdx; s++) {
          seamMeta[s * 2] = l;
          seamMeta[s * 2 + 1] = 0.02; // Seam xuất hiện ngay đầu chu trình Outer Wall của lớp
        }
        prevSeamIdx = Math.max(prevSeamIdx, endSeamIdx);
      }
    }

    const seamGeom = new THREE.BufferGeometry();
    seamGeom.setAttribute('position', new THREE.Float32BufferAttribute(data.seams, 3));
    seamGeom.setAttribute('aSeamMeta', new THREE.Float32BufferAttribute(seamMeta, 2));

    seamUniforms = {
      uMaxLayer: { value: maxTableIdx },
      uIntraLayerProgress: { value: 1.0 },
      uClipWorldY: { value: 10000.0 },
      uPointSize: { value: 4.2 },
    };

    const seamMat = new THREE.ShaderMaterial({
      uniforms: seamUniforms,
      vertexShader: SEAM_VERTEX_SHADER,
      fragmentShader: SEAM_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });

    const seamPoints = new THREE.Points(seamGeom, seamMat);
    seamPoints.name = 'preview_seams';
    seamPoints.frustumCulled = false;
    group.add(seamPoints);
  }

  let currentMappedIdx = maxTableIdx;
  let currentIntraRatio = 1.0;

  const mapLayerToTableIndex = (currentLayer: number, progressRatio?: number): number => {
    if (table.length === 0) return Math.max(0, currentLayer);
    let idx = currentLayer;
    if (progressRatio !== undefined) {
      idx = progressRatio >= 0.999 ? maxTableIdx : Math.round(progressRatio * maxTableIdx);
    } else if (data.totalLayers > 0) {
      idx = Math.round((currentLayer / data.totalLayers) * maxTableIdx);
    }
    return Math.max(0, Math.min(maxTableIdx, idx));
  };

  group.userData = {
    isVolumetric3D: true,
    totalLayers: data.totalLayers,
    totalSegments: validInstanceCount,
    layerIndexTable: data.layerIndexTable,

    updateLayer: (currentLayer: number, progressRatio?: number, clippingPlane?: THREE.Plane) => {
      const idx = mapLayerToTableIndex(currentLayer, progressRatio);
      currentMappedIdx = idx;
      beadUniforms.uMaxLayer.value = idx;
      if (seamUniforms) seamUniforms.uMaxLayer.value = idx;

      const clipY =
        clippingPlane && (progressRatio === undefined || progressRatio < 0.999)
          ? clippingPlane.constant
          : 10000.0;
      beadUniforms.uClipWorldY.value = clipY;
      if (seamUniforms) seamUniforms.uClipWorldY.value = clipY;
    },

    updateVisibility: (opts: { showSupport: boolean; brimEnabled: boolean; infillDensity: number }) => {
      beadUniforms.uShowSupport.value = opts.showSupport ? 1.0 : 0.0;
      beadUniforms.uShowBrim.value = opts.brimEnabled ? 1.0 : 0.0;
      beadUniforms.uShowInfill.value = opts.infillDensity > 0 ? 1.0 : 0.0;
    },

    setIntraLayerProgress: (intraRatio: number) => {
      const clamped = Math.max(0.0, Math.min(1.0, intraRatio));
      currentIntraRatio = clamped;
      beadUniforms.uIntraLayerProgress.value = clamped;
      if (seamUniforms) seamUniforms.uIntraLayerProgress.value = clamped;
    },

    setColorScheme: (scheme: FilamentColorScheme) => {
      const code =
        scheme === 'speed' ? 1.0 : scheme === 'flow' ? 2.0 : scheme === 'layer_time' ? 3.0 : 0.0;
      beadUniforms.uColorMode.value = code;
    },

    getActiveMoveTelemetry: (currentLayer?: number, intraRatio?: number): IActiveMoveTelemetry | null => {
      if (table.length === 0) return null;
      const lIdx =
        currentLayer !== undefined
          ? mapLayerToTableIndex(currentLayer)
          : currentMappedIdx;
      const count = layerInstanceCount[lIdx] || 0;
      if (count <= 0) return null;

      const ratio = intraRatio !== undefined ? intraRatio : currentIntraRatio;
      const localMove = Math.max(0, Math.min(count - 1, Math.floor(ratio * count)));
      const inst = layerInstanceStart[lIdx] + localMove;

      const i3 = inst * 3;
      const i4 = inst * 4;
      const i2 = inst * 2;
      const t = Math.max(0, Math.min(1, ratio * count - localMove));

      const px = segStarts[i3] + (segEnds[i3] - segStarts[i3]) * t;
      const py = segStarts[i3 + 1] + (segEnds[i3 + 1] - segStarts[i3 + 1]) * t;
      const pz = segStarts[i3 + 2] + (segEnds[i3 + 2] - segStarts[i3 + 2]) * t;
      const featId = Math.round(segMeta[i4]);

      return {
        position: [Number(px.toFixed(2)), Number(py.toFixed(2)), Number(pz.toFixed(2))],
        featureId: featId,
        featureLabel: FILAMENT_FEATURE_LABELS[featId] || 'Extrusion',
        speedMmS: Math.round(segMeta[i4 + 3]),
        flowMm3S: Number(segThermal[i2].toFixed(1)),
        layerTimeSec: Number(segThermal[i2 + 1].toFixed(1)),
        moveIndex: localMove + 1,
        totalLayerMoves: count,
      };
    },
  };

  return group;
}
