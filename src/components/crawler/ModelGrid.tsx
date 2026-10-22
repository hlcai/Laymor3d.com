'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Download, Printer, Clock, Weight, Layers, Zap } from '@/components/icons/MinimalIcons';
import { IModel3D } from '@/backend/domain/models';
import { getMatchingSampleModelId } from '@/backend/domain/sample-models';
import { SlicingProfileModal } from '@/components/slicing/SlicingProfileModal';

interface ModelGridProps {
  models: IModel3D[];
  isLoading?: boolean;
}

export function ModelGrid({ models, isLoading }: ModelGridProps) {
  const [failedImgIds, setFailedImgIds] = React.useState<Set<string>>(new Set());
  const [selectedModalModel, setSelectedModalModel] = React.useState<IModel3D | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="vision-glass rounded-[28px] h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="vision-glass rounded-[32px] p-10 text-center space-y-3 shadow-2xl backdrop-blur-2xl">
        <p className="text-white font-semibold text-sm">Kho dữ liệu đang trống (Đã loại bỏ toàn bộ dữ liệu mẫu giả lập).</p>
        <p className="text-white/60 text-xs">
          Hãy chọn sàn mục tiêu hoặc nhập từ khóa, sau đó nhấn <strong>&quot;Bắt Đầu Crawl Ngay&quot;</strong> để thu thập dữ liệu thật 100%!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {models.map((model) => {
        const isImgFailed = failedImgIds.has(model.id);
        const imageSrc = isImgFailed || !model.thumbnailUrl ? '/thumbnails/bambu-acc.svg' : model.thumbnailUrl;

        const getPlatformBadge = () => {
          switch (model.platform) {
            case 'makerworld':
              return { label: 'MakerWorld', style: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' };
            case 'printables':
              return { label: 'Printables', style: 'bg-amber-500/20 text-amber-200 border-amber-400/30' };
            case 'github':
              return { label: 'GitHub 3D', style: 'bg-white/20 text-white border-white/25' };
            case 'thangs':
              return { label: 'Thangs 3D', style: 'bg-blue-500/20 text-blue-200 border-blue-400/30' };
            case 'cults3d':
              return { label: 'Cults3D', style: 'bg-rose-500/20 text-rose-200 border-rose-400/30' };
            case 'reddit':
              return { label: 'Reddit 3D', style: 'bg-orange-500/20 text-orange-200 border-orange-400/30' };
            case 'community-forum':
              return { label: 'Diễn Đàn', style: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30' };
            case 'youtube':
              return { label: 'YouTube Video', style: 'bg-red-500/20 text-red-200 border-red-500/40' };
            case 'manual':
              return { label: 'Thủ Công', style: 'bg-violet-500/20 text-violet-200 border-violet-400/30' };
            case 'custom-url':
              return { label: 'Link Web', style: 'bg-teal-500/20 text-teal-200 border-teal-400/30' };
            default:
              return { label: 'Thingiverse', style: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30' };
          }
        };

        const platformBadge = getPlatformBadge();

        return (
          <div
            key={model.id}
            className="group vision-glass rounded-[28px] overflow-hidden border border-white/12 hover:border-white/25 transition-all flex flex-col hover:-translate-y-1.5 hover:shadow-2xl backdrop-blur-2xl"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-black/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={model.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => {
                  setFailedImgIds((prev) => new Set(prev).add(model.id));
                }}
              />
              {/* Platform badge */}
              <div className="absolute top-2.5 left-2.5">
                <span
                  className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${platformBadge.style}`}
                >
                  {platformBadge.label}
                </span>
              </div>

              {/* Category tag */}
              <div className="absolute bottom-2.5 left-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white/80 backdrop-blur-md border border-white/15">
                  {model.category}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-emerald-300 transition-colors" title={model.title}>
                  {model.title}
                </h4>
                <p className="text-xs text-white/60 mt-0.5">Tác giả: <span className="text-white font-medium">{model.author}</span></p>
              </div>

              {/* Print Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/25 p-2.5 rounded-2xl border border-white/10 text-white">
                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  <span>{model.printTimeMinutes || 120} phút</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Weight className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>{model.filamentWeightGrams || 80}g ({model.filamentType?.split(' ')[0] || 'PLA'})</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10 text-white/60">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-white font-medium">
                    <Download className="w-3.5 h-3.5 text-white/70" />
                    {model.downloads.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300 font-bold">
                    <Printer className="w-3.5 h-3.5" />
                    {model.prints.toLocaleString()}
                  </span>
                </div>

                <span className="text-[11px] text-white/40 font-mono truncate max-w-[90px]" title={model.id}>
                  {model.id}
                </span>
              </div>

              {/* Action Bar: Link to 3D Studio, Profile In & External Source */}
              <div className="flex items-center gap-2 pt-1">
                {(() => {
                  const sampleModelId = getMatchingSampleModelId(model.title, model.category, model.tags);
                  return (
                    <Link
                      href={`/studio?sampleModel=${sampleModelId}`}
                      className="vision-pill-btn flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full font-bold text-xs shadow-md transition-all active:scale-[0.98] group"
                      title={`Nạp mô hình ${model.title} vào 3D Studio để cắt lớp`}
                    >
                      <Layers className="w-3.5 h-3.5 text-white" />
                      <span>Studio</span>
                    </Link>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setSelectedModalModel(model)}
                  className="px-3.5 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-200 font-bold text-xs transition-all active:scale-[0.98] inline-flex items-center gap-1 shrink-0"
                  title="Xem Profile In chuẩn OrcaSlicer & Tải file JSON"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Profile In</span>
                </button>

                <a
                  href={model.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all shrink-0 shadow-sm"
                  title="Xem trên sàn gốc (Website chính thức)"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slicing Profile Modal */}
      <SlicingProfileModal
        model={selectedModalModel}
        isOpen={!!selectedModalModel}
        onClose={() => setSelectedModalModel(null)}
      />
    </div>
  );
}
