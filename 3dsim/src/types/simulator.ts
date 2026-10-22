export type FilamentMaterial = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'PLA-CF' | 'ASA' | 'PA-CF';
export type MaterialType = FilamentMaterial;

export type InfillPattern =
  | 'gyroid'
  | 'grid'
  | 'honeycomb'
  | 'triangles'
  | 'concentric'
  | 'cubic'
  | 'lightning'
  | 'solid';

export type SupportMode = 'none' | 'normal' | 'tree';
export type SupportType = SupportMode;

export type TreeSupportStyle = 'organic' | 'slim' | 'strong' | 'hybrid';

export type SeamPositionType = 'aligned' | 'nearest' | 'back' | 'random';

export type FuzzySkinMode = 'none' | 'outside' | 'all';

export type BrimTypeMode = 'none' | 'outer_only' | 'inner_only' | 'outer_and_inner' | 'mouse_ears';

export type PlaybackSpeed = 1 | 5 | 10 | 20 | 25 | 50 | 100 | 200 | 500 | 1000 | 'instant';

export type SlicerRenderMode = 'realistic' | 'features' | 'defects' | 'speed';

export type ViewportDisplayMode = 'prepare' | 'cad' | 'filament_preview';

export type SimulatorEngineType = 'wasm_client' | 'pro_local';

export type DefectSeverity = 'critical' | 'warning' | 'info';

export type DefectCategoryType =
  | 'overhang'
  | 'warping'
  | 'stringing'
  | 'under_extrusion'
  | 'temperature_mismatch'
  | 'first_layer'
  | 'elephant_foot'
  | 'pillowing'
  | 'ringing'
  | 'delamination'
  | 'z_seam_scarring'
  | 'bridging'
  | 'clogging'
  | 'support_fusion'
  | 'knock_over'
  | 'moisture_bubbling'
  | 'thin_wall'
  | 'custom_defect';

export type DefectType = DefectCategoryType;

export interface ISupportOverhangPatch {
  id: string;
  center: [number, number, number];
  areaMm2: number;
  minAngleDeg: number;
  avgAngleDeg: number;
  severity: 'critical' | 'moderate' | 'mild';
  requiresSupport: boolean;
  isBridge: boolean;
}

export interface IGeminiSupportAdvice {
  recommendedSupportMode: SupportMode;
  recommendedTreeStyle: TreeSupportStyle;
  recommendedThresholdAngle: number;
  recommendedRotationDeg: [number, number, number];
  estimatedSupportSavingsPercent: number;
  confidenceScore: number;
  technicalSummary: string;
  patchRecommendations: {
    patchId: string;
    strategy: string;
    tipDiameterMm: number;
    branchAngleDeg: number;
    zTopDistanceMm: number;
  }[];
  bambuStudioOverrides: Record<string, string | number | boolean>;
}

export interface IEngineInfo {
  id: SimulatorEngineType;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  features: string[];
  latency: string;
  memoryUsage: string;
  status: 'active' | 'ready';
  fidelity: 'High' | 'Ultra-Precision CNC';
}

export interface IProSlicerTelemetry {
  gcodeInstruction: string;
  feedrateMmMin: number;
  volumetricFlowMm3s: number;
  accelMmS2: number;
  fanPwmPercent: number;
  nozzlePressureBar: number;
  retractionDistanceMm: number;
  chamberTempC: number;
  hotendDutyPercent: number;
}

// ==========================================
// BAMBU LAB TIMELAPSE TYPES
// ==========================================
export type TimelapseMode = 'smooth' | 'live';
export type TimelapseCameraPreset = 'chamber_iso' | 'front_hero' | 'top_down' | 'custom';

export interface ITimelapseFrame {
  layer: number;
  progress: number;
  dataUrl?: string;
  timestamp: string;
  elapsedTimeSec: number;
  toolheadParked: boolean;
  nozzleTemp: number;
  bedTemp: number;
}

export interface ITimelapseConfig {
  mode: TimelapseMode;
  cameraPreset: TimelapseCameraPreset;
  fps: number;
  parkPosition: [number, number, number];
  showOsdOverlay: boolean;
  resolution: '720p' | '1080p';
}

export type PrintConsultIntent =
  | 'balanced'
  | 'aesthetic_statue'
  | 'mechanical_strength'
  | 'print_in_place'
  | 'rapid_prototype'
  | 'cantilever_overhang'
  | 'outdoor_thermal';

