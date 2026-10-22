'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Palette,
  Layers,
  Tag,
  Sliders,
  X,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  Flame,
  Zap,
  Thermometer,
  Gauge,
  PlusCircle,
  MinusCircle,
  Eye,
  Clock,
  Check,
  FileCode,
} from '@/components/icons/MinimalIcons';
import { useShopManagement } from '@/hooks/useShopManagement';
import { IFilamentItem, IAccessoryItem, FilamentMaterial, AccessorySubCategory } from '@/backend/domain/shop';

const FILAMENT_MATERIALS: FilamentMaterial[] = [
  'PLA',
  'PLA-CF',
  'PETG',
  'PETG-CF',
  'ABS',
  'ASA',
  'TPU',
  'Resin',
];

const ACCESSORY_CATEGORIES: { id: AccessorySubCategory; label: string }[] = [
  { id: 'nozzle', label: 'Đầu Phun (Nozzle)' },
  { id: 'build_plate', label: 'Bàn In (Build Plate PEI)' },
  { id: 'hotend', label: 'Cụm Hotend Hoàn Chỉnh' },
  { id: 'extruder', label: 'Bộ Đùn Nhựa (Extruder)' },
  { id: 'dryer', label: 'Hộp Sấy Nhựa (Dryer Box)' },
  { id: 'maintenance', label: 'Bảo Dưỡng & Mỡ Bôi Trơn' },
  { id: 'tools', label: 'Dụng Cụ Cắt Tỉa & Tháo Lắp' },
];

const SAMPLE_THUMBNAILS = [
  { label: 'Cuộn PLA Trắng', url: '/thumbnails/spool-pla.svg' },
  { label: 'Cuộn Sợi Carbon CF', url: '/thumbnails/spool-cf.svg' },
  { label: 'Cuộn PLA+ Bền', url: '/thumbnails/spool-pla-plus.svg' },
  { label: 'Cuộn TPU Dẻo', url: '/thumbnails/spool-tpu.svg' },
  { label: 'Cuộn ASA Chịu Nắng', url: '/thumbnails/spool-asa.svg' },
  { label: 'Chai Nhựa Resin 8K', url: '/thumbnails/bottle-resin.svg' },
  { label: 'Phụ Kiện Bambu Lab', url: '/thumbnails/bambu-acc.svg' },
  { label: 'Cụm Đầu In Voron', url: '/thumbnails/voron-toolhead.svg' },
];

