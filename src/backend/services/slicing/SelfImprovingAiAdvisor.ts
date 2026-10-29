import { IGeometryFingerprint } from './GeometryFingerprintEngine';

export interface ISlicerProfileInput {
  material: 'PLA' | 'PETG' | 'ABS' | 'ASA' | 'TPU' | string;
  layerHeightMm: number;
  infillDensityPct: number;
  infillPattern: string;
  wallLoops: number;
  supportMode: 'none' | 'tree' | 'normal';
  brimEnabled: boolean;
  brimWidthMm: number;
  printSpeedMmS: number;
  outerWallSpeedMmS: number;
  firstLayerSpeedMmS: number;
  nozzleTempC: number;
  bedTempC: number;
  coolingFanPct: number;
  retractionMm: number;
}

export type RealPrintOutcome =
  | 'VERIFIED_SUCCESS'
  | 'FAILED_WARP_TIPPING'
  | 'FAILED_OVERHANG_SPAGHETTI'
  | 'FAILED_STRINGING_SPIRE'
  | 'SIM_GOLDEN_PROFILE';

export interface IHistoricalLearningCase {
  caseId: string;
  modelId: string;
  modelName: string;
  material: string;
  fingerprint: IGeometryFingerprint;
  goldenProfile: Partial<ISlicerProfileInput>;
  outcome: RealPrintOutcome;
  aiInsightLesson: string;
  recordedAt: string;
}

export interface ISimilarCaseMatch {
  learningCase: IHistoricalLearningCase;
  similarityScore: number;
}

export interface IAdaptiveAuditIssue {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  physicsMechanism: string;
  historicalEvidence?: string;
  suggestedFix: Partial<ISlicerProfileInput>;
  riskPenalty: number;
}

export interface IAdaptiveAuditResult {
  qcHealthScore: number;
  overallRiskScore: number;
  matchedHistoricalCases: ISimilarCaseMatch[];
  issues: IAdaptiveAuditIssue[];
  autoTunedProfile: ISlicerProfileInput;
  geminiRagPrompt: string;
}

