export type KnowledgeCategory =
  | 'simulator_defect_learning' // Lỗi thực tế & Giải thích chi tiết từ người dùng / chuyên gia để App giả lập học
  | 'troubleshooting'           // Khắc phục lỗi in (stringing, warping, z-seam, elephant foot, delamination...)
  | 'material_benchmark'        // Đặc tính & định mức nhựa (nhiệt độ, co ngót, sấy nhựa, độ bền)
  | 'slicer_tuning'             // Tinh chỉnh OrcaSlicer / Bambu Studio (Scarf seam, tree support, pressure advance)
  | 'printer_hardware'          // Phần cứng máy in (vòi thép tôi, bàn PEI, quạt gió, buồng nhiệt)
  | 'vietnam_environment'       // Khí hậu Việt Nam (độ ẩm 85-95% mùa nồm, vệ sinh PEI bằng Sunlight)
  | 'commercial_practice';      // Kinh nghiệm vận hành xưởng in thương mại (tối ưu giờ máy, phế phẩm)

export interface ISlicerParameterOverride {
  layer_height?: number;
  initial_layer_print_height?: number;
  wall_loops?: number;
  top_shell_layers?: number;
  bottom_shell_layers?: number;
  sparse_infill_density?: string;
  sparse_infill_pattern?: string;
  seam_slope_type?: 'scarf' | 'normal';
  seam_slope_angle?: number;
  enable_support?: boolean;
  support_type?: string;
  support_top_z_distance?: number;
  brim_type?: string;
  brim_width?: number;
  outer_wall_speed?: number;
  inner_wall_speed?: number;
  sparse_infill_speed?: number;
  nozzle_temperature?: number;
  nozzle_temperature_initial_layer?: number;
  hot_plate_temp?: number;
  flow_ratio?: number;
  pressure_advance?: number;
  retraction_length?: number;
  fan_min_speed?: number;
  fan_max_speed?: number;
  drying_temperature?: number;
  drying_time_hours?: number;
  [key: string]: any;
}

export interface ISimulatorDefectTriggerCondition {
  paramKey?: string;                   // VD: 'printSpeed', 'nozzleTemp', 'bedTemp', 'retractionDistanceMm', 'infillDensity', 'wallLoops', 'coolingFanSpeed', 'supportTopZDistance'
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  thresholdValue?: number | string | boolean;
  description?: string;                // Mô tả điều kiện kích hoạt lỗi
}

export interface IKnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  defectType?: string;                  // Mã loại lỗi giả lập (overhang, warping, stringing, clogging, ringing, delamination, z_seam_scarring...)
  severity?: 'low' | 'medium' | 'high' | 'critical';
  problemSymptom?: string;              // Dấu hiệu nhận biết lỗi trên mẫu in thực tế
  rootCause?: string;                   // Giải thích chi tiết nguyên nhân gốc rễ (vật lý, nhiệt học, cơ học)
  solutionText: string;                 // Giải pháp khắc phục và hướng dẫn tối ưu thông số
  slicerOverrides?: ISlicerParameterOverride; // Cấu hình thông số Bambu Studio / OrcaSlicer override
  triggerCondition?: ISimulatorDefectTriggerCondition; // Điều kiện để App giả lập tự động phát hiện lỗi
  autoFixPatch?: Record<string, any>;   // Bản vá tự động áp dụng lên ISimulationProfile trong /3dsim
  submittedBy?: string;                 // ID người dùng đóng góp (VD: hlcai_admin, maker_vn...)
  applicablePrinters: string[];         // e.g. ['all'] hoặc ['bambu-x1c-p1s', 'creality-k1']
  applicableFilaments: string[];        // e.g. ['PLA', 'PETG', 'TPU', 'ABS', 'PLA-CF', 'ASA', 'PA-CF']
  applicableCategories?: string[];
  confidenceScore: number;              // 0 - 100 (độ tin cậy)
  verificationCount: number;            // Số ca kiểm chứng
  sourcePlatform:
    | 'user_contributed'
    | 'expert_curated'
    | 'reddit'
    | 'bambu_forum'
    | 'makerworld'
    | 'printables'
    | 'vietnam_community'
    | 'cnc_kitchen';
  sourceReference?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;                  // Admin phê duyệt để App giả lập kích hoạt học chính thức
}

export interface IRiskWarning {
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestedFix: string;
}

export interface ICrossReferenceResult {
  matchedEntries: IKnowledgeEntry[];
  riskWarnings: IRiskWarning[];
  recommendedOverrides: ISlicerParameterOverride;
  communityTips: string[];
  confidenceIndex: number; // 0 - 100
  totalCrossCheckedRules: number;
}
