'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Award,
  Zap,
  Tag,
  Palette,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Thermometer,
  Gauge,
  PackageCheck,
  ShieldAlert,
  Sliders,
} from '@/components/icons/MinimalIcons';
import { IGeminiTrendAnalysisResult } from '@/backend/services/analytics/GeminiAnalyticsService';

interface GeminiTrendAnalysisViewProps {
  selectedCategory?: string;
}

const DEFAULT_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Khuyên dùng - Nhanh, Thông Minh & Ổn Định)' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite (Siêu nhanh & Tiết kiệm token)' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Suy luận sâu & Phân tích chiến lược 2M)' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Thế hệ 1.5 ổn định)' },
];

export function GeminiTrendAnalysisView({ selectedCategory }: GeminiTrendAnalysisViewProps) {
  const [analysis, setAnalysis] = useState<IGeminiTrendAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
  const [availableModels, setAvailableModels] = useState<{ id: string; label: string }[]>(DEFAULT_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [hasNewCrawlData, setHasNewCrawlData] = useState<boolean>(false);

  // Load configured or available models from backend on mount
  useEffect(() => {
    setIsLoadingModels(true);
    fetch('/api/admin/gemini/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.models) && data.models.length > 0) {
          // Lọc chỉ giữ các model Google thực tế
          const valid = data.models
            .filter((m: any) => !m.id.includes('2.5') && !m.id.includes('8b'))
            .map((m: any) => ({
              id: m.id,
              label: m.name || m.id,
            }));
          if (valid.length > 0) {
            setAvailableModels(valid);
          }
        }
        if (data.preferredModel && !data.preferredModel.includes('2.5') && !data.preferredModel.includes('8b')) {
          setSelectedModel(data.preferredModel);
        }
      })
      .catch(() => {
        // Giữ DEFAULT_MODELS
      })
      .finally(() => {
        setIsLoadingModels(false);
      });
  }, []);

  const fetchGeminiAnalysis = async (modelOverride?: string) => {
    setIsLoading(true);
    setError(null);
    setHasNewCrawlData(false);
    try {
      const activeModel = modelOverride || selectedModel;
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      if (activeModel) {
        params.set('model', activeModel);
      }
      const url = `/api/trends/analyze?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Không thể tải phân tích từ Gemini');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối Gemini API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGeminiAnalysis();
  }, [selectedCategory]);

  // Lắng nghe sự kiện cào dữ liệu mới từ Crawler
  useEffect(() => {
    const handleCrawlUpdate = () => {
      setHasNewCrawlData(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('3dhub-crawled-models-updated', handleCrawlUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('3dhub-crawled-models-updated', handleCrawlUpdate);
      }
    };
  }, []);

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    fetchGeminiAnalysis(newModel);
  };

  return (
    <div className="rounded-[36px] vision-glass-panel border border-white/20 p-6 sm:p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)] relative overflow-hidden text-white">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5 text-[#2DD4BF] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Phân Tích Xu Hướng Thị Trường 3D Chuyên Sâu
              </h3>

              {/* Status Badge: Live API vs Local Real-Data Algorithm */}
              {analysis?.isLiveApi ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {analysis.geminiModelUsed}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#2DD4BF]" />
                  {analysis?.geminiModelUsed || 'Thuật Toán Phân Tích Dữ Liệu Thực Tế'}
                </span>
              )}
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              Đánh giá thị hiếu Maker, tính toán chi phí BOM, dự phóng doanh thu xưởng và đề xuất profile cắt lớp chuyên sâu
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-xs backdrop-blur-md">
            <span className="text-[11px] text-white/60 font-semibold hidden sm:inline">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="bg-transparent text-emerald-300 font-bold text-xs focus:outline-none cursor-pointer pr-1"
              title="Chọn mô hình Gemini AI để chạy phân tích"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/admin?tab=settings"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 text-xs font-semibold transition-all"
            title="Cấu hình Google Gemini API Key & Model Mặc Định"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span className="hidden sm:inline">Cài Đặt API</span>
          </Link>

          <button
            onClick={() => fetchGeminiAnalysis()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2DD4BF]/20 hover:bg-[#2DD4BF]/30 border border-[#2DD4BF]/40 text-[#5EEAD4] text-xs font-bold transition-all backdrop-blur-md disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang phân tích...' : 'Phân tích lại'}</span>
          </button>
        </div>
      </div>

      {/* Real-time notification if new crawl data arrived */}
      {hasNewCrawlData && (
        <div className="p-3.5 rounded-2xl bg-[#2DD4BF]/20 border border-[#2DD4BF]/40 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-ping shrink-0" />
            <span className="font-semibold text-white">
              Phát hiện dữ liệu mô hình mới vừa được cào về từ Crawler!
            </span>
          </div>
          <button
            onClick={() => fetchGeminiAnalysis()}
            disabled={isLoading}
            className="px-4 py-1.5 rounded-full bg-[#2DD4BF] text-[#051817] font-bold text-xs hover:bg-[#5EEAD4] transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Phân Tích Dữ Liệu Mới Ngay
          </button>
        </div>
      )}

      {/* Warning Box if API Key was provided but Google returned an error */}
      {!isLoading && analysis?.apiError && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-3 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-100">
              Thông báo kết nối Google Gemini API:
            </p>
            <p className="text-amber-200/80 leading-relaxed font-mono text-[11px]">
              {analysis.apiError}
            </p>
            <p className="text-[11px] text-white/70 pt-1">
              Hệ thống đã tự động chuyển sang <strong>Thuật toán Phân tích Cục bộ Chuyên Sâu (Dữ liệu thực từ các mô hình vừa cào)</strong> để không làm gián đoạn trải nghiệm của bạn. Bạn có thể kiểm tra lại khóa API tại{' '}
              <Link href="/admin?tab=settings" className="text-emerald-300 underline font-semibold">
                Cài Đặt Quản Trị
              </Link>.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-white/70 font-semibold">
            Đang tổng hợp dữ liệu cào đa sàn, tính toán BOM kinh tế và lập kế hoạch sản xuất...
          </p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Content */}
      {!isLoading && analysis && (
        <div className="space-y-6">
          {/* Executive Summary Box */}
          <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-2">
            <div className="flex items-center gap-2 text-[#2DD4BF] text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Tóm Tắt Báo Cáo Chiến Lược Thị Trường &amp; Dòng Vốn</span>
            </div>
            <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-normal">
              {analysis.summary}
            </p>
          </div>

          {/* Market Sentiment & Trending Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Sentiment, Drivers & Demographics */}
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span>Thị Hiếu &amp; Động Lực Thị Trường</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Độ nóng thị trường: {analysis.marketSentiment.sentimentScore}/100
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {analysis.marketSentiment.title}
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                {analysis.marketSentiment.description}
              </p>

              {/* Demand Drivers */}
              {analysis.marketSentiment.demandDrivers && analysis.marketSentiment.demandDrivers.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <span className="text-[11px] font-semibold text-amber-300 block">
                    Động lực kích cầu thực tế:
                  </span>
                  {analysis.marketSentiment.demandDrivers.map((driver, idx) => (
                    <div key={idx} className="text-[11px] text-white/80 flex items-start gap-1.5 leading-snug">
                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                      <span>{driver}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Demographics */}
              {analysis.marketSentiment.customerDemographics && (
                <div className="text-[11px] text-white/70 pt-1.5 border-t border-white/10">
                  <span className="text-white/50 font-semibold">Khách hàng mục tiêu: </span>
                  <span className="text-white/90">{analysis.marketSentiment.customerDemographics}</span>
                </div>
              )}

              {/* Keywords Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.marketSentiment.trendingKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/15 text-white border border-white/15"
                  >
                    <Tag className="w-3 h-3 text-[#2DD4BF]" />
                    <span>#{kw}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Box 2: Material & Colors & Inventory Strategy */}
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-300" />
                <span>Dự Báo Nhu Cầu Vật Liệu, Nhiệt Độ &amp; Chiến Lược Tồn Kho</span>
              </span>

              <div className="space-y-3">
                {analysis.materialPredictions.map((mat, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-black/25 border border-white/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{mat.material}</span>
                      <span className="font-black text-emerald-300 text-xs">{mat.sharePercent}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-white/70 pt-0.5">
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-rose-300 shrink-0" />
                        <span>{mat.temperatures || '215°C / 60°C'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-cyan-300 shrink-0" />
                        <span>Lưu lượng: {mat.flowRateMm3s || '20 mm³/s'}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-white/70 flex items-center gap-1">
                      <span className="text-white/50">Màu gợi ý:</span>
                      <span className="text-amber-300 font-semibold">{mat.recommendedColors.join(', ')}</span>
                    </div>
                    <p className="text-[11px] text-white/75">{mat.advice}</p>

                    {mat.inventoryStrategy && (
                      <p className="text-[10px] text-teal-300/80 pt-1 border-t border-white/10 font-mono">
                        📦 Tồn kho: {mat.inventoryStrategy}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Commercial Opportunities (Thương Mại Hóa & Bảng Tính BOM) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Top Cơ Hội Thương Mại &amp; Kế Hoạch Sản Xuất Hàng Loạt Cho Xưởng In
                </h4>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">BOM + Retail Pricing + Net Margin</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.commercialOpportunities.map((opp) => (
                <div
                  key={opp.rank}
                  className="p-5 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-200 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                        #{opp.rank}
                      </span>
                      <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                        {opp.potentialRevenueVnd}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-white line-clamp-2">
                      {opp.modelTitle}
                    </h5>

                    {/* Unit Economics & Pricing Box */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Chi phí BOM:</span>
                        <span className="text-rose-300 font-mono font-semibold">{opp.estimatedBomCost}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Giá bán lẻ đề xuất:</span>
                        <span className="text-amber-300 font-mono font-bold">{opp.suggestedRetailPrice}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-white/60">Biên lợi nhuận ròng:</span>
                        <span className="text-emerald-300 font-black font-mono">{opp.netMarginPercent}</span>
                      </div>
                    </div>

                    {opp.batchProductionPlan && (
                      <div className="text-[11px] text-teal-200/90 leading-snug p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                        <span className="font-semibold text-teal-300">In tổ hợp: </span>
                        <span>{opp.batchProductionPlan}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-white/70 line-clamp-3 leading-relaxed">
                      {opp.whyProfitable}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] text-white/50">
                    <div>
                      <span className="text-white/80 font-medium">Khách hàng: </span>
                      <span>{opp.targetAudience}</span>
                    </div>
                    {opp.commercialRights && (
                      <div className="text-emerald-300 font-mono">
                        ✓ {opp.commercialRights}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Slicing Deep Dive (OrcaSlicer / Bambu Studio) */}
          {analysis.technicalSlicingDeepDive && analysis.technicalSlicingDeepDive.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-300" />
                  <span>Khuyến Nghị Cắt Lớp Chuyên Sâu (OrcaSlicer / Bambu Studio Slicing Deep Dive)</span>
                </span>
                <span className="text-[10px] text-white/60 font-mono">Tối ưu máy CoreXY</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {analysis.technicalSlicingDeepDive.map((dive, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2.5 text-xs">
                    <span className="font-bold text-emerald-300 block text-xs">{dive.category}</span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-white/50 block">Layer Height:</span>
                        <span className="text-white font-mono font-semibold">{dive.recommendedSettings.layerHeight}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-white/50 block">Wall Loops:</span>
                        <span className="text-white font-mono font-semibold">{dive.recommendedSettings.wallLoops}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-white/50 block">Infill Pattern:</span>
                        <span className="text-white font-mono font-semibold">{dive.recommendedSettings.infillPattern}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-white/50 block">Tốc độ in:</span>
                        <span className="text-white font-mono font-semibold">{dive.recommendedSettings.printSpeed}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-white/50 block">Quạt tản nhiệt:</span>
                        <span className="text-white font-mono font-semibold">{dive.recommendedSettings.coolingFan}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-white/50 block">Vị trí Mối nối (Seam):</span>
                        <span className="text-white font-mono font-semibold">{dive.recommendedSettings.seamPosition}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-teal-200/90 bg-teal-500/10 p-2.5 rounded-lg border border-teal-500/20 leading-relaxed">
                      💡 <strong>Mẹo Orca/Bambu:</strong> {dive.orcaBambuSpecifics}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workshop Execution Checklist & Risk Mitigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Checklist */}
            {analysis.workshopExecutionChecklist && (
              <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-emerald-300" />
                  <span>Quy Trình Kiểm Soát Vận Hành Xưởng (QA/QC Checklist)</span>
                </span>
                <div className="space-y-2.5">
                  {analysis.workshopExecutionChecklist.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/25 border border-white/10 text-xs space-y-1">
                      <div className="font-bold text-amber-300 text-[11px]">{item.phase}</div>
                      <p className="text-white/90 text-[11px] leading-snug">{item.action}</p>
                      <div className="text-[10px] text-teal-300 flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        <span>Hiệu quả: {item.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk & Mitigation */}
            {analysis.riskAndMitigation && (
              <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-300" />
                  <span>Cảnh Báo Rủi Ro Kỹ Thuật &amp; Biện Pháp Triệt Tiêu</span>
                </span>
                <div className="space-y-2.5">
                  {analysis.riskAndMitigation.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/25 border border-white/10 text-xs space-y-1">
                      <div className="font-bold text-rose-300 text-[11px]">⚠️ {item.risk}</div>
                      <p className="text-white/70 text-[10px]">Hệ quả: {item.consequence}</p>
                      <p className="text-[11px] text-emerald-300 font-medium leading-snug pt-0.5">
                        Giải pháp: {item.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