export interface IProfileParameterDiff {
  category: 'quality' | 'strength' | 'speed' | 'support' | 'cooling' | 'adhesion';
  label: string;
  paramKey: keyof ISimulationProfile;
  currentValue: string | number | boolean;
  recommendedValue: string | number | boolean;
  unit?: string;
  reason: string;
}

export interface IMatchedKnowledgeRuleSummary {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  tags: string[];
  isVerified: boolean;
  autoFixPatch?: Partial<ISimulationProfile>;
}

export interface IConsultChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
  suggestedPatch?: Partial<ISimulationProfile>;
  patchSummary?: string;
  matchedRules?: string[];
}

export interface IPhotoDiagnosisResult {
  defectTitle: string;
  defectCategory: DefectCategoryType;
  severity: DefectSeverity;
  confidencePercent: number;
  visualSymptoms: string[];
  rootCauseAnalysis: string;
  engineeringFixSteps: string[];
  recommendedPatch: Partial<ISimulationProfile>;
  source: string;
}

export interface ISupportAnalysisResult {
  modelName: string;
  source: 'gemini_flash' | 'bambu_expert_rules';
  intent?: PrintConsultIntent;
  timestamp: string;
  totalTriangles: number;
  totalSurfaceAreaMm2: number;
  overhangPercent: number;
  severeOverhangPercent: number;
  bridgeSpansCount: number;
  estimatedSupportWeightGrams: number;
  recommendedOrientation: {
    axis: 'x' | 'y' | 'z';
    degrees: number;
    savingsPercent: number;
    rationale: string;
  };
  supportRecommendation: {
    mode: SupportType;
    treeStyle: TreeSupportStyle;
    angleThreshold: number;
    topZDistance: number;
    branchDiameter: number;
    branchAngle: number;
    onBuildPlateOnly: boolean;
    interfaceLayers: number;
    summary: string;
  };
  fullProfilePatch?: Partial<ISimulationProfile>;
  parameterChanges?: IProfileParameterDiff[];
  predictedImpact?: {
    successScoreBefore: number;
    successScoreAfter: number;
    surfaceQualityScore: number;
    structuralStrengthScore: number;
    estimatedTimeDeltaPercent: number;
    estimatedFilamentDeltaPercent: number;
  };
  matchedKnowledgeRules?: IMatchedKnowledgeRuleSummary[];
  riskHotspots: {
    id: string;
    title: string;
    location: [number, number, number];
    severity: DefectSeverity;
    description: string;
    fixSuggestion: string;
  }[];
  bambuStudioProTips: string[];
}

export interface IModelTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export const DEFAULT_TRANSFORM: IModelTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1.0,
};

export interface ISimulationProfile {
  id: string;
  name: string;
  description: string;

  // 1. Quality / Layer / Seam / Surface (Chuẩn Bambu Studio Quality Tab)
  layerHeight: number;               // 0.08 -> 0.36 mm
  firstLayerHeight?: number;         // 0.12 -> 0.32 mm (initial_layer_print_height)
  lineWidth?: number;                // 0.30 -> 0.85 mm (line_width)
  outerWallLineWidth?: number;       // 0.30 -> 0.80 mm (outer_wall_line_width)
  seamPosition?: SeamPositionType;   // 'aligned' | 'nearest' | 'back' | 'random'
  ironingEnabled?: boolean;          // Là phẳng bề mặt đỉnh (ironing_type)
  fuzzySkin?: FuzzySkinMode;         // Nhám nghệ thuật bề mặt ('none' | 'outside' | 'all')
  fuzzySkinThickness?: number;       // 0.1 -> 0.6 mm

  // 2. Strength / Walls / Shells / Infill (Chuẩn Bambu Studio Strength Tab)
  wallLoops: number;                 // 1 -> 8 loops
  topShellLayers?: number;           // 1 -> 10 layers
  bottomShellLayers?: number;        // 1 -> 10 layers
  infillType: InfillPattern;
  infillDensity: number;             // 0 -> 100 %
  infillOverlapPercent?: number;     // 5 -> 35 %

