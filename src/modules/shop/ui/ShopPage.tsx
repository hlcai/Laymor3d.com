'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useShop } from '@/hooks/useShop';
import { PrintingServicesProfilesView } from '@/components/shop/PrintingServicesProfilesView';
import { ModelMarketplaceView } from '@/components/shop/ModelMarketplaceView';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ProductDetailModal } from '@/components/shop/ProductDetailModal';
import { OrderServiceModal } from '@/components/shop/OrderServiceModal';
import { IPrintingServicePackage, IServiceQuoteResult } from '@/backend/domain/shop';
import {
  LAYMOR_PRINTER_BRANDS,
  LAYMOR_PRINTERS_CATALOG,
  LAYMOR_FILAMENT_BRANDS,
  LAYMOR_FILAMENTS_CATALOG,
  LAYMOR_ACCESSORIES_CATALOG,
} from '@/backend/domain/laymor-catalog';
import { LaymorRefTag } from '@/components/common/LaymorLogo';
import {
  CheckCircle2,
  Search,
  ShoppingCart,
  Printer,
  Layers,
  Wrench,
  Box,
  Sparkles,
  ChevronRight,
  Sliders,
  Trash2,
} from '@/components/icons/MinimalIcons';

type LaymorShopTab = 'printers' | 'filaments' | 'accessories' | 'models' | 'services';

const ALL_PRINTER_MODELS = [
  'H2D',
  'X2D',
  'P2S',
  'A2L',
  'A1',
  'Creator 5 Pro',
  'U1',
  'i8',
  'i7 combo',
  'K3',
  'Carbon 2 combo',
];

const ACCESSORY_TYPES = ['Build Plate', 'Hotend', 'Upgrade Parts', 'Air & Filtration'];