// Kho dữ liệu khởi tạo (Seed Dataset) được đồng bộ với Google Sheet 03_ai_learning_dataset
export const SEED_HISTORICAL_LEARNING_CASES: IHistoricalLearningCase[] = [
  {
    caseId: 'case_seed_001',
    modelId: 'mdl_seed_statue01',
    modelName: 'Tượng Nhân Vật Đứng 2 Chân Đế Hẹp (160mm)',
    material: 'PLA',
    fingerprint: {
      trueVolumeCm3: 42.5,
      surfaceAreaCm2: 185.0,
      bedContactAreaMm2: 145.0,
      bedFootprintHullMm2: 420.0,
      comHeightRatio: 3.45,
      overhangArea45Mm2: 640.0,
      severeOverhangArea60Mm2: 210.0,
      maxBridgeSpanMm: 18.0,
      minNeckAreaMm2: 34.0,
      minNeckHeightRatio: 0.22,
      thinWallRatioPct: 4.5,
      minLayerTimeSec: 3.8,
      maxIslandsPerLayer: 6,
      dimensionsMm: { x: 65, y: 160, z: 52 },
      centerOfMassMm: { x: 0, y: 78, z: 0 },
    },
    goldenProfile: {
      supportMode: 'tree',
      brimEnabled: true,
      brimWidthMm: 10,
      firstLayerSpeedMmS: 20,
      outerWallSpeedMmS: 75,
      coolingFanPct: 100,
    },
    outcome: 'FAILED_WARP_TIPPING',
    aiInsightLesson:
      'Mẫu tượng cao có diện tích bám bàn < 200mm² và Slenderness > 2.5 rất dễ bị đầu phun quệt đổ ở 65% chiều cao. Bắt buộc bật Brim 10mm, Tree Support và hạ tốc độ vách ngoài xuống 75mm/s.',
    recordedAt: '2026-10-20T10:00:00Z',
  },
  {
    caseId: 'case_seed_002',
    modelId: 'mdl_seed_gridbox02',
    modelName: 'Khay Cơ Khí Gridfinity Đáy Phẳng Rộng',
    material: 'PETG',
    fingerprint: {
      trueVolumeCm3: 68.0,
      surfaceAreaCm2: 310.0,
      bedContactAreaMm2: 6400.0,
      bedFootprintHullMm2: 7056.0,
      comHeightRatio: 0.28,
      overhangArea45Mm2: 45.0,
      severeOverhangArea60Mm2: 0,
      maxBridgeSpanMm: 6.0,
      minNeckAreaMm2: 880.0,
      minNeckHeightRatio: 0.5,
      thinWallRatioPct: 8.0,
      minLayerTimeSec: 16.5,
      maxIslandsPerLayer: 1,
      dimensionsMm: { x: 84, y: 42, z: 84 },
      centerOfMassMm: { x: 0, y: 18, z: 0 },
    },
    goldenProfile: {
      supportMode: 'none',
      brimEnabled: false,
      brimWidthMm: 0,
      infillDensityPct: 15,
      outerWallSpeedMmS: 130,
    },
    outcome: 'VERIFIED_SUCCESS',
    aiInsightLesson:
      'Mẫu cơ khí đáy phẳng rộng (>5000mm²) có trọng tâm thấp (Slenderness 0.28) tự bám bàn cực tốt, tắt Support và Brim để tiết kiệm 18% thời gian in.',
    recordedAt: '2026-10-22T14:30:00Z',
  },
  {
    caseId: 'case_seed_003',
    modelId: 'mdl_seed_dragon03',
    modelName: 'Rồng Khớp Động Articulated Nhiều Đốt & Sừng Nhọn',
    material: 'PLA',
    fingerprint: {
      trueVolumeCm3: 54.0,
      surfaceAreaCm2: 410.0,
      bedContactAreaMm2: 1850.0,
      bedFootprintHullMm2: 14400.0,
      comHeightRatio: 0.18,
      overhangArea45Mm2: 390.0,
      severeOverhangArea60Mm2: 85.0,
      maxBridgeSpanMm: 11.0,
      minNeckAreaMm2: 28.0,
      minNeckHeightRatio: 0.78,
      thinWallRatioPct: 14.0,
      minLayerTimeSec: 2.9,
      maxIslandsPerLayer: 18,
      dimensionsMm: { x: 120, y: 38, z: 120 },
      centerOfMassMm: { x: 0, y: 14, z: 0 },
    },
    goldenProfile: {
      supportMode: 'none',
      brimEnabled: false,
      firstLayerSpeedMmS: 22,
      retractionMm: 1.0,
      coolingFanPct: 100,
    },
    outcome: 'FAILED_STRINGING_SPIRE',
    aiInsightLesson:
      'Mẫu khớp liền (Print-in-Place) có tới 18 ốc đảo/layer và thời gian lớp đỉnh chóp < 3s: tuyệt đối không bật Brim (tránh dính khớp), giảm tốc độ lớp 1 xuống 22mm/s, tăng Retraction 1.0mm và quạt 100%.',
    recordedAt: '2026-10-24T09:15:00Z',
  },
];

let runtimeLearningDataset: IHistoricalLearningCase[] = [...SEED_HISTORICAL_LEARNING_CASES];

export function getRuntimeLearningDataset(): IHistoricalLearningCase[] {
  return runtimeLearningDataset;
}

export function addRuntimeLearningCase(newCase: IHistoricalLearningCase): void {
  runtimeLearningDataset = [newCase, ...runtimeLearningDataset.slice(0, 199)];
}

