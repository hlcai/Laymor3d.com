'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Printer,
  TrendingUp,
  CreditCard,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  CheckCircle,
  Clock,
  Settings,
  Plus,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Activity,
  ExternalLink,
  Cpu,
  Flame,
  AlertTriangle,
  UserPlus,
  ArrowUpRight,
  QrCode,
  Building2,
  FlaskConical,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sliders,
  Compass,
  BookOpen,
} from '@/components/icons/MinimalIcons';
import { useUserSession } from '@/hooks/useUserSession';
import { useOrders } from '@/hooks/useOrders';
import { UserRole, IUser } from '@/backend/domain/user';
import { OrderFulfillmentStatus } from '@/backend/domain/order';
import { AI_PRINT_TIERS } from '@/backend/domain/ai-tiers';
import { ISystemConfig, DEFAULT_SYSTEM_CONFIG } from '@/backend/domain/config';
import { AdminProductsManager } from '@/components/admin/AdminProductsManager';
import { AdminModulesManager } from '@/components/admin/AdminModulesManager';
import { AdminTrendsManager } from '@/components/admin/AdminTrendsManager';
import { AdminCrawlerManager } from '@/components/admin/AdminCrawlerManager';
import { AdminUserManager } from '@/components/admin/AdminUserManager';
import { AdminAuditLogManager } from '@/components/admin/AdminAuditLogManager';
import { AdminKnowledgeManager } from '@/components/admin/AdminKnowledgeManager';

const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Khuyên dùng - Nhanh, Thông Minh & Ổn Định Tuyệt Đối)' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite (Siêu tốc & Tiết kiệm token)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Suy luận sâu & Phân tích chiến lược 2M context)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Thế hệ 1.5 ổn định cao)' },
];

