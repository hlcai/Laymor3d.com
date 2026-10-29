import { IGeometryFingerprint } from './geometryFingerprintEngine';

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
];

let runtimeLearningDataset: IHistoricalLearningCase[] = [...SEED_HISTORICAL_LEARNING_CASES];

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
      physicsMechanism: `Diện tích bám bàn Layer 1 chỉ đạt ${fp.bedContactAreaMm2} mm² trong khi tỷ lệ độ mảnh trọng tâm là ${fp.comHeightRatio}.`,
      historicalEvidence: similarWarpFailure
        ? `⚠️ Bằng chứng lịch sử: Mẫu tương đồng "${similarWarpFailure.learningCase.modelName}" từng bị đổ gãy khi thiếu Brim.`
        : undefined,
      suggestedFix: {
        brimEnabled: true,
        brimWidthMm: recommendedBrim,
        firstLayerSpeedMmS: 20,
      },
      riskPenalty: similarWarpFailure ? 40 : 32,
    });
  }

  if (
    (fp.overhangArea45Mm2 > 280 || fp.severeOverhangArea60Mm2 > 60) &&
    profile.supportMode === 'none'
  ) {
    tuned.supportMode = 'tree';
    issues.push({
      code: 'UNSUPPORTED_OVERHANG_COLLAPSE',
      severity: 'CRITICAL',
      title: 'Phát hiện vùng dốc lớn lơ lửng không có cây chống (Spaghetti Risk)',
      physicsMechanism: `Mô hình có ${fp.overhangArea45Mm2} mm² bề mặt nghiêng >45° và nhịp cầu ${fp.maxBridgeSpanMm} mm.`,
      suggestedFix: { supportMode: 'tree' },
      riskPenalty: 38,
    });
  }

  const totalPenalty = issues.reduce((acc, item) => acc + item.riskPenalty, 0);
  const overallRiskScore = Math.min(100, totalPenalty);
  const qcHealthScore = Math.max(0, 100 - overallRiskScore);

  return {
    qcHealthScore,
    overallRiskScore,
    matchedHistoricalCases: topMatches,
    issues,
    autoTunedProfile: tuned,
    geminiRagPrompt: '',
  };
}
