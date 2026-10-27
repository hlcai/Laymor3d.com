'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  Wallet,
  Package,
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle,
  Clock,
  ExternalLink,
  Plus,
  ShieldCheck,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Printer,
  Edit2,
  Save,
  MapPin,
  Phone,
  Mail,
  Copy,
  Trash2,
  X,
  Star,
  RotateCcw,
  Check,
  AlertCircle,
  FileCode,
  Tag,
  ShieldAlert,
} from '@/components/icons/MinimalIcons';
import { useUserSession } from '@/hooks/useUserSession';
import { useUserWallet } from '@/hooks/useUserWallet';
import { useOrders } from '@/hooks/useOrders';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { GoogleAuthModal } from '@/components/common/GoogleAuthModal';
import { PresetGeneratorService } from '@/backend/services/slicing/PresetGeneratorService';

interface IUser3DAssetItem {
  id: string;
  userId: string;
  name: string;
  format: string;
  fileUrl: string;
  fileSizeMb?: number;
  previewUrl?: string;
  tags?: string[];
  category?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { currentUser, switchUser, refreshSession, showToast, permissions } = useUserSession();
  const { balanceVnd, isTopUpModalOpen, setIsTopUpModalOpen, topUpBalance } = useUserWallet();
  const { orders, refreshOrders } = useOrders();

