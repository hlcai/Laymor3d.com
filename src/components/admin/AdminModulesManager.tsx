'use client';

import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  ShoppingBag,
  Printer,
  Compass,
  Store,
  Wallet,
  Building2,
  CheckCircle,
  RotateCcw,
  Sliders,
  Info,
  Cpu,
} from 'lucide-react';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { SystemModuleKey } from '@/backend/domain/config';
import { UserRole } from '@/backend/domain/user';

interface ModuleDefinition {
  key: SystemModuleKey;
  name: string;
  category: string;
  description: string;
  icon: any;
  route: string;
}

const MODULES_LIST: ModuleDefinition[] = [
  {
    key: 'studio',
    name: '1. AI 2D-to-3D Studio',
    category: 'Cốt Lõi AI',
    description: 'Chuyển ảnh 2D thành mô hình 3D (.STL/.GLB) qua Tripo, Trellis, Meshy. Tự động kiểm tra kín nước Watertight.',
    icon: Sparkles,
    route: '/studio',
  },
  {
    key: 'dsim',
    name: '2. 3D PrintSim Pro (/3dsim)',
    category: 'Giả Lập & Kiểm Lỗi',
    description: 'Giả lập thông số Bambu Studio thời gian thực trên phôi 3D, kiểm lỗi 15+ khuyết tật thực tế, đóng góp tri thức và xuất file .3MF.',
    icon: Cpu,
    route: '/3dsim',
  },
  {
    key: 'shop',
    name: '3. Cửa Hàng Vật Tư & Linh Kiện',
    category: 'Thương Mại E-Commerce',
    description: 'Bán lẻ cuộn nhựa in (PLA, PETG-CF, ABS, TPU, Resin) và linh kiện phụ kiện máy in chính hãng.',
    icon: ShoppingBag,
    route: '/shop',
  },
  {
    key: 'services',
    name: '4. Xưởng In Cấp Tốc 24H',
    category: 'Dịch Vụ Xưởng',
    description: 'Báo giá tự động theo khối lượng gram và gửi file in trực tiếp lên Farm Bambu Lab X1C & Voron 2.4.',
    icon: Printer,
    route: '/shop?tab=services',
  },
  {
    key: 'marketplace',
    name: '5. Sàn Mô Hình 3D (Marketplace)',
    category: 'Nội Dung & Bản Quyền',
    description: 'Thư viện mô hình 3D chất lượng cao, hỗ trợ tải miễn phí và mua bán file 3D có bản quyền.',
    icon: Layers,
    route: '/shop?tab=models',
  },
  {
    key: 'trends',
    name: '6. Phân Tích Trend & Crawler',
    category: 'Trí Tuệ Dữ Liệu',
    description: 'Tự động quét mô hình hot từ MakerWorld, Printables, Thingiverse và phân tích xu hướng bằng Gemini AI.',
    icon: Compass,
    route: '/trends',
  },
  {
    key: 'seller_hub',
    name: '7. Gian Hàng Dành Cho Seller',
    category: 'Đối Tác & Nhà Bán',
    description: 'Khu vực quản lý riêng cho các Maker/Seller: đăng bán sản phẩm, theo dõi đơn bán và ví hoa hồng.',
    icon: Store,
    route: '/seller',
  },
  {
    key: 'wallet',
    name: '8. Ví Điện Tử & Nạp/Trừ Tiền',
    category: 'Tài Chính & Fintech',
    description: 'Nạp tiền ví tự động qua VietQR Napas 24/7, trừ tiền khi in hoặc mua hàng, sao kê lịch sử.',
    icon: Wallet,
    route: '/profile',
  },
  {
    key: 'admin_hub',
    name: '9. Trung Tâm Quản Trị Hệ Thống',
    category: 'Quản Trị Tối Cao',
    description: 'Điều phối xưởng in, quản lý thành viên, kho tri thức giả lập, bảng giá vốn, API keys và cấu hình hệ thống.',
    icon: Building2,
    route: '/admin',
  },
];

