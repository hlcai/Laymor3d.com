'use client';

import React, { useState } from 'react';
import { Compass, RefreshCw, Layers, ShieldCheck, Link2, PlusCircle } from '@/components/icons/MinimalIcons';
import { usePlatformCrawler } from '@/hooks/usePlatformCrawler';
import { CrawlerDashboard } from '@/components/crawler/CrawlerDashboard';
import { ModelGrid } from '@/components/crawler/ModelGrid';
import { CrawlUrlModal } from '@/components/crawler/CrawlUrlModal';
import { ManualIngestModal } from '@/components/crawler/ManualIngestModal';

export function AdminCrawlerManager() {
  const [isCrawlUrlModalOpen, setIsCrawlUrlModalOpen] = useState(false);
  const [isManualIngestModalOpen, setIsManualIngestModalOpen] = useState(false);

  const {
    models,
    rawModels,
    selectedPlatform,
    setSelectedPlatform,
    isCrawling,
    isLoadingModels,
    crawlLogs,
    keyword,
    setKeyword,
    sortBy,
    setSortBy,
    filamentFilter,
    setFilamentFilter,
    crawlDepth,
    setCrawlDepth,
    triggerCrawl,
    crawlCustomUrl,
    manualIngestModel,
    deduplicateDatabase,
    refetchModels,
  } = usePlatformCrawler();

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="vision-glass-panel rounded-[32px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0 shadow-sm">
            <Compass className="w-6 h-6 text-cyan-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              MakerWorld &amp; 3D Repositories Crawler v3.0
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Hệ thống bóc tách dữ liệu đa nền tảng thời gian thực: Printables, GitHub 3D, MakerWorld và Thingiverse
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsCrawlUrlModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Dán đường dẫn URL hoặc YouTube bất kỳ để bóc tách tự động"
          >
            <Link2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Cào Link URL &amp; YouTube</span>
          </button>

          <button
            onClick={() => setIsManualIngestModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-50 hover:bg-violet-100 border border-violet-300 text-violet-800 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Nạp mô hình hoặc mẹo in thủ công vào kho"
          >
            <PlusCircle className="w-3.5 h-3.5 text-violet-600" />
            <span>Nạp Thủ Công</span>
          </button>

          <button
            onClick={deduplicateDatabase}
            disabled={isLoadingModels}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95 shadow-sm"
            title="Tự động quét và loại bỏ toàn bộ dữ liệu trùng lặp"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Lọc sạch trùng lặp</span>
          </button>

          <button
            onClick={refetchModels}
            disabled={isLoadingModels}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
            <span>Làm mới ({models.length})</span>
          </button>
        </div>
      </div>

      {/* Crawler Engine Controller Console */}
      <CrawlerDashboard
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        keyword={keyword}
        onChangeKeyword={setKeyword}
        crawlDepth={crawlDepth}
        onChangeDepth={setCrawlDepth}
        onTriggerCrawl={triggerCrawl}
        isCrawling={isCrawling}
        crawlLogs={crawlLogs}
        onOpenCrawlUrlModal={() => setIsCrawlUrlModalOpen(true)}
        onOpenManualIngestModal={() => setIsManualIngestModalOpen(true)}
      />

      {/* Model Repository Grid with Filter & Sort Toolbar */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 vision-glass p-3 rounded-full border border-slate-200/80 bg-white/90 shadow-sm">
          {/* Filament Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap pl-2">
            <span className="text-xs font-semibold text-slate-600 mr-1">Chất liệu:</span>
            {['all', 'PLA', 'PETG', 'TPU', 'ABS'].map((f) => (
              <button
                key={f}
                onClick={() => setFilamentFilter(f)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filamentFilter === f
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 pr-3">
            <span className="text-xs font-semibold text-slate-600">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="downloads">Lượt tải nhiều nhất</option>
              <option value="prints">Lượt in thực tế cao nhất</option>
              <option value="recent">Mới cào gần đây</option>
            </select>

            <span className="text-xs text-slate-400 ml-1 hidden md:inline">
              ({models.length} / {rawModels.length} models)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>Kho Dữ Liệu Model Đã Crawl ({models.length})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Click &quot;Nạp Vào Studio&quot; để nạp trực tiếp mô hình lên bàn in 3D
          </span>
        </div>

        <ModelGrid models={models} isLoading={isLoadingModels} />
      </div>

      {/* Crawl URL Modal */}
      <CrawlUrlModal
        isOpen={isCrawlUrlModalOpen}
        onClose={() => setIsCrawlUrlModalOpen(false)}
        onCrawlUrl={crawlCustomUrl}
      />

      {/* Manual Ingest Modal */}
      <ManualIngestModal
        isOpen={isManualIngestModalOpen}
        onClose={() => setIsManualIngestModalOpen(false)}
        onManualIngest={manualIngestModel}
      />
    </div>
  );
}
