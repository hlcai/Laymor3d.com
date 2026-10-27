'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Store,
  DollarSign,
  Package,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Building2,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  CreditCard,
  FileCode,
  Tag,
  Layers,
  Sparkles,
  Info,
} from '@/components/icons/MinimalIcons';
import { useUserSession } from '@/hooks/useUserSession';
import { ModuleRouteGuard } from '@/components/common/ModuleRouteGuard';

interface ISellerProductItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  type?: string;
  priceVnd: number;
  stockCount?: number;
  salesCount?: number;
  thumbnailUrl?: string;
  status?: 'active' | 'pending_approval' | 'rejected';
  moderationFeedback?: string;
  createdAt?: string;
}

interface ISellerWithdrawalItem {
  id: string;
  amountVnd: number;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export default function SellerPage() {
  const { currentUser, switchRole, showToast } = useUserSession();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'withdrawals' | 'settings'>('products');
  const [products, setProducts] = useState<ISellerProductItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<ISellerWithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal rút tiền
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(500000);
  const [bankAccount, setBankAccount] = useState('0901234567');
  const [bankName, setBankName] = useState('MBBank (Ngân hàng Quân Đội)');
  const [accountHolder, setAccountHolder] = useState(currentUser?.name || 'HOÀNG 3D MAKER');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Modal tạo sản phẩm mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productType, setProductType] = useState<'filament' | 'accessory' | 'model'>('filament');
  const [formData, setFormData] = useState({
    name: '',
    brand: currentUser?.name || 'HLC Custom Maker',
    material: 'PLA',
    colorName: 'Xanh Ngọc Bích Pastel',
    colorHex: '#38bdf8',
    diameter: '1.75mm',
    weightKg: 1.0,
    priceVnd: 380000,
    stockCount: 20,
    subCategory: 'nozzle',
    category: 'Art & Figures',
    description: '',
    thumbnailUrl: '/thumbnails/spool-pla.svg',
    fileUrl: '',
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const isSeller =
    currentUser?.role === 'seller' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'mod';

  // Fetch dữ liệu sản phẩm & lệnh rút tiền
  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const [prodRes, wdrRes] = await Promise.all([
        fetch('/api/shop?action=get_seller_products'),
        fetch('/api/shop?action=get_withdrawals'),
      ]);

      const prodData = await prodRes.json();
      const wdrData = await wdrRes.json();

      if (prodData.success && prodData.products?.all) {
        setProducts(prodData.products.all);
      } else {
        // Fallback default
        setProducts([
          {
            id: 'sel-1',
            name: 'Bambu Lab PLA Silk Dual-Color (Cam Neon - Tím)',
            brand: currentUser?.name || 'Hoàng 3D Maker',
            category: 'Cuộn Nhựa In',
            priceVnd: 460000,
            stockCount: 18,
            salesCount: 32,
            thumbnailUrl: '/thumbnails/spool-pla.svg',
            status: 'active',
          },
          {
            id: 'sel-2',
            name: 'File 3D Khớp Cử Động - Rồng Ánh Kim Giáp (Bản Quyền STL)',
            brand: currentUser?.name || 'Hoàng 3D Maker',
            category: 'Mô Hình Bản Quyền',
            priceVnd: 95000,
            stockCount: 999,
            salesCount: 84,
            thumbnailUrl: '/thumbnails/dragon.svg',
            status: 'active',
          },
        ]);
      }

      if (wdrData.success && wdrData.withdrawals) {
        setWithdrawals(wdrData.withdrawals);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu seller:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSeller) {
      fetchSellerData();
    }
  }, [isSeller]);

  // Demo orders
  const sellerOrders = [
    {
      id: 'ORD-SEL-9912',
      customerName: 'Nguyễn Văn Long',
      items: 'File 3D Rồng Ánh Kim Giáp (x1)',
      totalVnd: 95000,
      commissionVnd: 7600, // 8% fee
      netVnd: 87400,
      date: 'Hôm nay, 10:14',
      status: 'completed',
    },
    {
      id: 'ORD-SEL-9874',
      customerName: 'Đặng Tuấn Anh',
      items: 'Cuộn PLA Silk Dual-Color (x2)',
      totalVnd: 920000,
      commissionVnd: 73600,
      netVnd: 846400,
      date: 'Hôm qua, 15:20',
      status: 'shipping',
    },
  ];