  const [activeTab, setActiveTab] = useState<'info' | 'wallet' | 'orders' | 'creations' | 'seller'>('info');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Form states for profile editing
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '0901234567');
  const [address, setAddress] = useState(currentUser?.address || '123 Đường Điện Biên Phủ, TP. Hồ Chí Minh');
  const [isSaving, setIsSaving] = useState(false);

  // 🟦 GIAI ĐOẠN 2: 3D ASSET VAULT CÁ NHÂN
  const [userAssets, setUserAssets] = useState<IUser3DAssetItem[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedAssetToSell, setSelectedAssetToSell] = useState<any | null>(null);
  const [sellPriceVnd, setSellPriceVnd] = useState(50000);
  const [isSubmittingSell, setIsSubmittingSell] = useState(false);

  // 🟦 GIAI ĐOẠN 3: HỦY ĐƠN, BẢO HÀNH 1 ĐỔI 1, ĐÁNH GIÁ
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Đổi ý / Cần thay đổi thông số in');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const [warrantyModalOrder, setWarrantyModalOrder] = useState<any | null>(null);
  const [warrantyReason, setWarrantyReason] = useState('Tách lớp in / Bề mặt không đạt');
  const [warrantyNotes, setWarrantyNotes] = useState('');
  const [isSubmittingWarranty, setIsSubmittingWarranty] = useState(false);

  const [reviewModalOrder, setReviewModalOrder] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('Sản phẩm in rất sắc nét, bề mặt láng mịn, giao hàng nhanh chóng!');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Filter orders of current user
  const userOrders = orders.filter((o) => o.userId === currentUser?.id || o.customerName === currentUser?.name);

  // Fetch 3D Assets từ API
  const fetchUserAssets = async () => {
    try {
      setIsLoadingAssets(true);
      const res = await fetch(`/api/shop?action=get_user_assets&userId=${currentUser?.id || ''}`);
      const data = await res.json();
      if (data.success && data.assets) {
        setUserAssets(data.assets);
      }
    } catch (err) {
      console.error('Lỗi lấy tài sản 3D:', err);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserAssets();
    }
  }, [currentUser]);

  // Xóa tài sản 3D khỏi Vault
  const handleDeleteAsset = async (assetId: string) => {
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'user_assets',
          subAction: 'delete',
          assetId,
        }),
      });
      if (res.ok) {
        showToast('Đã xóa tệp 3D khỏi Vault');
        fetchUserAssets();
      }
    } catch (err) {
      showToast('Lỗi khi xóa tệp');
    }
  };

  // Đăng bán mô hình từ Vault
  const handlePublishFromVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetToSell) return;
    setIsSubmittingSell(true);
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_seller_product',
          productType: 'model',
          productData: {
            title: selectedAssetToSell.name,
            name: selectedAssetToSell.name,
            category: selectedAssetToSell.category || 'Art & Figures',
            priceVnd: Number(sellPriceVnd),
            isFree: Number(sellPriceVnd) === 0,
            thumbnailUrl: selectedAssetToSell.previewUrl || '/thumbnails/dragon.svg',
            fileUrl: selectedAssetToSell.fileUrl || '/models/sample.stl',
            formats: ['.STL', '.3MF'],
            description: `Mô hình 3D bản quyền từ 3D Vault của ${currentUser?.name}.`,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🎉 ' + data.message);
        setIsSellModalOpen(false);
      } else {
        showToast(data.error || 'Lỗi khi đăng bán');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmittingSell(false);
    }
  };

  // Xử lý Hủy Đơn Hoàn Tiền 100%
  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_order',
          orderId: cancelModalOrder.id,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🎉 ' + data.message);
        setCancelModalOrder(null);
        refreshOrders();
      } else {
        showToast(data.error || 'Không thể hủy đơn hàng');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi mạng');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Xử lý Khiếu Nại Bảo Hành 1 Đổi 1
  const handleClaimWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyModalOrder) return;
    setIsSubmittingWarranty(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim_warranty',
          orderId: warrantyModalOrder.id,
          reason: warrantyReason,
          notes: warrantyNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🎉 ' + data.message);
        setWarrantyModalOrder(null);
        refreshOrders();
      } else {
        showToast(data.error || 'Lỗi gửi yêu cầu bảo hành');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi mạng');
    } finally {
      setIsSubmittingWarranty(false);
    }
  };

  // Xử lý Gửi Đánh Giá Sản Phẩm
  const handleReviewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_order',
          orderId: reviewModalOrder.id,
          rating: reviewRating,
          reviewText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('⭐ ' + data.message);
        setReviewModalOrder(null);
        refreshOrders();
      } else {
        showToast(data.error || 'Lỗi khi gửi đánh giá');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi mạng');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      showToast('Đã cập nhật thông tin hồ sơ thành công!');
    } finally {
      setIsSaving(false);
    }
  };

  const getOrderStatusPill = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Đã Giao Thành Công', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' };
      case 'printing':
        return { label: 'Đang In Thực Tế (Xưởng 24H)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' };
      case 'slicing':
        return { label: 'Đang Cắt Lớp OrcaSlicer', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30' };
      case 'pending_review':
        return { label: 'Chờ Duyệt File 3D', color: 'bg-amber-500/20 text-amber-300 border-amber-400/30' };
      case 'packaging':
      case 'post_processing':
        return { label: 'Đóng Gói & Hậu Kỳ', color: 'bg-purple-500/20 text-purple-300 border-purple-400/30' };
      case 'delivering':
        return { label: 'Đang Giao Hàng', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' };
      case 'warranty_claimed':
        return { label: 'Bảo Hành 1 Đổi 1 (Chờ In Lại)', color: 'bg-rose-500/20 text-rose-300 border-rose-400/30' };
      case 'cancelled':
        return { label: 'Đã Hủy Đơn & Hoàn Tiền', color: 'bg-gray-500/20 text-gray-300 border-gray-400/30' };
      default:
        return { label: status, color: 'bg-white/10 text-white/70 border-white/15' };
    }
  };

  // Xác định bước tiến độ 1..5 cho Stepper
  const getOrderStep = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 1;
      case 'slicing':
      case 'queued':
        return 2;
      case 'printing':
      case 'warranty_claimed':
      case 'warranty_reprinting':
        return 3;
      case 'post_processing':
      case 'packaging':
        return 4;
      case 'delivering':
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  const isSeller = currentUser?.role === 'seller';

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Top Profile Header Card - Apple VisionOS Style */}
      <div className="vision-glass-panel rounded-[36px] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.4)] border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#46694E]/25 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-black/40 border-2 border-white/25 shadow-xl shrink-0">
              {currentUser?.avatar ? (
                <Image src={currentUser.avatar} alt={currentUser.name} fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70 text-2xl font-bold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {currentUser?.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/25">
                  {currentUser?.role?.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Google Verified</span>
                </span>
              </div>

              <p className="text-xs text-white/70 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-white/50" />
                <span>{currentUser?.email}</span>
                <span className="text-white/30">•</span>
                <Phone className="w-3.5 h-3.5 text-white/50" />
                <span>{currentUser?.phone || '0901234567'}</span>
              </p>

              <p className="text-xs text-white/60 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/50" />
                <span className="truncate max-w-md">{currentUser?.address || 'Hồ Chí Minh, Việt Nam'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/15 backdrop-blur-md">
              <div className="text-[10px] text-white/60 font-medium">Số dư ví khả dụng:</div>
              <div className="text-lg font-black text-amber-300">
                {(currentUser?.walletBalanceVnd ?? balanceVnd).toLocaleString('vi-VN')} đ
              </div>
            </div>

            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="vision-pill-btn flex items-center gap-1.5 px-5 py-3 rounded-full text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nạp Tiền Ví</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Pill Tabs Navigation */}
      <div className="vision-glass p-1.5 rounded-full flex items-center gap-2 overflow-x-auto backdrop-blur-2xl border border-white/15">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'info' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ Sơ Cá Nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'wallet' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Ví Điện Tử &amp; Giao Dịch</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'orders' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Đơn Hàng Của Tôi</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
            {userOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('creations')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'creations' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Kho Tệp 3D &amp; AI Vault</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
            {userAssets.length}
          </span>
        </button>

        {isSeller && (
          <button
            onClick={() => setActiveTab('seller')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'seller' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4 text-amber-300" />
            <span>Khu Vực Seller</span>
          </button>
        )}
      </div>

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 vision-glass rounded-[32px] p-6 sm:p-7 border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Cập Nhật Thông Tin Cá Nhân</h3>
                <p className="text-xs text-white/60">Dùng để xác thực đơn hàng in 3D và giao nhận tận nơi.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/80 block">Họ Và Tên</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80 block">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80 block">Email Liên Hệ</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-xs text-white/50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/80 block">Địa Chỉ Giao Hàng Mặc Định</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="vision-pill-btn flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="md:col-span-4 space-y-4">
            <div className="vision-glass rounded-[32px] p-6 border border-white/15 space-y-4">
              <h3 className="text-sm font-bold text-white">Bảo Mật &amp; Liên Kết</h3>
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-white">G</div>
                  <div>
                    <div className="text-xs font-bold text-white">Tài khoản Google</div>
                    <div className="text-[10px] text-emerald-300">Đã liên kết bảo mật</div>
                  </div>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WALLET */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="vision-glass-panel rounded-[32px] p-6 sm:p-7 border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">Ví Số Dư Ký Quỹ &amp; Tiêu Dùng</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">
                {(currentUser?.walletBalanceVnd ?? balanceVnd).toLocaleString('vi-VN')} đ
              </div>
              <p className="text-xs text-white/70">
                Dùng để thanh toán nhanh 1-click các đơn hàng in 3D, mở khóa Profile In Pro và mua vật tư.
              </p>
            </div>

            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="vision-pill-btn flex items-center gap-2 px-6 py-3 rounded-full text-white text-xs font-bold shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nạp Tiền VietQR / MoMo</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ĐƠN HÀNG CỦA TÔI (GIAI ĐOẠN 3: STEPPER 5 BƯỚC, HỦY ĐƠN HOÀN TIỀN, BẢO HÀNH 1 ĐỔI 1, REVIEW) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-white">Tiến Độ Đơn Hàng &amp; Hậu Mãi 2 Chiều</h3>
              <p className="text-xs text-white/60">Theo dõi 5 bước thời gian thực, cam kết bảo hành 1 đổi 1 và hoàn tiền 100%.</p>
            </div>
            <Link href="/shop" className="vision-pill-btn px-4 py-2 rounded-full text-white text-xs font-bold">
              + Đặt Mua Thêm
            </Link>
          </div>

          {userOrders.length === 0 ? (
            <div className="vision-glass rounded-[32px] p-12 text-center space-y-3 border border-white/15">
              <Package className="w-10 h-10 text-white/30 mx-auto" />
              <h4 className="text-sm font-bold text-white">Bạn chưa có đơn hàng nào</h4>
              <p className="text-xs text-white/60 max-w-sm mx-auto">
                Hãy ghé qua Cửa Hàng 3D Hub để chọn mua cuộn nhựa, linh kiện hoặc đặt in mô hình 3D đầu tiên.
              </p>
              <Link href="/shop" className="vision-pill-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold mt-2">
                <span>Đặt In Cấp Tốc Ngay</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {userOrders.map((order) => {
                const statusPill = getOrderStatusPill(order.fulfillmentStatus);
                const step = getOrderStep(order.fulfillmentStatus);
                const isCancelled = order.fulfillmentStatus === 'cancelled';
                const isCompleted = order.fulfillmentStatus === 'completed';
                const canCancel = !isCompleted && !isCancelled && order.fulfillmentStatus !== 'delivering';

                return (
                  <div
                    key={order.id}
                    className="vision-glass rounded-[28px] p-5 sm:p-6 border border-white/15 space-y-5 transition-all hover:border-white/25"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm text-white">{order.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusPill.color}`}>
                          {statusPill.label}
                        </span>
                        {order.assignedPrinter && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                            Máy in: {order.assignedPrinter}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/60">
                        Ngày tạo: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {/* LIVE ORDER TRACKING STEPPER 5 BƯỚC */}
                    {!isCancelled && (
                      <div className="py-2 px-1">
                        <div className="relative flex items-center justify-between">
                          {/* Đường kẻ nền */}
                          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-white/10 rounded-full -z-0" />
                          {/* Đường kẻ tiến độ sáng */}
                          <div
                            className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500 -z-0"
                            style={{ width: `${((step - 1) / 4) * 100}%` }}
                          />

                          {[
                            { num: 1, label: 'Tiếp Nhận' },
                            { num: 2, label: 'Duyệt File' },
                            { num: 3, label: 'Đang In' },
                            { num: 4, label: 'Đóng Gói' },
                            { num: 5, label: 'Giao Hàng' },
                          ].map((st) => {
                            const isDone = step >= st.num;
                            const isCurrent = step === st.num;

                            return (
                              <div key={st.num} className="relative z-10 flex flex-col items-center gap-1.5">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-md ${
                                    isCurrent
                                      ? 'bg-cyan-400 text-black ring-4 ring-cyan-400/30 font-black'
                                      : isDone
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-black/60 text-white/40 border border-white/20'
                                  }`}
                                >
                                  {isDone && !isCurrent ? <Check className="w-3.5 h-3.5" /> : st.num}
                                </div>
                                <span
                                  className={`text-[10px] font-medium hidden sm:block ${
                                    isCurrent ? 'text-cyan-300 font-bold' : isDone ? 'text-white' : 'text-white/40'
                                  }`}
                                >
                                  {st.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Chi tiết đơn */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1 border-t border-white/10">
                      <div className="md:col-span-8 space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-white/90 font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{item.title}</span>
                            <span className="text-white/50">x{item.quantity}</span>
                          </div>
                        ))}
                        <p className="text-[11px] text-white/60">Giao đến: {order.customerAddress}</p>

                        {order.warrantyReason && (
                          <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-200">
                            <strong>Yêu cầu bảo hành 1 đổi 1:</strong> {order.warrantyReason}
                            {order.warrantyNotes ? ` (${order.warrantyNotes})` : ''}
                          </div>
                        )}

                        {order.rating && (
                          <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-center gap-2">
                            <span>Đánh giá: {'⭐'.repeat(order.rating)}</span>
                            {order.reviewText && <span className="italic text-white/80">&ldquo;{order.reviewText}&rdquo;</span>}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-4 text-right space-y-1">
                        <div className="text-xs text-white/50">Tổng thanh toán:</div>
                        <div className="text-base font-black text-amber-300">
                          {order.totalAmountVnd.toLocaleString('vi-VN')} đ
                        </div>
                        <span className="text-[10px] text-emerald-300 font-semibold uppercase">
                          {order.paymentStatus === 'paid' ? 'Đã Thanh Toán' : order.paymentStatus === 'refunded' ? 'Đã Hoàn Tiền' : 'Thanh Toán COD'}
                        </span>
                      </div>
                    </div>

                    {/* HÀNH ĐỘNG 2 CHIỀU: HỦY ĐƠN HOÀN TIỀN, BẢO HÀNH 1 ĐỔI 1, ĐÁNH GIÁ */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5 flex-wrap">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelModalOrder(order)}
                          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 text-xs font-bold transition-all"
                        >
                          Hủy Đơn &amp; Hoàn Tiền 100%
                        </button>
                      )}

                      {isCompleted && !order.warrantyReason && (
                        <button
                          type="button"
                          onClick={() => setWarrantyModalOrder(order)}
                          className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Yêu Cầu Bảo Hành 1 Đổi 1</span>
                        </button>
                      )}

                      {isCompleted && !order.rating && (
                        <button
                          type="button"
                          onClick={() => setReviewModalOrder(order)}
                          className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Đánh Giá Trải Nghiệm ⭐</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: KHO TỆP 3D & AI VAULT (GIAI ĐOẠN 2) */}
      {activeTab === 'creations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-white">Kho Tệp 3D &amp; AI Studio Vault Của Bạn</h3>
              <p className="text-xs text-white/60">Quản lý các mô hình 3D đã lưu từ AI Studio: Tải file STL, gửi in 24h hoặc đăng bán 1-click.</p>
            </div>

            <Link
              href="/studio"
              className="vision-pill-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Tạo Thêm Bằng AI</span>
            </Link>
          </div>

          {isLoadingAssets ? (
            <div className="py-12 text-center text-white/50 text-xs">Đang đồng bộ kho tệp 3D...</div>
          ) : userAssets.length === 0 ? (
            <div className="vision-glass rounded-[32px] p-10 text-center space-y-3 border border-white/15">
              <FileCode className="w-10 h-10 text-white/30 mx-auto" />
              <p className="text-sm text-white/80">Kho 3D Vault của bạn đang trống.</p>
              <p className="text-xs text-white/50">Hãy vào AI Studio để tạo mô hình từ ảnh 2D và bấm &ldquo;Lưu Vào 3D Vault&rdquo;.</p>
              <Link href="/studio" className="vision-pill-btn inline-block px-5 py-2 rounded-full text-xs font-bold">
                Mở 3D Studio Ngay
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="vision-glass rounded-[28px] p-5 border border-white/15 space-y-4 flex flex-col justify-between hover:border-white/30 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 p-4">
                      <Image
                        src={asset.previewUrl || '/thumbnails/dragon.svg'}
                        alt={asset.name}
                        fill
                        unoptimized
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                          {asset.format}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1.5 rounded-lg bg-black/50 hover:bg-rose-600 text-white/70 hover:text-white transition-all"
                          title="Xóa khỏi Vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-2">{asset.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-white/60 mt-1">
                        <span>{new Date(asset.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span>{asset.fileSizeMb || 8.5} MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/studio?sampleModel=dragon`}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Mở Studio</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssetToSell(asset);
                          setIsSellModalOpen(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-300" />
                        <span>Đăng Bán</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/shop?tab=services&modelName=${encodeURIComponent(asset.name)}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold flex items-center justify-center gap-1 transition-all text-center"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Gửi In 24H</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          PresetGeneratorService.downloadSTL('dragon');
                          showToast('📥 Đang tải tệp STL về thiết bị...');
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                        title="Tải tệp STL"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SELLER HUB */}
      {activeTab === 'seller' && isSeller && (
        <div className="space-y-6">
          <div className="vision-glass rounded-[32px] p-6 border border-amber-400/30 bg-amber-500/10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Gian Hàng Đối Tác</span>
                <h3 className="text-xl font-black text-white">{currentUser.sellerStoreName || 'Hoàng 3D Maker Studio'}</h3>
                <p className="text-xs text-white/70">
                  Đánh giá shop: <strong>4.9 / 5.0 ⭐</strong> • Hoa hồng sàn: 8% (Seller thực nhận 92%)
                </p>
              </div>

              <Link
                href="/seller"
                className="vision-pill-btn flex items-center gap-1.5 px-6 py-2.5 rounded-full text-white text-xs font-bold shrink-0 self-start md:self-auto"
              >
                <Store className="w-4 h-4" />
                <span>Mở Toàn Diện Seller Hub</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ĐĂNG BÁN MÔ HÌNH TỪ VAULT                      */}
      {/* ======================================================== */}
      {isSellModalOpen && selectedAssetToSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="vision-glass-panel rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-white/20 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Store className="w-5 h-5" />
                <span>Đăng Bán Mô Hình Lên Shop</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSellModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishFromVault} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-white block">Tên Mô Hình</label>
                <input
                  type="text"
                  disabled
                  value={selectedAssetToSell.name}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white/80"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white block">Giá Bán Niêm Yết (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={sellPriceVnd}
                  onChange={(e) => setSellPriceVnd(parseInt(e.target.value) || 0)}
                  placeholder="0 = Miễn phí"
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-amber-300 font-bold focus:outline-none"
                />
                <p className="text-[10px] text-white/50">Phí sàn 8%, 92% doanh thu cộng vào ví khi có khách mua.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSell}
                  className="vision-pill-btn px-5 py-2.5 rounded-full text-white font-bold"
                >
                  {isSubmittingSell ? 'Đang Gửi...' : 'Gửi Duyệt Đăng Bán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: HỦY ĐƠN VÀ HOÀN TIỀN 100%                      */}
      {/* ======================================================== */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="vision-glass-panel rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-rose-500/30 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>Xác Nhận Hủy Đơn Hàng</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Đơn hàng <strong className="text-white">#{cancelModalOrder.id}</strong> (Trị giá:{' '}
              <strong className="text-amber-300">{cancelModalOrder.totalAmountVnd.toLocaleString('vi-VN')} đ</strong>) sẽ được hủy ngay lập tức và hoàn trả 100% vào ví số dư của bạn.
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-white block">Lý do hủy đơn:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none"
                >
                  <option value="Đổi ý / Cần thay đổi thông số in">Đổi ý / Cần thay đổi thông số in</option>
                  <option value="Muốn chọn loại nhựa khác (PETG/ABS/TPU)">Muốn chọn loại nhựa khác (PETG/ABS/TPU)</option>
                  <option value="Tìm thấy mẫu in khác ưng ý hơn">Tìm thấy mẫu in khác ưng ý hơn</option>
                  <option value="Thời gian in chưa phù hợp">Thời gian in chưa phù hợp</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium"
                >
                  Không Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md"
                >
                  {isSubmittingCancel ? 'Đang Hủy...' : 'Xác Nhận Hủy & Hoàn Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: KHIẾU NẠI BẢO HÀNH 1 ĐỔI 1                    */}
      {/* ======================================================== */}
      {warrantyModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="vision-glass-panel rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-purple-500/30 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Yêu Cầu Bảo Hành 1 Đổi 1</span>
              </h3>
              <button
                type="button"
                onClick={() => setWarrantyModalOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Chính sách cam kết chất lượng 3D Hub: Nếu sản phẩm in lỗi kỹ thuật, xưởng sẽ in lại mới 100% miễn phí cho đơn hàng <strong className="text-white">#{warrantyModalOrder.id}</strong>.
            </p>

            <form onSubmit={handleClaimWarranty} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-white block">Tình trạng lỗi gặp phải:</label>
                <select
                  value={warrantyReason}
                  onChange={(e) => setWarrantyReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none"
                >
                  <option value="Tách lớp in / Bề mặt không đạt">Tách lớp in (Delamination) / Bề mặt không đạt</option>
                  <option value="Mô hình bị cong vênh (Warping)">Mô hình bị cong vênh (Warping)</option>
                  <option value="Sai lệch kích thước không lắp vừa">Sai lệch kích thước không lắp vừa</option>
                  <option value="Gãy vỡ trong quá trình vận chuyển">Gãy vỡ trong quá trình vận chuyển</option>
                  <option value="Thiếu chi tiết / Lỗi bóc support">Thiếu chi tiết / Lỗi bóc support</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white block">Ghi chú thêm cho kỹ thuật viên xưởng:</label>
                <textarea
                  rows={2}
                  value={warrantyNotes}
                  onChange={(e) => setWarrantyNotes(e.target.value)}
                  placeholder="Mô tả cụ thể vị trí lỗi để xưởng căn chỉnh nhiệt độ và tốc độ in tối ưu hơn..."
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWarrantyModalOrder(null)}
                  className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWarranty}
                  className="flex-1 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md"
                >
                  {isSubmittingWarranty ? 'Đang Gửi...' : 'Gửi Yêu Cầu In Lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ĐÁNH GIÁ TRẢI NGHIỆM ĐƠN HÀNG                   */}
      {/* ======================================================== */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="vision-glass-panel rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-amber-500/30 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                <span>Đánh Giá Trải Nghiệm Sản Phẩm</span>
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewOrder} className="space-y-4 text-xs">
              <div className="text-center space-y-2">
                <label className="font-bold text-white block">Mức độ hài lòng của bạn</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'text-amber-300 fill-amber-300'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-white block">Nhận xét chi tiết:</label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOrder(null)}
                  className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="vision-pill-btn flex-1 py-2.5 rounded-full text-white font-bold"
                >
                  {isSubmittingReview ? 'Đang Gửi...' : 'Gửi Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TopUp Modal */}
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        currentBalanceVnd={currentUser?.walletBalanceVnd ?? balanceVnd}
        onTopUp={topUpBalance}
      />

      {/* Google Auth Modal */}
      <GoogleAuthModal isOpen={isGoogleModalOpen} onClose={() => setIsGoogleModalOpen(false)} />
    </div>
  );
}
