'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Layers, Globe, TrendingUp } from '@/components/icons/MinimalIcons';
import { ITrendMetric } from '@/backend/domain/models';
import {
  IFilamentDistribution,
  IPlatformDistribution,
} from '@/backend/services/analytics/TagAnalytics';

interface TrendChartProps {
  trends: ITrendMetric[];
  filamentStats?: IFilamentDistribution[];
  platformStats?: IPlatformDistribution[];
  timeframe?: '24h' | '7d' | '30d';
}

export function TrendChart({
  trends,
  filamentStats = [],
  platformStats = [],
  timeframe = '24h',
}: TrendChartProps) {
  const [activeTab, setActiveTab] = useState<'growth' | 'filament' | 'platforms'>('growth');

  // Tổng hợp dữ liệu lịch sử theo từng ngày
  const dateMap: Record<string, { date: string; downloads: number; prints: number }> = {};

  trends.forEach((item) => {
    item.history.forEach((h) => {
      if (!dateMap[h.date]) {
        dateMap[h.date] = { date: h.date.slice(5), downloads: 0, prints: 0 };
      }
      dateMap[h.date].downloads += h.downloads;
      dateMap[h.date].prints += h.prints;
    });
  });

  const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="vision-glass rounded-[28px] p-5 sm:p-6 backdrop-blur-2xl">
      {/* Chart Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Biểu Đồ Xu Hướng Thị Trường</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 font-semibold uppercase border border-white/15">
              {timeframe}
            </span>
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Dữ liệu tổng hợp từ các mô hình 3D thực tế được theo dõi
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex rounded-full bg-black/30 p-1 border border-white/10 self-start sm:self-auto backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('growth')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'growth'
                ? 'bg-white/28 text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tăng trưởng</span>
          </button>
          <button
            onClick={() => setActiveTab('filament')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'filament'
                ? 'bg-white/28 text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vật liệu FDM</span>
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'platforms'
                ? 'bg-white/28 text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Thị phần sàn</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AREA GROWTH CHART */}
      {activeTab === 'growth' && (
        <div>
          <div className="flex items-center justify-end gap-4 text-xs mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/80" />
              <span className="text-white/80">Downloads (Lượt tải)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-white/80">Makes (Lượt in thực)</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="printsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" textAnchor="end" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(25, 35, 27, 0.92)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '1rem',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stroke="#ffffff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#downloadGradient)"
                  name="Lượt tải"
                />
                <Area
                  type="monotone"
                  dataKey="prints"
                  stroke="#34d399"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#printsGradient)"
                  name="Lượt in"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: FILAMENT DEMAND BREAKDOWN */}
      {activeTab === 'filament' && (
        <div className="h-64 flex flex-col justify-center space-y-4">
          <p className="text-xs text-white/60">
            Dự báo lượng tiêu hao nhựa in (Filament Consumption) theo chất liệu dựa trên {trends.length} models trending:
          </p>
          <div className="space-y-3">
            {filamentStats.map((item) => (
              <div key={item.material} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>Nhựa {item.material}</span>
                  </span>
                  <span className="text-white/60">
                    <strong className="text-white">{item.totalWeightKg} kg</strong> ({item.count} models • {item.sharePercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.sharePercent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM MARKET SHARE */}
      {activeTab === 'platforms' && (
        <div className="h-64 flex flex-col justify-center space-y-4">
          <p className="text-xs text-white/60">
            Tỷ trọng lưu lượng tải (Downloads) và lượt in thực tế (Makes) giữa 4 nền tảng 3D:
          </p>
          <div className="space-y-3">
            {platformStats.map((item) => (
              <div key={item.platform} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </span>
                  <span className="text-white/60">
                    <strong className="text-white">{item.totalDownloads.toLocaleString()}</strong> tải • {item.totalPrints.toLocaleString()} in ({item.sharePercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.sharePercent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