export function normalizeGeometryVector(fp: IGeometryFingerprint): number[] {
  return [
    Math.min(1, Math.log10(1 + fp.trueVolumeCm3) / 3.0),
    Math.min(1, Math.log10(1 + fp.bedContactAreaMm2) / 4.0),
    Math.min(1, fp.comHeightRatio / 4.0),
    Math.min(1, Math.log10(1 + fp.overhangArea45Mm2) / 3.5),
    Math.min(1, Math.log10(1 + fp.severeOverhangArea60Mm2) / 3.0),
    Math.min(1, fp.maxBridgeSpanMm / 50.0),
    Math.min(1, Math.log10(1 + fp.minNeckAreaMm2) / 3.5),
    fp.minNeckHeightRatio,
    Math.min(1, fp.thinWallRatioPct / 100.0),
    Math.min(1, 10.0 / Math.max(1.0, fp.minLayerTimeSec)),
    Math.min(1, fp.maxIslandsPerLayer / 12.0),
    Math.min(1, fp.surfaceAreaCm2 / Math.max(1, fp.trueVolumeCm3 * 6)),
  ];
}

const FEATURE_WEIGHTS = [0.8, 2.2, 2.5, 2.0, 2.2, 1.4, 1.8, 0.8, 1.5, 1.8, 1.7, 1.2];

export function computeGeometrySimilarity(
  fpA: IGeometryFingerprint,
  fpB: IGeometryFingerprint
): number {
  const vecA = normalizeGeometryVector(fpA);
  const vecB = normalizeGeometryVector(fpB);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const w = FEATURE_WEIGHTS[i];
    dot += w * vecA[i] * vecB[i];
    normA += w * vecA[i] * vecA[i];
    normB += w * vecB[i] * vecB[i];
  }

  if (normA < 1e-9 || normB < 1e-9) return 0;
  return Number((dot / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
}

export function retrieveSimilarHistoricalCases(
  targetFp: IGeometryFingerprint,
  dataset: IHistoricalLearningCase[] = runtimeLearningDataset,
  material?: string,
  topK: number = 3
): ISimilarCaseMatch[] {
  const scored = dataset.map((item) => {
    let sim = computeGeometrySimilarity(targetFp, item.fingerprint);
    if (material && item.material.toUpperCase() === material.toUpperCase()) {
      sim = Math.min(1.0, Number((sim * 1.04).toFixed(4)));
    }
    return { learningCase: item, similarityScore: sim };
  });

  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK);
}

