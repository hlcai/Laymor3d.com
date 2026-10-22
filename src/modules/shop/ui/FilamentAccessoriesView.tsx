'use client';

import React from 'react';
import Image from 'next/image';
import {
  Package,
  ShoppingCart,
  Thermometer,
  Gauge,
  Sliders,
  Eye,
} from '@/components/icons/MinimalIcons';
import { IFilamentItem, IAccessoryItem } from '@/backend/domain/shop';

interface FilamentAccessoriesViewProps {
  filaments: IFilamentItem[];
  accessories: IAccessoryItem[];
  subTab: 'all' | 'filament' | 'accessory';
  setSubTab: (tab: 'all' | 'filament' | 'accessory') => void;
  selectedMaterial: string;
  setSelectedMaterial: (mat: string) => void;
  selectedAccessorySub: string;
  setSelectedAccessorySub: (sub: string) => void;
  selectedBrand: string;
  setSelectedBrand: (b: string) => void;
  onAddToCart: (item: any) => void;
  onViewDetail: (item: any) => void;
}

export function FilamentAccessoriesView({
  filaments,
  accessories,
  subTab,
  setSubTab,
  selectedMaterial,
  setSelectedMaterial,
  selectedAccessorySub,
  setSelectedAccessorySub,
  selectedBrand,
  setSelectedBrand,
  onAddToCart,
  onViewDetail,
}: FilamentAccessoriesViewProps) {
  const materials = [
    { id: 'all', label: 'Tất cả loại nhựa' },
    { id: 'PLA', label: 'PLA / PLA+' },
    { id: 'PETG-CF', label: 'PETG / Sợi Carbon' },
    { id: 'TPU', label: 'TPU Nhựa Dẻo' },
    { id: 'ASA', label: 'ASA Chống UV' },
    { id: 'Resin', label: 'Resin SLA 8K' },
  ];

  const accessorySubs = [
    { id: 'all', label: 'Tất cả linh kiện' },
    { id: 'hotend', label: 'Cụm Hotend' },
    { id: 'build_plate', label: 'Bàn in PEI' },
    { id: 'dryer', label: 'Máy sấy cuộn' },
    { id: 'nozzle', label: 'Đầu phun Nozzle' },
    { id: 'tools', label: 'Dụng cụ thao tác' },
  ];

  const brands = ['all', 'Bambu Lab', 'eSUN', 'Sunlu', 'Polymaker', 'Phaetus'];

  const showFilaments = subTab === 'all' || subTab === 'filament';
  const showAccessories = subTab === 'all' || subTab === 'accessory';

  return (
    <div className="space-y-6 text-slate-800">
      {/* Sub Category Controls - VisionOS Segmented Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 vision-glass p-4 rounded-[28px] border border-slate-200/90 shadow-xs bg-white/85">
        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/80 backdrop-blur-xl">
          <button
            onClick={() => setSubTab('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              subTab === 'all'
                ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Tất cả ({filaments.length + accessories.length})
          </button>
          <button
            onClick={() => setSubTab('filament')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              subTab === 'filament'
                ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Cuộn Nhựa In ({filaments.length})
          </button>
          <button
            onClick={() => setSubTab('accessory')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              subTab === 'accessory'
                ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Phụ Kiện Máy In ({accessories.length})
          </button>
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold">Hãng:</span>
          <div className="flex flex-wrap gap-1">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedBrand === b
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {b === 'all' ? 'Tất cả' : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Chips by Material or Accessory Category */}
      {subTab === 'filament' && (
        <div className="flex flex-wrap items-center gap-2">
          {materials.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMaterial(m.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedMaterial === m.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {subTab === 'accessory' && (
        <div className="flex flex-wrap items-center gap-2">
          {accessorySubs.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAccessorySub(a.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedAccessorySub === a.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* 1. FILAMENTS GRID */}
      {showFilaments && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-600" />
              <span>Cuộn Nhựa In 3D FDM &amp; Resin SLA</span>
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{filaments.length} loại có sẵn</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filaments.map((fil) => (
              <div
                key={fil.id}
                className="group relative flex flex-col justify-between rounded-[28px] vision-glass border border-slate-200/90 hover:border-cyan-400 hover:shadow-lg hover:-translate-y-1 p-6 transition-all duration-300 shadow-xs bg-white/90 text-slate-900"
              >
                {/* Header */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    {/* Visual Preview / Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2.5 group-hover:scale-105 transition-transform shrink-0 overflow-hidden relative shadow-2xs">
                      <Image
                        src={fil.thumbnailUrl}
                        alt={fil.name}
                        width={48}
                        height={48}
                        unoptimized={fil.thumbnailUrl?.endsWith('.svg')}
                        className="object-contain filter drop-shadow max-w-full max-h-full"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {!fil.inStock || fil.stockCount === 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                          Hết hàng
                        </span>
                      ) : fil.stockCount <= 5 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          Còn {fil.stockCount} cuộn
                        </span>
                      ) : fil.badge ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          fil.badge === 'Bán chạy'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : fil.badge === 'Khuyên dùng'
                            ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                            : 'bg-purple-100 text-purple-900 border-purple-300'
                        }`}>
                          {fil.badge}
                        </span>
                      ) : null}
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {fil.brand}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => onViewDetail(fil)}
                      className="text-sm font-bold text-slate-900 hover:text-cyan-700 cursor-pointer transition-colors line-clamp-2 leading-snug"
                    >
                      {fil.name}
                    </h3>

                    {/* Color Swatch & Spec */}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: fil.colorHex }}
                        title={fil.colorName}
                      />
                      <span className="text-xs text-slate-700 font-semibold">{fil.colorName}</span>
                      <span className="text-[11px] text-slate-500">• {fil.weightKg} kg</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Đầu phun: <strong className="text-slate-800">{fil.nozzleTempRange}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                      <span>Tốc độ: <strong className="text-slate-800">{fil.printSpeedRange}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-extrabold tracking-tight text-slate-900 font-mono">
                      {fil.priceVnd.toLocaleString('vi-VN')} đ
                    </div>
                    {fil.originalPriceVnd && (
                      <div className="text-[11px] text-slate-400 line-through font-mono">
                        {fil.originalPriceVnd.toLocaleString('vi-VN')} đ
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetail(fil)}
                      className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="Xem thông số kỹ thuật"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      disabled={!fil.inStock || fil.stockCount === 0}
                      onClick={() =>
                        onAddToCart({
                          id: fil.id,
                          title: fil.name,
                          priceVnd: fil.priceVnd,
                          type: 'filament',
                          imageUrl: fil.thumbnailUrl,
                          subText: `${fil.brand} • ${fil.colorName}`,
                        })
                      }
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer ${
                        !fil.inStock || fil.stockCount === 0
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{!fil.inStock || fil.stockCount === 0 ? 'Hết hàng' : 'Thêm giỏ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ACCESSORIES GRID */}
      {showAccessories && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-600" />
              <span>Phụ Kiện &amp; Linh Kiện Nâng Cấp Máy In 3D</span>
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{accessories.length} phụ kiện có sẵn</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accessories.map((acc) => (
              <div
                key={acc.id}
                className="group relative flex flex-col justify-between rounded-[28px] vision-glass border border-slate-200/90 hover:border-cyan-400 hover:shadow-lg hover:-translate-y-1 p-6 transition-all duration-300 shadow-xs bg-white/90 text-slate-900"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2.5 group-hover:scale-105 transition-transform shrink-0 overflow-hidden relative shadow-2xs">
                      <Image
                        src={acc.thumbnailUrl}
                        alt={acc.name}
                        width={48}
                        height={48}
                        unoptimized={acc.thumbnailUrl?.endsWith('.svg')}
                        className="object-contain filter drop-shadow max-w-full max-h-full"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {!acc.inStock || acc.stockCount === 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                          Hết hàng
                        </span>
                      ) : acc.stockCount <= 5 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          Còn {acc.stockCount} món
                        </span>
                      ) : acc.badge ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                          {acc.badge}
                        </span>
                      ) : null}
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {acc.brand}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => onViewDetail(acc)}
                      className="text-sm font-bold text-slate-900 hover:text-cyan-700 cursor-pointer transition-colors line-clamp-2 leading-snug"
                    >
                      {acc.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{acc.description}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-base font-extrabold tracking-tight text-slate-900 font-mono">
                    {acc.priceVnd.toLocaleString('vi-VN')} đ
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetail(acc)}
                      className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      disabled={!acc.inStock || acc.stockCount === 0}
                      onClick={() =>
                        onAddToCart({
                          id: acc.id,
                          title: acc.name,
                          priceVnd: acc.priceVnd,
                          type: 'accessory',
                          imageUrl: acc.thumbnailUrl,
                          subText: `${acc.brand} • ${acc.subCategory}`,
                        })
                      }
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer ${
                        !acc.inStock || acc.stockCount === 0
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{!acc.inStock || acc.stockCount === 0 ? 'Hết hàng' : 'Thêm giỏ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
