import type { SystemModuleKey } from './config';

export type UserRole = 'admin' | 'mod' | 'seller' | 'staff' | 'user';

/**
 * Các chức năng cụ thể mà tài khoản người dùng được phép sử dụng (Feature Action Permissions).
 * Admin có thể bật/tắt từng quyền này cho mỗi tài khoản người dùng.
 */
export interface IUserFeaturePermissions {
  canEditPrintProfile: boolean;      // Chỉnh sửa bộ thông số in Bambu Studio trên 3D Simulator
  canExport3MF: boolean;             // Xuất file .3MF kèm đầy đủ profile Bambu Studio & G-code
  canSubmitDefectKnowledge: boolean; // Gửi báo cáo lỗi thực tế & giải thích để hệ thống học
  canUseAI3DGenerator: boolean;      // Tạo phôi 3D bằng AI (Trellis / Tripo / Meshy)
  canUseCrossReference: boolean;     // Sử dụng đối chiếu tri thức & tự động sửa lỗi (Auto-Fix)
  canOrderPrintService: boolean;     // Đặt lệnh in 3D xưởng & thanh toán ví
  canManageKnowledgeBase: boolean;   // Chỉnh sửa & phê duyệt kho tri thức giả lập (Admin / Chuyên gia)
}

export const DEFAULT_USER_FEATURE_PERMISSIONS: Record<UserRole, IUserFeaturePermissions> = {
  admin: {
    canEditPrintProfile: true,
    canExport3MF: true,
    canSubmitDefectKnowledge: true,
    canUseAI3DGenerator: true,
    canUseCrossReference: true,
    canOrderPrintService: true,
    canManageKnowledgeBase: true,
  },
  mod: {
    canEditPrintProfile: true,
    canExport3MF: true,
    canSubmitDefectKnowledge: true,
    canUseAI3DGenerator: true,
    canUseCrossReference: true,
    canOrderPrintService: true,
    canManageKnowledgeBase: true,
  },
  staff: {
    canEditPrintProfile: true,
    canExport3MF: true,
    canSubmitDefectKnowledge: true,
    canUseAI3DGenerator: true,
    canUseCrossReference: true,
    canOrderPrintService: true,
    canManageKnowledgeBase: false,
  },
  seller: {
    canEditPrintProfile: true,
    canExport3MF: true,
    canSubmitDefectKnowledge: true,
    canUseAI3DGenerator: true,
    canUseCrossReference: true,
    canOrderPrintService: true,
    canManageKnowledgeBase: false,
  },
  user: {
    canEditPrintProfile: true,
    canExport3MF: true,
    canSubmitDefectKnowledge: true,
    canUseAI3DGenerator: true,
    canUseCrossReference: true,
    canOrderPrintService: true,
    canManageKnowledgeBase: false,
  },
};

export interface IUser {
  id: string;
  username: string;                  // ID đăng nhập riêng (VD: hlcai_admin)
  password?: string;                 // Mật khẩu đăng nhập
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  walletBalanceVnd: number;
  phone?: string;
  address?: string;
  createdAt: string;
  status: 'active' | 'suspended';
  googleId?: string;
  sellerStoreName?: string;
  sellerRating?: number;
  sellerPendingBalanceVnd?: number;
  /**
   * Cấu hình tắt/mở các vùng chức năng (Modules) mà tài khoản này có thể nhìn thấy trên giao diện.
   * Nếu được thiết lập cho user, giá trị này sẽ ưu tiên hơn cấu hình mặc định của Role.
   */
  allowedModules?: Partial<Record<SystemModuleKey, boolean>>;
  /**
   * Cấu hình tắt/mở các chức năng thao tác cụ thể mà tài khoản này có thể sử dụng.
   */
  allowedFeatures?: Partial<IUserFeaturePermissions>;
}