export function runSelfImprovingPhysicsAudit(
  fp: IGeometryFingerprint,
  profile: ISlicerProfileInput,
  historicalDataset: IHistoricalLearningCase[] = runtimeLearningDataset
): IAdaptiveAuditResult {
  const topMatches = retrieveSimilarHistoricalCases(fp, historicalDataset, profile.material, 3);
  const issues: IAdaptiveAuditIssue[] = [];
  const tuned: ISlicerProfileInput = { ...profile };

  const similarWarpFailure = topMatches.find(
    (m) => m.similarityScore >= 0.82 && m.learningCase.outcome === 'FAILED_WARP_TIPPING'
  );
  const similarSpaghettiFailure = topMatches.find(
    (m) => m.similarityScore >= 0.82 && m.learningCase.outcome === 'FAILED_OVERHANG_SPAGHETTI'
  );
  const similarStringingFailure = topMatches.find(
    (m) => m.similarityScore >= 0.82 && m.learningCase.outcome === 'FAILED_STRINGING_SPIRE'
  );

  const slendernessThreshold = similarWarpFailure ? 1.45 : 1.85;
  const minBedAreaThreshold = similarWarpFailure ? 320 : 220;

  if (
    (fp.comHeightRatio > slendernessThreshold || fp.bedContactAreaMm2 < minBedAreaThreshold) &&
    (!profile.brimEnabled || profile.brimWidthMm < 6)
  ) {
    const recommendedBrim = fp.comHeightRatio > 2.5 || similarWarpFailure ? 10 : 8;
    tuned.brimEnabled = true;
    tuned.brimWidthMm = recommendedBrim;
    tuned.firstLayerSpeedMmS = 20;

    issues.push({
      code: 'HIGH_COM_TIPPING_AND_WARP_RISK',
      severity: 'CRITICAL',
      title: 'Nguy cơ quệt đổ mô hình & bong đế ở các lớp trên cao (High Center-of-Mass Leverage)',
      physicsMechanism: `Diện tích bám bàn Layer 1 chỉ đạt ${fp.bedContactAreaMm2} mm² trong khi tỷ lệ độ mảnh trọng tâm là ${fp.comHeightRatio} (ngưỡng an toàn < ${slendernessThreshold}).`,
      historicalEvidence: similarWarpFailure
        ? `⚠️ Bằng chứng lịch sử: Mẫu tương đồng "${similarWarpFailure.learningCase.modelName}" (độ giống ${(similarWarpFailure.similarityScore * 100).toFixed(0)}%) từng bị đổ gãy khi thiếu Brim.`
        : undefined,
      suggestedFix: {
        brimEnabled: true,
        brimWidthMm: recommendedBrim,
        firstLayerSpeedMmS: 20,
      },
      riskPenalty: similarWarpFailure ? 40 : 32,
    });
  }

  const overhangThresholdMm2 = similarSpaghettiFailure ? 180 : 300;
  if (
    (fp.overhangArea45Mm2 > overhangThresholdMm2 || fp.severeOverhangArea60Mm2 > 60) &&
    profile.supportMode === 'none'
  ) {
    tuned.supportMode = 'tree';
    issues.push({
      code: 'UNSUPPORTED_OVERHANG_COLLAPSE',
      severity: 'CRITICAL',
      title: 'Phát hiện vùng dốc lớn lơ lửng không có cây chống (Spaghetti Risk)',
      physicsMechanism: `Mô hình có ${fp.overhangArea45Mm2} mm² bề mặt nghiêng >45° (trong đó ${fp.severeOverhangArea60Mm2} mm² dốc nặng >60°) và nhịp cầu ${fp.maxBridgeSpanMm} mm.`,
      historicalEvidence: similarSpaghettiFailure
        ? `⚠️ Bằng chứng lịch sử: Mẫu "${similarSpaghettiFailure.learningCase.modelName}" từng bị rơi nhựa Spaghetti khi tắt Support.`
        : undefined,
      suggestedFix: { supportMode: 'tree' },
      riskPenalty: 38,
    });
  }

  if (fp.minNeckAreaMm2 < 45 && profile.outerWallSpeedMmS > 90) {
    tuned.outerWallSpeedMmS = 70;
    tuned.wallLoops = Math.max(3, profile.wallLoops);
    issues.push({
      code: 'FRAGILE_NECK_SHEAR_STRESS',
      severity: 'WARNING',
      title: `Điểm thắt cổ chai yếu (${fp.minNeckAreaMm2} mm²) tại ${Math.round(fp.minNeckHeightRatio * 100)}% chiều cao`,
      physicsMechanism: `Tiết diện ngang hẹp dễ bị rung lắc dưới lực kéo nhớt của dòng nhựa ở tốc độ vách ngoài ${profile.outerWallSpeedMmS} mm/s.`,
      suggestedFix: { outerWallSpeedMmS: 70, wallLoops: Math.max(3, profile.wallLoops) },
      riskPenalty: 18,
    });
  }

  if (fp.minLayerTimeSec < 5.5 || fp.maxIslandsPerLayer >= 5) {
    const newFan = profile.material.toUpperCase().includes('PLA') ? 100 : Math.min(80, profile.coolingFanPct + 20);
    const newRetraction = Math.max(1.0, profile.retractionMm);
    tuned.coolingFanPct = newFan;
    tuned.retractionMm = newRetraction;

    issues.push({
      code: 'SPIRE_OVERHEAT_AND_ISLAND_STRINGING',
      severity: 'WARNING',
      title: 'Quá nhiệt chóp đỉnh & Kéo tơ giữa nhiều ốc đảo rời rạc',
      physicsMechanism: `Thời gian in lớp ngắn nhất chỉ ${fp.minLayerTimeSec}s (< 5.5s) và có tới ${fp.maxIslandsPerLayer} ốc đảo/layer.`,
      historicalEvidence: similarStringingFailure
        ? `⚠️ Bằng chứng lịch sử: "${similarStringingFailure.learningCase.modelName}" (${(similarStringingFailure.similarityScore * 100).toFixed(0)}% tương đồng) ghi nhận lỗi kéo tơ và nhão chóp.`
        : undefined,
      suggestedFix: { coolingFanPct: newFan, retractionMm: newRetraction },
      riskPenalty: 20,
    });
  }

  const totalPenalty = issues.reduce((acc, item) => acc + item.riskPenalty, 0);
  const overallRiskScore = Math.min(100, totalPenalty);
  const qcHealthScore = Math.max(0, 100 - overallRiskScore);

  const geminiRagPrompt = buildAugmentedGeminiPrompt(fp, profile, qcHealthScore, issues, topMatches);

  return {
    qcHealthScore,
    overallRiskScore,
    matchedHistoricalCases: topMatches,
    issues,
    autoTunedProfile: tuned,
    geminiRagPrompt,
  };
}

