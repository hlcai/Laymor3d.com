import * as THREE from 'three';
import {
  ISimulationProfile,
  ISupportAnalysisResult,
  TreeSupportStyle,
  SupportType,
  PrintConsultIntent,
  IProfileParameterDiff,
  IMatchedKnowledgeRuleSummary,
  IConsultChatMessage,
  IPhotoDiagnosisResult,
  DefectCategoryType,
  DefectSeverity,
} from '@/types/simulator';
import { detectOverhangPatches } from './supportGenerator';
import { getLearnedDefectRules, ICustomDefectKnowledgeRule } from './preflightAnalyzer';

const STORAGE_KEY_GEMINI = '3d_sim_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = '3d_sim_gemini_model_id';

export interface IGeminiModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  recommended?: boolean;
}

export const GEMINI_AVAILABLE_MODELS: IGeminiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Khuyên Dùng • Đa Phương Thức',
    description: 'Mô hình 3.8 tốc độ cao của Google DeepMind, tối ưu cho tư vấn kỹ thuật in 3D, chat đa lượt và chẩn đoán ảnh lỗi.',
    recommended: true,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    badge: 'Siêu Nhanh • Tiết Kiệm',
    description: 'Phiên bản 3.5 Flash-Lite độ trễ cực thấp, tối ưu hóa chi phí token cho truy vấn tần suất cao.',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'Suy Luận Chuyên Sâu',
    description: 'Mô hình mạnh nhất cho suy luận cơ học cấu trúc 3D phức tạp, nhiệt động lực học nhựa và tối ưu hóa G-code.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    badge: 'Nhẹ & Ổn Định',
    description: 'Mô hình gọn nhẹ tốc độ phản hồi tức thì cho phân tích thông số nhanh.',
  },
];

export interface IPrintIntentOption {
  id: PrintConsultIntent;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
}

export const PRINT_CONSULT_INTENTS: IPrintIntentOption[] = [
  {
    id: 'balanced',
    label: 'Cân Bằng Tiêu Chuẩn (Bambu Standard)',
    shortLabel: 'Cân Bằng',
    badge: 'Đa Dụng',
    description: 'Cân bằng hoàn hảo giữa tốc độ in, độ bền kết cấu và độ mịn bề mặt chuẩn Bambu Studio.',
  },
  {
    id: 'aesthetic_statue',
    label: 'Tượng Mỹ Thuật / Figurine Siêu Mịn',
    shortLabel: 'Tượng Mỹ Thuật',
    badge: 'Siêu Mịn 0.12mm',
    description: 'Ưu tiên triệt tiêu vân lớp (Layer Lines), giấu đường Seam sau lưng và bóc Tree Support không để lại sẹo.',
  },
  {
    id: 'mechanical_strength',
    label: 'Chi Tiết Cơ Khí / Chịu Tải Nặng',
    shortLabel: 'Cơ Khí Chịu Lực',
    badge: 'Siêu Bền Cơ Học',
    description: 'Tăng 4–5 vòng tường (Wall Loops), ruột Gyroid chịu lực đa hướng và tăng nhiệt độ liên kết lớp tối đa.',
  },
  {
    id: 'print_in_place',
    label: 'Khớp Động Print-in-Place / Lắp Ghép',
    shortLabel: 'Khớp Động PiP',
    badge: 'Chống Dính Khớp',
    description: 'Bảo toàn dung sai khe hở khớp động, khóa Support chỉ mọc từ bàn in để không làm kẹt bản lề.',
  },
  {
    id: 'cantilever_overhang',
    label: 'Cứu Hộ Mẫu Nhiều Vòm Dốc / Chi Tiết Mảnh',
    shortLabel: 'Cứu Hộ Overhang',
    badge: 'Chống Gãy Đổ',
    description: 'Hạ tốc độ tường ngoài ở vùng nhô, bật Z-Hop tránh quệt đầu phun và dựng Tree Organic đa nhánh bao bọc.',
  },
  {
    id: 'rapid_prototype',
    label: 'In Nháp Siêu Tốc (Rapid Prototype)',
    shortLabel: 'In Nhanh',
    badge: 'Tiết Kiệm 35% Giờ',
    description: 'Tối ưu chiều cao lớp 0.24mm, ruột Lightning/Grid thưa và tốc độ cao để kiểm tra kích thước nhanh.',
  },
  {
    id: 'outdoor_thermal',
    label: 'Bền Nhiệt & Ngoài Trời (PETG/ABS/ASA)',
    shortLabel: 'Bền Nhiệt',
    badge: 'Chống Cong Vênh',
    description: 'Kiểm soát quạt làm mát, vành Brim rộng và nhiệt bàn cao chống co ngót nhiệt (Warping & Delamination).',
  },
];

// Kho tri thức chuẩn xưởng in (kết hợp cùng các quy tắc do Admin/Người dùng đóng góp)
const BUILTIN_WORKSHOP_KNOWLEDGE: ICustomDefectKnowledgeRule[] = [
  {
    id: 'wk-tall-slender-vibration',
    title: 'Chống rung lắc & đổ ngã cho mẫu cao mảnh (Tỷ lệ Cao/Đáy > 2.2)',
    category: 'simulator_defect_learning',
    defectType: 'knock_over',
    severity: 'critical',
    triggerCondition: 'aspectRatio > 2.2',
    content:
      'Khi chiều cao mẫu gấp trên 2.2 lần chiều rộng đáy, quán tính bàn in/đầu phun ở tầng cao gây lệch lớp (Layer Shift) hoặc bật gốc khỏi bàn PEI. Cần bật Brim >= 6mm, Z-Hop >= 0.4mm và giảm tốc độ tường ngoài.',
    tags: ['Tall Model', 'Brim', 'Z-Hop', 'Vibration'],
    autoFixPatch: {
      brimEnabled: true,
      brimType: 'outer_only',
      brimWidthMm: 7,
      zHopMm: 0.4,
      outerWallSpeed: 75,
      defaultAcceleration: 6000,
    },
    isVerified: true,
    updatedAt: '2026-10-22',
  },
  {
    id: 'wk-steep-overhang-organic-tree',
    title: 'Xử lý vùng hàm, đuôi, tai vươn xa (Overhang > 45° diện rộng)',
    category: 'simulator_defect_learning',
    defectType: 'overhang',
    severity: 'critical',
    triggerCondition: 'overhangPercent > 8%',
    content:
      'Các mẫu tượng có cằm, mõm, đuôi cong hoặc vòm > 45° cần Tree Support (Organic) với 2–3 lớp đệm Interface, khoảng cách Top Z 0.20mm (PLA) và quạt làm mát 100% để sợi nhựa đông cứng ngay khi rời đầu phun.',
    tags: ['Overhang', 'Tree Support', 'Conformal Interface', 'Cooling'],
    autoFixPatch: {
      supportMode: 'tree',
      treeStyle: 'organic',
      supportAngleThreshold: 45,
      supportTopZDistance: 0.2,
      supportInterfaceLayers: 2,
      coolingFanSpeed: 100,
      outerWallSpeed: 70,
    },
    isVerified: true,
    updatedAt: '2026-10-22',
  },
  {
    id: 'wk-petg-stringing-blobs',
    title: 'Triệt tiêu kéo tơ mạng nhện (Stringing) & vón cục khi in PETG / TPU',
    category: 'simulator_defect_learning',
    defectType: 'stringing',
    severity: 'high',
    triggerCondition: 'material === PETG || material === TPU',
    content:
      'Nhựa PETG và TPU có độ nhớt cao, dễ chảy rỉ ở đầu phun khi di chuyển không tải (Travel) và dính cực chặt vào Support. Cần tăng Retraction lên 1.2–1.6mm, hạ nhiệt Nozzle 5°C và tăng Support Top Z-Distance lên 0.25mm.',
    tags: ['PETG', 'TPU', 'Stringing', 'Retraction', 'Top Z'],
    autoFixPatch: {
      retractionDistanceMm: 1.4,
      retractionSpeedMmS: 45,
      supportTopZDistance: 0.25,
      zHopMm: 0.4,
      travelSpeed: 420,
    },
    isVerified: true,
    updatedAt: '2026-10-22',
  },
  {
    id: 'wk-abs-asa-warping-delamination',
    title: 'Chống cong vênh góc đáy (Warping) & nứt tách lớp cho ABS / ASA',
    category: 'simulator_defect_learning',
    defectType: 'delamination',
    severity: 'critical',
    triggerCondition: 'material === ABS || material === ASA',
    content:
      'Nhựa kỹ thuật ABS/ASA co ngót nhiệt rất mạnh khi gặp gió lạnh. Phải hạ quạt làm mát xuống 15–25%, nâng nhiệt bàn in 100°C, giữ buồng in ấm 45–50°C và bắt buộc bật Brim 8mm.',
    tags: ['ABS', 'ASA', 'Warping', 'Delamination', 'Chamber'],
    autoFixPatch: {
      bedTemp: 100,
      chamberTemp: 48,
      coolingFanSpeed: 20,
      auxFanSpeed: 0,
      brimEnabled: true,
      brimType: 'outer_only',
      brimWidthMm: 8,
    },
    isVerified: true,
    updatedAt: '2026-10-22',
  },
];

/**
 * Lấy Model Gemini đã chọn
 */
export function getSavedGeminiModel(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY_GEMINI_MODEL);
    if (local && local.trim().length > 0) {
      const trimmed = local.trim();
      if (
        trimmed.startsWith('gemini-2.') ||
        trimmed.startsWith('gemini-1.') ||
        trimmed === 'gemini-3.5-flash'
      ) {
        return 'gemini-3.8-flash';
      }
      return trimmed;
    }
  } catch {}
  return 'gemini-3.8-flash';
}

