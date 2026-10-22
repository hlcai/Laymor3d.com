'use client';

import React from 'react';
import { TrendingUp, Download, Printer, Flame, Layers } from '@/components/icons/MinimalIcons';
import { ITrendMetric } from '@/backend/domain/models';
import { IFilamentDistribution } from '@/backend/services/analytics/TagAnalytics';
import { ITrendSummary } from '@/hooks/useTrendAnalytics';

interface TrendMetricsOverviewProps {
  trends: ITrendMetric[];
  summary?: ITrendSummary | null;
  filamentStats?: IFilamentDistribution[];
  timeframe?: '24h' | '7d' | '30d';
}

export function TrendMetricsOverview({
  trends,
  summary,
  filamentStats = [],
  timeframe = '24h',
}: TrendMetricsOverviewProps) {
  const totalDownloads = summary?.totalDownloads ?? trends.reduce((acc, t) => acc + t.currentDownloads, 0);
  const totalPrints = summary?.totalPrints ?? trends.reduce((acc, t) => acc + t.currentPrints, 0);
  const surgeVolume = summary?.surgeVolume ?? trends.reduce((acc, t) => acc + t.downloads24h, 0);
  const avgConversion = summary?.avgConversionRate ?? (totalDownloads > 0 ? ((totalPrints / totalDownloads) * 100).toFixed(1) : 0);

  const totalKg = filamentStats.reduce((acc, f) => acc + f.totalWeightKg, 0).toFixed(1);
  const topMaterial = filamentStats[0]?.material || 'PLA';
  const topMaterialShare = filamentStats[0]?.sharePercent || 50;

  const topModel = trends[0];

  const cards = [
    {
      label: 'Tổng lượt tải theo dõi',
      value: totalDownloads.toLocaleString(),
      subtext: `+${surgeVolume.toLocaleString()} lượt mới trong ${timeframe.toUpperCase()}`,
      icon: Download,
      color: 'text-cyan-300',
    },
    {
      label: 'Lượt in thực tế (Makes)',
      value: totalPrints.toLocaleString(),
      subtext: `Tỷ lệ in thực: ${avgConversion}% (Makes/Downloads)`,
      icon: Printer,
      color: 'text-emerald-300',
    },
    {
      label: 'Nhu cầu tiêu thụ nhựa FDM',
      value: `${totalKg} kg Nhựa`,
      subtext: `Chủ lực: ${topMaterial} (${topMaterialShare}% sản lượng)`,
      icon: Layers,
      color: 'text-indigo-300',
    },
    {
      label: 'Top #1 Momentum Champion',
      value: topModel ? topModel.title : 'Chưa có',
      subtext: topModel
        ? `${topModel.momentumScore}/100 Điểm • ${topModel.author}`
        : 'Chưa có mô hình',
      icon: Flame,
      color: 'text-amber-300',
      isTruncate: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="p-5 rounded-[28px] vision-glass hover:bg-[#344637]/65 transition-all duration-300 hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.3)] border border-white/15 text-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">{c.label}</span>
              <div className="w-8 h-8 rounded-full bg-white/15 border border-white/15 flex items-center justify-center text-white shadow-xs">
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <div className="mt-3.5">
              <h3 className={`text-2xl font-bold tracking-tight text-white ${c.isTruncate ? 'truncate' : ''}`}>
                {c.value}
              </h3>
              <p className="text-[11px] text-white/60 mt-1 truncate">{c.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