const ROLES_COLUMNS: { role: UserRole; label: string; badgeColor: string; description: string }[] = [
  { role: 'admin', label: 'Admin (Quản trị)', badgeColor: 'bg-rose-50 text-rose-800 border-rose-300', description: 'Toàn quyền điều hành' },
  { role: 'mod', label: 'Mod (Kiểm duyệt)', badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300', description: 'Quản lý kho & tri thức' },
  { role: 'staff', label: 'Staff (Kỹ thuật)', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300', description: 'Vận hành xưởng in' },
  { role: 'seller', label: 'Seller (Người bán)', badgeColor: 'bg-amber-50 text-amber-800 border-amber-300', description: 'Quản lý gian hàng riêng' },
  { role: 'user', label: 'User (Khách hàng)', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300', description: 'Người dùng trải nghiệm' },
];

export function AdminModulesManager() {
  const { matrix, toggleModuleForRole, refreshPermissions } = useModulePermissions();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = async (moduleKey: SystemModuleKey, role: UserRole, currentVal: boolean) => {
    const nextVal = !currentVal;
    const ok = await toggleModuleForRole(moduleKey, role, nextVal);
    if (ok) {
      showToast(`Đã ${nextVal ? 'BẬT' : 'TẮT'} vùng [${moduleKey}] đối với nhóm [${role.toUpperCase()}]`);
    } else {
      showToast('Lỗi khi cập nhật phân quyền module!');
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 border border-cyan-500/50 text-white font-semibold text-xs shadow-2xl animate-slideUp flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="vision-glass-panel rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0 shadow-sm">
            <Sliders className="w-6 h-6 text-cyan-700" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Ma Trận Vùng Chức Năng Hệ Thống (9 Vùng Hiển Thị)
              </h2>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bật hoặc tắt quyền hiển thị mặc định theo từng nhóm Vai trò. Để tắt/mở riêng cho từng cá nhân cụ thể, vào mục &ldquo;Quản Lý Người Dùng&rdquo;.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refreshPermissions()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-sm shrink-0 self-start md:self-auto active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Tải lại ma trận</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700 shadow-sm">
        <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-900">Phân cấp ưu tiên:</strong> Mỗi tài khoản người dùng có thể được cấu hình tắt/mở từng vùng chức năng riêng biệt trong tab <strong>Quản Lý Người Dùng &rarr; Tắt/Mở Vùng &amp; Chức Năng</strong>. Bảng dưới đây thiết lập trạng thái mặc định chung cho toàn bộ nhóm vai trò.
        </p>
      </div>

      <div className="vision-glass rounded-[32px] overflow-hidden border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-4 px-6 min-w-[280px]">Tên Vùng &amp; Chức Năng</th>
                {ROLES_COLUMNS.map((col) => (
                  <th key={col.role} className="py-4 px-4 text-center min-w-[130px]">
                    <div className="space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${col.badgeColor}`}>
                        {col.label}
                      </span>
                      <p className="text-[10px] text-slate-400 font-normal lowercase tracking-normal">
                        {col.description}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {MODULES_LIST.map((mod) => {
                const Icon = mod.icon;
                return (
                  <tr key={mod.key} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-cyan-700" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm tracking-tight">{mod.name}</span>
                            <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                              {mod.category}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed max-w-md">{mod.description}</p>
                          <div className="text-[10px] font-mono text-cyan-800">Đường dẫn: {mod.route}</div>
                        </div>
                      </div>
                    </td>

                    {ROLES_COLUMNS.map((col) => {
                      const isEnabled = matrix[mod.key] ? matrix[mod.key][col.role] ?? true : true;
                      const isMasterAdminRole = col.role === 'admin' && mod.key === 'admin_hub';

                      return (
                        <td key={col.role} className="py-4 px-4 text-center align-middle">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={isMasterAdminRole}
                              onClick={() => handleToggle(mod.key, col.role, isEnabled)}
                              className={`w-12 h-6 rounded-full transition-colors p-0.5 relative flex items-center border ${
                                isEnabled
                                  ? 'bg-cyan-600 border-cyan-600'
                                  : 'bg-slate-200 border-slate-300'
                              } ${isMasterAdminRole ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                                  isEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                isEnabled ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {isEnabled ? 'Hiển Thị' : 'Đã Ẩn'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
