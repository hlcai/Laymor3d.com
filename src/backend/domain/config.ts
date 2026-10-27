import { UserRole } from './user';

export type AppEnvironment = 'staging' | 'official';

// Danh sách các Module (Vùng chức năng) độc lập trong hệ thống
export type SystemModuleKey =
  | 'studio'        // Module 1: AI 2D-to-3D Studio
  | 'dsim'          // Module 2: 3D PrintSim Pro (/3dsim - Giả lập & Kiểm lỗi in 3D)
  | 'shop'          // Module 3: Cửa hàng vật tư cuộn nhựa & linh kiện
  | 'services'      // Module 4: Xưởng in dịch vụ cấp tốc 24H
  | 'marketplace'   // Module 5: Sàn mô hình 3D Free & Trả phí
  | 'trends'        // Module 6: Phân tích Trend & Crawler
  | 'seller_hub'    // Module 7: Gian hàng dành cho Seller
  | 'wallet'        // Module 8: Ví điện tử nạp/trừ tiền
  | 'admin_hub';    // Module 9: Trung tâm quản trị

// Ma trận quyền hiển thị & truy cập từng Module theo từng Role
export type IModuleRoleMatrix = Record<SystemModuleKey, Record<UserRole, boolean>>;

export interface ICommercialConfig {
  brandName: string;            // '3D HUB VIETNAM'
  companyName: string;          // 'Công ty Cổ phần Công nghệ In 3D Hub'
  taxCode: string;              // '0318998822'
  hotline: string;              // '1900 6833 - 0988.333.444'
  supportEmail: string;         // 'contact@3dhub.vn'
  address: string;              // 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh'
  bankAccount: {
    bankName: string;           // 'MBBank (Ngân hàng Quân Đội)'
    accountNumber: string;      // '0901234567'
    accountHolder: string;      // 'CONG TY CP CONG NGHE 3D HUB'
    bin: string;                // '970422'
  };
  commercialMarginPercent: number; // Tỷ lệ biên lợi nhuận thương mại (ví dụ: 25%)
  warrantyPolicy: string;       // 'Cam kết chuẩn xác kích thước ±0.1mm, bảo hành 1 đổi 1 trong 7 ngày'
  vatEnabled: boolean;          // Xuất hóa đơn GTGT điện tử (VAT 8%)
}

export interface IMaterialCostConfig {
  plaPerKgVnd: number;       // Giá vốn PLA (đ/kg)
  petgPerKgVnd: number;      // Giá vốn PETG (đ/kg)
  petgCfPerKgVnd: number;    // Giá vốn PETG-CF (đ/kg)
  absPerKgVnd: number;       // Giá vốn ABS (đ/kg)
  resinPerLiterVnd: number;  // Giá vốn Resin SLA (đ/lít)
}

export interface IOperationCostConfig {
  machineHourlyRateVnd: number;  // Khấu hao & bảo trì máy in theo giờ (đ/h)
  electricityHourlyVnd: number;  // Chi phí điện theo giờ (đ/h)
  laborPostProcessVnd: number;   // Nhân công hậu kỳ gỡ support (đ/đơn)
  profitMarginPercent: number;   // % chi phí phụ thu / biên lợi nhuận (0% = giá gốc, 15%, 30%...)
}

export interface IAICostConfig {
  tripoUsd: number;      // $0.01
  tripoVnd: number;      // 250 đ (giá gốc)
  trellisUsd: number;    // $0.05
  trellisVnd: number;    // 1.250 đ (giá gốc)
  meshyUsd: number;      // $0.80
  meshyVnd: number;      // 20.000 đ (giá gốc)
  exchangeRate: number;  // 25.400 đ/USD
}

export interface IApiKeysConfig {
  falKey: string;
  meshyApiKey: string;
  geminiApiKey: string;
  preferredGeminiModel?: string;
  makerWorldCookie: string;
}

export interface ISystemConfig {
  environment: AppEnvironment;  // 'staging' | 'official'
  commercial: ICommercialConfig;
  materials: IMaterialCostConfig;
  operations: IOperationCostConfig;
  aiPricing: IAICostConfig;
  apiKeys: IApiKeysConfig;
  modulePermissions: IModuleRoleMatrix;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_COMMERCIAL_CONFIG: ICommercialConfig = {
  brandName: '3D HUB VIETNAM',
  companyName: 'Công ty Cổ phần Công nghệ In 3D Hub',
  taxCode: '0318998822',
  hotline: '1900 6833 - 0988.333.444',
  supportEmail: 'contact@3dhub.vn',
  address: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
  bankAccount: {
    bankName: 'MBBank (Ngân hàng Quân Đội)',
    accountNumber: '0901234567',
    accountHolder: 'CONG TY CP CONG NGHE 3D HUB',
    bin: '970422',
  },
  commercialMarginPercent: 25, // 25% biên lợi nhuận thương mại
  warrantyPolicy: 'Cam kết chuẩn xác kích thước ±0.1mm, bảo hành 1 đổi 1 trong 7 ngày',
  vatEnabled: true,
};

export const DEFAULT_MODULE_PERMISSIONS: IModuleRoleMatrix = {
  studio: {
    admin: true,
    mod: true,
    seller: true,
    staff: true,
    user: true,
  },
  dsim: {
    admin: true,
    mod: true,
    seller: true,
    staff: true,
    user: true,
  },
  shop: {
    admin: true,
    mod: true,
    seller: true,
    staff: true,
    user: true,
  },
  services: {
    admin: true,
    mod: true,
    seller: true,
    staff: true,
    user: true,
  },
  marketplace: {
    admin: true,
    mod: true,
    seller: true,
    staff: true,
    user: true,
  },
  trends: {
    admin: true,
    mod: true,
    seller: true,
    staff: true,
    user: true,
  },
  seller_hub: {
    admin: true,
    mod: false,
    seller: true,
    staff: false,
    user: false,
  },
  wallet: {
    admin: true,
    mod: true,
    seller: true,
    staff: true,
    user: true,
  },
  admin_hub: {
    admin: true,
    mod: true,
    seller: false,
    staff: true,
    user: false,
  },
};

export const DEFAULT_SYSTEM_CONFIG: ISystemConfig = {
  environment: 'official',
  commercial: DEFAULT_COMMERCIAL_CONFIG,
  materials: {
    plaPerKgVnd: 180000,
    petgPerKgVnd: 220000,
    petgCfPerKgVnd: 450000,
    absPerKgVnd: 240000,
    resinPerLiterVnd: 420000,
  },
  operations: {
    machineHourlyRateVnd: 8000,
    electricityHourlyVnd: 2500,
    laborPostProcessVnd: 15000,
    profitMarginPercent: 25,
  },
  aiPricing: {
    tripoUsd: 0.01,
    tripoVnd: 250,
    trellisUsd: 0.05,
    trellisVnd: 1250,
    meshyUsd: 0.80,
    meshyVnd: 20000,
    exchangeRate: 25400,
  },
  apiKeys: {
    falKey: process.env.FAL_KEY || '',
    meshyApiKey: process.env.MESHY_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    preferredGeminiModel: 'gemini-2.0-flash',
    makerWorldCookie: '',
  },
  modulePermissions: DEFAULT_MODULE_PERMISSIONS,
  updatedAt: '2026-10-22T04:00:00.000Z',
  updatedBy: 'hlcai_admin',
};
