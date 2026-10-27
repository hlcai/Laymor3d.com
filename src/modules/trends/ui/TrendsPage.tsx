'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  Globe,
  Radio,
  ArrowRight,
  Layers,
} from '@/components/icons/MinimalIcons';
import { useTrendAnalytics } from '@/hooks/useTrendAnalytics';
import { TrendMetricsOverview } from '@/components/trends/TrendMetricsOverview';
import { VelocityLeaderboard } from '@/components/trends/VelocityLeaderboard';
import { TrendChart } from '@/components/trends/TrendChart';
import { HotTagsCloud } from '@/components/trends/HotTagsCloud';
import { GeminiTrendAnalysisView } from '@/components/trends/GeminiTrendAnalysisView';
import { PlatformType } from '@/backend/domain/models';

export default function TrendsPage() {
  const {
    timeframe,
    setTimeframe,
    selectedPlatform,
    setSelectedPlatform,
    trends,
    rawTrends,
    hotTags,
    categories,
    filamentStats,
    platformStats,
    summary,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    refetch,
  } = useTrendAnalytics();

  const platformTabs: { id: PlatformType | 'all'; label: string }[] = [
    { id: 'all', label: 'Tất cả sàn' },
    { id: 'makerworld', label: 'MakerWorld' },
    { id: 'printables', label: 'Printables' },
    { id: 'thingiverse', label: 'Thingiverse' },
    { id: 'github', label: 'GitHub 3D' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="vision-glass-panel rounded-[32px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Phân Tích Xu Hướng In 3D (Trend Intelligence)
            </h1>
            <p className="text-xs sm:text-sm text-white/70 mt-1">
              Đo lường tốc độ tăng trưởng (Velocity), dự báo nhu cầu vật liệu FDM và thị hiếu cộng đồng 3D quốc tế
            </p>
          </div>
        </div>

        {/* Timeframe Buttons & Refresh */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Chu kỳ:
          </span>
          <div className="flex rounded-full bg-black/30 p-1 border border-white/10 backdrop-blur-xl">
            {(['24h', '7d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-white/28 text-white shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={refetch}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all shadow-xs"
            title="Làm mới dữ liệu phân tích"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Platform Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 vision-glass p-2.5 rounded-full backdrop-blur-2xl">
        <div className="flex items-center gap-1.5 flex-wrap pl-2">
          <span className="text-xs font-semibold text-white/70 pr-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-white/90" /> Sàn:
          </span>
          {platformTabs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                selectedPlatform === p.id
                  ? 'bg-white/30 text-white border-white/40 shadow-xs'
                  : 'bg-black/20 text-white/70 border-white/10 hover:text-white hover:border-white/25'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-white/70 pr-4 flex items-center gap-2">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Theo dõi thời gian thực: <strong className="text-white">{summary?.totalTrackedModels || 0}</strong> models</span>
        </div>
      </div>

      {/* Empty State Notice if No Models Crawled Yet */}
      {summary && summary.totalTrackedModels === 0 ? (
        <div className="vision-glass rounded-[32px] p-10 text-center space-y-4 max-w-xl mx-auto shadow-2xl backdrop-blur-2xl">
          <div className="w-14 h-14 rounded-full bg-white/20 border border-white/25 text-white flex items-center justify-center mx-auto shadow-sm">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Chưa có dữ liệu xu hướng thực tế</h3>
            <p className="text-xs text-white/70">
              Hãy khởi chạy bộ thu thập dữ liệu (Crawler) từ MakerWorld, Printables, Thingiverse hoặc GitHub 3D để kích hoạt hệ thống phân tích xu hướng!
            </p>
          </div>
          <Link
            href="/crawler"
            className="vision-pill-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-xs shadow-lg transition-all"
          >
            <span>Mở Trình Quét Crawler Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Overview Cards */}
          <TrendMetricsOverview
            trends={rawTrends}
            summary={summary}
            filamentStats={filamentStats}
            timeframe={timeframe}
          />

          {/* Google Gemini AI In-Depth Market Trend Analysis */}
          <GeminiTrendAnalysisView selectedCategory={selectedCategory} />

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm model, tác giả (Jody, CreativeTools, Prusa), hoặc tag..."
                className="w-full pl-11 pr-4 py-3 rounded-full bg-black/25 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-black/35 shadow-xs transition-all backdrop-blur-xl"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/25 border border-white/15 backdrop-blur-xl w-full sm:w-auto">
                <Filter className="w-4 h-4 text-white/60 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-3"
                >
                  <option value="all" className="bg-[#18231B] text-white">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.category} value={c.category} className="bg-[#18231B] text-white">
                      {c.category} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Charts Grid: Multi-mode Chart (8 cols) + Hot Tags Cloud (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <TrendChart
                trends={rawTrends}
                filamentStats={filamentStats}
                platformStats={platformStats}
                timeframe={timeframe}
              />
            </div>
            <div className="lg:col-span-4">
              <HotTagsCloud hotTags={hotTags} onSelectTag={(t) => setSearchQuery(t)} />
            </div>
          </div>

          {/* Detailed Velocity Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-white">
                Danh Sách Xếp Hạng Chi Tiết ({trends.length} models)
              </h2>
            </div>
            <VelocityLeaderboard trends={trends} />
          </div>
        </>
      )}
    </div>
  );
}