export function AdminProductsManager() {
  const {
    filaments,
    accessories,
    stats,
    isLoading,
    isProcessing,
    toastMessage,
    showToast,
    refreshInventory,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  } = useShopManagement();

  // Tab chính: Kho Chính Hãng vs Hàng Đợi Kiểm Duyệt Seller
  const [activeMainTab, setActiveMainTab] = useState<'inventory' | 'moderation'>('inventory');
  const [pendingItems, setPendingItems] = useState<{
    filaments: any[];
    accessories: any[];
    models: any[];
    totalCount: number;
  }>({ filaments: [], accessories: [], models: [], totalCount: 0 });
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [rejectModalItem, setRejectModalItem] = useState<{ id: string; name: string; type: 'filament' | 'accessory' | 'model' } | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('Nội dung hình ảnh hoặc thông tin kỹ thuật chưa đạt tiêu chuẩn sàn.');

  const fetchPendingModeration = async () => {
    try {
      setIsLoadingPending(true);
      const [modRes, wdrRes] = await Promise.all([
        fetch('/api/shop?action=get_pending_moderation'),
        fetch('/api/shop?action=get_withdrawals'),
      ]);
      const modData = await modRes.json();
      const wdrData = await wdrRes.json();
      if (modData.success && modData.pending) {
        setPendingItems(modData.pending);
      }
      if (wdrData.success && wdrData.withdrawals) {
        setPendingWithdrawals(wdrData.withdrawals);
      }
    } catch (err) {
      console.error('Lỗi tải hàng đợi kiểm duyệt:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  React.useEffect(() => {
    fetchPendingModeration();
  }, []);

  const handleModerate = async (
    id: string,
    type: 'filament' | 'accessory' | 'model',
    decision: 'approve' | 'reject',
    feedback?: string
  ) => {
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderate_product',
          id,
          productType: type,
          decision,
          feedback,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(decision === 'approve' ? '🎉 ' + data.message : '⚠️ ' + data.message);
        fetchPendingModeration();
        refreshInventory();
      } else {
        showToast(data.error || 'Lỗi thao tác kiểm duyệt');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối máy chủ');
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_withdrawal',
          withdrawalId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🎉 Đã xác nhận chuyển khoản và hoàn tất lệnh rút tiền!');
        fetchPendingModeration();
      } else {
        showToast(data.error || 'Lỗi duyệt lệnh rút tiền');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối máy chủ');
    }
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'filament' | 'accessory'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItemType, setEditingItemType] = useState<'filament' | 'accessory'>('filament');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<'filament' | 'accessory'>('filament');
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('Bambu Lab');
  const [formMaterial, setFormMaterial] = useState<FilamentMaterial>('PLA');
  const [formColorName, setFormColorName] = useState('Trắng Sữa');
  const [formColorHex, setFormColorHex] = useState('#ffffff');
  const [formWeightKg, setFormWeightKg] = useState(1.0);
  const [formSubCategory, setFormSubCategory] = useState<AccessorySubCategory>('nozzle');
  const [formCompatibility, setFormCompatibility] = useState('Bambu Lab X1/P1/A1, Creality K1, Voron 2.4');
  const [formPriceVnd, setFormPriceVnd] = useState(380000);
  const [formOriginalPriceVnd, setFormOriginalPriceVnd] = useState(420000);
  const [formStockCount, setFormStockCount] = useState(20);
  const [formInStock, setFormInStock] = useState(true);
  const [formNozzleTemp, setFormNozzleTemp] = useState('190°C - 230°C');
  const [formBedTemp, setFormBedTemp] = useState('45°C - 60°C');
  const [formPrintSpeed, setFormPrintSpeed] = useState('50 - 300 mm/s');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('/thumbnails/spool-pla.svg');
  const [formBadge, setFormBadge] = useState<string>('Bán chạy');
  const [formDescription, setFormDescription] = useState('');
  const [formHighlights, setFormHighlights] = useState('Chính hãng 100%, Bề mặt láng mịn, Ít kéo sợi');

  // Delete Confirmation Modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; name: string; type: 'filament' | 'accessory' } | null>(null);

  // List of all unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    filaments.forEach((f) => set.add(f.brand));
    accessories.forEach((a) => set.add(a.brand));
    return Array.from(set);
  }, [filaments, accessories]);

  // Combined and filtered items
  const filteredItems = useMemo(() => {
    let items: Array<({ itemType: 'filament' } & IFilamentItem) | ({ itemType: 'accessory' } & IAccessoryItem)> = [];

    if (productTypeFilter === 'all' || productTypeFilter === 'filament') {
      items.push(...filaments.map((f) => ({ ...f, itemType: 'filament' as const })));
    }
    if (productTypeFilter === 'all' || productTypeFilter === 'accessory') {
      items.push(...accessories.map((a) => ({ ...a, itemType: 'accessory' as const })));
    }

    // Filter by Brand
    if (selectedBrandFilter !== 'all') {
      items = items.filter((item) => item.brand.toLowerCase() === selectedBrandFilter.toLowerCase());
    }

    // Filter by Stock Status
    if (stockStatusFilter === 'in_stock') {
      items = items.filter((item) => item.inStock && item.stockCount > 5);
    } else if (stockStatusFilter === 'low_stock') {
      items = items.filter((item) => item.stockCount > 0 && item.stockCount <= 5);
    } else if (stockStatusFilter === 'out_of_stock') {
      items = items.filter((item) => !item.inStock || item.stockCount === 0);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          (item.itemType === 'filament' && (item as IFilamentItem).material.toLowerCase().includes(q)) ||
          (item.itemType === 'filament' && (item as IFilamentItem).colorName.toLowerCase().includes(q)) ||
          (item.itemType === 'accessory' && (item as IAccessoryItem).subCategory.toLowerCase().includes(q))
      );
    }

    return items;
  }, [filaments, accessories, productTypeFilter, selectedBrandFilter, stockStatusFilter, searchQuery]);

  // Handlers for modal
  const handleOpenCreateModal = (type: 'filament' | 'accessory') => {
    setModalMode('create');
    setFormType(type);
    setEditingItemId(null);
    setFormName('');
    setFormBrand('Bambu Lab');
    setFormPriceVnd(380000);
    setFormOriginalPriceVnd(320000);
    setFormStockCount(20);
    setFormInStock(true);
    setFormBadge('Bán chạy');
    setFormDescription('');
    setFormHighlights('Chính hãng 100%, Hoàn thiện cao cấp');

    if (type === 'filament') {
      setFormMaterial('PLA');
      setFormColorName('Trắng Sữa');
      setFormColorHex('#ffffff');
      setFormWeightKg(1.0);
      setFormNozzleTemp('190°C - 230°C');
      setFormBedTemp('45°C - 60°C');
      setFormPrintSpeed('50 - 300 mm/s');
      setFormThumbnailUrl('/thumbnails/spool-pla.svg');
    } else {
      setFormSubCategory('nozzle');
      setFormCompatibility('Bambu Lab X1/P1/A1, Creality K1, Voron 2.4');
      setFormThumbnailUrl('/thumbnails/bambu-acc.svg');
    }

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ({ itemType: 'filament' } & IFilamentItem) | ({ itemType: 'accessory' } & IAccessoryItem)) => {
    setModalMode('edit');
    setEditingItemType(item.itemType);
    setEditingItemId(item.id);
    setFormType(item.itemType);
    setFormName(item.name);
    setFormBrand(item.brand);
    setFormPriceVnd(item.priceVnd);
    setFormOriginalPriceVnd(item.originalPriceVnd || Math.round(item.priceVnd * 0.85));
    setFormStockCount(item.stockCount);
    setFormInStock(item.inStock);
    setFormBadge(item.badge || '');
    setFormDescription(item.description || '');
    setFormThumbnailUrl(item.thumbnailUrl);

    if (item.itemType === 'filament') {
      const fil = item as IFilamentItem;
      setFormMaterial(fil.material);
      setFormColorName(fil.colorName);
      setFormColorHex(fil.colorHex);
      setFormWeightKg(fil.weightKg);
      setFormNozzleTemp(fil.nozzleTempRange);
      setFormBedTemp(fil.bedTempRange);
      setFormPrintSpeed(fil.printSpeedRange);
      setFormHighlights(fil.highlights ? fil.highlights.join(', ') : '');
    } else {
      const acc = item as IAccessoryItem;
      setFormSubCategory(acc.subCategory);
      setFormCompatibility(acc.compatibility ? acc.compatibility.join(', ') : '');
    }

    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('Vui lòng điền tên sản phẩm!');
      return;
    }

    if (formType === 'filament') {
      const highlightsArray = formHighlights
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const filamentPayload = {
        name: formName.trim(),
        brand: formBrand.trim(),
        material: formMaterial,
        colorName: formColorName.trim(),
        colorHex: formColorHex.trim(),
        weightKg: Number(formWeightKg) || 1.0,
        priceVnd: Number(formPriceVnd) || 0,
        originalPriceVnd: Number(formOriginalPriceVnd) || undefined,
        inStock: formInStock,
        stockCount: Number(formStockCount) || 0,
        nozzleTempRange: formNozzleTemp.trim(),
        bedTempRange: formBedTemp.trim(),
        printSpeedRange: formPrintSpeed.trim(),
        description: formDescription.trim(),
        highlights: highlightsArray,
        thumbnailUrl: formThumbnailUrl.trim() || '/thumbnails/spool-pla.svg',
        badge: formBadge ? (formBadge as any) : undefined,
      };

      if (modalMode === 'create') {
        const ok = await createProduct('filament', filamentPayload);
        if (ok) setIsModalOpen(false);
      } else if (editingItemId) {
        const ok = await updateProduct(editingItemId, 'filament', filamentPayload);
        if (ok) setIsModalOpen(false);
      }
    } else {
      const compatibilityArray = formCompatibility
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const accessoryPayload = {
        name: formName.trim(),
        brand: formBrand.trim(),
        subCategory: formSubCategory,
        compatibility: compatibilityArray,
        priceVnd: Number(formPriceVnd) || 0,
        originalPriceVnd: Number(formOriginalPriceVnd) || undefined,
        inStock: formInStock,
        stockCount: Number(formStockCount) || 0,
        description: formDescription.trim(),
        thumbnailUrl: formThumbnailUrl.trim() || '/thumbnails/bambu-acc.svg',
        badge: formBadge ? (formBadge as any) : undefined,
        specs: {},
      };

      if (modalMode === 'create') {
        const ok = await createProduct('accessory', accessoryPayload);
        if (ok) setIsModalOpen(false);
      } else if (editingItemId) {
        const ok = await updateProduct(editingItemId, 'accessory', accessoryPayload);
        if (ok) setIsModalOpen(false);
      }
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    const ok = await deleteProduct(deleteConfirmItem.id, deleteConfirmItem.type);
    if (ok) {
      setDeleteConfirmItem(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-white font-semibold text-xs shadow-xl animate-slideUp flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Fast Actions */}
      <div className="vision-glass rounded-[32px] p-6 border border-slate-200/80 bg-white/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 shrink-0 shadow-2xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Quản Lý Kho Hàng &amp; Sản Phẩm
              </h2>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                ADMIN &amp; MOD
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Thêm mới, điều chỉnh số lượng tồn kho tức thì, cập nhật giá niêm yết, giá vốn gốc và thông số kỹ thuật cuộn nhựa &amp; linh kiện máy in.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => refreshInventory()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới kho</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal('filament')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      {/* Tab Chuyển Đổi: Kho Hàng vs Hàng Đợi Kiểm Duyệt Seller */}
      <div className="vision-glass p-1.5 rounded-full flex items-center gap-2 overflow-x-auto border border-slate-200/80 bg-white/80 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveMainTab('inventory')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeMainTab === 'inventory' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Kho Hàng Chính Hãng ({stats.totalSKU})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMainTab('moderation');
            fetchPendingModeration();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 relative cursor-pointer ${
            activeMainTab === 'moderation' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-200" />
          <span>Hàng Đợi Kiểm Duyệt Seller</span>
          {(pendingItems.totalCount > 0 || pendingWithdrawals.filter((w) => w.status === 'pending').length > 0) && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingItems.totalCount + pendingWithdrawals.filter((w) => w.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* NỘI DUNG THEO TAB CHÍNH */}
      {activeMainTab === 'inventory' ? (
        <>
          {/* KPI Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Total SKU */}
            <div className="vision-glass rounded-[24px] p-4 space-y-1.5 border border-slate-200 bg-white/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">Tổng SKU (Mẫu Hàng)</span>
                <Package className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {stats.totalSKU}
              </div>
              <div className="text-[10px] text-slate-500">
                {stats.totalFilaments} cuộn nhựa • {stats.totalAccessories} linh kiện
              </div>
            </div>

            {/* KPI 2: Total Units in Stock */}
            <div className="vision-glass rounded-[24px] p-4 space-y-1.5 border border-slate-200 bg-white/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">Tổng Số Lượng Tồn</span>
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                {stats.totalStockUnits} <span className="text-xs font-normal text-slate-500">món</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                Sẵn sàng xuất kho &amp; giao 24h
              </div>
            </div>

            {/* KPI 3: Low Stock Alert (<= 5) */}
            <div className="vision-glass rounded-[24px] p-4 space-y-1.5 border border-amber-200 bg-amber-50/60 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[11px] font-bold">Cảnh Báo Sắp Hết (≤5)</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-900">
                {stats.lowStockCount} <span className="text-xs font-normal text-amber-800">SKU</span>
              </div>
              <div className="text-[10px] text-amber-700 font-bold">
                Cần nhập thêm hàng sớm
              </div>
            </div>

            {/* KPI 4: Out of Stock */}
            <div className="vision-glass rounded-[24px] p-4 space-y-1.5 border border-rose-200 bg-rose-50/60 shadow-2xs">
              <div className="flex items-center justify-between text-rose-800">
                <span className="text-[11px] font-bold">Đã Hết Hàng (0)</span>
                <X className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-900">
                {stats.outOfStockCount} <span className="text-xs font-normal text-rose-800">SKU</span>
              </div>
              <div className="text-[10px] text-rose-700 font-bold">
                Tạm ngưng nhận đơn
              </div>
            </div>

            {/* KPI 5: Inventory Asset Valuation */}
            <div className="vision-glass rounded-[24px] p-4 space-y-1.5 border border-cyan-200 bg-cyan-50/60 col-span-2 sm:col-span-1 shadow-2xs">
              <div className="flex items-center justify-between text-cyan-800">
                <span className="text-[11px] font-bold">Giá Trị Kho Hàng</span>
                <DollarSign className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-lg sm:text-xl font-black text-cyan-900 truncate">
                {stats.totalInventoryValueVnd.toLocaleString('vi-VN')} đ
              </div>
              <div className="text-[10px] text-cyan-700 font-medium">
                Tính theo giá vốn gốc
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="vision-glass rounded-[28px] p-4 border border-slate-200/80 bg-white/90 shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên sản phẩm, hãng, vật liệu PLA/PETG/ABS, màu sắc..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Brand Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-bold whitespace-nowrap">Hãng:</span>
                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white cursor-pointer font-medium"
                >
                  <option value="all">Tất cả hãng ({brands.length})</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Segmented Controls (Product Category & Stock Status) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-200">
              {/* Category Pill Switcher */}
              <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200">
                <button
                  onClick={() => setProductTypeFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    productTypeFilter === 'all'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất Cả ({stats.totalSKU})
                </button>
                <button
                  onClick={() => setProductTypeFilter('filament')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    productTypeFilter === 'filament'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cuộn Nhựa ({stats.totalFilaments})
                </button>
                <button
                  onClick={() => setProductTypeFilter('accessory')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    productTypeFilter === 'accessory'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Phụ Kiện Máy In ({stats.totalAccessories})
                </button>
              </div>

              {/* Stock Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setStockStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                    stockStatusFilter === 'all'
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Toàn Bộ Tồn Kho
                </button>
                <button
                  onClick={() => setStockStatusFilter('in_stock')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                    stockStatusFilter === 'in_stock'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Còn Dồi Dào (&gt;5)
                </button>
                <button
                  onClick={() => setStockStatusFilter('low_stock')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                    stockStatusFilter === 'low_stock'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Sắp Hết (≤5)
                </button>
                <button
                  onClick={() => setStockStatusFilter('out_of_stock')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                    stockStatusFilter === 'out_of_stock'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Đã Hết Hàng
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid / Cards */}
          {filteredItems.length === 0 ? (
            <div className="vision-glass rounded-[32px] p-12 text-center space-y-3 border border-slate-200/80 bg-white/90 shadow-sm">
              <Package className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Không tìm thấy sản phẩm phù hợp</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Thử thay đổi bộ lọc tìm kiếm hoặc nhấn nút &ldquo;+ Thêm Sản Phẩm Mới&rdquo; để bổ sung vào kho hàng.
              </p>
              <button
                onClick={() => handleOpenCreateModal('filament')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold mt-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sản Phẩm Ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const isFilament = item.itemType === 'filament';
                const fil = isFilament ? (item as IFilamentItem) : null;
                const acc = !isFilament ? (item as IAccessoryItem) : null;

                const isLowStock = item.stockCount > 0 && item.stockCount <= 5;
                const isOut = !item.inStock || item.stockCount === 0;

                const profitMargin = item.originalPriceVnd
                  ? Math.round(((item.priceVnd - item.originalPriceVnd) / item.originalPriceVnd) * 100)
                  : null;

                return (
                  <div
                    key={item.id}
                    className={`vision-glass rounded-[26px] p-4 sm:p-5 border transition-all shadow-sm ${
                      isOut
                        ? 'border-rose-300 bg-rose-50/40'
                        : isLowStock
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200/90 bg-white/90 hover:border-cyan-300'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Column 1: Thumbnail & Badges */}
                      <div className="lg:col-span-2 relative aspect-square sm:aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <Image
                          src={item.thumbnailUrl || '/thumbnails/spool-pla.svg'}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-contain p-3 transition-transform hover:scale-105"
                        />

                        {/* Badge top-left */}
                        {item.badge && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900/80 text-white shadow-2xs">
                              {item.badge}
                            </span>
                          </div>
                        )}

                        {/* Stock status indicator pill */}
                        <div className="absolute bottom-2 left-2 right-2">
                          <span
                            className={`block text-center px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${
                              isOut
                                ? 'bg-rose-600 text-white'
                                : isLowStock
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isOut
                              ? 'HẾT HÀNG'
                              : isLowStock
                              ? `SẮP HẾT: CÒN ${item.stockCount}`
                              : `CÒN HÀNG: ${item.stockCount}`}
                          </span>
                        </div>
                      </div>

                      {/* Column 2: Product Info & Technical Specs */}
                      <div className="lg:col-span-6 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {item.brand}
                          </span>

                          {isFilament && fil && (
                            <>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {fil.material}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-800">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0"
                                  style={{ backgroundColor: fil.colorHex }}
                                />
                                <span>{fil.colorName}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">{fil.weightKg} kg</span>
                            </>
                          )}

                          {!isFilament && acc && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                              {ACCESSORY_CATEGORIES.find((c) => c.id === acc.subCategory)?.label || acc.subCategory}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                          {item.name}
                        </h3>

                        {/* Detailed Specs Row */}
                        {isFilament && fil && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-amber-600" />
                              <span>Đầu in: <strong>{fil.nozzleTempRange}</strong></span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-rose-600" />
                              <span>Bàn in: <strong>{fil.bedTempRange}</strong></span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-cyan-600" />
                              <span>Tốc độ: <strong>{fil.printSpeedRange}</strong></span>
                            </span>
                          </div>
                        )}

                        {!isFilament && acc && acc.compatibility && (
                          <div className="text-[11px] text-slate-600">
                            <span className="font-bold text-slate-800">Tương thích: </span>
                            <span>{acc.compatibility.join(', ')}</span>
                          </div>
                        )}

                        {item.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Column 3: Price & Inventory Stock Management Controls */}
                      <div className="lg:col-span-4 flex flex-col gap-2.5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-5">
                        {/* Prices row */}
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-xs text-slate-500 font-semibold">Giá niêm yết:</div>
                            <div className="text-base sm:text-lg font-black text-amber-800">
                              {item.priceVnd.toLocaleString('vi-VN')} đ
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[11px] text-slate-400 font-semibold">Giá vốn gốc:</div>
                            <div className="text-xs font-bold text-slate-700">
                              {item.originalPriceVnd
                                ? `${item.originalPriceVnd.toLocaleString('vi-VN')} đ`
                                : 'Chưa đặt'}
                            </div>
                            {profitMargin !== null && (
                              <div className={`text-[10px] font-bold ${profitMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {profitMargin >= 0 ? `+${profitMargin}%` : `${profitMargin}%`} biên lãi
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stock Counter with Quick Stepper Buttons */}
                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                          <span className="text-xs text-slate-700 font-bold whitespace-nowrap">
                            Tồn kho:
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Decrement -1 */}
                            <button
                              type="button"
                              onClick={() => adjustStock(item.id, item.itemType, { delta: -1 })}
                              disabled={item.stockCount <= 0}
                              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-800 disabled:opacity-40 transition-all active:scale-90 cursor-pointer"
                              title="Giảm 1"
                            >
                              <span className="font-black text-sm">-</span>
                            </button>

                            {/* Stock Number */}
                            <span className="min-w-8 text-center text-sm font-black text-slate-900">
                              {item.stockCount}
                            </span>

                            {/* Increment +1 */}
                            <button
                              type="button"
                              onClick={() => adjustStock(item.id, item.itemType, { delta: 1 })}
                              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-800 transition-all active:scale-90 cursor-pointer"
                              title="Tăng 1"
                            >
                              <span className="font-black text-sm">+</span>
                            </button>

                            {/* Quick Restock +5 */}
                            <button
                              type="button"
                              onClick={() => adjustStock(item.id, item.itemType, { delta: 5 })}
                              className="px-2 h-7 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                              title="Nhập thêm 5 cuộn/món"
                            >
                              +5
                            </button>
                          </div>

                          {/* InStock Quick Toggle */}
                          <button
                            type="button"
                            onClick={() => adjustStock(item.id, item.itemType, { inStock: !item.inStock })}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                              item.inStock
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            {item.inStock ? 'Kinh doanh' : 'Tạm khóa'}
                          </button>
                        </div>

                        {/* Row of Management Buttons */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa Chi Tiết</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmItem({
                                id: item.id,
                                name: item.name,
                                type: item.itemType,
                              })
                            }
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs transition-all active:scale-95 cursor-pointer"
                            title="Xóa sản phẩm khỏi kho"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* TAB 2: HÀNG ĐỢI KIỂM DUYỆT SELLER & QUYẾT TOÁN RÚT TIỀN */
        <div className="space-y-6">
          {/* Section 1: Sản phẩm Seller chờ duyệt */}
          <div className="vision-glass rounded-[32px] p-6 border border-slate-200/80 bg-white/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Sản Phẩm Mới Chờ Phê Duyệt ({pendingItems.totalCount})</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Cuộn nhựa, linh kiện và mô hình do Seller gửi lên. Cần kiểm duyệt chất lượng trước khi kích hoạt ra Marketplace.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchPendingModeration}
                disabled={isLoadingPending}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPending ? 'animate-spin' : ''}`} />
                <span>Tải lại</span>
              </button>
            </div>

            {isLoadingPending ? (
              <div className="py-12 text-center text-slate-400 text-xs">Đang tải danh sách chờ duyệt...</div>
            ) : pendingItems.totalCount === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold">Tuyệt vời! Hiện tại không có sản phẩm nào cần kiểm duyệt.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pending Filaments */}
                {pendingItems.filaments.map((f: any) => (
                  <div key={f.id} className="vision-glass rounded-[24px] p-4 border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          Cuộn Nhựa ({f.material})
                        </span>
                        <span className="text-slate-500 text-[11px]">Người bán: <strong className="text-slate-800">{f.sellerName || 'Seller'}</strong></span>
                      </div>
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-2">
                        <Image src={f.thumbnailUrl || '/thumbnails/spool-pla.svg'} alt={f.name} fill unoptimized className="object-contain" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{f.name}</h4>
                      <div className="text-xs text-amber-800 font-bold">{(f.priceVnd || 0).toLocaleString('vi-VN')} đ • Tồn: {f.stockCount}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{f.description || 'Chưa có mô tả'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleModerate(f.id, 'filament', 'approve')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Phê Duyệt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectModalItem({ id: f.id, name: f.name, type: 'filament' })}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Từ Chối
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pending Accessories */}
                {pendingItems.accessories.map((a: any) => (
                  <div key={a.id} className="vision-glass rounded-[24px] p-4 border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                          Phụ Kiện ({a.subCategory})
                        </span>
                        <span className="text-slate-500 text-[11px]">Người bán: <strong className="text-slate-800">{a.sellerName || 'Seller'}</strong></span>
                      </div>
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-2">
                        <Image src={a.thumbnailUrl || '/thumbnails/spool-pla.svg'} alt={a.name} fill unoptimized className="object-contain" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{a.name}</h4>
                      <div className="text-xs text-amber-800 font-bold">{(a.priceVnd || 0).toLocaleString('vi-VN')} đ • Tồn: {a.stockCount}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{a.description || 'Chưa có mô tả'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleModerate(a.id, 'accessory', 'approve')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Phê Duyệt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectModalItem({ id: a.id, name: a.name, type: 'accessory' })}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Từ Chối
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pending Models */}
                {pendingItems.models.map((m: any) => (
                  <div key={m.id} className="vision-glass rounded-[24px] p-4 border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Mô Hình Bản Quyền
                        </span>
                        <span className="text-slate-500 text-[11px]">Tác giả: <strong className="text-slate-800">{m.author || m.sellerName || 'Seller'}</strong></span>
                      </div>
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-2">
                        <Image src={m.thumbnailUrl || '/thumbnails/dragon.svg'} alt={m.title || m.name} fill unoptimized className="object-contain" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{m.title || m.name}</h4>
                      <div className="text-xs text-amber-800 font-bold">{m.priceVnd > 0 ? `${m.priceVnd.toLocaleString('vi-VN')} đ` : 'Miễn Phí'}</div>
                      <div className="text-[10px] text-cyan-700 flex items-center gap-1 font-mono font-semibold">
                        <FileCode className="w-3 h-3" />
                        <span>Tệp: {m.fileUrl || 'STL/OBJ'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleModerate(m.id, 'model', 'approve')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Phê Duyệt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectModalItem({ id: m.id, name: m.title || m.name, type: 'model' })}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Từ Chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Yêu cầu giải ngân rút tiền Seller */}
          <div className="vision-glass rounded-[32px] p-6 border border-slate-200/80 bg-white/90 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Yêu Cầu Rút Tiền Của Seller Chờ Xử Lý ({pendingWithdrawals.filter((w) => w.status === 'pending').length})</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {pendingWithdrawals.filter((w) => w.status === 'pending').length === 0 ? (
                <div className="py-6 text-center text-slate-400">Không có yêu cầu rút tiền nào đang chờ giải ngân.</div>
              ) : (
                pendingWithdrawals
                  .filter((w) => w.status === 'pending')
                  .map((w) => (
                    <div key={w.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{w.sellerName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            Chờ Chuyển Khoản
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Ngân hàng: <strong>{w.bankName}</strong> • STK: <strong className="font-mono text-cyan-800 font-bold">{w.bankAccount}</strong> • Chủ TK: <strong>{w.accountHolder}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400">Mã lệnh: {w.id} • {new Date(w.createdAt).toLocaleString('vi-VN')}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-base font-black text-emerald-700">{w.amountVnd.toLocaleString('vi-VN')} đ</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApproveWithdrawal(w.id)}
                          className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          Xác Nhận Đã Chuyển Tiền
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TỪ CHỐI SẢN PHẨM SELLER KÈM PHẢN HỒI */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-rose-300 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Từ Chối Duyệt Sản Phẩm</h3>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Nhập lý do hoặc phản hồi cho Seller đối với sản phẩm <strong className="text-slate-900">&ldquo;{rejectModalItem.name}&rdquo;</strong>:
            </p>

            <textarea
              rows={3}
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  handleModerate(rejectModalItem.id, rejectModalItem.type, 'reject', rejectFeedback);
                  setRejectModalItem(null);
                }}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT                                */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[36px] p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 text-slate-900 my-8 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
                  <Package className="w-5 h-5 text-cyan-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {modalMode === 'create' ? 'Thêm Sản Phẩm Mới Vào Kho' : 'Cập Nhật Chi Tiết Sản Phẩm'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Phân loại danh mục, thông số kỹ thuật, giá vốn, giá niêm yết và tồn kho.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Product Type Selector (Only selectable on Create) */}
              {modalMode === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Loại Sản Phẩm</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType('filament');
                        setFormThumbnailUrl('/thumbnails/spool-pla.svg');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        formType === 'filament'
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Cuộn Nhựa In 3D (Filament)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType('accessory');
                        setFormThumbnailUrl('/thumbnails/bambu-acc.svg');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        formType === 'accessory'
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Phụ Kiện Máy In (Accessory)
                    </button>
                  </div>
                </div>
              )}

              {/* Product Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Tên Sản Phẩm *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Bambu Lab PLA Basic 1.75mm Trắng Ngọc"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Thương Hiệu</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Bambu Lab, eSUN, Creality..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Filament Specific Fields */}
              {formType === 'filament' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Thông Số Cuộn Nhựa</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Loại Nhựa</label>
                      <select
                        value={formMaterial}
                        onChange={(e) => setFormMaterial(e.target.value as FilamentMaterial)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {FILAMENT_MATERIALS.map((mat) => (
                          <option key={mat} value={mat}>
                            {mat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Khối Lượng (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formWeightKg}
                        onChange={(e) => setFormWeightKg(parseFloat(e.target.value) || 1.0)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Tên Màu Sắc</label>
                      <input
                        type="text"
                        value={formColorName}
                        onChange={(e) => setFormColorName(e.target.value)}
                        placeholder="VD: Trắng Ngọc"
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Mã Màu HEX</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formColorHex}
                          onChange={(e) => setFormColorHex(e.target.value)}
                          className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-300 p-0.5"
                        />
                        <input
                          type="text"
                          value={formColorHex}
                          onChange={(e) => setFormColorHex(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Printing Temperatures & Speeds */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Nhiệt Độ Đầu Phun</label>
                      <input
                        type="text"
                        value={formNozzleTemp}
                        onChange={(e) => setFormNozzleTemp(e.target.value)}
                        placeholder="190°C - 230°C"
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Nhiệt Độ Bàn In</label>
                      <input
                        type="text"
                        value={formBedTemp}
                        onChange={(e) => setFormBedTemp(e.target.value)}
                        placeholder="45°C - 60°C"
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Tốc Độ In</label>
                      <input
                        type="text"
                        value={formPrintSpeed}
                        onChange={(e) => setFormPrintSpeed(e.target.value)}
                        placeholder="Lên tới 300 mm/s"
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Accessory Specific Fields */}
              {formType === 'accessory' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="text-xs font-black uppercase text-cyan-800 tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Thông Số Phụ Kiện</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Phân Loại Phụ Kiện</label>
                      <select
                        value={formSubCategory}
                        onChange={(e) => setFormSubCategory(e.target.value as AccessorySubCategory)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {ACCESSORY_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Tương Thích Dòng Máy In</label>
                      <input
                        type="text"
                        value={formCompatibility}
                        onChange={(e) => setFormCompatibility(e.target.value)}
                        placeholder="VD: Bambu Lab X1/P1/A1, Creality K1, Voron 2.4"
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Stock Management */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Giá Cả &amp; Quản Lý Tồn Kho</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Giá Niêm Yết (VNĐ) *</label>
                    <input
                      type="number"
                      required
                      step="1000"
                      value={formPriceVnd}
                      onChange={(e) => setFormPriceVnd(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-amber-800 font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Giá Vốn / Gốc (VNĐ)</label>
                    <input
                      type="number"
                      step="1000"
                      value={formOriginalPriceVnd}
                      onChange={(e) => setFormOriginalPriceVnd(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Số Lượng Tồn Kho *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formStockCount}
                      onChange={(e) => setFormStockCount(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Trạng Thái Kho</label>
                    <button
                      type="button"
                      onClick={() => setFormInStock(!formInStock)}
                      className={`w-full py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        formInStock
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {formInStock ? 'Còn Hàng' : 'Tạm Hết'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail Image & Badge */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">URL Hình Ảnh Thumbnail *</label>
                    <input
                      type="text"
                      required
                      value={formThumbnailUrl}
                      onChange={(e) => setFormThumbnailUrl(e.target.value)}
                      placeholder="/thumbnails/spool-pla.svg"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nhãn Badge (Nếu có)</label>
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">Không có</option>
                      <option value="Bán chạy">Bán chạy</option>
                      <option value="Khuyên dùng">Khuyên dùng</option>
                      <option value="Mới ra mắt">Mới ra mắt</option>
                      <option value="Chính hãng">Chính hãng</option>
                      <option value="Sale 15%">Sale 15%</option>
                    </select>
                  </div>
                </div>

                {/* Sample Thumbnails Selector */}
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold">Chọn nhanh hình ảnh có sẵn trong hệ thống:</div>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_THUMBNAILS.map((thumb) => (
                      <button
                        key={thumb.url}
                        type="button"
                        onClick={() => setFormThumbnailUrl(thumb.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          formThumbnailUrl === thumb.url
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {thumb.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description & Highlights */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Mô Tả Sản Phẩm</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả công dụng, tính chất vật liệu, đặc tính bề mặt hoàn thiện..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Điểm Nổi Bật (Phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formHighlights}
                    onChange={(e) => setFormHighlights(e.target.value)}
                    placeholder="Chính hãng 100%, Bề mặt mờ che layer, Tốc độ in 300mm/s"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{modalMode === 'create' ? 'Tạo Sản Phẩm Mới' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION                               */}
      {/* ======================================================== */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-rose-300 text-slate-900 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Sản Phẩm?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-900">&ldquo;{deleteConfirmItem.name}&rdquo;</strong> khỏi danh mục và kho hàng không? Thao tác này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Xóa Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