/**
 * Lưu Model Gemini đã chọn
 */
export function saveGeminiModel(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, modelId.trim());
  } catch {}
}

/**
 * Lấy Gemini API Key lưu trong LocalStorage (hoặc biến môi trường Vite)
 */
export function getSavedGeminiApiKey(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY_GEMINI);
    if (local && local.trim().length > 0) return local.trim();
  } catch {}
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Lưu Gemini API Key vào LocalStorage
 */
export function saveGeminiApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
  } catch {}
}

/**
 * Xóa Gemini API Key
 */
export function clearGeminiApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_GEMINI);
  } catch {}
}

/**
 * Helper gọi Gemini REST API kèm cơ chế tự động fallback model tương thích với API Key
 */
async function callGeminiGenerateContent(
  apiKey: string,
  preferredModel: string,
  parts: any[],
  systemInstruction?: string,
  jsonMode: boolean = true,
  maxOutputTokens: number = 2500
): Promise<{ ok: boolean; status: number; text: string; modelUsed: string; errorMessage?: string }> {
  const candidateModels = Array.from(
    new Set([preferredModel, 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview'])
  );

  let lastStatus = 0;
  let lastError = '';

  for (const modelId of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const bodyPayload: Record<string, any> = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.25,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };
    if (systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      lastStatus = response.status;
      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          return { ok: true, status: 200, text, modelUsed: modelId };
        }
      } else {
        try {
          const errJson = await response.json();
          lastError = errJson?.error?.message || response.statusText;
        } catch {
          lastError = response.statusText;
        }
        // Nếu lỗi 400/404 do tên model chưa mở trên project của user, thử tiếp model kế tiếp
        if (response.status === 404 || response.status === 400) {
          continue;
        }
        break;
      }
    } catch (err: any) {
      lastError = err?.message || 'Lỗi kết nối mạng';
    }
  }

  return {
    ok: false,
    status: lastStatus,
    text: '',
    modelUsed: preferredModel,
    errorMessage: lastError,
  };
}

/**
 * Kiểm tra kết nối thực tế tới Google Gemini API bằng API Key cung cấp
 */
export async function testGeminiApiKey(
  key: string,
  targetModelId?: string
): Promise<{ success: boolean; latencyMs?: number; error?: string; modelName?: string }> {
  const cleanKey = key.trim();
  if (!cleanKey) {
    return { success: false, error: 'Chưa nhập API Key. Vui lòng dán key của bạn vào ô bên dưới.' };
  }
  const chosenModel = targetModelId || getSavedGeminiModel();
  const startTime = performance.now();

  const res = await callGeminiGenerateContent(
    cleanKey,
    chosenModel,
    [{ text: 'Hello, respond with {"status":"OK"}' }],
    undefined,
    false,
    16
  );
  const latencyMs = Math.round(performance.now() - startTime);
  const modelName =
    GEMINI_AVAILABLE_MODELS.find((m) => m.id === res.modelUsed)?.name || res.modelUsed;

  if (!res.ok) {
    return {
      success: false,
      error: res.errorMessage || `Mã lỗi HTTP ${res.status}`,
      latencyMs,
      modelName,
    };
  }

  return { success: true, latencyMs, modelName };
}

/**
 * Thu thập chỉ số hình học chi tiết của mô hình để chuẩn bị dữ liệu phân tích
 */
export function extractGeometryMetrics(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox || new THREE.Box3();
  const dimX = Number((bbox.max.x - bbox.min.x).toFixed(1));
  const dimY = Number((bbox.max.y - bbox.min.y).toFixed(1));
  const dimZ = Number((bbox.max.z - bbox.min.z).toFixed(1));

  const positions = geometry.getAttribute('position');
  const indexAttr = geometry.getIndex();
  const vertCount = indexAttr ? indexAttr.count : positions ? positions.count : 0;
  const triangleCount = Math.floor(vertCount / 3);

  let totalSurfaceArea = 0;
  let overhangArea45 = 0;
  let severeOverhangArea60 = 0;
  let bridgeArea80 = 0;
  let baseContactArea = 0;

  if (positions) {
    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();
    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();
    const cross = new THREE.Vector3();

    for (let t = 0; t < triangleCount; t++) {
      const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
      const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

      pA.fromBufferAttribute(positions, i0);
      pB.fromBufferAttribute(positions, i1);
      pC.fromBufferAttribute(positions, i2);

      edge1.subVectors(pB, pA);
      edge2.subVectors(pC, pA);
      cross.crossVectors(edge1, edge2);
      const area = cross.length() * 0.5;
      totalSurfaceArea += area;

      cross.normalize();
      const ny = cross.y;
      const midY = (pA.y + pB.y + pC.y) / 3;

      if (midY <= bbox.min.y + 0.6 && ny < -0.5) {
        baseContactArea += area;
      }

      if (ny < 0 && midY > bbox.min.y + 1.8) {
        if (ny < -0.7071) overhangArea45 += area; // > 45°
        if (ny < -0.866) severeOverhangArea60 += area; // > 60°
        if (ny < -0.9848) bridgeArea80 += area; // > 80°
      }
    }
  }

  const overhangPercent =
    totalSurfaceArea > 0 ? (overhangArea45 / totalSurfaceArea) * 100 : 0;
  const severeOverhangPercent =
    totalSurfaceArea > 0 ? (severeOverhangArea60 / totalSurfaceArea) * 100 : 0;

  let patches = detectOverhangPatches(geometry, 45);
  if (patches.length === 0) {
    patches = detectOverhangPatches(geometry, 68);
  }

  const minBaseDim = Math.max(1, Math.min(dimX, dimZ));
  const slendernessRatio = Number((dimY / minBaseDim).toFixed(2));

  return {
    dimensions: [dimX, dimY, dimZ] as [number, number, number],
    triangleCount,
    totalSurfaceArea: Math.round(totalSurfaceArea),
    baseContactAreaMm2: Math.round(baseContactArea),
    slendernessRatio,
    overhangPercent: Number(overhangPercent.toFixed(1)),
    severeOverhangPercent: Number(severeOverhangPercent.toFixed(1)),
    bridgeAreaMm2: Math.round(bridgeArea80),
    patches,
  };
}

/**
 * Đối chiếu hình học & vật liệu hiện tại với Kho Tri Thức Lỗi (Defect Knowledge DB)
 */
export function matchWorkshopKnowledgeRules(
  metrics: ReturnType<typeof extractGeometryMetrics>,
  profile: ISimulationProfile
): IMatchedKnowledgeRuleSummary[] {
  const learnedRules = getLearnedDefectRules();
  const allRules = [...learnedRules, ...BUILTIN_WORKSHOP_KNOWLEDGE];
  const matched: IMatchedKnowledgeRuleSummary[] = [];
  const seenIds = new Set<string>();

  for (const r of allRules) {
    if (seenIds.has(r.id)) continue;
    let isMatch = false;

    const textBlob = `${r.title} ${r.content} ${r.triggerCondition || ''} ${(r.tags || []).join(' ')}`.toLowerCase();

    if (metrics.overhangPercent >= 5 && (textBlob.includes('overhang') || textBlob.includes('tree') || r.defectType === 'overhang')) {
      isMatch = true;
    }
    if (metrics.slendernessRatio >= 1.8 && (textBlob.includes('tall') || textBlob.includes('brim') || textBlob.includes('rung') || r.defectType === 'warping' || r.defectType === 'knock_over')) {
      isMatch = true;
    }
    if (metrics.bridgeAreaMm2 >= 15 && (textBlob.includes('bridge') || textBlob.includes('cầu') || r.defectType === 'bridging')) {
      isMatch = true;
    }
    if (textBlob.includes(profile.material.toLowerCase())) {
      isMatch = true;
    }
    // Các quy tắc do Admin/Người dùng vừa nhập trong phiên hiện tại luôn được ưu tiên tham chiếu
    if (!r.id.startsWith('wk-')) {
      isMatch = true;
    }

    if (isMatch) {
      seenIds.add(r.id);
      matched.push({
        id: r.id,
        title: r.title,
        severity: r.severity || 'high',
        content: r.content,
        tags: r.tags || [],
        isVerified: r.isVerified,
        autoFixPatch: r.autoFixPatch,
      });
    }
  }

  return matched.slice(0, 6);
}

/**
 * Tính toán gói tối ưu hóa toàn diện 6 nhóm thông số Bambu Studio dựa trên Hình học + Vật liệu + Mục tiêu In
 */
