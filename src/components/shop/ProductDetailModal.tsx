'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Star,
  ShoppingCart,
  CheckCircle2,
  Box,
  Thermometer,
  Gauge,
  Layers,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Play,
} from '@/components/icons/MinimalIcons';

interface ProductDetailModalProps {
  item: any | null;
  onClose: () => void;
  onAddToCart: (item: any) => void;
}

export function ProductDetailModal({ item, onClose, onAddToCart }: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'specs' | 'studio'>('info');

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity" />

      {/* VisionOS Floating Glass Dialog - Apple Vision Pro Light Palette */}
      <div className="relative z-10 w-full max-w-3xl rounded-[36px] bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-slate-900">
        {/* Top Control Bar: Circle Close + Center Segmented Pill */}
        <div className="flex items-center justify-between">
          {/* Circular Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Segmented Pill Tabs (Info / Specs / Studio) */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thông Tin
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thông Số
            </button>
            {item.sampleModelId && (
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'studio'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Xem 3D Studio
              </button>
            )}
          </div>

          {/* Spacer balance */}
          <div className="w-10" />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Thumbnail Image */}
          <div className="md:col-span-4 relative aspect-video md:aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center p-4">
            <Image
              src={item.thumbnailUrl || '/thumbnails/benchy.svg'}
              alt={item.name || item.title}
              width={160}
              height={160}
              unoptimized={item.thumbnailUrl?.endsWith?.('.svg')}
              className="object-contain max-w-full max-h-full filter drop-shadow"
            />
            {item.badge && (
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white shadow-2xs">
                  {item.badge}
                </span>
              </div>
            )}
          </div>

          {/* Middle Details */}
          <div className="md:col-span-5 space-y-3">
            <div>
              <span className="text-xs text-cyan-700 font-bold uppercase tracking-wider block mb-1">
                {item.brand || '3D Hub Official'}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{item.name || item.title}</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
              {item.description}
            </p>

            {/* Pill Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-700">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800">
                {item.type === 'filament' ? 'FDM SPOOL' : 'ACCESSORY'}
              </span>
              {item.weightKg && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800">
                  {item.weightKg} KG
                </span>
              )}
              {item.colorName && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800">
                  {item.colorName}
                </span>
              )}
            </div>

            {/* Price display */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-500 font-semibold block">Đơn giá niêm yết:</span>
              <span className="text-2xl font-black text-amber-800 tracking-tight">
                {item.priceVnd !== undefined
                  ? item.priceVnd === 0
                    ? 'Miễn phí'
                    : `${item.priceVnd.toLocaleString('vi-VN')} đ`
                  : 'Liên hệ'}
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="md:col-span-3 flex flex-col gap-3">
            {item.priceVnd !== undefined && item.priceVnd > 0 && (
              <button
                onClick={() => {
                  onAddToCart({
                    id: item.id,
                    title: item.name || item.title,
                    priceVnd: item.priceVnd,
                    type: item.type,
                    imageUrl: item.thumbnailUrl,
                    subText: item.brand || item.author,
                  });
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm Vào Giỏ</span>
              </button>
            )}

            {item.sampleModelId && (
              <Link
                href={`/studio?model=${item.sampleModelId}`}
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 text-center cursor-pointer"
              >
                <Box className="w-4 h-4 text-cyan-600" />
                <span>Mở Trong Studio</span>
              </Link>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>

        {/* Tab 2: Specs Grid */}
        {activeTab === 'specs' && item.type === 'filament' && (
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">Nhiệt đầu phun</span>
              <span className="font-bold text-amber-800 mt-1 block">{item.nozzleTempRange}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">Nhiệt bàn in</span>
              <span className="font-bold text-rose-700 mt-1 block">{item.bedTempRange}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">Tốc độ in</span>
              <span className="font-bold text-cyan-700 mt-1 block">{item.printSpeedRange}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">Khối lượng</span>
              <span className="font-bold text-slate-900 mt-1 block">{item.weightKg} kg</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