export function buildAugmentedGeminiPrompt(
  fp: IGeometryFingerprint,
  profile: ISlicerProfileInput,
  qcHealthScore: number,
  issues: IAdaptiveAuditIssue[],
  matchedCases: ISimilarCaseMatch[]
): string {
  const caseLines = matchedCases
    .map(
      (m, idx) =>
        `  ${idx + 1}. [${m.learningCase.outcome}] Mẫu "${m.learningCase.modelName}" (Tương đồng: ${(
          m.similarityScore * 100
        ).toFixed(1)}%, Vật liệu: ${m.learningCase.material}) -> Bài học: ${m.learningCase.aiInsightLesson}`
    )
    .join('\n');

  const issueLines = issues
    .map((iss) => `  - [${iss.severity}] ${iss.title}: ${iss.physicsMechanism}`)
    .join('\n');

  return [
    `Bạn là Chuyên gia Kỹ thuật In 3D FDM Công nghiệp của hệ thống Laymor3D.`,
    `=== 1. ĐẶC TRƯNG HÌNH HỌC THỰC TẾ CỦA MÔ HÌNH (12-POINT GEOMETRY FINGERPRINT) ===`,
    `- Kích thước bao: ${fp.dimensionsMm.x} x ${fp.dimensionsMm.y} x ${fp.dimensionsMm.z} mm | Thể tích thực: ${fp.trueVolumeCm3} cm³`,
    `- Diện tích bám bàn Layer 1: ${fp.bedContactAreaMm2} mm² | Tỷ lệ độ mảnh trọng tâm (Slenderness): ${fp.comHeightRatio}`,
    `- Diện tích dốc Overhang >45°: ${fp.overhangArea45Mm2} mm² (>60°: ${fp.severeOverhangArea60Mm2} mm²) | Nhịp cầu: ${fp.maxBridgeSpanMm} mm`,
    `- Tiết diện cổ chai nhỏ nhất: ${fp.minNeckAreaMm2} mm² (tại ${Math.round(fp.minNeckHeightRatio * 100)}% chiều cao)`,
    `- Thời gian layer ngắn nhất: ${fp.minLayerTimeSec}s | Số ốc đảo tối đa/layer: ${fp.maxIslandsPerLayer}`,
    ``,
    `=== 2. CẤU HÌNH HIỆN TẠI & ĐIỂM AN TOÀN VẬT LÝ (${qcHealthScore}/100) ===`,
    `- Vật liệu: ${profile.material} | Layer: ${profile.layerHeightMm}mm | Support: ${profile.supportMode} | Brim: ${profile.brimEnabled ? profile.brimWidthMm + 'mm' : 'Tắt'}`,
    issueLines ? `- Cảnh báo vật lý phát hiện:\n${issueLines}` : `- Không phát hiện xung đột vật lý nghiêm trọng.`,
    ``,
    `=== 3. DỮ LIỆU THỰC NGHIỆM TỪ CÁC MÔ HÌNH TƯƠNG ĐỒNG TRONG LỊCH SỬ (GEOMETRY-RAG) ===`,
    caseLines || `  (Chưa có mẫu tương đồng trong kho lịch sử)`,
    ``,
    `YÊU CẦU: Dựa trực tiếp vào 12 chỉ số hình học và bằng chứng từ các ca in tương đồng ở Mục 3, hãy đưa ra nhận định kỹ thuật súc tích và 3 khuyến nghị thông số chính xác nhất.`,
  ].join('\n');
}