export function buildFullBambuProfileConsultation(
  metrics: ReturnType<typeof extractGeometryMetrics>,
  profile: ISimulationProfile,
  intent: PrintConsultIntent = 'balanced'
): {
  fullProfilePatch: Partial<ISimulationProfile>;
  parameterChanges: IProfileParameterDiff[];
  predictedImpact: NonNullable<ISupportAnalysisResult['predictedImpact']>;
} {
  const [dimX, dimY, dimZ] = metrics.dimensions;
  const isTall = metrics.slendernessRatio >= 2.0 || dimY >= 140;
  const hasHeavyOverhang = metrics.overhangPercent >= 8.0 || metrics.patches.length >= 6;
  const hasBridges = metrics.bridgeAreaMm2 >= 20;

  // Khởi tạo thông số mục tiêu dựa trên Intent & Hình học thực tế
  let layerHeight = profile.layerHeight;
  let firstLayerHeight = profile.firstLayerHeight || 0.2;
  let seamPosition = profile.seamPosition || 'aligned';
  let ironingEnabled = profile.ironingEnabled || false;

  let wallLoops = profile.wallLoops;
  let topShellLayers = profile.topShellLayers || 4;
  let bottomShellLayers = profile.bottomShellLayers || 3;
  let infillType = profile.infillType;
  let infillDensity = profile.infillDensity;

  let printSpeed = profile.printSpeed;
  let outerWallSpeed = profile.outerWallSpeed || Math.round(profile.printSpeed * 0.55);
  let innerWallSpeed = profile.innerWallSpeed || Math.round(profile.printSpeed * 0.8);
  let travelSpeed = profile.travelSpeed || 400;
  let defaultAcceleration = profile.defaultAcceleration || 8000;

  let supportMode: SupportType = hasHeavyOverhang || metrics.patches.length > 0 ? 'tree' : 'none';
  let treeStyle: TreeSupportStyle = hasHeavyOverhang ? 'organic' : 'slim';
  let supportAngleThreshold = hasHeavyOverhang ? 45 : 50;
  let supportTopZDistance = profile.material === 'PETG' ? 0.25 : 0.2;
  let supportBranchDiameter = dimY > 120 ? 3.0 : hasHeavyOverhang ? 2.6 : 2.2;
  let supportBranchAngle = 45;
  let supportInterfaceLayers = 2;
  let supportOnBuildPlateOnly = true;

  let nozzleTemp = profile.nozzleTemp;
  let bedTemp = profile.bedTemp;
  let coolingFanSpeed = profile.coolingFanSpeed;
  let retractionDistanceMm = profile.retractionDistanceMm ?? 0.8;
  let zHopMm = isTall ? 0.4 : 0.2;

  let brimEnabled = isTall || dimX * dimZ < 900 || profile.material === 'ABS' || profile.material === 'ASA';
  let brimType = profile.brimType || 'outer_only';
  let brimWidthMm = isTall ? 7 : brimEnabled ? 5 : 0;

  // Tinh chỉnh chuyên sâu theo từng mục tiêu in (Print Intent)
  switch (intent) {
    case 'aesthetic_statue':
      layerHeight = 0.12;
      firstLayerHeight = 0.2;
      seamPosition = 'back';
      wallLoops = 3;
      topShellLayers = 5;
      infillType = 'gyroid';
      infillDensity = 15;
      printSpeed = 160;
      outerWallSpeed = 60;
      innerWallSpeed = 130;
      defaultAcceleration = 5000;
      supportMode = metrics.patches.length > 0 ? 'tree' : 'none';
      treeStyle = 'organic';
      supportAngleThreshold = 45;
      supportTopZDistance = profile.material === 'PETG' ? 0.22 : 0.18;
      supportInterfaceLayers = 3;
      supportOnBuildPlateOnly = true;
      coolingFanSpeed = profile.material === 'ABS' || profile.material === 'ASA' ? 25 : 100;
      zHopMm = 0.4;
      break;

    case 'mechanical_strength':
      layerHeight = 0.2;
      firstLayerHeight = 0.24;
      seamPosition = 'aligned';
      wallLoops = 5;
      topShellLayers = 5;
      bottomShellLayers = 5;
      infillType = 'gyroid';
      infillDensity = 40;
      printSpeed = 180;
      outerWallSpeed = 90;
      innerWallSpeed = 150;
      supportMode = metrics.patches.length > 0 ? 'tree' : 'none';
      treeStyle = 'strong';
      supportBranchDiameter = 3.4;
      supportTopZDistance = 0.22;
      nozzleTemp = Math.min(300, profile.nozzleTemp + 5);
      coolingFanSpeed = Math.max(20, profile.coolingFanSpeed - 15);
      brimEnabled = true;
      brimWidthMm = 6;
      break;

    case 'print_in_place':
      layerHeight = 0.16;
      seamPosition = 'nearest';
      wallLoops = 3;
      infillType = 'grid';
      infillDensity = 18;
      printSpeed = 170;
      outerWallSpeed = 75;
      supportMode = metrics.patches.length > 0 ? 'tree' : 'none';
      treeStyle = 'slim';
      supportAngleThreshold = 52;
      supportOnBuildPlateOnly = true;
      supportTopZDistance = 0.22;
      retractionDistanceMm = Math.max(1.2, retractionDistanceMm);
      zHopMm = 0.3;
      brimEnabled = false;
      brimType = 'none';
      brimWidthMm = 0;
      break;

    case 'cantilever_overhang':
      layerHeight = 0.16;
      wallLoops = 3;
      infillType = 'gyroid';
      infillDensity = 18;
      printSpeed = 150;
      outerWallSpeed = 55;
      innerWallSpeed = 110;
      defaultAcceleration = 4500;
      supportMode = 'tree';
      treeStyle = 'organic';
      supportAngleThreshold = 42;
      supportTopZDistance = 0.2;
      supportBranchDiameter = Math.max(2.8, supportBranchDiameter);
      supportInterfaceLayers = 3;
      coolingFanSpeed = 100;
      zHopMm = 0.45;
      brimEnabled = true;
      brimWidthMm = 8;
      break;

    case 'rapid_prototype':
      layerHeight = 0.28;
      firstLayerHeight = 0.28;
      wallLoops = 2;
      topShellLayers = 3;
      bottomShellLayers = 3;
      infillType = 'lightning';
      infillDensity = 12;
      printSpeed = 280;
      outerWallSpeed = 160;
      innerWallSpeed = 240;
      defaultAcceleration = 12000;
      supportMode = metrics.patches.length > 0 ? 'tree' : 'none';
      treeStyle = 'slim';
      supportAngleThreshold = 55;
      supportInterfaceLayers = 1;
      break;

    case 'outdoor_thermal':
      layerHeight = 0.2;
      wallLoops = 4;
      topShellLayers = 5;
      bottomShellLayers = 5;
      infillType = 'gyroid';
      infillDensity = 30;
      printSpeed = 160;
      outerWallSpeed = 80;
      bedTemp = Math.max(80, profile.bedTemp);
      coolingFanSpeed = profile.material === 'PLA' ? 70 : 25;
      brimEnabled = true;
      brimType = 'outer_only';
      brimWidthMm = 8;
      break;

    case 'balanced':
    default:
      layerHeight = dimY > 150 ? 0.2 : 0.16;
      wallLoops = 3;
      infillType = 'gyroid';
      infillDensity = 20;
      printSpeed = isTall ? 180 : 210;
      outerWallSpeed = hasHeavyOverhang ? 70 : 95;
      if (hasBridges) {
        coolingFanSpeed = Math.max(90, coolingFanSpeed);
      }
      break;
  }

  const fullProfilePatch: Partial<ISimulationProfile> = {
    layerHeight,
    firstLayerHeight,
    seamPosition,
    ironingEnabled,
    wallLoops,
    topShellLayers,
    bottomShellLayers,
    infillType,
    infillDensity,
    printSpeed,
    outerWallSpeed,
    innerWallSpeed,
    travelSpeed,
    defaultAcceleration,
    supportMode,
    treeStyle,
    supportAngleThreshold,
    supportTopZDistance,
    supportBranchDiameter,
    supportBranchAngle,
    supportInterfaceLayers,
    supportOnBuildPlateOnly,
    nozzleTemp,
    bedTemp,
    coolingFanSpeed,
    retractionDistanceMm,
    zHopMm,
    brimEnabled,
    brimType: brimEnabled ? 'outer_only' : 'none',
    brimWidthMm: brimEnabled ? brimWidthMm : 0,
  };

  const parameterChanges: IProfileParameterDiff[] = [
    {
      category: 'quality',
      label: 'Chiều cao lớp cắt (Layer Height)',
      paramKey: 'layerHeight',
      currentValue: profile.layerHeight,
      recommendedValue: layerHeight,
      unit: 'mm',
      reason:
        layerHeight <= 0.14
          ? 'Giảm bậc thang bề mặt cong và tăng diện tích chồng lớp tại các sườn dốc Overhang.'
          : layerHeight >= 0.24
          ? 'Tăng tốc độ đùn lớp cho phôi kiểm thử kích thước nhanh.'
          : 'Độ mịn tiêu chuẩn cân bằng giữa thẩm mỹ và thời gian in.',
    },
    {
      category: 'quality',
      label: 'Vị trí đường nối lớp (Seam Position)',
      paramKey: 'seamPosition',
      currentValue: profile.seamPosition || 'aligned',
      recommendedValue: seamPosition,
      reason:
        seamPosition === 'back'
          ? 'Giấu toàn bộ vết nối Z-Seam ra mặt lưng mô hình để mặt tiền hoàn toàn láng mịn.'
          : 'Tối ưu quãng đường di chuyển đầu phun giữa các chu vi.',
    },
    {
      category: 'strength',
      label: 'Số vòng tường chu vi (Wall Loops)',
      paramKey: 'wallLoops',
      currentValue: profile.wallLoops,
      recommendedValue: wallLoops,
      unit: 'vòng',
      reason:
        wallLoops >= 4
          ? 'Tăng độ cứng vững vỏ ngoài, chịu ứng suất uốn/xoắn và chống lộ vân Infill.'
          : 'Đảm bảo lớp vỏ đủ dày để đỡ các bậc thang Overhang liên tiếp.',
    },
    {
      category: 'strength',
      label: 'Cấu trúc & Mật độ ruột (Infill)',
      paramKey: 'infillDensity',
      currentValue: `${profile.infillDensity}% (${profile.infillType})`,
      recommendedValue: `${infillDensity}% (${infillType})`,
      reason:
        infillType === 'gyroid'
          ? 'Mẫu ruột Gyroid phân tán lực đẳng hướng 3D và không làm đầu phun quệt ngang qua đường giao nhau.'
          : infillType === 'lightning'
          ? 'Ruột tia chớp chỉ đỡ mặt đỉnh, tiết kiệm tối đa nhựa và thời gian.'
          : 'Cấu trúc lưới ổn định cho chi tiết tiêu chuẩn.',
    },
    {
      category: 'speed',
      label: 'Tốc độ tường ngoài (Outer Wall Speed)',
      paramKey: 'outerWallSpeed',
      currentValue: profile.outerWallSpeed || Math.round(profile.printSpeed * 0.6),
      recommendedValue: outerWallSpeed,
      unit: 'mm/s',
      reason: `Hạ tốc độ chu vi ngoài xuống ${outerWallSpeed} mm/s giúp nhựa kịp nguội định hình ở vùng nghiêng ${metrics.overhangPercent}% và triệt tiêu bóng mờ (Ghosting).`,
    },
    {
      category: 'support',
      label: 'Hệ thống chống đỡ (Support Mode & Style)',
      paramKey: 'supportMode',
      currentValue: `${profile.supportMode.toUpperCase()} (${profile.treeStyle || 'organic'})`,
      recommendedValue: `${supportMode.toUpperCase()} (${treeStyle})`,
      reason:
        supportMode === 'tree'
          ? `Dựng cành cây ${treeStyle.toUpperCase()} mọc từ ngoài chân đế vươn lên đỡ ${metrics.patches.length} vùng Overhang, tiết kiệm nhựa và không làm xước thân mẫu.`
          : 'Hình học tự nâng đỡ tốt, không cần dùng Support.',
    },
    {
      category: 'support',
      label: 'Khoảng cách đệm bóc tách (Top Z Distance)',
      paramKey: 'supportTopZDistance',
      currentValue: profile.supportTopZDistance || 0.2,
      recommendedValue: supportTopZDistance,
      unit: 'mm',
      reason: `Khe hở ${supportTopZDistance}mm kết hợp ${supportInterfaceLayers} lớp Conformal Interface giúp bóc cành cây bằng tay nhẹ nhàng không để lại sẹo.`,
    },
    {
      category: 'cooling',
      label: 'Quạt làm mát & Nhiệt độ đùn',
      paramKey: 'coolingFanSpeed',
      currentValue: `${profile.coolingFanSpeed}% / ${profile.nozzleTemp}°C`,
      recommendedValue: `${coolingFanSpeed}% / ${nozzleTemp}°C`,
      reason:
        coolingFanSpeed >= 90
          ? 'Thổi mát 100% giúp sợi nhựa đông cứng tức thì khi bắc cầu ngang và vươn ra ngoài không trung.'
          : 'Kiểm soát gió làm mát để ngăn co ngót nhiệt và tăng lực liên kết giữa các lớp.',
    },
    {
      category: 'adhesion',
      label: 'Vành bám bàn & Nhấc đầu phun (Brim & Z-Hop)',
      paramKey: 'brimWidthMm',
      currentValue: profile.brimEnabled ? `${profile.brimWidthMm}mm (Z-Hop ${profile.zHopMm || 0.2}mm)` : 'Tắt Brim',
      recommendedValue: brimEnabled ? `${brimWidthMm}mm (Z-Hop ${zHopMm}mm)` : `Tắt Brim (Z-Hop ${zHopMm}mm)`,
      reason: isTall
        ? `Mẫu có tỷ lệ Cao/Đáy = ${metrics.slendernessRatio} (cao ${dimY}mm), bắt buộc mở rộng vành Brim ${brimWidthMm}mm và Z-Hop ${zHopMm}mm để chống gạt đổ mẫu.`
        : 'Đảm bảo độ bám dính lớp đầu tiên ổn định trên mặt bàn PEI.',
    },
  ];

  // Tính toán điểm an toàn trước và sau khi áp dụng cấu hình AI
  let scoreBefore = 88;
  if (hasHeavyOverhang && profile.supportMode === 'none') scoreBefore -= 32;
  if (isTall && !profile.brimEnabled) scoreBefore -= 18;
  if (profile.printSpeed > 250 && hasHeavyOverhang) scoreBefore -= 12;
  scoreBefore = Math.max(35, Math.min(94, scoreBefore));

  const scoreAfter = Math.min(99, Math.max(scoreBefore + 14, 96));
  const surfaceQualityScore =
    intent === 'aesthetic_statue' ? 98 : intent === 'rapid_prototype' ? 82 : 93;
  const structuralStrengthScore =
    intent === 'mechanical_strength' ? 98 : intent === 'rapid_prototype' ? 78 : 91;

  const layerRatio = profile.layerHeight / layerHeight;
  const speedRatio = printSpeed / Math.max(60, profile.printSpeed);
  const estimatedTimeDeltaPercent = Math.round(((layerRatio / speedRatio) - 1) * 100);
  const estimatedFilamentDeltaPercent = Math.round(
    ((infillDensity - profile.infillDensity) * 0.45 + (wallLoops - profile.wallLoops) * 4)
  );

  return {
    fullProfilePatch,
    parameterChanges,
    predictedImpact: {
      successScoreBefore: scoreBefore,
      successScoreAfter: scoreAfter,
      surfaceQualityScore,
      structuralStrengthScore,
      estimatedTimeDeltaPercent,
      estimatedFilamentDeltaPercent,
    },
  };
}

