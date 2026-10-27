'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Store,
  Wallet,
  CheckCircle2,
  Lock,
  RefreshCw,
  Trash2,
  X,
  Eye,
  Phone,
  Coins,
  Sliders,
  KeyRound,
  Layers,
  CheckSquare,
} from '@/components/icons/MinimalIcons';
import {
  IUser,
  UserRole,
  IUserFeaturePermissions,
  DEFAULT_USER_FEATURE_PERMISSIONS,
} from '@/backend/domain/user';
import { SystemModuleKey, DEFAULT_MODULE_PERMISSIONS } from '@/backend/domain/config';

interface AdminUserManagerProps {
  users: IUser[];
  currentUserId?: string;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

const MODULE_LABELS: { key: SystemModuleKey; label: string; desc: string }[] = [
  { key: 'studio', label: 'AI 2D-to-3D Studio (/studio)', desc: 'Vùng tạo mô hình 3D bằng AI' },
  { key: 'dsim', label: '3D PrintSim Pro (/3dsim)', desc: 'Vùng giả lập & kiểm lỗi in 3D thời gian thực' },
  { key: 'shop', label: 'Cửa Hàng Vật Tư (/shop)', desc: 'Mua sắm nhựa in & linh kiện' },
  { key: 'services', label: 'Xưởng In Cấp Tốc 24H', desc: 'Đặt in 3D theo yêu cầu' },
  { key: 'marketplace', label: 'Sàn Mô Hình 3D (Marketplace)', desc: 'Thư viện file 3D cộng đồng' },
  { key: 'trends', label: 'Phân Tích Trend & Crawler', desc: 'Xu hướng mô hình 3D thịnh hành' },
  { key: 'seller_hub', label: 'Kênh Gian Hàng (Seller Hub)', desc: 'Quản lý gian hàng đối tác' },
  { key: 'wallet', label: 'Ví Điện Tử & Nạp/Trừ Tiền', desc: 'Hiển thị số dư ví & thanh toán VietQR' },
  { key: 'admin_hub', label: 'Trung Tâm Quản Trị (/admin)', desc: 'Truy cập trang quản trị nội bộ' },
];

const FEATURE_LABELS: { key: keyof IUserFeaturePermissions; label: string; desc: string }[] = [
  {
    key: 'canEditPrintProfile',
    label: 'Chỉnh sửa bộ thông số in Bambu Studio',
    desc: 'Cho phép điều chỉnh Layer, Wall, Infill, Support, Nhiệt độ, Tốc độ trên 3D Simulator',
  },
  {
    key: 'canExport3MF',
    label: 'Xuất file .3MF chuẩn Bambu Studio & G-code',
    desc: 'Cho phép tải xuống gói dự án .3MF đầy đủ profile để đưa vào Bambu Studio in ngay',
  },
  {
    key: 'canSubmitDefectKnowledge',
    label: 'Báo cáo lỗi in & Đóng góp tri thức mới',
    desc: 'Cho phép nhập lỗi phát sinh kèm giải thích chi tiết gửi về Database để App học',
  },
  {
    key: 'canUseCrossReference',
    label: 'Sử dụng Đối Chiếu Tri Thức & Tự Động Sửa Lỗi (Auto-Fix)',
    desc: 'Cho phép chạy chẩn đoán 15+ lỗi thực tế và áp dụng cấu hình sửa tự động',
  },
  {
    key: 'canUseAI3DGenerator',
    label: 'Sử dụng AI Tạo Phôi 3D (Trellis / Tripo / Meshy)',
    desc: 'Cho phép khởi tạo lưới 3D từ văn bản hoặc hình ảnh',
  },
  {
    key: 'canOrderPrintService',
    label: 'Đặt lệnh in xưởng & Thanh toán ví',
    desc: 'Cho phép gửi đơn đặt hàng in 3D thực tế',
  },
  {
    key: 'canManageKnowledgeBase',
    label: 'Toàn quyền chỉnh sửa Kho Tri Thức Giả Lập',
    desc: 'Cho phép thêm/sửa/xóa và duyệt các quy tắc lỗi in trong Database của App giả lập',
  },
];

export function AdminUserManager({
  users,
  currentUserId,
  onRefresh,
  showToast,
}: AdminUserManagerProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'balance_desc' | 'name_asc'>('newest');

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAdjustBalanceOpen, setIsAdjustBalanceOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('laymor_2026');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [newUserBalance, setNewUserBalance] = useState<number>(100000);
  const [newAllowedModules, setNewAllowedModules] = useState<Partial<Record<SystemModuleKey, boolean>>>({
    studio: true,
    dsim: true,
    shop: true,
    services: true,
    marketplace: true,
    trends: false,
    seller_hub: false,
    wallet: true,
    admin_hub: false,
  });
  const [newAllowedFeatures, setNewAllowedFeatures] = useState<Partial<IUserFeaturePermissions>>({
    ...DEFAULT_USER_FEATURE_PERMISSIONS.user,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Permissions state
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAllowedModules, setEditAllowedModules] = useState<Partial<Record<SystemModuleKey, boolean>>>({});
  const [editAllowedFeatures, setEditAllowedFeatures] = useState<Partial<IUserFeaturePermissions>>({});

  // Adjust balance form state
  const [balanceDelta, setBalanceDelta] = useState<number>(100000);
  const [balanceMode, setBalanceMode] = useState<'add' | 'deduct'>('add');
  const [balanceNote, setBalanceNote] = useState('');

  const handleSelectRoleForNewUser = (role: UserRole) => {
    setNewUserRole(role);
    const defaultMods: Partial<Record<SystemModuleKey, boolean>> = {};
    (Object.keys(DEFAULT_MODULE_PERMISSIONS) as SystemModuleKey[]).forEach((k) => {
      defaultMods[k] = DEFAULT_MODULE_PERMISSIONS[k][role] ?? true;
    });
    setNewAllowedModules(defaultMods);
    setNewAllowedFeatures({
      ...(DEFAULT_USER_FEATURE_PERMISSIONS[role] || DEFAULT_USER_FEATURE_PERMISSIONS.user),
    });
  };

  const openPermissionsModal = (u: IUser) => {
    setSelectedUser(u);
    setEditUsername(u.username || u.id);
    setEditPassword(u.password || '');
    const defaultMods: Partial<Record<SystemModuleKey, boolean>> = {};
    (Object.keys(DEFAULT_MODULE_PERMISSIONS) as SystemModuleKey[]).forEach((k) => {
      defaultMods[k] = DEFAULT_MODULE_PERMISSIONS[k][u.role] ?? true;
    });
    setEditAllowedModules({
      ...defaultMods,
      ...(u.allowedModules || {}),
    });
    setEditAllowedFeatures({
      ...(DEFAULT_USER_FEATURE_PERMISSIONS[u.role] || DEFAULT_USER_FEATURE_PERMISSIONS.user),
      ...(u.allowedFeatures || {}),
    });
    setIsPermissionsModalOpen(true);
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_permissions',
          userId: selectedUser.id,
          username: editUsername.trim(),
          password: editPassword,
          allowedModules: editAllowedModules,
          allowedFeatures: editAllowedFeatures,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Đã cập nhật phân quyền cho ${selectedUser.name}`);
        setIsPermissionsModalOpen(false);
        onRefresh();
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể lưu phân quyền'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const adminMod = users.filter((u) => u.role === 'admin' || u.role === 'mod').length;
    const sellers = users.filter((u) => u.role === 'seller').length;
    const customers = users.filter((u) => u.role === 'user').length;
    const totalBalance = users.reduce((sum, u) => sum + (u.walletBalanceVnd || 0), 0);
    const activeCount = users.filter((u) => u.status !== 'suspended').length;
    return { total, adminMod, sellers, customers, totalBalance, activeCount };
  }, [users]);

  // Filtered & Sorted users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          u.name.toLowerCase().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(searchQuery));

        const matchesRole = selectedRole === 'all' || u.role === selectedRole;
        const matchesStatus =
          selectedStatus === 'all' ||
          (selectedStatus === 'active' && u.status !== 'suspended') ||
          (selectedStatus === 'suspended' && u.status === 'suspended');

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'balance_desc') {
          return (b.walletBalanceVnd || 0) - (a.walletBalanceVnd || 0);
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [users, searchQuery, selectedRole, selectedStatus, sortBy]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch_role', userId, role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Đã đổi vai trò sang: ${newRole.toUpperCase()}`);
        onRefresh();
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể đổi vai trò'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi mạng: ${err.message}`);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã cập nhật trạng thái người dùng');
        onRefresh();
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể thay đổi trạng thái'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newUserName.trim()) {
      showToast('Vui lòng nhập đầy đủ ID đăng nhập, Mật khẩu và Họ tên!');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          username: newUsername.trim(),
          password: newPassword,
          name: newUserName.trim(),
          email: newUserEmail.trim() || `${newUsername.trim()}@laymor3d.com`,
          phone: newUserPhone.trim(),
          role: newUserRole,
          amount: newUserBalance,
          allowedModules: newAllowedModules,
          allowedFeatures: newAllowedFeatures,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Đã tạo tài khoản "${newUsername}" thành công!`);
        setIsAddUserOpen(false);
        setNewUsername('');
        setNewPassword('laymor_2026');
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        handleSelectRoleForNewUser('user');
        setNewUserBalance(100000);
        onRefresh();
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể tạo tài khoản'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAdjustBalance = async () => {
    if (!selectedUser) return;
    const finalDelta = balanceMode === 'add' ? balanceDelta : -balanceDelta;
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_balance',
          userId: selectedUser.id,
          amount: finalDelta,
          description: balanceNote || `Quản trị viên ${balanceMode === 'add' ? 'nạp tiền' : 'trừ tiền'} ví`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Đã ${balanceMode === 'add' ? 'cộng' : 'trừ'} ${balanceDelta.toLocaleString('vi-VN')} đ cho ${selectedUser.name}`);
        setIsAdjustBalanceOpen(false);
        setBalanceNote('');
        onRefresh();
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể điều chỉnh số dư'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const handleQuickAdd = async (userId: string, amount: number) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_balance',
          userId,
          amount,
          description: `Nạp nhanh +${amount.toLocaleString('vi-VN')} đ từ Quản Trị Viên`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Đã cộng nhanh +${amount.toLocaleString('vi-VN')} đ`);
        onRefresh();
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (userId === currentUserId || userId === 'usr-admin-1') {
      showToast('Không thể xóa tài khoản Quản trị viên tối cao (hlcai_admin)!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Đã xóa tài khoản ${name}`);
        onRefresh();
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể xóa tài khoản'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'ADMIN', bg: 'bg-rose-50 text-rose-800 border-rose-300' };
      case 'mod':
        return { label: 'MOD', bg: 'bg-indigo-50 text-indigo-800 border-indigo-300' };
      case 'seller':
        return { label: 'SELLER', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'staff':
        return { label: 'STAFF', bg: 'bg-cyan-50 text-cyan-800 border-cyan-300' };
      default:
        return { label: 'USER', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Header & Actions */}
      <div className="vision-glass rounded-[32px] p-6 shadow-sm border border-slate-200/80 bg-white/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Quản Lý Tài Khoản, Vùng Hiển Thị &amp; Chức Năng (RBAC)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                    {users.length} tài khoản
                  </span>
                </h2>
                <p className="text-xs text-slate-600">
                  Cấp tài khoản đăng nhập riêng cho người dùng trải nghiệm, tắt/mở các vùng giao diện nhìn thấy và các chức năng được phép sử dụng
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Làm mới</span>
            </button>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo Tài Khoản Trải Nghiệm Mới</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Tổng Tài Khoản</span>
              <Users className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[10px] text-emerald-700 font-bold">● {stats.activeCount} đang hoạt động</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1">
            <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
              <span>Master Admin &amp; Mod</span>
              <Shield className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-900">{stats.adminMod}</div>
            <div className="text-[10px] text-rose-700 font-medium">Toàn quyền điều khiển hệ thống</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
              <span>Đối Tác Bán Hàng</span>
              <Store className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-900">{stats.sellers}</div>
            <div className="text-[10px] text-amber-700 font-medium">Seller phân phối mô hình</div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-1">
            <div className="flex items-center justify-between text-cyan-700 text-xs font-semibold">
              <span>Tổng Tiền Ví Hệ Thống</span>
              <Wallet className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-900 font-mono">
              {stats.totalBalance.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[10px] text-cyan-700 font-medium">Số dư ví người dùng khả dụng</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="vision-glass rounded-[28px] p-4 sm:p-5 border border-slate-200/80 bg-white/90 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm theo ID đăng nhập, họ tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200 shrink-0">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'admin', label: 'Admin' },
                { id: 'mod', label: 'Mod' },
                { id: 'seller', label: 'Seller' },
                { id: 'staff', label: 'Staff' },
                { id: 'user', label: 'User' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedRole === r.id
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer shrink-0 font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="suspended">Đã tạm khóa</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer shrink-0 font-medium"
            >
              <option value="newest">Mới nhất</option>
              <option value="balance_desc">Số dư ví: Cao &rarr; Thấp</option>
              <option value="name_asc">Họ tên: A &rarr; Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="vision-glass rounded-[32px] p-5 sm:p-6 border border-slate-200/80 bg-white/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <th className="pb-3 px-3">Thành Viên &amp; ID Đăng Nhập</th>
                <th className="pb-3 px-3">Mật Khẩu &amp; Liên Hệ</th>
                <th className="pb-3 px-3">Vai Trò</th>
                <th className="pb-3 px-3">Vùng Hiển Thị &amp; Chức Năng</th>
                <th className="pb-3 px-3">Số Dư Ví</th>
                <th className="pb-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUserId;
                const isMainAdmin = u.id === 'usr-admin-1' || u.username === 'hlcai_admin';
                const badge = getRoleBadge(u.role);
                const isSuspended = u.status === 'suspended';

                const visibleModsCount = u.allowedModules
                  ? Object.values(u.allowedModules).filter(Boolean).length
                  : MODULE_LABELS.length;
                const enabledFeaturesCount = u.allowedFeatures
                  ? Object.values(u.allowedFeatures).filter(Boolean).length
                  : FEATURE_LABELS.length;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Column 1: Member & Login ID */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                          {u.avatar ? (
                            <Image src={u.avatar} alt={u.name} fill unoptimized className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-700">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isMainAdmin && (
                              <span className="text-[9px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-black border border-rose-300">
                                Master Admin
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-[9px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-black border border-cyan-300">
                                Đang dùng
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 font-mono text-[10px] font-bold">
                              ID: {u.username || u.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Password & Contact */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 font-semibold">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Pass: {isMainAdmin ? 'hlcai_2026.!@#' : u.password || '123456'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{u.email}</div>
                      {u.phone && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Column 3: Role Switcher & Status */}
                    <td className="py-3.5 px-3 space-y-1.5">
                      <select
                        value={u.role}
                        disabled={isMainAdmin}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={`px-3 py-1 rounded-full border text-xs font-bold cursor-pointer transition-all focus:outline-none block ${badge.bg}`}
                      >
                        <option value="admin" className="bg-white text-rose-800">ADMIN</option>
                        <option value="mod" className="bg-white text-indigo-800">MOD</option>
                        <option value="seller" className="bg-white text-amber-800">SELLER</option>
                        <option value="staff" className="bg-white text-cyan-800">STAFF</option>
                        <option value="user" className="bg-white text-slate-800">USER</option>
                      </select>

                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        disabled={isMainAdmin}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          isSuspended
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {isSuspended ? <Lock className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                        <span>{isSuspended ? 'Đã khóa' : 'Hoạt động'}</span>
                      </button>
                    </td>

                    {/* Column 4: Per-User Modules & Features Summary + Button */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold">
                            {isMainAdmin ? MODULE_LABELS.length : visibleModsCount}/{MODULE_LABELS.length} vùng hiển thị
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                            {isMainAdmin ? FEATURE_LABELS.length : enabledFeaturesCount}/{FEATURE_LABELS.length} chức năng
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openPermissionsModal(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Sliders className="w-3 h-3 text-cyan-400" />
                          <span>Tắt/Mở Vùng &amp; Chức Năng</span>
                        </button>
                      </div>
                    </td>

                    {/* Column 5: Wallet Balance */}
                    <td className="py-3.5 px-3">
                      <div className="font-black text-cyan-800 text-sm font-mono">
                        {(u.walletBalanceVnd || 0).toLocaleString('vi-VN')} đ
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => handleQuickAdd(u.id, 100000)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[9px] font-bold text-slate-700 cursor-pointer"
                        >
                          +100k
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsAdjustBalanceOpen(true);
                          }}
                          className="px-2 py-0.5 rounded-md bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-[9px] font-bold text-cyan-800 cursor-pointer"
                        >
                          Tùy chỉnh
                        </button>
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPermissionsModal(u)}
                          className="p-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 transition-all cursor-pointer"
                          title="Cấu hình vùng hiển thị & chức năng được dùng"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsAdjustBalanceOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all cursor-pointer"
                          title="Điều chỉnh số dư ví"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>

                        {!isMainAdmin && !isSelf && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO TÀI KHOẢN NGƯỜI DÙNG MỚI KÈM PHÂN VÙNG & CHỨC NĂNG */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-[32px] border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5 text-slate-900 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Tạo Tài Khoản Người Dùng &amp; Phân Quyền Trải Nghiệm
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cấp ID/Mật khẩu đăng nhập riêng và chọn các vùng giao diện + chức năng mà tài khoản được phép dùng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5">
              {/* Thông tin đăng nhập */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ID Đăng Nhập (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: khach_beta_01"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Mật Khẩu Đăng Nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: laymor_2026"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Hiển Thị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Khách Trải Nghiệm Beta 01"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Liên Hệ
                  </label>
                  <input
                    type="email"
                    placeholder="khach01@laymor3d.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vai Trò Mặc Định (RBAC)
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => handleSelectRoleForNewUser(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="user">Khách hàng / Người trải nghiệm (User)</option>
                    <option value="staff">Nhân viên kỹ thuật xưởng (Staff)</option>
                    <option value="seller">Đối tác gian hàng (Seller)</option>
                    <option value="mod">Kiểm duyệt viên (Moderator)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Dư Ví Trải Nghiệm (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={newUserBalance}
                    onChange={(e) => setNewUserBalance(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Phần 1: Tắt/Mở các vùng giao diện tài khoản có thể thấy */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-600" />
                    <span>1. Tắt/Mở Các Vùng Chức Năng Tài Khoản Có Thể Nhìn Thấy</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MODULE_LABELS.map((mod) => {
                    const checked = Boolean(newAllowedModules[mod.key]);
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          checked
                            ? 'bg-cyan-50/70 border-cyan-300 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setNewAllowedModules((prev) => ({
                              ...prev,
                              [mod.key]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 accent-cyan-600"
                        />
                        <div>
                          <div className="font-bold">{mod.label}</div>
                          <div className="text-[10px] text-slate-500">{mod.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Phần 2: Tắt/Mở các chức năng tài khoản có thể sử dụng */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>2. Tắt/Mở Các Chức Năng Cụ Thể Tài Khoản Được Phép Sử Dụng</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FEATURE_LABELS.map((feat) => {
                    const checked = Boolean(newAllowedFeatures[feat.key]);
                    return (
                      <label
                        key={feat.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          checked
                            ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setNewAllowedFeatures((prev) => ({
                              ...prev,
                              [feat.key]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <div className="font-bold">{feat.label}</div>
                          <div className="text-[10px] text-slate-500">{feat.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản & Lưu Phân Quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TẮT/MỞ VÙNG HIỂN THỊ & CHỨC NĂNG CỦA TÀI KHOẢN */}
      {isPermissionsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-[32px] border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5 text-slate-900 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Cấu Hình Quyền Tài Khoản: {selectedUser.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {selectedUser.username} • Vai trò: {selectedUser.role.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin ID & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID Đăng Nhập (Username)
                </label>
                <input
                  type="text"
                  disabled={selectedUser.id === 'usr-admin-1'}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật Khẩu Đăng Nhập
                </label>
                <input
                  type="text"
                  disabled={selectedUser.id === 'usr-admin-1'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            {/* 1. Vùng chức năng hiển thị */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-600" />
                  <span>1. Các Vùng Giao Diện Tài Khoản Nhìn Thấy ({Object.values(editAllowedModules).filter(Boolean).length}/{MODULE_LABELS.length})</span>
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allOn: Partial<Record<SystemModuleKey, boolean>> = {};
                      MODULE_LABELS.forEach((m) => (allOn[m.key] = true));
                      setEditAllowedModules(allOn);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold cursor-pointer"
                  >
                    Bật tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const basicOnly: Partial<Record<SystemModuleKey, boolean>> = {};
                      MODULE_LABELS.forEach((m) => (basicOnly[m.key] = m.key === 'dsim' || m.key === 'shop'));
                      setEditAllowedModules(basicOnly);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold cursor-pointer"
                  >
                    Chỉ mở 3D Sim &amp; Shop
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MODULE_LABELS.map((mod) => {
                  const checked = Boolean(editAllowedModules[mod.key]);
                  return (
                    <label
                      key={mod.key}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        checked
                          ? 'bg-cyan-50/70 border-cyan-300 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={selectedUser.id === 'usr-admin-1'}
                        checked={checked}
                        onChange={(e) =>
                          setEditAllowedModules((prev) => ({
                            ...prev,
                            [mod.key]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 accent-cyan-600"
                      />
                      <div>
                        <div className="font-bold">{mod.label}</div>
                        <div className="text-[10px] text-slate-500">{mod.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 2. Chức năng được phép sử dụng */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>2. Các Chức Năng Tài Khoản Được Phép Dùng ({Object.values(editAllowedFeatures).filter(Boolean).length}/{FEATURE_LABELS.length})</span>
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allOn: Partial<IUserFeaturePermissions> = {};
                      FEATURE_LABELS.forEach((f) => (allOn[f.key] = true));
                      setEditAllowedFeatures(allOn);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                  >
                    Mở toàn bộ chức năng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAllowedFeatures({
                        canEditPrintProfile: true,
                        canExport3MF: false,
                        canSubmitDefectKnowledge: true,
                        canUseAI3DGenerator: false,
                        canUseCrossReference: true,
                        canOrderPrintService: false,
                        canManageKnowledgeBase: false,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold cursor-pointer"
                  >
                    Chế độ Xem &amp; Báo lỗi (Giới hạn Xuất 3MF)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FEATURE_LABELS.map((feat) => {
                  const checked = Boolean(editAllowedFeatures[feat.key]);
                  return (
                    <label
                      key={feat.key}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        checked
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={selectedUser.id === 'usr-admin-1'}
                        checked={checked}
                        onChange={(e) =>
                          setEditAllowedFeatures((prev) => ({
                            ...prev,
                            [feat.key]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <div className="font-bold">{feat.label}</div>
                        <div className="text-[10px] text-slate-500">{feat.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveUserPermissions}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Cấu Hình Vùng & Chức Năng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST BALANCE */}
      {isAdjustBalanceOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-200 p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Điều Chỉnh Số Dư Ví</h3>
                  <p className="text-[11px] text-slate-500">Tài khoản: {selectedUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustBalanceOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setBalanceMode('add')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    balanceMode === 'add' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  + Cộng Tiền Ví
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceMode('deduct')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    balanceMode === 'deduct' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  - Trừ Tiền Ví
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  value={balanceDelta}
                  onChange={(e) => setBalanceDelta(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú giao dịch</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cấp ngân sách trải nghiệm in 3D..."
                  value={balanceNote}
                  onChange={(e) => setBalanceNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustBalanceOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdjustBalance}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold text-white cursor-pointer"
                >
                  Xác Nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
