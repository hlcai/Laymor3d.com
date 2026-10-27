'use client';

import React from 'react';
import {
  Package,
  Layers,
  Sparkles,
  Search,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
} from '@/components/icons/MinimalIcons';
import { ShopCategoryTab } from '@/backend/domain/shop';
import { useSystemEnvironment } from '@/hooks/useSystemEnvironment';

interface ShopHeaderProps {
  activeTab: ShopCategoryTab;
  setActiveTab: (tab: ShopCategoryTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  filamentsCount: number;
  servicesCount: number;
  modelsCount: number;
}

export function ShopHeader({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  cartCount,
  onOpenCart,
  filamentsCount,
  servicesCount,
  modelsCount,
}: ShopHeaderProps) {
  const { commercial } = useSystemEnvironment();

  const tabs = [
    {
      id: 'filaments_accessories' as ShopCategoryTab,
      label: 'Nhựa In & Phụ Kiện',
      icon: Package,
      count: filamentsCount,
      badge: 'Chính Hãng',
    },
    {
      id: 'printing_services' as ShopCategoryTab,
      label: 'Dịch Vụ In & Profiles',
      icon: Layers,
      count: servicesCount,
      badge: 'Báo Giá Tức Thì',
    },
    {
      id: 'models_marketplace' as ShopCategoryTab,
      label: 'Thư Viện Mô Hình 3D',
      icon: Sparkles,
      count: modelsCount,
      badge: 'Bản Quyền & Free',
    },
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner - VisionOS Spatial Glass */}
      <div className="relative rounded-[32px] overflow-hidden border border-slate-200/90 vision-glass-panel p-6 sm:p-9 shadow-xs bg-white/85 backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-bold backdrop-blur-md transition-all bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>3D Hub Official Store • Vật Tư &amp; Dịch Vụ Thương Mại Chính Thức</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Cửa Hàng 3D Hub Official.
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cung cấp cuộn nhựa in FDM chính hãng, linh kiện Bambu Lab, dịch vụ in 3D gia công công nghiệp và xuất hóa đơn VAT điện tử bởi {commercial?.companyName || 'Công ty Cổ phần Công nghệ In 3D Hub'}.
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Chính hãng (Bảo hành 1 đổi 1)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                <span>Báo giá tự động &amp; Xuất hóa đơn VAT</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>VietQR {commercial?.bankAccount?.bankName || 'MBBank'} &amp; Ví</span>
              </div>
            </div>
          </div>

          {/* Cart Trigger Button - VisionOS Pill */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm shadow-xs transition-all hover:scale-102 active:scale-98 group cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-cyan-600" />
              <span>Giỏ Hàng</span>
              {cartCount > 0 ? (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-cyan-600 text-white text-[11px] font-bold shadow-xs">
                  {cartCount}
                </span>
              ) : (
                <span className="text-xs text-slate-400">(0)</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3 Main Category Tabs - VisionOS Segmented Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-between p-4 rounded-[24px] border transition-all text-left cursor-pointer group ${
                isActive
                  ? 'bg-cyan-50/90 border-cyan-400 ring-2 ring-cyan-400/40 shadow-sm text-slate-900'
                  : 'bg-white/80 hover:bg-white border-slate-200 text-slate-700 hover:border-cyan-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight text-slate-900">
                    {tab.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {tab.count} sản phẩm
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                  isActive
                    ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Global VisionOS Pill Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm cuộn nhựa (PLA, PETG), phụ kiện máy in, dịch vụ in SLA hoặc mô hình 3D..."
            className="w-full pl-11 pr-24 py-3.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors font-bold border border-slate-300 cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