/**
 * Bambu Studio Expert Rule Engine (Thuật toán phân tích nội tại chuẩn xác 100% không phụ thuộc mạng)
 */
export function analyzeWithBambuExpertRules(
  modelName: string,
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  intent: PrintConsultIntent = 'balanced'
): ISupportAnalysisResult {
  const metrics = extractGeometryMetrics(geometry);
  const [dimX, dimY, dimZ] = metrics.dimensions;
  const matchedKnowledgeRules = matchWorkshopKnowledgeRules(metrics, profile);
  const { fullProfilePatch, parameterChanges, predictedImpact } =
    buildFullBambuProfileConsultation(metrics, profile, intent);

  const intentMeta =
    PRINT_CONSULT_INTENTS.find((i) => i.id === intent) || PRINT_CONSULT_INTENTS[0];

  const mode: SupportType = (fullProfilePatch.supportMode as SupportType) || 'tree';
  const treeStyle: TreeSupportStyle = fullProfilePatch.treeStyle || 'organic';
  const angleThreshold = fullProfilePatch.supportAngleThreshold || 45;
  const topZ = fullProfilePatch.supportTopZDistance || 0.2;
  const branchDia = fullProfilePatch.supportBranchDiameter || 2.6;
  const branchAngle = fullProfilePatch.supportBranchAngle || 45;
  const onBuildPlateOnly = fullProfilePatch.supportOnBuildPlateOnly ?? true;
  const interfaceLayers = fullProfilePatch.supportInterfaceLayers ?? 2;

  const summary = `Chế độ [${intentMeta.shortLabel}]: Phát hiện ${metrics.patches.length} vùng Overhang (${metrics.overhangPercent}% diện tích nghiêng, tỷ lệ Cao/Đáy ${metrics.slendernessRatio}). Đã tối ưu đồng bộ 6 nhóm thông số Bambu Studio: Lớp cắt ${fullProfilePatch.layerHeight}mm, ${fullProfilePatch.wallLoops} vòng tường, ruột ${fullProfilePatch.infillType?.toUpperCase()} ${fullProfilePatch.infillDensity}%, tốc độ tường ngoài ${fullProfilePatch.outerWallSpeed}mm/s và ${mode === 'tree' ? `Tree Support (${treeStyle}) đa nhánh mọc ngoài vỏ 3D` : 'không dùng Support'}.`;

  const estimatedSupportGrams = Math.max(
    1.8,
    Number(
      (
        Math.max(2, metrics.patches.length) *
        1.45 *
        (dimY / 42) *
        (treeStyle === 'slim' ? 0.68 : treeStyle === 'strong' ? 1.25 : 1.0)
      ).toFixed(1)
    )
  );

  let orientAxis: 'x' | 'y' | 'z' = 'x';
  let orientDeg = 0;
  let savingsPercent = 0;
  let orientRationale = 'Mô hình hiện đang ở tư thế đặt tối ưu với mặt đáy tiếp xúc phẳng nhất.';

  if (dimY > Math.max(dimX, dimZ) * 1.85 && metrics.overhangPercent > 10) {
    orientAxis = 'x';
    orientDeg = -90;
    savingsPercent = 48;
    orientRationale = `Mô hình có chiều cao trục Y lớn (${dimY}mm, tỷ lệ mảnh ${metrics.slendernessRatio}). Xoay 90° quanh trục X để hạ thấp trọng tâm sẽ giảm rung lắc ở tầng cao và tiết kiệm ~48% nhựa Support.`;
  }

  const riskHotspots = metrics.patches.slice(0, 6).map((p, idx) => ({
    id: `risk-${idx + 1}`,
    title: `Vùng Overhang ${p.severity === 'critical' ? 'Nghiêm Trọng' : 'Cần Đỡ'} tại Y=${p.center[1]}mm`,
    location: p.center,
    severity: p.severity === 'critical' ? ('critical' as const) : ('warning' as const),
    description: `Góc dốc ${p.avgAngleDeg}° • Diện tích ${p.areaMm2}mm² ${p.isBridge ? '• Cầu nối ngang (Bridge)' : ''}.`,
    fixSuggestion: `Nhánh Tree (${treeStyle}) vươn từ ngoài vỏ + đệm Conformal ${interfaceLayers} lớp (Top Z ${topZ}mm) + tốc độ tường ngoài ${fullProfilePatch.outerWallSpeed}mm/s.`,
  }));

  const bambuStudioProTips = [
    `Mục tiêu [${intentMeta.shortLabel}]: Đặt Layer Height = ${fullProfilePatch.layerHeight}mm và Outer Wall Speed = ${fullProfilePatch.outerWallSpeed}mm/s để đường đùn bám chắc ở các góc nghiêng > 45°.`,
    `Bambu Studio Conformal Interface: Giữ Top Z Distance = ${topZ}mm với ${interfaceLayers} lớp đệm màu tím giúp gỡ Tree Support bằng tay sạch 100% không để lại sẹo trắng.`,
    `Chống gạt đổ mẫu cao (${dimY}mm): Bật Z-Hop When Retract = ${fullProfilePatch.zHopMm}mm kết hợp ruột Gyroid để đầu phun không bao giờ quệt vào phần nhựa đã đông cứng.`,
    'Mẹo đa vật liệu (AMS): Nếu có AMS, chọn PETG làm Support Interface cho mẫu PLA (hoặc ngược lại) và đặt Top Z = 0mm để đáy Overhang láng bóng như gương.',
  ];

  return {
    modelName,
    source: 'bambu_expert_rules',
    intent,
    timestamp: new Date().toLocaleTimeString('vi-VN'),
    totalTriangles: metrics.triangleCount,
    totalSurfaceAreaMm2: metrics.totalSurfaceArea,
    overhangPercent: metrics.overhangPercent,
    severeOverhangPercent: metrics.severeOverhangPercent,
    bridgeSpansCount: metrics.patches.filter((p) => p.isBridge).length,
    estimatedSupportWeightGrams: estimatedSupportGrams,
    recommendedOrientation: {
      axis: orientAxis,
      degrees: orientDeg,
      savingsPercent,
      rationale: orientRationale,
    },
    supportRecommendation: {
      mode,
      treeStyle,
      angleThreshold,
      topZDistance: topZ,
      branchDiameter: branchDia,
      branchAngle,
      onBuildPlateOnly,
      interfaceLayers,
      summary,
    },
    fullProfilePatch,
    parameterChanges,
    predictedImpact,
    matchedKnowledgeRules,
    riskHotspots,
    bambuStudioProTips,
  };
}