function ShopInner() {
  const shop = useShop();
  const searchParams = useSearchParams();

  const [activeCatalogTab, setActiveCatalogTab] = useState<LaymorShopTab>('printers');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [selectedModelCheckboxes, setSelectedModelCheckboxes] = useState<string[]>([]);
  const [selectedAccessoryTypes, setSelectedAccessoryTypes] = useState<string[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance');

  // State cho Service Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedServiceForOrder, setSelectedServiceForOrder] =
    useState<IPrintingServicePackage | undefined>();
  const [selectedQuoteForOrder, setSelectedQuoteForOrder] =
    useState<IServiceQuoteResult | undefined>();

  // Đồng bộ URL query params (?category=printers&brand=Bambu Lab&model=H2D&q=...)
  useEffect(() => {
    const cat = searchParams.get('category') || searchParams.get('tab');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const type = searchParams.get('type');
    const q = searchParams.get('q');

    if (cat === 'printers') {
      setActiveCatalogTab('printers');
    } else if (cat === 'filaments' || cat === 'filaments_accessories') {
      setActiveCatalogTab('filaments');
    } else if (cat === 'accessories') {
      setActiveCatalogTab('accessories');
    } else if (cat === 'models' || cat === 'models_marketplace') {
      setActiveCatalogTab('models');
    } else if (cat === 'services' || cat === 'printing_services' || cat === 'services_profiles') {
      setActiveCatalogTab('services');
    }

    if (brand) {
      setSelectedBrandFilter(brand);
    } else {
      setSelectedBrandFilter('all');
    }

    if (model) {
      setSelectedModelCheckboxes([model]);
    } else {
      setSelectedModelCheckboxes([]);
    }

    if (type) {
      setSelectedAccessoryTypes([type]);
    } else {
      setSelectedAccessoryTypes([]);
    }

    if (q) {
      setLocalSearch(q);
      shop.setSearchQuery(q);
    }
  }, [searchParams]);

  const toggleModelCheckbox = (modelCode: string) => {
    setSelectedModelCheckboxes((prev) =>
      prev.includes(modelCode) ? prev.filter((m) => m !== modelCode) : [...prev, modelCode]
    );
  };

  const toggleAccessoryType = (accType: string) => {
    setSelectedAccessoryTypes((prev) =>
      prev.includes(accType) ? prev.filter((t) => t !== accType) : [...prev, accType]
    );
  };

  const clearAllFilters = () => {
    setSelectedBrandFilter('all');
    setSelectedModelCheckboxes([]);
    setSelectedAccessoryTypes([]);
    setLocalSearch('');
  };

  const handleOpenOrderModal = (pkg?: IPrintingServicePackage, quote?: IServiceQuoteResult) => {
    setSelectedServiceForOrder(pkg);
    setSelectedQuoteForOrder(quote);
    setIsOrderModalOpen(true);
  };

  // Lọc danh sách Máy in 3D
  const filteredPrinters = LAYMOR_PRINTERS_CATALOG.filter((p) => {
    if (selectedBrandFilter !== 'all' && p.brand !== selectedBrandFilter) return false;
    if (
      selectedModelCheckboxes.length > 0 &&
      !selectedModelCheckboxes.includes(p.modelCode)
    ) {
      return false;
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.modelCode.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceVnd - b.priceVnd;
    if (sortBy === 'price_desc') return b.priceVnd - a.priceVnd;
    return 0;
  });

  // Lọc danh sách Nhựa in 3D
  const filteredFilaments = LAYMOR_FILAMENTS_CATALOG.filter((f) => {
    if (selectedBrandFilter !== 'all' && f.brand !== selectedBrandFilter) return false;
    if (
      selectedModelCheckboxes.length > 0 &&
      !selectedModelCheckboxes.some((m) => f.compatiblePrinters.includes(m))
    ) {
      return false;
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        f.materialType.toLowerCase().includes(q) ||
        f.colorName.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceVnd - b.priceVnd;
    if (sortBy === 'price_desc') return b.priceVnd - a.priceVnd;
    return 0;
  });

  // Lọc danh sách Linh kiện (Accessories)
  const filteredAccessories = LAYMOR_ACCESSORIES_CATALOG.filter((a) => {
    if (selectedBrandFilter !== 'all' && a.brand !== selectedBrandFilter) return false;
    if (
      selectedModelCheckboxes.length > 0 &&
      !selectedModelCheckboxes.some((m) => a.compatibleModels.includes(m))
    ) {
      return false;
    }
    if (
      selectedAccessoryTypes.length > 0 &&
      !selectedAccessoryTypes.includes(a.accessoryType)
    ) {
      return false;
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.accessoryType.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceVnd - b.priceVnd;
    if (sortBy === 'price_desc') return b.priceVnd - a.priceVnd;
    return 0;
  });

  const activeFilterCount =
    (selectedBrandFilter !== 'all' ? 1 : 0) +
    selectedModelCheckboxes.length +
    selectedAccessoryTypes.length;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {shop.toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-[#3FA9F5] text-white shadow-2xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#3FA9F5] shrink-0" />
            <span>{shop.toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. TOP BAR CHỌN NHÓM DANH MỤC SHOP & NÚT GIỎ HÀNG */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveCatalogTab('printers');
              clearAllFilters();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeCatalogTab === 'printers'
                ? 'bg-[#3FA9F5] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Máy in 3D</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCatalogTab('filaments');
              clearAllFilters();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeCatalogTab === 'filaments'
                ? 'bg-[#3FA9F5] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Nhựa in 3D</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCatalogTab('accessories');
              clearAllFilters();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeCatalogTab === 'accessories'
                ? 'bg-[#3FA9F5] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Linh kiện</span>
            <LaymorRefTag type="coming_soon" size="xs" />
            <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            type="button"
            onClick={() => setActiveCatalogTab('models')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeCatalogTab === 'models'
                ? 'bg-[#3FA9F5] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>3D Models</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            type="button"
            onClick={() => setActiveCatalogTab('services')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeCatalogTab === 'services'
                ? 'bg-[#3FA9F5] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Dịch vụ in 3D</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

        {/* Nút Giỏ hàng */}
        <button
          type="button"
          onClick={() => shop.setIsCartOpen(true)}
          className="self-start lg:self-auto flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-[#1A75FF] text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Giỏ hàng ({shop.cartItemsCount})</span>
        </button>
      </div>

      {/* 2. BỐ CỤC BAMBU STORE CHO MỤC MÁY IN / NHỰA IN / LINH KIỆN (TRANG 2, 3, 4 PDF) */}
      {(activeCatalogTab === 'printers' ||
        activeCatalogTab === 'filaments' ||
        activeCatalogTab === 'accessories') && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Tiêu đề danh mục lớn giống Bambu Store Trang 4 PDF */}
          <div className="border-b border-slate-200 pb-5 space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {activeCatalogTab === 'printers'
                  ? 'Máy in 3D Chính Hãng'
                  : activeCatalogTab === 'filaments'
                  ? 'Nhựa in 3D (Filaments)'
                  : 'Accessories & Linh Kiện'}
              </h1>
              {activeCatalogTab === 'accessories' && (
                <LaymorRefTag type="coming_soon" size="sm" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {activeCatalogTab === 'printers'
                ? 'Phân phối chính hãng Bambu Lab (A1, A2L, H2D, X2D, P2S), Flashforge Creator 5 Pro, Snapmaker U1, Creality (i8, i7 combo, K3) và Elegoo Carbon 2 combo.'
                : activeCatalogTab === 'filaments'
                ? 'Nhựa cuộn in 3D chính hãng Bambu Lab, Creality và dòng nhựa thương hiệu riêng LAYMOR (Coming soon).'
                : 'Linh kiện thay thế, bàn in PEI, cụm đầu phun Hotend và phụ kiện nâng cấp chính hãng cho từng dòng máy.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CỘT TRÁI (3 cols): BỘ LỌC SIDEBAR THEO HÃNG & DÒNG MÁY (CHUẨN TRANG 4 PDF) */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span>Filter</span>
                  <span className="text-xs font-mono text-slate-500">{activeFilterCount}</span>
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                  title="Xóa bộ lọc"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Cây thư mục Chọn Hãng (Nền bình thường trắng trơn có dấu >, khi chọn nền xanh + dấu >) */}
              <div className="space-y-1.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2">
                  Thương hiệu (Brand)
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBrandFilter('all')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer ${
                    selectedBrandFilter === 'all'
                      ? 'bg-[#3FA9F5] text-white font-bold'
                      : 'bg-white text-slate-700 hover:text-[#1A75FF] font-medium'
                  }`}
                >
                  <span>Tất cả thương hiệu</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {activeCatalogTab === 'printers' &&
                  LAYMOR_PRINTER_BRANDS.map((b) => {
                    const active = selectedBrandFilter === b.name;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBrandFilter(b.name)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer ${
                          active
                            ? 'bg-[#3FA9F5] text-white font-bold'
                            : 'bg-white text-slate-700 hover:text-[#1A75FF] font-medium'
                        }`}
                      >
                        <span>{b.name}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                {activeCatalogTab === 'filaments' &&
                  LAYMOR_FILAMENT_BRANDS.map((b) => {
                    const active = selectedBrandFilter === b.name;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBrandFilter(b.name)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer ${
                          active
                            ? 'bg-[#3FA9F5] text-white font-bold'
                            : 'bg-white text-slate-700 hover:text-[#1A75FF] font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{b.name}</span>
                          {b.refTag && <LaymorRefTag type={b.refTag} size="xs" />}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
              </div>

              {/* Bộ lọc Checkbox Printer Model (Giống hệt cột trái Bambu Store Trang 4 PDF) */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <div className="text-xs font-extrabold text-slate-900">Printer Model</div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {ALL_PRINTER_MODELS.map((modelCode) => {
                    const checked = selectedModelCheckboxes.includes(modelCode);
                    return (
                      <label
                        key={modelCode}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModelCheckbox(modelCode)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#1A75FF] focus:ring-[#1A75FF]"
                        />
                        <span>{modelCode}</span>
                      </label>
                    );
                  })}
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedModelCheckboxes.length === 0}
                      onChange={() => setSelectedModelCheckboxes([])}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#1A75FF]"
                    />
                    <span>Browse all</span>
                  </label>
                </div>
              </div>

              {/* Bộ lọc Accessories Type (Khi ở mục Linh kiện - Trang 4 PDF) */}
              {activeCatalogTab === 'accessories' && (
                <div className="pt-4 border-t border-slate-200 space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-900">Accessories Type</div>
                  <div className="space-y-2">
                    {ACCESSORY_TYPES.map((type) => {
                      const checked = selectedAccessoryTypes.includes(type);
                      return (
                        <label
                          key={type}
                          className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAccessoryType(type)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#1A75FF]"
                          />
                          <span>{type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>

            {/* CỘT PHẢI (9 cols): THANH TÌM KIẾM + SẮP XẾP + LƯỚI SẢN PHẨM (CHUẨN TRANG 4 PDF) */}
            <div className="lg:col-span-9 space-y-6">
              {/* Search & Sort Bar */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search for products in this collection..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#1A75FF]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">
                    {activeCatalogTab === 'printers'
                      ? `${filteredPrinters.length} Items`
                      : activeCatalogTab === 'filaments'
                      ? `${filteredFilaments.length} Items`
                      : `${filteredAccessories.length} Items`}
                  </span>

                  <div className="flex items-center gap-2">
                    <span>Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price_asc">Giá thấp đến cao</option>
                      <option value="price_desc">Giá cao đến thấp</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LƯỚI SẢN PHẨM 1: MÁY IN 3D */}
              {activeCatalogTab === 'printers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPrinters.map((printer) => (
                    <div
                      key={printer.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 hover:border-[#3FA9F5] bg-white overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div>
                        {/* Khung ảnh nền xám giống Bambu Store Trang 4 PDF */}
                        <div className="relative h-56 bg-[#E5E7EB]/70 flex flex-col items-center justify-center p-6">
                          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                            {printer.brand}
                          </div>
                          {printer.refTag && (
                            <div className="absolute top-3 right-3">
                              <LaymorRefTag type={printer.refTag} size="xs" />
                            </div>
                          )}

                          <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                            <Printer className="w-11 h-11 text-[#1A75FF]" />
                            <span className="text-[10px] font-black text-slate-900 mt-1">
                              {printer.modelCode}
                            </span>
                          </div>

                          <div className="mt-3 text-[11px] font-mono text-slate-600">
                            {printer.buildVolumeMm} • {printer.maxSpeedMmS} mm/s
                          </div>
                        </div>

                        {/* Thông tin máy */}
                        <div className="p-4 space-y-2">
                          <div className="text-[11px] font-bold text-[#1D4ED8]">
                            {printer.series} • {printer.multiColorSupport}
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#1A75FF] transition-colors">
                            {printer.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">{printer.subtitle}</p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">From</div>
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {printer.priceVnd.toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            shop.addToCart({
                              id: printer.id,
                              title: printer.name,
                              priceVnd: printer.priceVnd,
                              type: 'accessory',
                              imageUrl: '/thumbnails/robot.svg',
                              subText: `${printer.brand} • ${printer.buildVolumeMm}`,
                            })
                          }
                          className="px-4 py-2 rounded-xl bg-[#1A75FF] hover:bg-[#1D4ED8] text-white text-xs font-bold transition cursor-pointer"
                        >
                          MUA NGAY
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LƯỚI SẢN PHẨM 2: NHỰA IN 3D */}
              {activeCatalogTab === 'filaments' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredFilaments.map((fil) => (
                    <div
                      key={fil.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 hover:border-[#3FA9F5] bg-white overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div>
                        <div className="relative h-52 bg-[#E5E7EB]/70 flex flex-col items-center justify-center p-6">
                          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                            {fil.brand}
                          </div>
                          {fil.refTag && (
                            <div className="absolute top-3 right-3">
                              <LaymorRefTag type={fil.refTag} size="xs" />
                            </div>
                          )}

                          <div
                            className="w-24 h-24 rounded-full border-[10px] border-white shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: fil.colorHex }}
                          >
                            <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300" />
                          </div>

                          <div className="mt-3 text-[11px] font-semibold text-slate-700">
                            {fil.colorName}
                          </div>
                        </div>

                        <div className="p-4 space-y-1.5">
                          <div className="text-[11px] font-bold text-[#1D4ED8]">
                            {fil.materialType} • {fil.weightKg}kg ({fil.diameterMm}mm)
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-900">{fil.name}</h3>
                          <p className="text-xs text-slate-500">
                            Nhiệt độ đầu phun: {fil.nozzleTemp} • Bàn: {fil.bedTemp}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">From</div>
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {fil.priceVnd.toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                        {fil.refTag === 'coming_soon' ? (
                          <LaymorRefTag type="coming_soon" size="sm" />
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              shop.addToCart({
                                id: fil.id,
                                title: fil.name,
                                priceVnd: fil.priceVnd,
                                type: 'filament',
                                imageUrl: '/thumbnails/benchy.svg',
                                subText: `${fil.brand} • ${fil.colorName}`,
                              })
                            }
                            className="px-4 py-2 rounded-xl bg-[#1A75FF] hover:bg-[#1D4ED8] text-white text-xs font-bold transition cursor-pointer"
                          >
                            MUA NGAY
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LƯỚI SẢN PHẨM 3: LINH KIỆN (ACCESSORIES — GIAO DIỆN BAMBU STORE TRANG 4 PDF) */}
              {activeCatalogTab === 'accessories' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAccessories.map((acc) => (
                    <div
                      key={acc.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 hover:border-[#3FA9F5] bg-white overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div>
                        <div className="relative h-56 bg-[#D1D5DB]/60 flex flex-col items-center justify-center p-6">
                          {/* Nhãn góc phải giống hệt ảnh Bambu Store Trang 4 PDF */}
                          <div className="absolute top-3 right-3">
                            <LaymorRefTag type="coming_soon" size="xs" />
                          </div>

                          <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col items-center justify-center">
                            <Wrench className="w-10 h-10 text-[#3FA9F5]" />
                            <span className="text-[9px] font-mono uppercase text-slate-300 mt-1">
                              {acc.accessoryType}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{acc.name}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2">{acc.description}</p>
                          <div className="text-[11px] text-slate-400">
                            Tương thích: {acc.compatibleModels.join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500">From </span>
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {acc.priceVnd.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <LaymorRefTag type="coming_soon" size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB THƯ VIỆN 3D MODELS */}
      {activeCatalogTab === 'models' && (
        <ModelMarketplaceView
          models={shop.models}
          modelTypeFilter={shop.modelTypeFilter}
          setModelTypeFilter={shop.setModelTypeFilter}
          selectedCategory={shop.selectedModelCategory}
          setSelectedCategory={shop.setSelectedModelCategory}
          onAddToCart={shop.addToCart}
          onViewDetail={shop.setSelectedDetailItem}
          onShowToast={shop.showToast}
        />
      )}

      {/* 4. TAB DỊCH VỤ IN 3D & PROFILES */}
      {activeCatalogTab === 'services' && (
        <PrintingServicesProfilesView
          services={shop.services}
          profiles={shop.profiles}
          subTab={shop.serviceSubTab}
          setSubTab={shop.setServiceSubTab}
          selectedSlicer={shop.selectedSlicer}
          setSelectedSlicer={shop.setSelectedSlicer}
          quoteParams={shop.quoteParams}
          setQuoteParams={shop.setQuoteParams}
          quoteResult={shop.quoteResult}
          isCalculatingQuote={shop.isCalculatingQuote}
          onCalculateQuote={shop.calculateServiceQuote}
          onOpenOrderModal={handleOpenOrderModal}
          onAddToCart={shop.addToCart}
          onShowToast={shop.showToast}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={shop.isCartOpen}
        onClose={() => shop.setIsCartOpen(false)}
        items={shop.cartItems}
        onUpdateQuantity={shop.updateQuantity}
        onRemoveItem={shop.removeFromCart}
        onClearCart={shop.clearCart}
        totalVnd={shop.cartTotalVnd}
        onCheckout={shop.handleCheckout}
        isProcessing={shop.isProcessingOrder}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={shop.selectedDetailItem}
        onClose={() => shop.setSelectedDetailItem(null)}
        onAddToCart={shop.addToCart}
      />

      {/* Custom Service Order Modal */}
      {isOrderModalOpen && (
        <OrderServiceModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          servicePackage={selectedServiceForOrder}
          quote={selectedQuoteForOrder}
          onShowToast={shop.showToast}
        />
      )}
    </div>
  );
}

export function ShopPage() {
  return (
    <Suspense
      fallback={<div className="p-12 text-center text-slate-500">Đang tải cửa hàng LAYMOR...</div>}
    >
      <ShopInner />
    </Suspense>
  );
}

export default ShopPage;
