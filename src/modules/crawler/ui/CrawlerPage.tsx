'use client';

import React, { useState } from 'react';
import { Compass, RefreshCw, Layers, ShieldCheck, Link2, PlusCircle } from '@/components/icons/MinimalIcons';
import { usePlatformCrawler } from '@/hooks/usePlatformCrawler';
import { CrawlerDashboard } from '@/components/crawler/CrawlerDashboard';
import { ModelGrid } from '@/components/crawler/ModelGrid';
import { CrawlUrlModal } from '@/components/crawler/CrawlUrlModal';
import { ManualIngestModal } from '@/components/crawler/ManualIngestModal';

export default function CrawlerPage() {
  const [isCrawlUrlModalOpen, setIsCrawlUrlModalOpen] = useState(false);
  const [isManualIngestModalOpen, setIsManualIngestModalOpen] = useState(false);

  // 🟦 TẦNG 2: HOOK (TRUNG GIAN ĐIỀU PHỐI CRAWLER)
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="vision-glass-panel rounded-[32px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Compass className="w-6 h-6 text-[#2DD4BF]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Multi-Source 3D Repositories &amp; Community Crawler v3.5
            </h1>
            <p className="text-xs sm:text-sm text-white/70 mt-1">
              Bóc tách đa sàn (Printables, MakerWorld, Thangs, Cults3D, Thingiverse, GitHub 3D, Reddit, Forum) &amp; Nạp thủ công vào Obsidian Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsCrawlUrlModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Dán đường dẫn URL bất kỳ để bóc tách tự động"
          >
            <Link2 className="w-3.5 h-3.5 text-teal-300" />
            <span>Cào Link URL</span>
          </button>

          <button
            onClick={() => setIsManualIngestModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/40 text-violet-200 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Nạp mô hình hoặc mẹo in thủ công vào kho"
          >
            <PlusCircle className="w-3.5 h-3.5 text-violet-300" />
            <span>Nạp Thủ Công</span>
          </button>

          <button
            onClick={deduplicateDatabase}
            disabled={isLoadingModels}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Tự động quét và loại bỏ toàn bộ dữ liệu trùng lặp"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Lọc trùng</span>
          </button>

          <button
            onClick={refetchModels}
            disabled={isLoadingModels}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 vision-glass p-3 rounded-full backdrop-blur-2xl">
          {/* Filament Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap pl-2">
            <span className="text-xs font-semibold text-white/70 mr-1">Chất liệu:</span>
            {['all', 'PLA', 'PETG', 'TPU', 'ABS', 'ASA'].map((f) => (
              <button
                key={f}
                onClick={() => setFilamentFilter(f)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                  filamentFilter === f
                    ? 'bg-white/30 text-white border-white/40 shadow-xs font-bold'
                    : 'bg-black/20 text-white/70 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 pr-3">
            <span className="text-xs font-semibold text-white/70">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-1.5 rounded-full bg-black/30 border border-white/15 text-xs text-white font-semibold focus:outline-none focus:border-white/40 cursor-pointer"
            >
              <option value="downloads" className="bg-[#18231B] text-white">Lượt tải nhiều nhất</option>
              <option value="prints" className="bg-[#18231B] text-white">Lượt in thực tế cao nhất</option>
              <option value="recent" className="bg-[#18231B] text-white">Mới cào gần đây</option>
            </select>

            <span className="text-xs text-white/50 ml-1 hidden md:inline font-mono">
              ({models.length} / {rawModels.length} models)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-white/90" />
            <span>Kho Dữ Liệu Model Đã Crawl &amp; Nạp Tri Thức ({models.length})</span>
          </h2>
          <span className="text-xs text-white/60">
            Dữ liệu được đồng bộ trực tiếp vào Obsidian Knowledge Vault và bộ nhớ AI Slicing
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