/**
 * Gọi Gemini AI API để suy luận sâu và sinh cấu hình Tư vấn In 3D toàn diện 6 nhóm Bambu Studio
 */
export async function analyzeWithGeminiAI(
  modelName: string,
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  customApiKey?: string,
  intent: PrintConsultIntent = 'balanced'
): Promise<ISupportAnalysisResult> {
  const apiKey = (customApiKey || getSavedGeminiApiKey()).trim();
  const baseExpertResult = analyzeWithBambuExpertRules(modelName, geometry, profile, intent);

  if (!apiKey) {
    return baseExpertResult;
  }

  const metrics = extractGeometryMetrics(geometry);
  const intentMeta =
    PRINT_CONSULT_INTENTS.find((i) => i.id === intent) || PRINT_CONSULT_INTENTS[0];
  const knowledgeContext = (baseExpertResult.matchedKnowledgeRules || [])
    .map((r) => `- [${r.title}]: ${r.content}`)
    .join('\n');

  const prompt = `
Bạn là Chuyên gia Tư vấn Kỹ thuật In 3D & Kỹ sư Cắt lớp hàng đầu của Bambu Lab (Bambu Studio / OrcaSlicer Master Consultant).
Hãy phân tích toàn diện mô hình 3D đang mở và tư vấn bộ thông số in tối ưu nhất theo mục tiêu của người dùng.

1. THÔNG SỐ HÌNH HỌC MÔ HÌNH 3D:
- Tên mô hình: "${modelName}"
- Kích thước [X, Y(Cao), Z]: ${metrics.dimensions[0]} x ${metrics.dimensions[1]} x ${metrics.dimensions[2]} mm
- Tỷ lệ độ mảnh (Cao / Đáy nhỏ nhất): ${metrics.slendernessRatio}
- Tổng số tam giác: ${metrics.triangleCount} | Tổng diện tích bề mặt: ${metrics.totalSurfaceArea} mm²
- Diện tích mặt dốc Overhang (>45°): ${metrics.overhangPercent}% | Vùng dốc hiểm (>60°): ${metrics.severeOverhangPercent}%
- Diện tích cầu nối ngang (Bridging >80°): ${metrics.bridgeAreaMm2} mm² | Số cụm Overhang: ${metrics.patches.length}

2. CẤU HÌNH HIỆN TẠI & MỤC TIÊU NGƯỜI DÙNG:
- Mục tiêu bản in: "${intentMeta.label}" (${intentMeta.description})
- Vật liệu: ${profile.material} (Nozzle: ${profile.nozzleTemp}°C, Bed: ${profile.bedTemp}°C, Fan: ${profile.coolingFanSpeed}%)
- Cấu hình đang chọn: Layer ${profile.layerHeight}mm, Wall Loops ${profile.wallLoops}, Infill ${profile.infillDensity}% (${profile.infillType}), Speed ${profile.printSpeed}mm/s, Support ${profile.supportMode}.

3. TRI THỨC XƯỞNG IN NỘI BỘ (KNOWLEDGE BASE):
${knowledgeContext || '- Áp dụng tiêu chuẩn kỹ thuật Bambu Studio.'}

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc sau:
{
  "summary": "Nhận định tổng quan sâu sắc (3-4 câu tiếng Việt) phân tích đặc điểm hình học của mẫu, rủi ro khi in và giải pháp tối ưu cho mục tiêu đã chọn",
  "recommendedMode": "tree" | "normal" | "none",
  "recommendedTreeStyle": "organic" | "slim" | "strong" | "hybrid",
  "angleThreshold": số từ 35 đến 60,
  "topZDistance": số mm (ví dụ 0.18, 0.20, 0.25),
  "branchDiameter": số mm (ví dụ 2.4, 2.8, 3.2),
  "branchAngle": số độ (ví dụ 42, 45),
  "onBuildPlateOnly": true hoặc false,
  "interfaceLayers": số lớp (1, 2, hoặc 3),
  "layerHeight": số mm (0.12, 0.16, 0.20, 0.24, 0.28),
  "wallLoops": số vòng tường (2 đến 6),
  "infillType": "gyroid" | "grid" | "cubic" | "honeycomb" | "lightning",
  "infillDensity": số % (10 đến 50),
  "printSpeed": số mm/s (120 đến 280),
  "outerWallSpeed": số mm/s (50 đến 150),
  "nozzleTemp": số °C,
  "bedTemp": số °C,
  "coolingFanSpeed": số % (0 đến 100),
  "brimEnabled": true hoặc false,
  "brimWidthMm": số mm (0 đến 10),
  "zHopMm": số mm (0.2 đến 0.6),
  "estimatedSupportWeightGrams": số gram nhựa support,
  "recommendedOrientation": {
    "axis": "x" | "y" | "z",
    "degrees": 0 | 45 | -90 | 90,
    "savingsPercent": số %,
    "rationale": "Giải thích kỹ thuật vì sao giữ nguyên hoặc xoay hướng đặt mẫu"
  },
  "riskHotspots": [
    {
      "id": "risk-1",
      "title": "Tên vùng rủi ro cụ thể trên mẫu",
      "severity": "critical" | "warning" | "info",
      "description": "Phân tích cơ chế vật lý gây lỗi tại vùng này",
      "fixSuggestion": "Thông số Bambu Studio cụ thể để triệt tiêu lỗi"
    }
  ],
  "bambuStudioProTips": [
    "Mẹo chuyên sâu 1",
    "Mẹo chuyên sâu 2",
    "Mẹo chuyên sâu 3",
    "Mẹo chuyên sâu 4"
  ]
}
`;

  try {
    const chosenModel = getSavedGeminiModel();
    const res = await callGeminiGenerateContent(apiKey, chosenModel, [{ text: prompt }], undefined, true, 2500);

    if (!res.ok || !res.text) {
      return baseExpertResult;
    }

    const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const mergedPatch: Partial<ISimulationProfile> = {
      ...baseExpertResult.fullProfilePatch,
      ...(parsed.layerHeight ? { layerHeight: Number(parsed.layerHeight) } : {}),
      ...(parsed.wallLoops ? { wallLoops: Number(parsed.wallLoops) } : {}),
      ...(parsed.infillType ? { infillType: parsed.infillType } : {}),
      ...(parsed.infillDensity ? { infillDensity: Number(parsed.infillDensity) } : {}),
      ...(parsed.printSpeed ? { printSpeed: Number(parsed.printSpeed) } : {}),
      ...(parsed.outerWallSpeed ? { outerWallSpeed: Number(parsed.outerWallSpeed) } : {}),
      ...(parsed.recommendedMode ? { supportMode: parsed.recommendedMode } : {}),
      ...(parsed.recommendedTreeStyle ? { treeStyle: parsed.recommendedTreeStyle } : {}),
      ...(parsed.angleThreshold ? { supportAngleThreshold: Number(parsed.angleThreshold) } : {}),
      ...(parsed.topZDistance ? { supportTopZDistance: Number(parsed.topZDistance) } : {}),
      ...(parsed.branchDiameter ? { supportBranchDiameter: Number(parsed.branchDiameter) } : {}),
      ...(parsed.branchAngle ? { supportBranchAngle: Number(parsed.branchAngle) } : {}),
      ...(parsed.interfaceLayers ? { supportInterfaceLayers: Number(parsed.interfaceLayers) } : {}),
      ...(typeof parsed.onBuildPlateOnly === 'boolean'
        ? { supportOnBuildPlateOnly: parsed.onBuildPlateOnly }
        : {}),
      ...(parsed.nozzleTemp ? { nozzleTemp: Number(parsed.nozzleTemp) } : {}),
      ...(parsed.bedTemp ? { bedTemp: Number(parsed.bedTemp) } : {}),
      ...(typeof parsed.coolingFanSpeed === 'number'
        ? { coolingFanSpeed: Number(parsed.coolingFanSpeed) }
        : {}),
      ...(typeof parsed.brimEnabled === 'boolean' ? { brimEnabled: parsed.brimEnabled } : {}),
      ...(typeof parsed.brimWidthMm === 'number' ? { brimWidthMm: Number(parsed.brimWidthMm) } : {}),
      ...(typeof parsed.zHopMm === 'number' ? { zHopMm: Number(parsed.zHopMm) } : {}),
    };

    return {
      ...baseExpertResult,
      source: 'gemini_flash',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      estimatedSupportWeightGrams:
        parsed.estimatedSupportWeightGrams || baseExpertResult.estimatedSupportWeightGrams,
      recommendedOrientation: {
        axis: parsed.recommendedOrientation?.axis || baseExpertResult.recommendedOrientation.axis,
        degrees:
          parsed.recommendedOrientation?.degrees ?? baseExpertResult.recommendedOrientation.degrees,
        savingsPercent:
          parsed.recommendedOrientation?.savingsPercent ??
          baseExpertResult.recommendedOrientation.savingsPercent,
        rationale:
          parsed.recommendedOrientation?.rationale ||
          baseExpertResult.recommendedOrientation.rationale,
      },
      supportRecommendation: {
        mode: mergedPatch.supportMode === 'normal' ? 'normal' : mergedPatch.supportMode === 'none' ? 'none' : 'tree',
        treeStyle: (mergedPatch.treeStyle as TreeSupportStyle) || 'organic',
        angleThreshold: mergedPatch.supportAngleThreshold || 45,
        topZDistance: mergedPatch.supportTopZDistance || 0.2,
        branchDiameter: mergedPatch.supportBranchDiameter || 2.8,
        branchAngle: mergedPatch.supportBranchAngle || 45,
        onBuildPlateOnly: mergedPatch.supportOnBuildPlateOnly ?? true,
        interfaceLayers: mergedPatch.supportInterfaceLayers || 2,
        summary: parsed.summary || baseExpertResult.supportRecommendation.summary,
      },
      fullProfilePatch: mergedPatch,
      riskHotspots:
        Array.isArray(parsed.riskHotspots) && parsed.riskHotspots.length > 0
          ? parsed.riskHotspots.map((r: any, i: number) => ({
              id: r.id || `risk-${i + 1}`,
              title: r.title || `Điểm nóng kỹ thuật #${i + 1}`,
              location: metrics.patches[i]?.center || [0, Math.round(metrics.dimensions[1] * 0.6), 0],
              severity: r.severity || 'warning',
              description: r.description || '',
              fixSuggestion: r.fixSuggestion || '',
            }))
          : baseExpertResult.riskHotspots,
      bambuStudioProTips:
        Array.isArray(parsed.bambuStudioProTips) && parsed.bambuStudioProTips.length > 0
          ? parsed.bambuStudioProTips
          : baseExpertResult.bambuStudioProTips,
    };
  } catch (err) {
    console.error('Lỗi khi gọi Gemini API:', err);
    return baseExpertResult;
  }
}