export interface IPermission {
  canAccessAdmin: boolean;
  canAccessSeller: boolean;
  canManageUsers: boolean;
  canManageOrders: boolean;
  canManageProducts: boolean;
  canModerateCommunity: boolean;
  canAdjustWallet: boolean;
  canConfigureAIPricing: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, IPermission> = {
  admin: {
    canAccessAdmin: true,
    canAccessSeller: true,
    canManageUsers: true,
    canManageOrders: true,
    canManageProducts: true,
    canModerateCommunity: true,
    canAdjustWallet: true,
    canConfigureAIPricing: true,
  },
  mod: {
    canAccessAdmin: true,
    canAccessSeller: true,
    canManageUsers: false,
    canManageOrders: true,
    canManageProducts: true,
    canModerateCommunity: true,
    canAdjustWallet: false,
    canConfigureAIPricing: false,
  },
  seller: {
    canAccessAdmin: false,
    canAccessSeller: true,
    canManageUsers: false,
    canManageOrders: true,
    canManageProducts: true,
    canModerateCommunity: false,
    canAdjustWallet: false,
    canConfigureAIPricing: false,
  },
  staff: {
    canAccessAdmin: true,
    canAccessSeller: false,
    canManageUsers: false,
    canManageOrders: true,
    canManageProducts: false,
    canModerateCommunity: false,
    canAdjustWallet: false,
    canConfigureAIPricing: false,
  },
  user: {
    canAccessAdmin: false,
    canAccessSeller: false,
    canManageUsers: false,
    canManageOrders: false,
    canManageProducts: false,
    canModerateCommunity: false,
    canAdjustWallet: false,
    canConfigureAIPricing: false,
  },
};

export const MASTER_ADMIN_CREDENTIALS = {
  id: 'usr-admin-1',
  username: 'hlcai_admin',
  password: 'hlcai_2026.!@#',
} as const;

export const INITIAL_USERS: IUser[] = [
  {
    id: 'usr-admin-1',
    username: 'hlcai_admin',
    password: 'hlcai_2026.!@#',
    name: 'HLCAI Master Admin',
    email: 'hlcai_admin@laymor3d.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    walletBalanceVnd: 50000000,
    phone: '0901234567',
    address: 'Trụ sở 3D Hub, Quận 1, TP. Hồ Chí Minh',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    allowedModules: {
      studio: true,
      dsim: true,
      shop: true,
      services: true,
      marketplace: true,
      trends: true,
      seller_hub: true,
      wallet: true,
      admin_hub: true,
    },
    allowedFeatures: {
      canEditPrintProfile: true,
      canExport3MF: true,
      canSubmitDefectKnowledge: true,
      canUseAI3DGenerator: true,
      canUseCrossReference: true,
      canOrderPrintService: true,
      canManageKnowledgeBase: true,
    },
  },
  {
    id: 'usr-mod-1',
    username: 'mod_kiemduyet',
    password: 'mod_2026.!@#',
    name: 'Trần Thị Moderator',
    email: 'mod@3dhub.vn',
    role: 'mod',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    walletBalanceVnd: 1200000,
    phone: '0912345678',
    address: 'Tòa nhà Innovation, Cầu Giấy, Hà Nội',
    createdAt: '2026-01-15T00:00:00.000Z',
    status: 'active',
    allowedModules: {
      studio: true,
      dsim: true,
      shop: true,
      services: true,
      marketplace: true,
      trends: true,
      seller_hub: false,
      wallet: true,
      admin_hub: true,
    },
    allowedFeatures: { ...DEFAULT_USER_FEATURE_PERMISSIONS.mod },
  },
  {
    id: 'usr-seller-1',
    username: 'seller_hoang3d',
    password: 'seller_2026.!@#',
    name: 'Hoàng 3D Maker (Seller)',
    email: 'seller@3dhub.vn',
    role: 'seller',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    walletBalanceVnd: 1850000,
    phone: '0977889900',
    address: 'Khu Công Nghiệp Tân Bình, TP. Hồ Chí Minh',
    createdAt: '2026-02-10T00:00:00.000Z',
    status: 'active',
    sellerStoreName: 'Hoàng 3D Maker Studio',
    sellerRating: 4.9,
    sellerPendingBalanceVnd: 420000,
    allowedModules: {
      studio: true,
      dsim: true,
      shop: true,
      services: true,
      marketplace: true,
      trends: true,
      seller_hub: true,
      wallet: true,
      admin_hub: false,
    },
    allowedFeatures: { ...DEFAULT_USER_FEATURE_PERMISSIONS.seller },
  },
  {
    id: 'usr-staff-1',
    username: 'staff_kythuat',
    password: 'staff_2026.!@#',
    name: 'Lê Kỹ Thuật (Xưởng In 3D)',
    email: 'staff@3dhub.vn',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    walletBalanceVnd: 850000,
    phone: '0987654321',
    address: 'Xưởng in FDM Farm số 1, Bình Thạnh, TP. HCM',
    createdAt: '2026-02-01T00:00:00.000Z',
    status: 'active',
    allowedModules: {
      studio: true,
      dsim: true,
      shop: true,
      services: true,
      marketplace: true,
      trends: true,
      seller_hub: false,
      wallet: true,
      admin_hub: true,
    },
    allowedFeatures: { ...DEFAULT_USER_FEATURE_PERMISSIONS.staff },
  },
  {
    id: 'usr-customer-1',
    username: 'demo_user',
    password: 'user_2026',
    name: 'Phạm Minh Maker (Khách Trải Nghiệm)',
    email: 'maker@gmail.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    walletBalanceVnd: 250000,
    phone: '0933445566',
    address: '123 Đường Điện Biên Phủ, TP. Đà Nẵng',
    createdAt: '2026-03-10T00:00:00.000Z',
    status: 'active',
    allowedModules: {
      studio: true,
      dsim: true,
      shop: true,
      services: true,
      marketplace: true,
      trends: false,
      seller_hub: false,
      wallet: true,
      admin_hub: false,
    },
    allowedFeatures: { ...DEFAULT_USER_FEATURE_PERMISSIONS.user },
  },
];
