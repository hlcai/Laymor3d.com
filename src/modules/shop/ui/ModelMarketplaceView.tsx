'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Download,
  ShoppingCart,
  Eye,
  Star,
  Clock,
  Layers,
  Box,
  ArrowUpRight,
} from '@/components/icons/MinimalIcons';
import { IShopModelItem, ModelMarketplaceCategory } from '@/backend/domain/shop';

interface ModelMarketplaceViewProps {
  models: IShopModelItem[];
  modelTypeFilter: 'all' | 'free' | 'paid';
  setModelTypeFilter: (filter: 'all' | 'free' | 'paid') => void;
  selectedCategory: ModelMarketplaceCategory;
  setSelectedCategory: (cat: ModelMarketplaceCategory) => void;
  onAddToCart: (item: any) => void;
  onViewDetail: (item: any) => void;
  onShowToast: (msg: string) => void;
}

export function ModelMarketplaceView({
  models,
  modelTypeFilter,
  setModelTypeFilter,
  selectedCategory,
  setSelectedCategory,
  onAddToCart,
  onViewDetail,
  onShowToast,
}: ModelMarketplaceViewProps) {
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  const categories: { id: ModelMarketplaceCategory; label: string }[] = [
    { id: 'all', label: 'Tất cả chủ đề' },
    { id: 'mechanical', label: 'Cơ khí & Bánh răng' },
    { id: 'art_decor', label: 'Nghệ thuật & Decor' },
    { id: 'figure', label: 'Figure & Nhân vật' },
    { id: 'gadgets', label: 'Đồ chơi & Fidget' },
    { id: 'tools', label: 'Dụng cụ tiện ích' },
  ];

  const handleFreeDownload = (model: IShopModelItem) => {
    setDownloadedIds((prev) => [...prev, model.id]);
    const blob = new Blob(
      [
        JSON.stringify(
          {
            modelTitle: model.title,
            author: model.author,
            license: 'Creative Commons - Free Personal & Commercial Print',
            downloadDate: new Date().toISOString(),
            formats: model.formats,
            specs: {
              estTime: model.printTimeEstimate,
              filamentWeight: model.filamentWeightEstimate,
            },
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.id}_package.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`🎉 Đã tải tệp mô hình: ${model.title}`);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Filters Bar - VisionOS Segmented Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 vision-glass p-4 rounded-[28px] border border-slate-200/90 shadow-xs bg-white/85">
        {/* Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/80 backdrop-blur-xl">
          <button
            onClick={() => setModelTypeFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              modelTypeFilter === 'all'
                ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Tất cả ({models.length})
          </button>
          <button
            onClick={() => setModelTypeFilter('free')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              modelTypeFilter === 'free'
                ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Miễn Phí (Free 100%)
          </button>
          <button
            onClick={() => setModelTypeFilter('paid')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              modelTypeFilter === 'paid'
                ? 'bg-white text-cyan-950 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Mô Hình Trả Phí (Premium)
          </button>
        </div>

        {/* Category Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => {
          const isFree = model.isFree;
          const isDownloaded = downloadedIds.includes(model.id);

          return (
            <div
              key={model.id}
              className="group relative flex flex-col justify-between rounded-[32px] vision-glass hover:border-cyan-400 hover:shadow-lg hover:-translate-y-1 p-5 transition-all duration-300 shadow-xs border border-slate-200/90 text-slate-900 bg-white/90"
            >
              <div className="space-y-3.5">
                {/* Visual Header */}
                <div className="relative aspect-video rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-4 overflow-hidden group-hover:border-cyan-300 transition-colors shadow-2xs">
                  <Image
                    src={model.thumbnailUrl}
                    alt={model.title}
                    width={96}
                    height={96}
                    unoptimized={model.thumbnailUrl?.endsWith?.('.svg')}
                    className="object-contain filter drop-shadow group-hover:scale-110 transition-transform duration-300 max-w-full max-h-full"
                  />

                  {/* Badges on preview */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {model.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-cyan-900 border border-cyan-200 shadow-2xs">
                        {model.badge}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide border shadow-2xs ${
                        isFree
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300 font-mono'
                      }`}
                    >
                      {isFree ? 'FREE' : `${model.priceVnd.toLocaleString('vi-VN')} đ`}
                    </span>
                  </div>

                  {/* Formats Pills */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                    {model.formats.map((fmt, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white/90 text-slate-700 rounded border border-slate-200 shadow-2xs"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>

                  {/* 3D Studio Link Button */}
                  {model.sampleModelId && (
                    <Link
                      href={`/studio?model=${model.sampleModelId}`}
                      className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold border border-cyan-500 transition-all hover:scale-105 shadow-2xs"
                      title="Mở trong 3D Studio"
                    >
                      <Box className="w-3 h-3" />
                      <span>Xem 3D</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Tác giả: <strong className="text-slate-800 font-semibold">{model.author}</strong></span>
                    <div className="flex items-center gap-1 text-amber-700 font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{model.rating}</span>
                      <span className="text-slate-400 font-normal">({model.reviewsCount})</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => onViewDetail(model)}
                    className="text-sm font-bold text-slate-900 hover:text-cyan-700 cursor-pointer transition-colors line-clamp-2 leading-snug"
                  >
                    {model.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">{model.description}</p>
                </div>

                {/* Specs: Print Time & Filament Weight */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>In: <strong className="text-slate-900">{model.printTimeEstimate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tốn: <strong className="text-slate-900">{model.filamentWeightEstimate}</strong></span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500 font-semibold">
                  {model.downloads.toLocaleString('vi-VN')} lượt tải
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetail(model)}
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shadow-2xs cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isFree ? (
                    <button
                      onClick={() => handleFreeDownload(model)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloaded ? 'Tải lại' : 'Tải File'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        onAddToCart({
                          id: model.id,
                          title: model.title,
                          priceVnd: model.priceVnd,
                          type: 'model',
                          imageUrl: model.thumbnailUrl,
                          subText: `Bản quyền: ${model.author}`,
                        })
                      }
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Mua Bản Quyền</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