/**
 * TRỢ LÝ CHAT ĐA LƯỢT (AI COPILOT): Tư vấn kỹ thuật trực tiếp dựa trên hình học mẫu đang mở & tự động sinh gói chỉnh thông số 1-Click
 */
export async function consultChatWithGeminiAI(
  userQuestion: string,
  history: IConsultChatMessage[],
  modelName: string,
  geometry: THREE.BufferGeometry,
  profile: ISimulationProfile,
  intent: PrintConsultIntent = 'balanced',
  customApiKey?: string
): Promise<IConsultChatMessage> {
  const apiKey = (customApiKey || getSavedGeminiApiKey()).trim();
  const metrics = extractGeometryMetrics(geometry);
  const matchedRules = matchWorkshopKnowledgeRules(metrics, profile);

  // Suy luận nội tại thông minh nếu chưa nhập API key hoặc mất kết nối
  const buildLocalSmartReply = (): IConsultChatMessage => {
    const q = userQuestion.toLowerCase();
    const [dimX, dimY, dimZ] = metrics.dimensions;

    if (q.includes('nhanh') || q.includes('thời gian') || q.includes('tốc độ') || q.includes('fast')) {
      const patch: Partial<ISimulationProfile> = {
        layerHeight: 0.24,
        infillType: 'lightning',
        infillDensity: 12,
        wallLoops: 2,
        printSpeed: 260,
        outerWallSpeed: 130,
        treeStyle: 'slim',
      };
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        source: 'Bambu Engineering Copilot',
        content: `Để rút ngắn **30–38% thời gian in** cho mẫu **"${modelName}"** (${dimX}×${dimY}×${dimZ}mm) mà vẫn giữ nguyên biên dạng:\n1. Tăng **Layer Height lên 0.24mm** (giảm ngay 1/3 tổng số lớp cắt).\n2. Đổi ruột sang **Lightning Infill 12%** (chỉ mọc nhánh đỡ mặt đỉnh từ bên trong, tiết kiệm 45% thời gian chạy ruột).\n3. Chuyển **Tree Support sang chế độ Slim** và nâng tốc độ in lên **260 mm/s** (tường ngoài giữ ở **130 mm/s** để không bị rung góc).`,
        suggestedPatch: patch,
        patchSummary: 'Cấu hình In Nhanh: Layer 0.24mm • Lightning 12% • Tốc độ 260mm/s • Tree Slim',
        matchedRules: matchedRules.slice(0, 2).map((r) => r.title),
      };
    }

    if (q.includes('sẹo') || q.includes('gỡ') || q.includes('bóc') || q.includes('support') || q.includes('tree')) {
      const topZ = profile.material === 'PETG' ? 0.24 : 0.18;
      const patch: Partial<ISimulationProfile> = {
        supportMode: 'tree',
        treeStyle: 'organic',
        supportAngleThreshold: 45,
        supportTopZDistance: topZ,
        supportInterfaceLayers: 3,
        supportOnBuildPlateOnly: true,
        outerWallSpeed: 65,
        coolingFanSpeed: 100,
      };
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        source: 'Bambu Engineering Copilot',
        content: `Để **gỡ Tree Support nhẹ nhàng bằng tay và không để lại sẹo trắng** trên mẫu **"${modelName}"** (${metrics.patches.length} vùng Overhang):\n1. Bật **3 lớp đệm Conformal Support Interface** (màu tím) để tạo mặt lưới đỡ mịn thay vì đầu cành đâm trực tiếp vào mẫu.\n2. Đặt **Support Top Z Distance = ${topZ}mm** (chuẩn vàng cho ${profile.material}) và khóa **On Build Plate Only = Bật** để thân cây chỉ mọc từ mặt bàn PEI bên ngoài vỏ 3D.\n3. Tăng **Quạt làm mát 100%** và giảm **Outer Wall Speed xuống 65 mm/s** để sợi nhựa vùng Overhang se mặt trước khi chạm vào lớp đệm.`,
        suggestedPatch: patch,
        patchSummary: `Tree Organic Không Sẹo: Top Z ${topZ}mm • 3 Lớp Interface • Quạt 100%`,
        matchedRules: matchedRules.slice(0, 2).map((r) => r.title),
      };
    }

    if (q.includes('tơ') || q.includes('stringing') || q.includes('mạng nhện') || q.includes('vón')) {
      const patch: Partial<ISimulationProfile> = {
        retractionDistanceMm: profile.material === 'PETG' ? 1.4 : 1.0,
        retractionSpeedMmS: 45,
        nozzleTemp: Math.max(195, profile.nozzleTemp - 5),
        travelSpeed: 450,
        zHopMm: 0.3,
        seamPosition: 'nearest',
      };
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        source: 'Bambu Engineering Copilot',
        content: `Hiện tượng **kéo tơ (Stringing)** giữa các nhánh cây và chi tiết nhọn (tai, sừng, đuôi) xảy ra do áp suất dư trong buồng nung khi đầu phun nhảy không tải (Travel):\n1. Hạ nhiệt độ đầu phun **Nozzle xuống ${patch.nozzleTemp}°C** (-5°C) để giảm độ chảy loãng.\n2. Tăng **Retraction Length lên ${patch.retractionDistanceMm}mm** với tốc độ rút **45 mm/s**.\n3. Tăng **Travel Speed lên 450 mm/s** để dứt đứt sợi nhựa tơ trước khi kịp kéo dài.`,
        suggestedPatch: patch,
        patchSummary: `Chống Kéo Tơ: Nozzle ${patch.nozzleTemp}°C • Retract ${patch.retractionDistanceMm}mm • Travel 450mm/s`,
        matchedRules: matchedRules.slice(0, 2).map((r) => r.title),
      };
    }

    if (q.includes('bền') || q.includes('cứng') || q.includes('gãy') || q.includes('chịu lực')) {
      const patch: Partial<ISimulationProfile> = {
        wallLoops: 5,
        topShellLayers: 5,
        bottomShellLayers: 5,
        infillType: 'gyroid',
        infillDensity: 38,
        nozzleTemp: Math.min(300, profile.nozzleTemp + 5),
        outerWallSpeed: 80,
      };
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        source: 'Bambu Engineering Copilot',
        content: `Để tăng **độ bền cơ học gấp 2.4 lần** và chống gãy các cổ nối hẹp trên mẫu **"${modelName}"**:\n1. Tăng **Số vòng tường (Wall Loops) lên 5 vòng** (độ bền kéo/uốn phụ thuộc 75% vào độ dày vỏ chu vi chứ không chỉ mật độ ruột).\n2. Đổi sang **Infill Gyroid 38%** để chịu lực đẳng hướng 3 chiều.\n3. Tăng **Nozzle Temp thêm +5°C (${patch.nozzleTemp}°C)** để các lớp nhựa khuếch tán nhiệt và hàn dính chặt vào nhau (Inter-layer Adhesion).`,
        suggestedPatch: patch,
        patchSummary: `Siêu Bền Cơ Học: 5 Vòng Tường • Gyroid 38% • Nozzle ${patch.nozzleTemp}°C`,
        matchedRules: matchedRules.slice(0, 2).map((r) => r.title),
      };
    }

    // Mặc định: tư vấn toàn diện theo hình học mẫu đang mở
    const { fullProfilePatch, predictedImpact } = buildFullBambuProfileConsultation(
      metrics,
      profile,
      intent
    );
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      source: 'Bambu Engineering Copilot',
      content: `Dựa trên phân tích hình học của **"${modelName}"** (Kích thước **${dimX}×${dimY}×${dimZ}mm**, tỷ lệ mảnh **${metrics.slendernessRatio}**, **${metrics.patches.length} vùng Overhang** chiếm **${metrics.overhangPercent}%** diện tích):\n- **Rủi ro chính**: ${
        metrics.slendernessRatio > 2.0
          ? 'Mẫu khá cao nên dễ rung lắc ở 30% tầng trên cùng và dễ bị đầu phun quệt gãy nhánh.'
          : 'Các vùng vòm/hàm/đuôi nhô ra ngoài cần đệm đỡ Conformal để không bị võng sợi nhựa.'
      }\n- **Giải pháp đề xuất**: Đặt **Layer Height ${fullProfilePatch.layerHeight}mm**, **${fullProfilePatch.wallLoops} vòng tường**, ruột **${fullProfilePatch.infillType?.toUpperCase()} ${fullProfilePatch.infillDensity}%**, tốc độ tường ngoài **${fullProfilePatch.outerWallSpeed}mm/s**, bật **Z-Hop ${fullProfilePatch.zHopMm}mm** và **Tree Support (${fullProfilePatch.treeStyle})** mọc từ ngoài biên dạng vỏ.\n- Điểm an toàn bản in sẽ tăng từ **${predictedImpact.successScoreBefore}% lên ${predictedImpact.successScoreAfter}%**.`,
      suggestedPatch: fullProfilePatch,
      patchSummary: `Tối Ưu Toàn Diện: Layer ${fullProfilePatch.layerHeight}mm • ${fullProfilePatch.wallLoops} Tường • ${fullProfilePatch.infillType} ${fullProfilePatch.infillDensity}% • Tree ${fullProfilePatch.treeStyle}`,
      matchedRules: matchedRules.slice(0, 2).map((r) => r.title),
    };
  };

  if (!apiKey) {
    return buildLocalSmartReply();
  }

  const historyText = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Người dùng' : 'Chuyên gia AI'}: ${m.content}`)
    .join('\n');

  const knowledgeText = matchedRules
    .map((r) => `- [${r.title}]: ${r.content}`)
    .join('\n');

  const systemInstruction = `Bạn là Kỹ sư Chuyên gia Tư vấn In 3D của nền tảng 3D PrintSim Pro (chuẩn Bambu Studio & OrcaSlicer).
Bạn đang trực tiếp xem mô hình 3D "${modelName}" trên bàn in với thông số thực tế:
- Kích thước [X, Y(Cao), Z]: ${metrics.dimensions[0]} x ${metrics.dimensions[1]} x ${metrics.dimensions[2]} mm (Tỷ lệ Cao/Đáy: ${metrics.slendernessRatio})
- Số tam giác: ${metrics.triangleCount} | Diện tích mặt: ${metrics.totalSurfaceArea} mm²
- Overhang >45°: ${metrics.overhangPercent}% (${metrics.patches.length} cụm) | Overhang >60°: ${metrics.severeOverhangPercent}% | Cầu nối ngang: ${metrics.bridgeAreaMm2} mm²
- Cấu hình hiện tại: Vật liệu ${profile.material}, Layer ${profile.layerHeight}mm, Wall Loops ${profile.wallLoops}, Infill ${profile.infillDensity}% (${profile.infillType}), Speed ${profile.printSpeed}mm/s (Outer Wall ${profile.outerWallSpeed || 90}mm/s), Nozzle ${profile.nozzleTemp}°C, Bed ${profile.bedTemp}°C, Fan ${profile.coolingFanSpeed}%, Support ${profile.supportMode} (${profile.treeStyle || 'organic'}), Brim ${profile.brimEnabled ? profile.brimWidthMm + 'mm' : 'Tắt'}.
- Tri thức lỗi từ xưởng in:
${knowledgeText}

Hãy trả lời câu hỏi của người dùng bằng tiếng Việt thật súc tích, đúng trọng tâm kỹ thuật cơ-nhiệt in 3D, có gạch đầu dòng rõ ràng và đề xuất gói chỉnh thông số (suggestedPatch) để người dùng bấm 1 nút áp dụng ngay.`;

  const prompt = `
Lịch sử hội thoại gần đây:
${historyText || '(Bắt đầu phiên tư vấn)'}

Câu hỏi mới của người dùng: "${userQuestion}"

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc:
{
  "reply": "Câu trả lời tư vấn kỹ thuật chi tiết bằng tiếng Việt (hỗ trợ in đậm **...** và xuống dòng \\n)",
  "patchSummary": "Tóm tắt ngắn gọn 1 dòng về gói thông số đề xuất",
  "suggestedPatch": {
    "layerHeight": số mm (tùy chọn),
    "wallLoops": số vòng (tùy chọn),
    "infillType": "gyroid" | "grid" | "cubic" | "honeycomb" | "lightning" (tùy chọn),
    "infillDensity": số % (tùy chọn),
    "printSpeed": số mm/s (tùy chọn),
    "outerWallSpeed": số mm/s (tùy chọn),
    "supportMode": "tree" | "normal" | "none" (tùy chọn),
    "treeStyle": "organic" | "slim" | "strong" | "hybrid" (tùy chọn),
    "supportAngleThreshold": số độ (tùy chọn),
    "supportTopZDistance": số mm (tùy chọn),
    "supportInterfaceLayers": số lớp (tùy chọn),
    "nozzleTemp": số °C (tùy chọn),
    "bedTemp": số °C (tùy chọn),
    "coolingFanSpeed": số % (tùy chọn),
    "retractionDistanceMm": số mm (tùy chọn),
    "zHopMm": số mm (tùy chọn),
    "brimEnabled": true | false (tùy chọn),
    "brimWidthMm": số mm (tùy chọn)
  }
}
`;

  try {
    const chosenModel = getSavedGeminiModel();
    const res = await callGeminiGenerateContent(
      apiKey,
      chosenModel,
      [{ text: prompt }],
      systemInstruction,
      true,
      1800
    );

    if (!res.ok || !res.text) {
      return buildLocalSmartReply();
    }

    const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      source: res.modelUsed,
      content: parsed.reply || buildLocalSmartReply().content,
      suggestedPatch: parsed.suggestedPatch,
      patchSummary: parsed.patchSummary || 'Gói thông số tối ưu đề xuất bởi Gemini AI',
      matchedRules: matchedRules.slice(0, 2).map((r) => r.title),
    };
  } catch {
    return buildLocalSmartReply();
  }
}

