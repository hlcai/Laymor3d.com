'use client';

import React from 'react';
import {
  TrendingUp,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  Globe,
  Radio,
  Layers,
} from '@/components/icons/MinimalIcons';
import { useTrendAnalytics } from '@/hooks/useTrendAnalytics';
import { TrendMetricsOverview } from '@/components/trends/TrendMetricsOverview';
import { VelocityLeaderboard } from '@/components/trends/VelocityLeaderboard';
import { TrendChart } from '@/components/trends/TrendChart';
import { HotTagsCloud } from '@/components/trends/HotTagsCloud';
import { GeminiTrendAnalysisView } from '@/components/trends/GeminiTrendAnalysisView';
import { PlatformType } from '@/backend/domain/models';

export function AdminTrendsManager() {
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

  const getPlatformCount = (pId: PlatformType | 'all') => {
    if (pId === 'all') return summary?.totalTrackedModels || 0;
    const found = platformStats.find((ps) => ps.platform === pId);
    return found?.count || 0;
  };

  const platformTabs: { id: PlatformType | 'all'; label: string }[] = [
    { id: 'all', label: 'Tất cả sàn' },
    { id: 'makerworld', label: 'MakerWorld' },
    { id: 'printables', label: 'Printables' },
    { id: 'thingiverse', label: 'Thingiverse' },
    { id: 'github', label: 'GitHub 3D' },
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header & Controls */}
      <div className="vision-glass-panel rounded-[32px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0 shadow-sm">
            <TrendingUp className="w-6 h-6 text-cyan-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Phân Tích Xu Hướng In 3D (Trend Intelligence)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Đo lường tốc độ tăng trưởng (Velocity), dự báo nhu cầu vật liệu FDM và thị hiếu cộng đồng 3D quốc tế
            </p>
          </div>
        </div>

        {/* Timeframe Buttons & Refresh */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5" /> Chu kỳ:
          </span>
          <div className="flex rounded-full bg-slate-100 p-1 border border-slate-200">
            {(['24h', '7d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Đồng bộ dữ liệu xu hướng với dữ liệu mới nhất từ Crawler"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Đồng Bộ ({summary?.totalTrackedModels || 0})</span>
          </button>
        </div>
      </div>

      {/* Platform Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 vision-glass p-2.5 rounded-full border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap pl-2">
          <span className="text-xs font-semibold text-slate-600 pr-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-700" /> Sàn:
          </span>
          {platformTabs.map((p) => {
            const count = getPlatformCount(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedPlatform === p.id
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedPlatform === p.id
                      ? 'bg-cyan-700 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 pr-4 flex items-center gap-2">
          <Radio className="w-3 h-3 text-cyan-600 animate-pulse" />
          <span>Theo dõi thời gian thực: <strong className="text-slate-800">{summary?.totalTrackedModels || 0}</strong> models</span>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <TrendMetricsOverview
        trends={trends}
        summary={summary}
        filamentStats={filamentStats}
        timeframe={timeframe}
      />

      {/* Gemini AI Intelligence Analysis Report */}
      <GeminiTrendAnalysisView
        selectedCategory={selectedCategory}
      />

      {/* Leaderboard & Category Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm mô hình theo tên, tác giả, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Tất cả ({categories.reduce((a, b) => a + b.count, 0)})
            </button>
            {categories.slice(0, 5).map((c) => (
              <button
                key={c.category}
                onClick={() => setSelectedCategory(c.category)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 ${
                  selectedCategory === c.category
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {c.category} ({c.count})
              </button>
            ))}
          </div>
        </div>

        <VelocityLeaderboard trends={trends} />
      </div>

      {/* Tags Cloud & Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HotTagsCloud
          hotTags={hotTags}
          onSelectTag={(t) => setSearchQuery(t)}
        />
        <TrendChart
          trends={trends}
          filamentStats={filamentStats}
          platformStats={platformStats}
          timeframe={timeframe}
        />
      </div>
    </div>
  );
}