  // Xử lý gửi yêu cầu rút tiền
  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWithdraw(true);
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_withdrawal',
          amountVnd: withdrawAmount,
          bankName,
          bankAccount,
          accountHolder,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Không thể tạo lệnh rút tiền');
        return;
      }
      showToast('🎉 Đã gửi lệnh rút tiền thành công! Sàn sẽ duyệt và chuyển khoản trong 24h.');
      setIsWithdrawModalOpen(false);
      fetchSellerData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi mạng khi rút tiền');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Xử lý gửi đăng bán sản phẩm mới
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    try {
      let productData: any = {};
      if (productType === 'filament') {
        productData = {
          name: formData.name,
          brand: formData.brand,
          material: formData.material,
          colorName: formData.colorName,
          colorHex: formData.colorHex,
          diameter: formData.diameter,
          weightKg: Number(formData.weightKg),
          priceVnd: Number(formData.priceVnd),
          stockCount: Number(formData.stockCount),
          inStock: Number(formData.stockCount) > 0,
          thumbnailUrl: formData.thumbnailUrl || '/thumbnails/spool-pla.svg',
          description: formData.description || 'Cuộn nhựa in 3D chất lượng cao, cuộn đều không rối.',
          printTempC: '200-220°C',
          bedTempC: '50-60°C',
        };
      } else if (productType === 'accessory') {
        productData = {
          name: formData.name,
          brand: formData.brand,
          subCategory: formData.subCategory,
          compatibleWith: ['Bambu Lab X1/P1P', 'Creality Ender 3', 'K1 Max'],
          priceVnd: Number(formData.priceVnd),
          stockCount: Number(formData.stockCount),
          inStock: Number(formData.stockCount) > 0,
          thumbnailUrl: formData.thumbnailUrl || '/thumbnails/spool-pla.svg',
          description: formData.description || 'Linh kiện thay thế và nâng cấp máy in 3D chuẩn xác.',
        };
      } else {
        productData = {
          title: formData.name,
          name: formData.name,
          category: formData.category,
          priceVnd: Number(formData.priceVnd),
          isFree: Number(formData.priceVnd) === 0,
          thumbnailUrl: formData.thumbnailUrl || '/thumbnails/dragon.svg',
          fileUrl: formData.fileUrl || '/models/sample.stl',
          formats: ['.STL', '.OBJ', '.3MF'],
          description: formData.description || 'Mô hình 3D tối ưu cho máy in FDM/Resin, không lỗi mặt.',
        };
      }

      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_seller_product',
          productType,
          productData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Lỗi khi đăng bán sản phẩm');
        return;
      }

      showToast('🎉 ' + data.message);
      setIsCreateModalOpen(false);
      // Reset form
      setFormData({
        name: '',
        brand: currentUser?.name || 'HLC Custom Maker',
        material: 'PLA',
        colorName: 'Xanh Ngọc Bích Pastel',
        colorHex: '#38bdf8',
        diameter: '1.75mm',
        weightKg: 1.0,
        priceVnd: 380000,
        stockCount: 20,
        subCategory: 'nozzle',
        category: 'Art & Figures',
        description: '',
        thumbnailUrl: '/thumbnails/spool-pla.svg',
        fileUrl: '',
      });
      fetchSellerData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  if (!isSeller) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full vision-glass-panel rounded-[36px] p-8 text-center space-y-5 shadow-2xl border border-white/20">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 mx-auto flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Đăng Ký Gian Hàng Seller</h2>
            <p className="text-xs text-white/70 mt-2 leading-relaxed">
              Tài khoản hiện tại của bạn là <strong className="text-white">{currentUser?.role?.toUpperCase()}</strong>. Quyền truy cập Kênh Gian Hàng dành cho người bán đã xác thực, Quản trị viên và Điều phối viên (Mod).
            </p>
          </div>

          {currentUser?.role === 'admin' ? (
            <button
              type="button"
              onClick={() => {
                switchRole('seller');
                showToast('🎉 Đã chuyển sang vai trò Seller! Chào mừng bạn đến với Seller Hub.');
              }}
              className="vision-pill-btn w-full py-3 rounded-full text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Kích Hoạt Quyền Seller Test (Chỉ Dành Cho Admin)
            </button>
          ) : (
            <Link
              href="/shop"
              className="vision-pill-btn block w-full py-3 rounded-full text-white text-xs font-bold transition-all text-center shadow-md"
            >
              Quay Lại Cửa Hàng &amp; Mua Sắm
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <ModuleRouteGuard moduleKey="seller_hub" moduleName="Kênh Gian Hàng Seller">
      <div className="space-y-8 max-w-7xl mx-auto text-white">
      {/* Top Banner Header */}
      <div className="vision-glass-panel rounded-[36px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/20 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-lg">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Trung Tâm Quản Lý Gian Hàng Seller
              </h1>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                SELLER VERIFIED
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1">
              Đăng bán cuộn nhựa, linh kiện và file 3D bản quyền. Mô hình ký quỹ Escrow bảo vệ người bán: sàn thu 8% hoa hồng, 92% về ví tự động.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Yêu Cầu Rút Tiền</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="vision-pill-btn flex items-center gap-1.5 px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Đăng Bán Mặt Hàng Mới</span>
          </button>

          <Link
            href="/shop"
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem Shop</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Available Balance */}
        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 backdrop-blur-2xl border border-white/15">
          <div className="flex items-center justify-between text-white/70">
            <span className="text-xs font-semibold">Doanh Thu Khả Dụng Rút</span>
            <DollarSign className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300">
            {(currentUser?.walletBalanceVnd ?? 1850000).toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-200/80 font-medium">
            Có thể rút về tài khoản ngân hàng ngay
          </div>
        </div>

        {/* Metric 2: Escrow Pending Balance */}
        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 backdrop-blur-2xl border border-amber-400/20 bg-amber-500/10">
          <div className="flex items-center justify-between text-amber-200">
            <span className="text-xs font-semibold">Đang Ký Quỹ Tạm Giữ</span>
            <Clock className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300">
            {(currentUser?.sellerPendingBalanceVnd || 420000).toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-amber-200/80 font-medium">
            Ký quỹ đơn hàng (92% giá trị đơn)
          </div>
        </div>

        {/* Metric 3: Total Sales */}
        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 backdrop-blur-2xl border border-white/15">
          <div className="flex items-center justify-between text-white/70">
            <span className="text-xs font-semibold">Sản Phẩm Đang Quản Lý</span>
            <Package className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {products.length} mặt hàng
          </div>
          <div className="text-[11px] text-white/60">
            {products.filter(p => p.status === 'active').length} đang bán công khai
          </div>
        </div>

        {/* Metric 4: Store Rating */}
        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 backdrop-blur-2xl border border-white/15">
          <div className="flex items-center justify-between text-white/70">
            <span className="text-xs font-semibold">Đánh Giá Gian Hàng</span>
            <ShieldCheck className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300">
            4.9 / 5.0 ⭐
          </div>
          <div className="text-[11px] text-white/60">
            Hoa hồng sàn ưu đãi chỉ 8%
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="vision-glass p-1.5 rounded-full flex items-center gap-2 overflow-x-auto backdrop-blur-2xl border border-white/15">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'products' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Sản Phẩm Của Shop ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'orders' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Đơn Hàng Từ Khách Hàng ({sellerOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'withdrawals' ? 'bg-white/28 text-white shadow-xs' : 'text-white/60 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Lịch Sử Rút Tiền ({withdrawals.length})</span>
        </button>
      </div>

      {/* TAB 1: SELLER PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-white">Danh Sách Mặt Hàng Của Shop</h3>
              <p className="text-xs text-white/60">Mọi sản phẩm đăng mới sẽ qua khâu duyệt của Mod/Admin trước khi xuất hiện trên Shop chung.</p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="vision-pill-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Đăng Bán Mặt Hàng Mới</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-white/60 text-xs">Đang đồng bộ dữ liệu gian hàng...</div>
          ) : products.length === 0 ? (
            <div className="vision-glass rounded-[28px] p-8 text-center space-y-3 border border-white/15">
              <Package className="w-10 h-10 text-white/30 mx-auto" />
              <p className="text-sm text-white/70">Gian hàng của bạn chưa có sản phẩm nào.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="vision-pill-btn px-5 py-2 rounded-full text-xs font-bold"
              >
                Đăng Bán Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => {
                const isPending = p.status === 'pending_approval';
                const isRejected = p.status === 'rejected';

                return (
                  <div
                    key={p.id}
                    className="vision-glass rounded-[28px] p-5 border border-white/15 space-y-4 flex flex-col justify-between hover:border-white/30 transition-all relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 p-3">
                        <Image
                          src={p.thumbnailUrl || '/thumbnails/spool-pla.svg'}
                          alt={p.name}
                          fill
                          unoptimized
                          className="object-contain p-2"
                        />
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/90 text-white shadow-md flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Đang Chờ Duyệt
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/90 text-white shadow-md flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Bị Từ Chối
                            </span>
                          )}
                          {!isPending && !isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/90 text-white shadow-md flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Đang Bán
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight leading-snug line-clamp-2">
                          {p.name}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-white/60 mt-2">
                          <span>Đã bán: <strong className="text-white">{p.salesCount || 0}</strong></span>
                          <span>Tồn kho: <strong className="text-emerald-300">{p.stockCount ?? 'Vô hạn'}</strong></span>
                        </div>

                        {p.moderationFeedback && (
                          <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-200">
                            <strong>Phản hồi kiểm duyệt:</strong> {p.moderationFeedback}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="text-base font-black text-amber-300">
                        {p.priceVnd > 0 ? `${p.priceVnd.toLocaleString('vi-VN')} đ` : 'Miễn Phí'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/shop?id=${p.id}`}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-all"
                          title="Xem thử trên Shop"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SELLER ORDERS */}
      {activeTab === 'orders' && (
        <div className="vision-glass rounded-[32px] p-6 border border-white/15 space-y-4">
          <h3 className="text-sm font-bold text-white">Đơn Hàng Gần Đây Của Shop</h3>

          <div className="divide-y divide-white/10 text-xs">
            {sellerOrders.map((o) => (
              <div key={o.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{o.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        o.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      }`}
                    >
                      {o.status === 'completed' ? 'Hoàn Tất' : 'Đang Giao Hàng'}
                    </span>
                  </div>
                  <div className="text-white/70">
                    Khách hàng: <strong>{o.customerName}</strong> • {o.items}
                  </div>
                  <div className="text-[11px] text-white/50">{o.date}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-amber-300">
                    +{o.netVnd.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[10px] text-white/50">
                    Tổng: {o.totalVnd.toLocaleString('vi-VN')} đ (Đã trừ phí sàn 8%: {o.commissionVnd.toLocaleString('vi-VN')} đ)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWALS & PAYOUTS */}
      {activeTab === 'withdrawals' && (
        <div className="vision-glass rounded-[32px] p-6 border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Lịch Sử Quyết Toán Về Tài Khoản Ngân Hàng</h3>
              <p className="text-xs text-white/60">Tất cả các lệnh yêu cầu rút doanh thu khả dụng về ngân hàng cá nhân.</p>
            </div>
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="vision-pill-btn px-4 py-2 rounded-full text-white text-xs font-bold"
            >
              + Tạo Lệnh Rút Mới
            </button>
          </div>

          <div className="divide-y divide-white/10 text-xs">
            {withdrawals.length === 0 ? (
              <div className="py-8 text-center text-white/60">Chưa có lệnh rút tiền nào được tạo.</div>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-white">
                      {w.bankName} • STK: <span className="font-mono text-cyan-300">{w.bankAccount}</span> ({w.accountHolder})
                    </div>
                    <div className="text-[11px] text-white/50">
                      Mã lệnh: <strong className="text-white">{w.id}</strong> • {new Date(w.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-emerald-300 text-sm">
                      {w.amountVnd.toLocaleString('vi-VN')} đ
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : w.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {w.status === 'completed'
                        ? 'Đã Giải Ngân'
                        : w.status === 'rejected'
                        ? 'Bị Từ Chối'
                        : 'Chờ Xử Lý'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ĐĂNG BÁN SẢN PHẨM MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="vision-glass-panel rounded-[36px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white/20 text-white space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-base">
                <Plus className="w-5 h-5" />
                <span>Đăng Bán Mặt Hàng Mới</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => setProductType('filament')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  productType === 'filament' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-white/60'
                }`}
              >
                Cuộn Nhựa In
              </button>
              <button
                type="button"
                onClick={() => setProductType('accessory')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  productType === 'accessory' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-white/60'
                }`}
              >
                Linh Kiện Máy In
              </button>
              <button
                type="button"
                onClick={() => setProductType('model')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  productType === 'model' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-white/60'
                }`}
              >
                File 3D Bản Quyền
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white block">Tên Mặt Hàng</label>
                <input
                  type="text"
                  required
                  placeholder={
                    productType === 'filament'
                      ? 'VD: PLA Silk Dual-Color Xanh Dương - Tím'
                      : productType === 'accessory'
                      ? 'VD: Đầu Đùn Cường Lực Hardened Steel 0.4mm'
                      : 'VD: File STL Rồng Khớp Cử Động Ánh Kim'
                  }
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {productType === 'filament' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Loại Nhựa</label>
                    <select
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                    >
                      <option value="PLA">PLA / PLA+</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS / ASA</option>
                      <option value="TPU">TPU Dẻo</option>
                      <option value="PA-CF">Carbon Fiber (PA-CF)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Màu Sắc</label>
                    <input
                      type="text"
                      value={formData.colorName}
                      onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {productType === 'accessory' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white block">Phân Loại Linh Kiện</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                  >
                    <option value="nozzle">Đầu đùn (Nozzle)</option>
                    <option value="hotend">Cụm Hotend</option>
                    <option value="bed">Bàn in nhiệt (PEI Plate)</option>
                    <option value="extruder">Bộ đùn Extruder</option>
                    <option value="board">Bo mạch &amp; Cảm biến</option>
                  </select>
                </div>
              )}

              {productType === 'model' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Thể Loại</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                    >
                      <option value="Art & Figures">Mô Hình Nghệ Thuật &amp; Nhân Vật</option>
                      <option value="Gadgets & Tools">Công Cụ &amp; Tiện Ích</option>
                      <option value="Robotics & RC">Robot &amp; Cơ Khí</option>
                      <option value="Home & Living">Đồ Gia Dụng Thông Minh</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Đường Dẫn Tệp 3D (.stl / .glb)</label>
                    <input
                      type="text"
                      placeholder="https://... hoặc /models/file.stl"
                      value={formData.fileUrl}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white block">Giá Bán (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={formData.priceVnd}
                    onChange={(e) => setFormData({ ...formData, priceVnd: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-amber-300 font-bold focus:outline-none"
                  />
                </div>

                {productType !== 'model' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Số Lượng Tồn Kho</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.stockCount}
                      onChange={(e) => setFormData({ ...formData, stockCount: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Tồn Kho Kỹ Thuật Số</label>
                    <div className="px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-xs text-emerald-300 font-bold">
                      Không giới hạn (File Digital)
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white block">Mô Tả Sản Phẩm</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Thông tin chi tiết về sản phẩm, chất lượng, cách in tối ưu..."
                  className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] text-cyan-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                <span>
                  Sản phẩm sau khi bấm gửi sẽ ở trạng thái <strong>Chờ Duyệt</strong>. Admin và Mod sẽ kiểm duyệt nội dung và kích hoạt ra Marketplace trong vòng 2-4 giờ.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="vision-pill-btn px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-md"
                >
                  {isSubmittingProduct ? 'Đang Gửi...' : 'Gửi Kiểm Duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: YÊU CẦU RÚT TIỀN */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="vision-glass-panel rounded-[36px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20 text-white space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-base">
                <DollarSign className="w-5 h-5" />
                <span>Yêu Cầu Rút Doanh Thu</span>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white block">Số Tiền Muốn Rút (VNĐ)</label>
                <input
                  type="number"
                  required
                  min="50000"
                  step="50000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-amber-300 font-bold focus:outline-none"
                />
                <div className="text-[10px] text-white/50 flex justify-between">
                  <span>Tối thiểu: 50.000 đ</span>
                  <span>Khả dụng: {(currentUser?.walletBalanceVnd ?? 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white block">Ngân Hàng Thụ Hưởng</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white block">Số Tài Khoản Ngân Hàng</label>
                <input
                  type="text"
                  required
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white block">Tên Chủ Tài Khoản</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white uppercase font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw}
                  className="vision-pill-btn px-6 py-2 rounded-full text-white text-xs font-bold shadow-md"
                >
                  {isSubmittingWithdraw ? 'Đang Xử Lý...' : 'Xác Nhận Rút Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </ModuleRouteGuard>
);
}