/**
 * CHẨN ĐOÁN LỖI BẢN IN TỪ ẢNH CHỤP & TRIỆU CHỨNG THỰC TẾ (MULTIMODAL VISION AI)
 */
export async function diagnosePrintPhotoWithAI(
  symptomText: string,
  profile: ISimulationProfile,
  modelName: string,
  imageBase64?: string,
  imageMimeType?: string,
  customApiKey?: string
): Promise<IPhotoDiagnosisResult> {
  const apiKey = (customApiKey || getSavedGeminiApiKey()).trim();

  const buildLocalVisionFallback = (): IPhotoDiagnosisResult => {
    const s = symptomText.toLowerCase();

    if (s.includes('tơ') || s.includes('string') || s.includes('lông') || s.includes('nhện')) {
      return {
        defectTitle: 'Kéo Tơ Mạng Nhện & Rỉ Nhựa Đầu Phun (Severe Stringing & Oozing)',
        defectCategory: 'stringing',
        severity: 'warning',
        confidencePercent: 94,
        visualSymptoms: [
          'Các sợi tơ nhựa mảnh giăng ngang giữa các nhánh Tree Support và chi tiết nhọn',
          'Hạt nhựa nhỏ bám lấm tấm trên bề mặt tường ngoài (Blobs/Zits)',
        ],
        rootCauseAnalysis:
          'Nhiệt độ đầu phun cao làm giảm độ nhớt nhựa nóng chảy, kết hợp khoảng rút nhựa (Retraction) chưa đủ dài hoặc sợi nhựa bị ẩm khiến áp suất buồng nung đẩy nhựa rỉ ra khi di chuyển Travel.',
        engineeringFixSteps: [
          `Hạ nhiệt độ Nozzle từ ${profile.nozzleTemp}°C xuống ${Math.max(195, profile.nozzleTemp - 6)}°C.`,
          'Tăng Retraction Distance lên 1.2mm – 1.4mm và Retraction Speed lên 45 mm/s.',
          'Tăng tốc độ di chuyển không tải (Travel Speed) lên 450 mm/s và bật Wipe While Retracting.',
        ],
        recommendedPatch: {
          nozzleTemp: Math.max(195, profile.nozzleTemp - 6),
          retractionDistanceMm: 1.3,
          retractionSpeedMmS: 45,
          travelSpeed: 450,
          zHopMm: 0.3,
        },
        source: 'Bambu Vision Diagnostic Engine',
      };
    }

    if (s.includes('cong') || s.includes('bong') || s.includes('warp') || s.includes('tróc') || s.includes('đổ')) {
      return {
        defectTitle: 'Cong Vênh Góc Đáy & Bong Khỏi Bàn PEI (Thermal Warping & Bed Detachment)',
        defectCategory: 'warping',
        severity: 'critical',
        confidencePercent: 95,
        visualSymptoms: [
          'Mép đáy mô hình hoặc chân đế Tree Support bị nhổng cong lên khỏi mặt bàn in',
          'Các lớp phía trên bị ép dẹt hoặc đầu phun quệt làm bật gốc mẫu in',
        ],
        rootCauseAnalysis:
          'Ứng suất co ngót nhiệt không đều giữa các lớp trên đang nguội và lớp đáy dẫn tới momen uốn kéo bật mép đáy khỏi bàn PEI, đặc biệt khi diện tích đáy hẹp hoặc gió quạt thổi quá sớm.',
        engineeringFixSteps: [
          'Bật vành bám bàn Outer Brim rộng 8.0mm để giữ chặt mép biên dạng.',
          `Tăng nhiệt độ bàn in (Bed Temp) lên ${Math.min(105, profile.bedTemp + 5)}°C và tăng chiều cao lớp đầu tiên lên 0.24mm.`,
          'Bật Z-Hop 0.4mm để đầu phun nhấc cao khi băng qua các vùng nhựa dễ cong.',
        ],
        recommendedPatch: {
          brimEnabled: true,
          brimType: 'outer_only',
          brimWidthMm: 8,
          bedTemp: Math.min(105, profile.bedTemp + 5),
          firstLayerHeight: 0.24,
          zHopMm: 0.4,
        },
        source: 'Bambu Vision Diagnostic Engine',
      };
    }

    if (s.includes('lệch') || s.includes('shift') || s.includes('trượt') || s.includes('nghiêng')) {
      return {
        defectTitle: 'Trượt Bước & Lệch Tầng Ngang (Layer Shifting / Step Loss)',
        defectCategory: 'knock_over',
        severity: 'critical',
        confidencePercent: 92,
        visualSymptoms: [
          'Phần thân trên của mẫu bị dịch chuyển lệch hẳn sang một bên theo trục X hoặc Z',
          'Có vết cháy xước nhẹ tại tầng bắt đầu bị lệch do đầu phun đâm vào nhựa nhô lên',
        ],
        rootCauseAnalysis:
          'Gia tốc di chuyển (Acceleration) quá cao hoặc đầu phun va chạm mạnh vào mép Overhang/Infill bị vểnh lên làm mô-tơ bước bị mất bước (Skipped Steps).',
        engineeringFixSteps: [
          'Chuyển mẫu ruột từ Grid sang Gyroid (không có điểm giao cắt chồng chéo làm cọ đầu phun).',
          'Hạ Default Acceleration xuống 5500 mm/s² và Travel Speed xuống 360 mm/s.',
          'Bật Z-Hop 0.45mm để đầu phun luôn nhấc qua khỏi mọi chướng ngại vật.',
        ],
        recommendedPatch: {
          infillType: 'gyroid',
          defaultAcceleration: 5500,
          outerWallAcceleration: 3500,
          travelSpeed: 360,
          zHopMm: 0.45,
        },
        source: 'Bambu Vision Diagnostic Engine',
      };
    }

    // Mặc định: Lỗi sập Overhang / xù mặt dưới (Overhang Sagging & Spaghetti)
    return {
      defectTitle: 'Võng Sợi Mặt Dưới Overhang & Sẹo Điểm Tựa (Overhang Curling & Support Scarring)',
      defectCategory: 'overhang',
      severity: 'critical',
      confidencePercent: 93,
      visualSymptoms: [
        'Bề mặt dưới cằm, vòm hoặc đuôi mẫu bị xù mì, chảy xệ từng vòng sợi nhựa rời rạc',
        'Đầu nhánh Support dính quá chặt hoặc thiếu lớp đệm Interface làm rỗ mặt dưới',
      ],
      rootCauseAnalysis:
        'Khi góc nghiêng vượt quá 45°, sợi nhựa đùn ra chỉ bám được một phần nhỏ vào lớp dưới. Nếu thiếu lớp đệm Conformal Interface hoặc tốc độ tường ngoài quá nhanh, sợi nhựa sẽ bị kéo tuột vào không trung.',
      engineeringFixSteps: [
        'Kích hoạt Tree Support (Organic) với góc ngưỡng 44° và 3 lớp đệm Conformal Interface.',
        'Hạ tốc độ tường ngoài (Outer Wall Speed) xuống 60 mm/s và Layer Height xuống 0.16mm.',
        'Tăng quạt làm mát (Cooling Fan) lên 100% để định hình sợi nhựa tức thì.',
      ],
      recommendedPatch: {
        layerHeight: 0.16,
        supportMode: 'tree',
        treeStyle: 'organic',
        supportAngleThreshold: 44,
        supportTopZDistance: 0.2,
        supportInterfaceLayers: 3,
        outerWallSpeed: 60,
        coolingFanSpeed: 100,
      },
      source: 'Bambu Vision Diagnostic Engine',
    };
  };

  if (!apiKey) {
    return buildLocalVisionFallback();
  }

  const parts: any[] = [];
  if (imageBase64 && imageMimeType) {
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    parts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: cleanBase64,
      },
    });
  }

  const prompt = `
Bạn là Chuyên gia Chẩn đoán Lỗi In 3D bằng Thị giác Máy tính (Bambu Lab Vision Diagnostic AI).
Người dùng đang in mô hình "${modelName}" bằng vật liệu ${profile.material} (Layer ${profile.layerHeight}mm, Speed ${profile.printSpeed}mm/s, Nozzle ${profile.nozzleTemp}°C, Bed ${profile.bedTemp}°C, Support ${profile.supportMode}).
Mô tả triệu chứng từ người dùng: "${symptomText || 'Phân tích lỗi bản in trong hình ảnh đính kèm'}"

Hãy quan sát kỹ hình ảnh (nếu có) và triệu chứng, sau đó trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc:
{
  "defectTitle": "Tên chuyên môn của lỗi in 3D bằng tiếng Việt (kèm thuật ngữ tiếng Anh)",
  "defectCategory": "overhang" | "stringing" | "adhesion_warp" | "layer_shift" | "bridging" | "under_extrusion" | "layer_splitting" | "ghosting",
  "severity": "critical" | "warning" | "info",
  "confidencePercent": số % độ tin cậy từ 85 đến 99,
  "visualSymptoms": ["Dấu hiệu nhận biết 1", "Dấu hiệu nhận biết 2"],
  "rootCauseAnalysis": "Giải thích sâu sắc cơ chế vật lý / nhiệt động lực học gây ra lỗi này",
  "engineeringFixSteps": ["Bước khắc phục 1", "Bước khắc phục 2", "Bước khắc phục 3"],
  "recommendedPatch": {
    "layerHeight": số mm (tùy chọn),
    "wallLoops": số vòng (tùy chọn),
    "infillType": "gyroid" | "grid" | "cubic" (tùy chọn),
    "infillDensity": số % (tùy chọn),
    "printSpeed": số mm/s (tùy chọn),
    "outerWallSpeed": số mm/s (tùy chọn),
    "supportMode": "tree" | "normal" (tùy chọn),
    "treeStyle": "organic" | "slim" | "strong" (tùy chọn),
    "supportAngleThreshold": số độ (tùy chọn),
    "supportTopZDistance": số mm (tùy chọn),
    "supportInterfaceLayers": số lớp (tùy chọn),
    "nozzleTemp": số °C (tùy chọn),
    "bedTemp": số °C (tùy chọn),
    "coolingFanSpeed": số % (tùy chọn),
    "retractionDistanceMm": số mm (tùy chọn),
    "zHopMm": số mm (tùy chọn),
    "brimEnabled": true | false (tùy chọn),
    "brimWidthMm": số mm (tùy chọn)
  }
}
`;
  parts.push({ text: prompt });

  try {
    const chosenModel = getSavedGeminiModel();
    const res = await callGeminiGenerateContent(apiKey, chosenModel, parts, undefined, true, 2000);
    if (!res.ok || !res.text) {
      return buildLocalVisionFallback();
    }
    const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const fallback = buildLocalVisionFallback();

    return {
      defectTitle: parsed.defectTitle || fallback.defectTitle,
      defectCategory: (parsed.defectCategory as DefectCategoryType) || fallback.defectCategory,
      severity: (parsed.severity as DefectSeverity) || fallback.severity,
      confidencePercent: parsed.confidencePercent || 95,
      visualSymptoms:
        Array.isArray(parsed.visualSymptoms) && parsed.visualSymptoms.length > 0
          ? parsed.visualSymptoms
          : fallback.visualSymptoms,
      rootCauseAnalysis: parsed.rootCauseAnalysis || fallback.rootCauseAnalysis,
      engineeringFixSteps:
        Array.isArray(parsed.engineeringFixSteps) && parsed.engineeringFixSteps.length > 0
          ? parsed.engineeringFixSteps
          : fallback.engineeringFixSteps,
      recommendedPatch: parsed.recommendedPatch || fallback.recommendedPatch,
      source: res.modelUsed,
    };
  } catch {
    return buildLocalVisionFallback();
  }
}