  // 3. Speed & Acceleration (Chuẩn Bambu Studio Speed Tab)
  printSpeed: number;                // 30 -> 500 mm/s
  outerWallSpeed?: number;           // 30 -> 350 mm/s
  innerWallSpeed?: number;           // 50 -> 400 mm/s
  infillSpeed?: number;              // 50 -> 450 mm/s
  topSurfaceSpeed?: number;          // 30 -> 250 mm/s
  travelSpeed?: number;              // 150 -> 700 mm/s
  defaultAcceleration?: number;      // 1000 -> 20000 mm/s²
  outerWallAcceleration?: number;    // 500 -> 15000 mm/s²

  // 4. Support & Bed Adhesion (Chuẩn Bambu Studio Support & Others Tab)
  supportMode: SupportMode;
  treeStyle?: TreeSupportStyle;
  supportAngleThreshold?: number;    // 15 -> 75 deg (support_threshold_angle)
  supportTopZDistance?: number;      // 0.08 -> 0.36 mm (support_top_z_distance)
  supportBottomZDistance?: number;   // 0.08 -> 0.36 mm
  supportBranchDiameter?: number;    // 1.2 -> 5.0 mm (tree_support_branch_diameter)
  supportBranchAngle?: number;       // 25 -> 65 deg (tree_support_branch_angle)
  supportInterfaceLayers?: number;   // 0 -> 5 layers
  supportOnBuildPlateOnly?: boolean; // Chỉ mọc từ bàn in
  brimEnabled: boolean;
  brimType?: BrimTypeMode;
  brimWidthMm: number;               // 0 -> 15 mm
  raftLayers?: number;               // 0 -> 5 layers

  // 5. Material, Thermal, Cooling & Extrusion (Filament & Printer Settings)
  material: FilamentMaterial;
  materialColor: string;
  nozzleDiameter?: number;           // 0.2 | 0.4 | 0.6 | 0.8 mm
  nozzleTemp: number;                // 180 -> 310 °C
  bedTemp: number;                   // 30 -> 120 °C
  chamberTemp?: number;              // 0 -> 65 °C
  coolingFanSpeed: number;           // 0 -> 100 %
  auxFanSpeed?: number;              // 0 -> 100 %
  flowRateMm3s?: number;             // Max Volumetric Speed (mm³/s)
  flowRatio?: number;                // 0.85 -> 1.15
  pressureAdvance?: number;          // 0.00 -> 0.12
  retractionDistanceMm?: number;     // 0.0 -> 6.0 mm
  retractionSpeedMmS?: number;       // 15 -> 80 mm/s
  zHopMm?: number;                   // 0.0 -> 1.2 mm
}

export interface IPreflightError {
  id: string;
  type: DefectCategoryType;
  severity: DefectSeverity;
  title: string;
  description: string;
  rootCause?: string;
  affectedLayers?: [number, number];
  layerRange?: [number, number];
  location?: [number, number, number];
  suggestedFix: string;
  impactScorePenalty: number;
  autoFixAction?: Partial<ISimulationProfile>;
  isLearnedFromCommunity?: boolean;
  contributor?: string;
}

export type IPrintDefectError = IPreflightError;

export interface IPreflightReport {
  printabilityScore: number; // 0 -> 100
  overallStatus: 'ready' | 'caution' | 'high_risk';
  errors: IPreflightError[];
  summary: string;
  estimatedCostVnd: number;
  estimatedPrintTimeMinutes: number;
  modelFootprintAreaMm2: number;
  overhangRiskAreaPercent: number;
}

export interface ISimulationState {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  currentProgress: number; // 0.0 -> 1.0
  currentLayer: number;
  totalLayers: number;
  elapsedTimeSec: number;
  totalTimeSec: number;
  filamentUsedGrams: number;
  totalFilamentGrams: number;
  toolheadPosition: [number, number, number];
  activeToolpathType: 'perimeter' | 'infill' | 'support' | 'travel' | 'brim' | 'outer_wall' | 'inner_wall';
  isCompleted: boolean;
}

export interface ISampleModel {
  id: string;
  name: string;
  description: string;
  category: string;
  geometryType:
    | 'benchy'
    | 'cube'
    | 'dragon'
    | 'gear'
    | 'organizer'
    | 'voron_cube'
    | 'overhang_arch'
    | 'articulated_dragon'
    | 'planetary_gear'
    | 'custom';
  defaultProfileId: string;
  dimensionsMm: [number, number, number];
  estimatedWeightGrams: number;
  accentBadge: string;
  path?: string;
}