function AdminPageContent() {
  const {
    currentUser,
    permissions,
    allUsers,
    login,
    refreshSession,
    toastMessage,
    showToast,
    isLoading,
  } = useUserSession();
  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminLoginPass, setAdminLoginPass] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);

  const {
    orders,
    printers,
    stats,
    updateOrderStatus,
    assignPrinter,
    updatePrinterProgress,
    refreshOrders,
  } = useOrders();

  const searchParams = useSearchParams();
  const tabQuery = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'users' | 'workshop' | 'revenue' | 'settings' | 'products' | 'modules' | 'trends' | 'crawler' | 'audit' | 'knowledge'>('workshop');
  const [tabCategory, setTabCategory] = useState<'all' | 'operations' | 'growth' | 'system'>('all');
  const [systemConfig, setSystemConfig] = useState<ISystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Dynamic Gemini Models state
  const [availableGeminiModels, setAvailableGeminiModels] = useState<
    { id: string; name: string; description?: string }[]
  >([]);
  const [isLoadingGeminiModels, setIsLoadingGeminiModels] = useState<boolean>(false);
  const [geminiModelStatus, setGeminiModelStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFetchGeminiModels = async () => {
    setIsLoadingGeminiModels(true);
    setGeminiModelStatus({ type: null, message: '' });
    try {
      const apiKey = systemConfig.apiKeys.geminiApiKey?.trim();
      const res = await fetch('/api/admin/gemini/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableGeminiModels(data.models);
        setGeminiModelStatus({
          type: 'success',
          message: `Kết nối thành công! Đã tải ${data.models.length} model từ Google Gemini API.`,
        });
        showToast(`Đã tải ${data.models.length} model từ Google API`);
        if (!systemConfig.apiKeys.preferredGeminiModel) {
          setSystemConfig((prev) => ({
            ...prev,
            apiKeys: {
              ...prev.apiKeys,
              preferredGeminiModel: data.models[0].id,
            },
          }));
        }
      } else {
        const errMsg = data.error || 'Không thể tải danh sách model từ Google API';
        setGeminiModelStatus({
          type: 'error',
          message: errMsg,
        });
        showToast(`Lỗi: ${errMsg}`);
      }
    } catch (err: any) {
      const errMsg = `Lỗi kết nối Google API: ${err.message}`;
      setGeminiModelStatus({
        type: 'error',
        message: errMsg,
      });
      showToast(errMsg);
    } finally {
      setIsLoadingGeminiModels(false);
    }
  };

  // Sync tab with query parameters (?tab=users, ?tab=products, etc.)
  useEffect(() => {
    if (tabQuery && ['users', 'workshop', 'revenue', 'settings', 'products', 'modules', 'trends', 'crawler', 'audit', 'knowledge'].includes(tabQuery)) {
      setActiveTab(tabQuery as any);
    } else if (currentUser?.role === 'mod') {
      setActiveTab('products');
    }
  }, [tabQuery, currentUser?.role]);

  // Fetch admin system configuration
  React.useEffect(() => {
    fetch('/api/admin/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setSystemConfig(data.config);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveConfig = async (section: string, payload: any) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, ...payload }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSystemConfig(data.config);
        showToast('Đã lưu cấu hình hệ thống thành công!');
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể lưu cấu hình'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSwitchEnvironment = async (env: 'staging' | 'official') => {
    if (currentUser?.role !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền chuyển đổi môi trường hệ thống!');
      return;
    }
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/system/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: env }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSystemConfig((prev) => ({
          ...prev,
          environment: env,
          operations: {
            ...prev.operations,
            profitMarginPercent: env === 'official' ? (prev.commercial?.commercialMarginPercent || 25) : 0,
          },
        }));
        showToast(data.message || `Đã chuyển sang: ${env.toUpperCase()}`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('3dhub-environment-change', { detail: { environment: env } })
          );
        }
      } else {
        showToast(`Lỗi: ${data.error || 'Không thể chuyển đổi môi trường'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Workshop filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.fulfillmentStatus === orderStatusFilter;
    const matchesSearch =
      !orderSearchQuery ||
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.items.some((item) => item.title.toLowerCase().includes(orderSearchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getFulfillmentBadge = (status: OrderFulfillmentStatus) => {
    switch (status) {
      case 'pending_review':
        return { label: 'Chờ Duyệt File', color: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'slicing':
        return { label: 'Đang Cắt Lớp OrcaSlicer', color: 'bg-cyan-50 text-cyan-800 border-cyan-300' };
      case 'queued':
        return { label: 'Xếp Hàng Chờ Máy', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'printing':
        return { label: 'Đang In Thực Tế', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'post_processing':
        return { label: 'Hậu Kỳ / Rửa Sấy', color: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'packaging':
        return { label: 'Đóng Gói Chống Sốc', color: 'bg-purple-50 text-purple-800 border-purple-300' };
      case 'delivering':
        return { label: 'Đang Giao Hàng', color: 'bg-orange-50 text-orange-800 border-orange-300' };
      case 'completed':
        return { label: 'Hoàn Tất', color: 'bg-emerald-100 text-emerald-900 border-emerald-400' };
      case 'cancelled':
        return { label: 'Đã Hủy', color: 'bg-rose-50 text-rose-800 border-rose-300' };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Đang xác thực phiên quản trị viên...</p>
      </div>
    );
  }

  // If user isn't logged in or doesn't have admin access permissions, show dedicated Admin Login Gate
  if (!currentUser || !permissions.canAccessAdmin) {
    const handleInlineAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAdminLoginError(null);
      if (!adminLoginId.trim() || !adminLoginPass) {
        setAdminLoginError('Vui lòng nhập đầy đủ ID Quản trị và Mật khẩu!');
        return;
      }
      setIsLoggingInAdmin(true);
      const res = await login(adminLoginId.trim(), adminLoginPass);
      setIsLoggingInAdmin(false);
      if (!res.ok) {
        setAdminLoginError(res.error || 'Sai thông tin đăng nhập!');
      } else {
        setAdminLoginId('');
        setAdminLoginPass('');
      }
    };

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full vision-glass-panel rounded-[36px] p-8 text-center space-y-5 shadow-2xl border border-slate-200/80 bg-white/95">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 mx-auto flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">Xác Thực Quản Trị Hệ Thống</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {currentUser ? (
                <>
                  Tài khoản hiện tại (<strong className="text-slate-900">{currentUser.username}</strong> -{' '}
                  {currentUser.role.toUpperCase()}) không có quyền truy cập khu vực quản trị. Vui lòng đăng nhập bằng tài khoản Quản trị viên.
                </>
              ) : (
                <>
                  Vui lòng đăng nhập bằng tài khoản <strong className="text-slate-900">Quản Trị Viên (Admin)</strong> hoặc Nhân sự được phân quyền để truy cập Trung Tâm Điều Hành.
                </>
              )}
            </p>
          </div>

          {adminLoginError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold text-left">
              {adminLoginError}
            </div>
          )}

          <form onSubmit={handleInlineAdminLogin} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ID Quản Trị / Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập ID tài khoản..."
                value={adminLoginId}
                onChange={(e) => setAdminLoginId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật Khẩu <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu..."
                value={adminLoginPass}
                onChange={(e) => setAdminLoginPass(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingInAdmin}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white text-xs font-bold transition-all text-center shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoggingInAdmin ? 'Đang xác thực...' : 'Đăng Nhập Trung Tâm Quản Trị'}
            </button>
          </form>

          <Link
            href="/"
            className="block w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
          >
            Quay lại Trang Chủ 3D Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Top Banner Header */}
      <div className="vision-glass-panel rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80 bg-white/85 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-800 shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Trung Tâm Quản Trị &amp; Xưởng In 3D
              </h1>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
                {currentUser?.role?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phân quyền người dùng, điều phối máy in xưởng Bambu Lab, kiểm soát doanh thu và cổng thanh toán VietQR / MoMo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => {
              refreshSession();
              refreshOrders();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm mới</span>
          </button>

          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>AI Studio 3D</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="vision-glass rounded-[28px] p-5 space-y-2 border border-slate-200/80 bg-white/85 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Doanh Thu Đã Thu</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {stats.totalRevenueVnd.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18.5% từ dịch vụ in AI</span>
          </div>
        </div>

        {/* Metric 2: Active Workshop Orders */}
        <div className="vision-glass rounded-[28px] p-5 space-y-2 border border-slate-200/80 bg-white/85 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Đơn Đang Chạy Xưởng</span>
            <Printer className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.activePrintingJobs} / {stats.totalOrders} đơn
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {stats.pendingReviewCount} đơn chờ duyệt file
          </div>
        </div>

        {/* Metric 3: Active Printers */}
        <div className="vision-glass rounded-[28px] p-5 space-y-2 border border-slate-200/80 bg-white/85 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Máy In Hoạt Động</span>
            <Cpu className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.activePrintersCount} / {stats.totalPrintersCount} máy
          </div>
          <div className="text-[11px] text-slate-500">
            Bambu Lab X1C &amp; Anycubic SLA
          </div>
        </div>

        {/* Metric 4: System Users */}
        <div className="vision-glass rounded-[28px] p-5 space-y-2 border border-slate-200/80 bg-white/85 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tài Khoản Hệ Thống</span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {allUsers.length} tài khoản
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            4 cấp phân quyền RBAC
          </div>
        </div>
      </div>

      {/* Unified Apple VisionOS Admin Navigation Hub (Zero-Horizontal-Scroll) */}
      <div className="vision-glass p-4 sm:p-5 rounded-[28px] space-y-3.5 border border-slate-200/80 bg-white/85 shadow-sm">
        {/* Top: Category Filter Tabs & Direct Seller Hub Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Nhóm Quản Trị:
            </span>
            {[
              { id: 'all', label: 'Tất Cả', count: 11 },
              { id: 'operations', label: '🏭 Vận Hành & Kho', count: 4 },
              { id: 'growth', label: '📈 Kinh Doanh & AI', count: 4 },
              { id: 'system', label: '🛡️ Quản Trị & Hệ Thống', count: 3 },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setTabCategory(cat.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  tabCategory === cat.id
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm font-bold'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Quick External Link to Seller Hub */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'mod') && (
            <Link
              href="/seller"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-sm shrink-0 self-start sm:self-auto"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Vào Kênh Gian Hàng (Seller Hub)</span>
              <ArrowUpRight className="w-3 h-3 text-amber-600/70" />
            </Link>
          )}
        </div>

        {/* Bottom: Responsive Wrapped Tab Pills (No Horizontal Scroll Needed) */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* 1. Users */}
          {currentUser?.role === 'admin' && (tabCategory === 'all' || tabCategory === 'operations') && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'users'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'users' ? 'text-white' : 'text-cyan-600'}`} />
              <span>Quản Lý Người Dùng</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'users' ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {allUsers.length}
              </span>
            </button>
          )}

          {/* 2. Products */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'mod' || permissions.canManageProducts) &&
            (tabCategory === 'all' || tabCategory === 'operations') && (
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'products'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${activeTab === 'products' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Kho Hàng &amp; Sản Phẩm</span>
            </button>
          )}

          {/* 3. Workshop */}
          {(tabCategory === 'all' || tabCategory === 'operations') && (
            <button
              type="button"
              onClick={() => setActiveTab('workshop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'workshop'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Printer className={`w-3.5 h-3.5 ${activeTab === 'workshop' ? 'text-white' : 'text-cyan-600'}`} />
              <span>Điều Phối Xưởng In &amp; Đơn Hàng</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'workshop' ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {orders.length}
              </span>
            </button>
          )}

          {/* 4. Revenue */}
          {currentUser?.role === 'admin' && (tabCategory === 'all' || tabCategory === 'growth') && (
            <button
              type="button"
              onClick={() => setActiveTab('revenue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'revenue'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <DollarSign className={`w-3.5 h-3.5 ${activeTab === 'revenue' ? 'text-white' : 'text-amber-500'}`} />
              <span>Doanh Thu &amp; Cổng Thanh Toán</span>
            </button>
          )}

          {/* 5. Trends */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'mod' || permissions.canManageProducts) &&
            (tabCategory === 'all' || tabCategory === 'growth') && (
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'trends'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'trends' ? 'text-white' : 'text-teal-600'}`} />
              <span>Phân Tích Trend (Gemini AI)</span>
            </button>
          )}

          {/* 6. Crawler */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'mod' || permissions.canManageProducts) &&
            (tabCategory === 'all' || tabCategory === 'growth') && (
            <button
              type="button"
              onClick={() => setActiveTab('crawler')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'crawler'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${activeTab === 'crawler' ? 'text-white' : 'text-cyan-600'}`} />
              <span>Thu Thập Dữ Liệu 3D (Crawler v3)</span>
            </button>
          )}

          {/* 7. Knowledge Base */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'mod' || permissions.canManageProducts) &&
            (tabCategory === 'all' || tabCategory === 'growth') && (
            <button
              type="button"
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'knowledge'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'knowledge' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Kho Tri Thức Đối Chiếu</span>
            </button>
          )}

          {/* 8. Settings */}
          {currentUser?.role === 'admin' && (tabCategory === 'all' || tabCategory === 'system') && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'settings'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${activeTab === 'settings' ? 'text-white' : 'text-slate-600'}`} />
              <span>Cấu Hình Giá Vốn &amp; API</span>
            </button>
          )}

          {/* 9. Modules */}
          {currentUser?.role === 'admin' && (tabCategory === 'all' || tabCategory === 'system') && (
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'modules'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Sliders className={`w-3.5 h-3.5 ${activeTab === 'modules' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Phân Quyền Modules (8 Tính Năng)</span>
            </button>
          )}

          {/* 10. Audit Logs */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'mod') &&
            (tabCategory === 'all' || tabCategory === 'system') && (
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeTab === 'audit'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${activeTab === 'audit' ? 'text-white' : 'text-cyan-600'}`} />
              <span>Nhật Ký Kiểm Toán (Audit Trail)</span>
            </button>
          )}
        </div>
      </div>


      {/* TAB 1: WORKSHOP & ORDERS COORDINATION */}
      {activeTab === 'workshop' && (
        <div className="space-y-6">
          {/* Live Farm Status Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-600" />
                <span>Trạng Thái Trực Tiếp Các Cỗ Máy Xưởng In (Farm Live)</span>
              </h3>
              <span className="text-xs text-slate-500">Tự động giám sát nhiệt độ và tiến độ in</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {printers.map((prt) => {
                const isPrinting = prt.status === 'printing';
                return (
                  <div
                    key={prt.id}
                    className={`p-4 rounded-[28px] vision-glass border border-slate-200/80 bg-white/90 shadow-sm transition-all ${
                      isPrinting
                        ? 'border-cyan-300 ring-2 ring-cyan-500/10'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isPrinting ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
                            }`}
                          />
                          <h4 className="text-xs font-black text-slate-900 truncate">{prt.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {prt.materialLoaded || 'Vật liệu: N/A'}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          isPrinting
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isPrinting ? 'Đang In' : 'Sẵn Sàng'}
                      </span>
                    </div>

                    {/* Printer Telemetry */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px]">
                      <div>
                        <span className="text-slate-400 block font-medium">Đầu phun</span>
                        <span className="font-bold text-rose-600">
                          {prt.nozzleTemp ? `${prt.nozzleTemp}°C` : 'Off'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Bàn nhiệt</span>
                        <span className="font-bold text-amber-600">
                          {prt.bedTemp ? `${prt.bedTemp}°C` : 'Off'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Công nghệ</span>
                        <span className="font-bold text-slate-800">{prt.type}</span>
                      </div>
                    </div>

                    {/* Progress Bar if printing */}
                    {isPrinting && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-600">Đơn #{prt.currentOrderId}</span>
                          <span className="text-cyan-700">{prt.currentProgressPercent || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all"
                            style={{ width: `${prt.currentProgressPercent || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orders Filter & Management */}
          <div className="vision-glass rounded-[32px] p-5 sm:p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Danh Sách Đơn Hàng ({filteredOrders.length} đơn)
                </h3>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm mã đơn, tên khách..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white w-44 sm:w-56 shadow-sm"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer shadow-sm"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending_review">Chờ duyệt file</option>
                  <option value="slicing">Đang cắt lớp</option>
                  <option value="printing">Đang in thực tế</option>
                  <option value="post_processing">Hậu kỳ</option>
                  <option value="completed">Hoàn tất</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <th className="pb-3 px-3">Mã Đơn</th>
                    <th className="pb-3 px-3">Khách Hàng</th>
                    <th className="pb-3 px-3">Sản Phẩm &amp; AI Tier</th>
                    <th className="pb-3 px-3">Tổng Tiền / Cổng</th>
                    <th className="pb-3 px-3">Máy In Phân Bổ</th>
                    <th className="pb-3 px-3">Tiến Độ Xưởng</th>
                    <th className="pb-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const badge = getFulfillmentBadge(order.fulfillmentStatus);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            #{order.id}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{order.customerName}</div>
                            <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                          </td>

                          <td className="py-3 px-3 max-w-xs">
                            <div className="space-y-1">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-800 truncate">
                                    {it.title}
                                  </span>
                                  {it.aiTier && it.aiTier !== 'none' && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 shrink-0">
                                      {it.aiTier === 'meshy_ultra'
                                        ? 'Meshy 4K'
                                        : it.aiTier === 'trellis_pro'
                                        ? 'Trellis 2'
                                        : 'Tripo Fast'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-black text-amber-600">
                              {order.totalAmountVnd.toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">
                              {order.paymentMethod === 'vietqr'
                                ? 'VietQR 24/7'
                                : order.paymentMethod === 'momo'
                                ? 'MoMo'
                                : order.paymentMethod === 'wallet'
                                ? 'Ví 3D Hub'
                                : 'COD'}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <select
                              value={order.assignedPrinter || ''}
                              onChange={(e) => assignPrinter(order.id, e.target.value)}
                              className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
                            >
                              <option value="">Chưa phân bổ</option>
                              {printers.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.fulfillmentStatus === 'pending_review' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'slicing')}
                                  className="px-3 py-1 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 text-[11px] font-bold transition-all shadow-sm active:scale-95"
                                  title="Chuyển sang bước cắt lớp trên OrcaSlicer"
                                >
                                  Cắt Lớp
                                </button>
                              )}

                              {order.fulfillmentStatus === 'slicing' && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(
                                      order.id,
                                      'printing',
                                      order.assignedPrinter || printers[0].name
                                    )
                                  }
                                  className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition-all shadow-sm active:scale-95"
                                  title="Bắt đầu chạy máy in"
                                >
                                  Bắt Đầu In
                                </button>
                              )}

                              {order.fulfillmentStatus === 'printing' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'post_processing')}
                                  className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-bold transition-all shadow-sm active:scale-95"
                                  title="In xong, chuyển sang hậu kỳ gỡ support"
                                >
                                  Hậu Kỳ
                                </button>
                              )}

                              {order.fulfillmentStatus === 'post_processing' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'delivering')}
                                  className="px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold transition-all shadow-sm active:scale-95"
                                  title="Đóng gói và giao cho đơn vị vận chuyển"
                                >
                                  Giao Hàng
                                </button>
                              )}

                              {order.fulfillmentStatus === 'delivering' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'completed')}
                                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-sm active:scale-95"
                                  title="Xác nhận khách đã nhận thành công"
                                >
                                  Hoàn Tất
                                </button>
                              )}

                              {order.fulfillmentStatus === 'completed' && (
                                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Xong</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC USER & WALLET MANAGEMENT */}
      {activeTab === 'users' && (
        <AdminUserManager
          users={allUsers}
          currentUserId={currentUser?.id}
          onRefresh={refreshSession}
          showToast={showToast}
        />
      )}

      {/* TAB 3: AI PRICING COST x2 & PAYMENT AUDIT */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* AI Models Cost x2 Matrix */}
          <div className="vision-glass rounded-[32px] p-5 sm:p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Bảng Cấu Hình &amp; Báo Giá Dịch Vụ AI 3D
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Định mức giá niêm yết cho từng cấp độ tạo mô hình 3D (In Thường, In Nâng Cao, In Chất Lượng 4K) tối ưu theo hạ tầng.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {Object.values(AI_PRINT_TIERS).map((tier) => (
                <div
                  key={tier.id}
                  className="p-4 sm:p-5 rounded-[28px] vision-glass border border-slate-200/80 bg-white/90 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900">{tier.name}</h4>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {tier.engine}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">{tier.description}</p>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Đơn giá hạ tầng API:</span>
                      <span className="font-mono text-slate-800 font-semibold">${tier.costUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quy đổi ước tính:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {Math.round(tier.costUsd * 25400).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200">
                      <span className="font-bold text-amber-700">Giá bán niêm yết:</span>
                      <span className="font-black text-amber-600 text-sm">
                        {tier.priceVnd.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-between">
                    <span>Biên lợi nhuận gộp:</span>
                    <span>50.0% (Tự động hạch toán)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VietQR / MoMo Gateway Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="vision-glass rounded-[28px] p-5 sm:p-6 space-y-3 border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-600" />
                <h4 className="text-xs font-black text-slate-900">Cổng VietQR Napas 24/7 (MB Bank)</h4>
              </div>
              <p className="text-xs text-slate-600">
                Tích hợp API tạo mã QR động ngân hàng Quân Đội (MB Bank). Khách hàng chuyển khoản với cú pháp định danh được hệ thống xác nhận và nạp tiền tức thì.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-slate-900">0901234567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900">3D HUB VIETNAM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="text-slate-800 font-semibold">MB Bank (Quân Đội)</span>
                </div>
              </div>
            </div>

            <div className="vision-glass rounded-[28px] p-5 sm:p-6 space-y-3 border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-500" />
                <h4 className="text-xs font-black text-slate-900">Cổng Ví Điện Tử MoMo (QuickPay)</h4>
              </div>
              <p className="text-xs text-slate-600">
                Thanh toán qua quét mã QR MoMo P2P trực tiếp. Khách hàng chỉ cần giơ điện thoại quét là hoàn tất giao dịch trong 30 giây.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số điện thoại MoMo:</span>
                  <span className="font-mono font-bold text-slate-900">0901234567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên ví đại diện:</span>
                  <span className="font-bold text-slate-900">3D HUB TECH VIETNAM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cú pháp:</span>
                  <span className="text-rose-600 font-mono font-bold">3DHUB NAP [USER]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM CONFIG, MATERIAL COSTS & API KEYS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Section 1: API Keys */}
          <div className="vision-glass rounded-[32px] p-5 sm:p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-200 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    1. Khóa Kết Nối API (Google Gemini, Fal.ai &amp; Meshy)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản trị viên có thể nhập trực tiếp API Key để kích hoạt phân tích dữ liệu và sinh 3D thực tế
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Gemini Key & Model Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Google Gemini API Key
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-700 hover:underline font-semibold"
                  >
                    <span>Lấy key Google miễn phí</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={systemConfig.apiKeys.geminiApiKey}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      apiKeys: { ...systemConfig.apiKeys, geminiApiKey: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-cyan-500 shadow-sm"
                />

                {/* Model Selector & Live Load Button */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Mô hình Gemini sử dụng:
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchGeminiModels}
                      disabled={isLoadingGeminiModels}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 transition-all disabled:opacity-50"
                      title="Kết nối trực tiếp tới Google AI API để tải danh sách các model đang hoạt động theo API Key này"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingGeminiModels ? 'animate-spin' : ''}`} />
                      <span>{isLoadingGeminiModels ? 'Đang tải...' : 'Tải Model từ API'}</span>
                    </button>
                  </div>

                  <select
                    value={systemConfig.apiKeys.preferredGeminiModel || 'gemini-2.0-flash'}
                    onChange={(e) =>
                      setSystemConfig({
                        ...systemConfig,
                        apiKeys: {
                          ...systemConfig.apiKeys,
                          preferredGeminiModel: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-cyan-500 shadow-sm"
                  >
                    {(availableGeminiModels.length > 0 ? availableGeminiModels : DEFAULT_GEMINI_MODELS).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.id}
                      </option>
                    ))}
                  </select>

                  {geminiModelStatus.type === 'success' && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{geminiModelStatus.message}</span>
                    </div>
                  )}

                  {geminiModelStatus.type === 'error' && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-300 text-[11px] text-rose-800 flex items-start gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{geminiModelStatus.message}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Dùng cho phân tích xu hướng MakerWorld và khuyến nghị sản xuất cho xưởng in.
                </p>
              </div>

              {/* Fal.ai Key */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">
                  Fal.ai API Key
                </label>
                <input
                  type="text"
                  placeholder="fal_key_..."
                  value={systemConfig.apiKeys.falKey}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      apiKeys: { ...systemConfig.apiKeys, falKey: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-cyan-500 shadow-sm"
                />
                <p className="text-[11px] text-slate-500">
                  Dùng để chạy mô hình Trellis 2 ($0.05) &amp; Tripo H3.1 ($0.01) sinh khối 3D siêu tốc.
                </p>
                <a
                  href="https://fal.ai/dashboard/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-700 hover:underline font-semibold"
                >
                  <span>Đăng ký tại Fal.ai</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Meshy Key */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">
                  Meshy.ai API Key
                </label>
                <input
                  type="text"
                  placeholder="msy_..."
                  value={systemConfig.apiKeys.meshyApiKey}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      apiKeys: { ...systemConfig.apiKeys, meshyApiKey: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-cyan-500 shadow-sm"
                />
                <p className="text-[11px] text-slate-500">
                  Dùng để sinh chi tiết sắc nét 4K PBR Texture và Quad Mesh thương mại.
                </p>
                <a
                  href="https://meshy.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-700 hover:underline font-semibold"
                >
                  <span>Đăng ký tại Meshy.ai</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSaveConfig('apiKeys', { apiKeys: systemConfig.apiKeys })}
                disabled={isSavingConfig}
                className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSavingConfig ? 'Đang Lưu...' : 'Lưu Khóa API Hệ Thống'}
              </button>
            </div>
          </div>

          {/* Section 2: Material Costs (Giá vốn nhựa) */}
          <div className="vision-glass rounded-[32px] p-5 sm:p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-200 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  2. Cấu Hình Giá Gốc (Giá Vốn) Cuộn Nhựa &amp; Resin In 3D
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đơn giá vốn làm cơ sở tính toán chi phí thực tế cho khách hàng khi đặt in FDM / SLA
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {/* PLA */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">Nhựa PLA Basic</span>
                  <span className="text-[10px] text-amber-700 font-mono font-semibold">
                    {Math.round(systemConfig.materials.plaPerKgVnd / 1000)} đ/g
                  </span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={systemConfig.materials.plaPerKgVnd}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      materials: {
                        ...systemConfig.materials,
                        plaPerKgVnd: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold focus:outline-none focus:border-cyan-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 block">Đơn vị: VNĐ / cuộn 1kg</span>
              </div>

              {/* PETG */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">Nhựa PETG</span>
                  <span className="text-[10px] text-amber-700 font-mono font-semibold">
                    {Math.round(systemConfig.materials.petgPerKgVnd / 1000)} đ/g
                  </span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={systemConfig.materials.petgPerKgVnd}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      materials: {
                        ...systemConfig.materials,
                        petgPerKgVnd: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold focus:outline-none focus:border-cyan-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 block">Đơn vị: VNĐ / cuộn 1kg</span>
              </div>

              {/* PETG-CF */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">PETG-CF Carbon</span>
                  <span className="text-[10px] text-amber-700 font-mono font-semibold">
                    {Math.round(systemConfig.materials.petgCfPerKgVnd / 1000)} đ/g
                  </span>
                </div>
                <input
                  type="number"
                  step="10000"
                  value={systemConfig.materials.petgCfPerKgVnd}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      materials: {
                        ...systemConfig.materials,
                        petgCfPerKgVnd: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold focus:outline-none focus:border-cyan-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 block">Đơn vị: VNĐ / cuộn 1kg</span>
              </div>

              {/* ABS */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">Nhựa ABS Chịu Nhiệt</span>
                  <span className="text-[10px] text-amber-700 font-mono font-semibold">
                    {Math.round(systemConfig.materials.absPerKgVnd / 1000)} đ/g
                  </span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={systemConfig.materials.absPerKgVnd}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      materials: {
                        ...systemConfig.materials,
                        absPerKgVnd: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold focus:outline-none focus:border-cyan-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 block">Đơn vị: VNĐ / cuộn 1kg</span>
              </div>

              {/* Resin SLA */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">Resin SLA 12K</span>
                  <span className="text-[10px] text-amber-700 font-mono font-semibold">
                    {Math.round(systemConfig.materials.resinPerLiterVnd / 1000)} đ/g
                  </span>
                </div>
                <input
                  type="number"
                  step="10000"
                  value={systemConfig.materials.resinPerLiterVnd}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      materials: {
                        ...systemConfig.materials,
                        resinPerLiterVnd: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold focus:outline-none focus:border-cyan-500 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 block">Đơn vị: VNĐ / chai 1 lít</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSaveConfig('materials', { materials: systemConfig.materials })}
                disabled={isSavingConfig}
                className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSavingConfig ? 'Đang Lưu...' : 'Lưu Bảng Giá Vốn Nhựa'}
              </button>
            </div>
          </div>

          {/* Section 3: Operations & % Margin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="vision-glass rounded-[32px] p-5 sm:p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-200 shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    3. Chi Phí Vận Hành &amp; % Phụ Thu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khấu hao máy in, tiền điện và % biên lợi nhuận cộng thêm (0% = bán giá gốc)
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Khấu hao máy in theo giờ:</span>
                  <input
                    type="number"
                    step="1000"
                    value={systemConfig.operations.machineHourlyRateVnd}
                    onChange={(e) =>
                      setSystemConfig({
                        ...systemConfig,
                        operations: {
                          ...systemConfig.operations,
                          machineHourlyRateVnd: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-32 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold text-right focus:outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Tiền điện chạy máy theo giờ:</span>
                  <input
                    type="number"
                    step="500"
                    value={systemConfig.operations.electricityHourlyVnd}
                    onChange={(e) =>
                      setSystemConfig({
                        ...systemConfig,
                        operations: {
                          ...systemConfig.operations,
                          electricityHourlyVnd: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-32 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold text-right focus:outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Nhân công hậu kỳ (gỡ support):</span>
                  <input
                    type="number"
                    step="5000"
                    value={systemConfig.operations.laborPostProcessVnd}
                    onChange={(e) =>
                      setSystemConfig({
                        ...systemConfig,
                        operations: {
                          ...systemConfig.operations,
                          laborPostProcessVnd: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-32 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold text-right focus:outline-none focus:border-cyan-500 shadow-sm"
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="font-bold text-emerald-700 block">% Phụ thu / Lợi nhuận:</span>
                    <span className="text-[10px] text-slate-500">0% = tính đúng giá gốc</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="200"
                      value={systemConfig.operations.profitMarginPercent}
                      onChange={(e) =>
                        setSystemConfig({
                          ...systemConfig,
                          operations: {
                            ...systemConfig.operations,
                            profitMarginPercent: Number(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-24 px-3 py-1.5 rounded-xl bg-white border border-emerald-400 text-xs text-emerald-800 font-black text-right focus:outline-none focus:border-emerald-500 shadow-sm"
                    />
                    <span className="text-xs font-bold text-slate-700">%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('operations', { operations: systemConfig.operations })}
                  disabled={isSavingConfig}
                  className="px-6 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSavingConfig ? 'Đang Lưu...' : 'Lưu Chi Phí & % Phụ Thu'}
                </button>
              </div>
            </div>

            {/* Section 4: AI Model Base Pricing */}
            <div className="vision-glass rounded-[32px] p-5 sm:p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-200 shadow-sm">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    4. Giá Gốc Các Mô Hình AI 3D (VNĐ)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Định mức chi phí tính cho khách theo đúng giá gốc API
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-800 font-bold block">Tripo H3.1 (In Thường):</span>
                    <span className="text-[10px] text-slate-500">Chi phí gốc: $0.01 / lượt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="50"
                      value={systemConfig.aiPricing.tripoVnd}
                      onChange={(e) =>
                        setSystemConfig({
                          ...systemConfig,
                          aiPricing: { ...systemConfig.aiPricing, tripoVnd: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-28 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold text-right focus:outline-none focus:border-cyan-500 shadow-sm"
                    />
                    <span className="text-xs text-slate-500 font-medium">đ</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-800 font-bold block">Trellis 2 (In Nâng Cao):</span>
                    <span className="text-[10px] text-slate-500">Chi phí gốc: $0.05 / lượt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="100"
                      value={systemConfig.aiPricing.trellisVnd}
                      onChange={(e) =>
                        setSystemConfig({
                          ...systemConfig,
                          aiPricing: { ...systemConfig.aiPricing, trellisVnd: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-28 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold text-right focus:outline-none focus:border-cyan-500 shadow-sm"
                    />
                    <span className="text-xs text-slate-500 font-medium">đ</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-800 font-bold block">Meshy 6 (In 4K Ultra):</span>
                    <span className="text-[10px] text-slate-500">Chi phí gốc: $0.80 / lượt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1000"
                      value={systemConfig.aiPricing.meshyVnd}
                      onChange={(e) =>
                        setSystemConfig({
                          ...systemConfig,
                          aiPricing: { ...systemConfig.aiPricing, meshyVnd: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-28 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-amber-700 font-bold text-right focus:outline-none focus:border-cyan-500 shadow-sm"
                    />
                    <span className="text-xs text-slate-500 font-medium">đ</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveConfig('aiPricing', { aiPricing: systemConfig.aiPricing })}
                  disabled={isSavingConfig}
                  className="px-6 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSavingConfig ? 'Đang Lưu...' : 'Lưu Giá Gốc AI'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Commercial Enterprise Configuration */}
          <div className="vision-glass rounded-[32px] p-5 sm:p-6 space-y-4 border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-200 shadow-sm">
                <Building2 className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  5. Cấu Hình Doanh Nghiệp &amp; Phiên Bản Thương Mại (Official Edition)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thông tin pháp nhân, tài khoản ngân hàng nhận thanh toán VietQR và chính sách bảo hành thương mại
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">Tên Doanh Nghiệp / Thương Hiệu</label>
                <input
                  type="text"
                  value={systemConfig.commercial?.companyName || ''}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      commercial: { ...systemConfig.commercial, companyName: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-sm"
                  placeholder="Công ty Cổ phần Công nghệ In 3D Hub"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">Mã Số Thuế (MST)</label>
                <input
                  type="text"
                  value={systemConfig.commercial?.taxCode || ''}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      commercial: { ...systemConfig.commercial, taxCode: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 font-mono shadow-sm"
                  placeholder="0318998822"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">Hotline Hỗ Trợ 24/7</label>
                <input
                  type="text"
                  value={systemConfig.commercial?.hotline || ''}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      commercial: { ...systemConfig.commercial, hotline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-sm"
                  placeholder="1900 6833 - 0988.333.444"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">Email Chăm Sóc Khách Hàng</label>
                <input
                  type="email"
                  value={systemConfig.commercial?.supportEmail || ''}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      commercial: { ...systemConfig.commercial, supportEmail: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-sm"
                  placeholder="contact@3dhub.vn"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">Tài Khoản Ngân Hàng VietQR (Chính Thức)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={systemConfig.commercial?.bankAccount?.bankName || ''}
                    onChange={(e) =>
                      setSystemConfig({
                        ...systemConfig,
                        commercial: {
                          ...systemConfig.commercial,
                          bankAccount: {
                            ...systemConfig.commercial?.bankAccount,
                            bankName: e.target.value,
                          },
                        },
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-sm"
                    placeholder="Tên ngân hàng (MBBank)"
                  />
                  <input
                    type="text"
                    value={systemConfig.commercial?.bankAccount?.accountNumber || ''}
                    onChange={(e) =>
                      setSystemConfig({
                        ...systemConfig,
                        commercial: {
                          ...systemConfig.commercial,
                          bankAccount: {
                            ...systemConfig.commercial?.bankAccount,
                            accountNumber: e.target.value,
                          },
                        },
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-cyan-800 font-mono font-bold focus:outline-none focus:border-cyan-500 shadow-sm"
                    placeholder="Số tài khoản"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">Tên Chủ Tài Khoản Doanh Nghiệp</label>
                <input
                  type="text"
                  value={systemConfig.commercial?.bankAccount?.accountHolder || ''}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      commercial: {
                        ...systemConfig.commercial,
                        bankAccount: {
                          ...systemConfig.commercial?.bankAccount,
                          accountHolder: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 uppercase font-mono shadow-sm"
                  placeholder="CONG TY CP CONG NGHE 3D HUB"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block">Chính Sách Bảo Hành &amp; Cam Kết Chất Lượng</label>
                <input
                  type="text"
                  value={systemConfig.commercial?.warrantyPolicy || ''}
                  onChange={(e) =>
                    setSystemConfig({
                      ...systemConfig,
                      commercial: { ...systemConfig.commercial, warrantyPolicy: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-sm"
                  placeholder="Cam kết chuẩn xác kích thước ±0.1mm, bảo hành 1 đổi 1 trong 7 ngày"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSaveConfig('commercial', { commercial: systemConfig.commercial })}
                disabled={isSavingConfig}
                className="px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSavingConfig ? 'Đang Lưu...' : 'Lưu Thông Tin Doanh Nghiệp Thương Mại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRODUCTS & INVENTORY MANAGEMENT (ADMIN & MOD) */}
      {activeTab === 'products' && (
        <AdminProductsManager />
      )}

      {/* TAB 6: DYNAMIC ROLE-BASED MODULE PERMISSIONS MATRIX (ADMIN ONLY) */}
      {activeTab === 'modules' && currentUser?.role === 'admin' && (
        <AdminModulesManager />
      )}

      {/* TAB 7: TREND INTELLIGENCE & GEMINI AI ANALYSIS */}
      {activeTab === 'trends' && (
        <AdminTrendsManager />
      )}

      {/* TAB 8: MULTI-PLATFORM 3D DATA CRAWLER */}
      {activeTab === 'crawler' && (
        <AdminCrawlerManager />
      )}

      {/* TAB 9: AUDIT TRAIL LOGS (ADMIN & MOD) */}
      {activeTab === 'audit' && (
        <AdminAuditLogManager />
      )}

      {/* TAB 10: KNOWLEDGE BASE & GROUND TRUTH RULES (ADMIN & MOD) */}
      {activeTab === 'knowledge' && (
        <AdminKnowledgeManager />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Đang tải bảng điều khiển quản trị...</p>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
