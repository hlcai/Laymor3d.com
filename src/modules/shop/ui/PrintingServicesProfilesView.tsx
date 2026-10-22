'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FileCode,
  Sparkles,
  Calculator,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Printer,
  Send,
  Coins,
} from '@/components/icons/MinimalIcons';
import {
  IPrintingServicePackage,
  IPrintProfileItem,
  IServiceQuoteRequest,
  IServiceQuoteResult,
  PrintingTechnology,
} from '@/backend/domain/shop';

interface PrintingServicesProfilesViewProps {
  services: IPrintingServicePackage[];
  profiles: IPrintProfileItem[];
  subTab: 'services' | 'profiles';
  setSubTab: (tab: 'services' | 'profiles') => void;
  selectedSlicer: string;
  setSelectedSlicer: (s: string) => void;
  quoteParams: IServiceQuoteRequest;
  setQuoteParams: React.Dispatch<React.SetStateAction<IServiceQuoteRequest>>;
  quoteResult: IServiceQuoteResult | null;
  isCalculatingQuote: boolean;
  onCalculateQuote: (override?: Partial<IServiceQuoteRequest>) => void;
  onOpenOrderModal: (servicePackage?: IPrintingServicePackage, quote?: IServiceQuoteResult) => void;
  onAddToCart: (item: any) => void;
  onShowToast: (msg: string) => void;
}

export function PrintingServicesProfilesView({
  services,
  profiles,
  subTab,
  setSubTab,
  selectedSlicer,
  setSelectedSlicer,
  quoteParams,
  setQuoteParams,
  quoteResult,
  isCalculatingQuote,
  onCalculateQuote,
  onOpenOrderModal,
  onAddToCart,
  onShowToast,
}: PrintingServicesProfilesViewProps) {
  const [downloadedProfiles, setDownloadedProfiles] = useState<string[]>([]);

  const slicers = ['all', 'OrcaSlicer', 'Bambu Studio', 'Creality Print', 'PrusaSlicer'];

  const technologies: { id: PrintingTechnology; label: string; desc: string }[] = [
    { id: 'FDM High-Speed', label: 'In FDM Tốc Độ Cao', desc: 'Bambu Lab & Voron (600đ/g)' },
    { id: 'SLA Resin 8K', label: 'In SLA Resin 8K', desc: 'Siêu mịn từng micromet (1.800đ/g)' },
    { id: 'AMS Multi-Color', label: 'In Đa Màu AMS', desc: 'Phối 4 - 8 màu tự động (950đ/g)' },
    { id: 'Engineering PA-CF', label: 'In Nhựa Sợi Carbon', desc: 'Chịu nhiệt 150°C, siêu cứng (1.500đ/g)' },
  ];

  const handleTechChange = (tech: PrintingTechnology) => {
    let defaultMat = 'PLA Basic';
    if (tech === 'SLA Resin 8K') defaultMat = 'Resin 8K Tiêu chuẩn';
    if (tech === 'Engineering PA-CF') defaultMat = 'Nylon PA-CF';
    if (tech === 'AMS Multi-Color') defaultMat = 'PLA Đa màu';

    const newParams = { ...quoteParams, technology: tech, material: defaultMat };
    setQuoteParams(newParams);
    onCalculateQuote(newParams);
  };

  const handleWeightChange = (weight: number) => {
    const newParams = { ...quoteParams, weightGrams: weight };
    setQuoteParams(newParams);
    onCalculateQuote(newParams);
  };

  const handleDownloadProfile = (prof: IPrintProfileItem) => {
    if (prof.priceVnd > 0) {
      onAddToCart({
        id: prof.id,
        title: `Profile: ${prof.title}`,
        priceVnd: prof.priceVnd,
        type: 'profile',
        imageUrl: '/thumbnails/voron-toolhead.svg',
        subText: `${prof.slicer} • ${prof.printerModel}`,
      });
      onShowToast(`📥 Đã thêm Profile Pro "${prof.title}" vào giỏ hàng!`);
    } else {
      setDownloadedProfiles((prev) => [...prev, prof.id]);
      const blob = new Blob(
        [
          JSON.stringify(
            {
              profileName: prof.title,
              slicer: prof.slicer,
              layerHeight: prof.layerHeightMm,
              nozzleSize: prof.nozzleSizeMm,
              speed: prof.estimatedSpeedMmS,
              verifiedBy: '3D Hub Expert Team',
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
      a.download = prof.fileName;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast(`🎉 Đang tải xuống cấu hình: ${prof.fileName}`);
    }
  };

  return (
    <div className="space-y-8 text-slate-800">
      {/* Sub Tab Switcher - VisionOS Segmented Pill Control */}
      <div className="flex items-center justify-center">
        <div className="flex items-center p-1 bg-slate-100 backdrop-blur-xl border border-slate-200 rounded-full shadow-xs">
          <button
            onClick={() => setSubTab('services')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subTab === 'services'
                ? 'bg-white text-cyan-950 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-cyan-600" />
            <span>Đặt In Dịch Vụ 3D &amp; Báo Giá Nhanh</span>
          </button>
          <button
            onClick={() => setSubTab('profiles')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subTab === 'profiles'
                ? 'bg-white text-cyan-950 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-cyan-600" />
            <span>Thư Viện Profile Slicer ({profiles.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DỊCH VỤ IN 3D & BÁO GIÁ TỰ ĐỘNG */}
      {subTab === 'services' && (
        <div className="space-y-8">
          {/* INTERACTIVE INSTANT QUOTE CALCULATOR */}
          <div className="rounded-[36px] vision-glass-panel border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden bg-white/90">
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold mb-2">
                    <Calculator className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Công Cụ Báo Giá In 3D Trực Tuyến</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Tính Báo Giá Đơn Hàng In 3D Tức Thì
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Chọn công nghệ, khối lượng mô hình để nhận chi phí tạm tính và thời gian hoàn thiện dự kiến.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-emerald-800 font-bold shadow-2xs">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Xử lý &amp; giao hàng trong 24h</span>
                </div>
              </div>

              {/* Calculator Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Controls */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Step 1: Select Technology */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 block">
                      1. Chọn Công Nghệ In
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {technologies.map((t) => {
                        const isSelected = quoteParams.technology === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleTechChange(t.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-50/90 border-cyan-400 ring-2 ring-cyan-400/40 text-slate-900 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-900">{t.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Weight Slider (Grams) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        2. Khối Lượng Mô Hình Dự Kiến (Gram)
                      </label>
                      <div className="flex items-center gap-1 bg-white border border-slate-300 px-3 py-1 rounded-full shadow-2xs">
                        <span className="text-sm font-extrabold text-cyan-800 font-mono">{quoteParams.weightGrams}</span>
                        <span className="text-xs text-slate-600 font-semibold">g</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={10}
                      max={600}
                      step={10}
                      value={quoteParams.weightGrams}
                      onChange={(e) => handleWeightChange(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-cyan-600"
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>10g (Phụ kiện nhỏ)</span>
                      <span>100g (Mẫu chuẩn)</span>
                      <span>300g (Chi tiết cơ khí)</span>
                      <span>600g+ (Khổ lớn)</span>
                    </div>
                  </div>

                  {/* Step 3: Material & Post Processing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-2">
                        Loại Vật Liệu
                      </label>
                      <select
                        value={quoteParams.material}
                        onChange={(e) => {
                          const newParams = { ...quoteParams, material: e.target.value };
                          setQuoteParams(newParams);
                          onCalculateQuote(newParams);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs font-semibold"
                      >
                        <option value="PLA Basic">PLA Basic (Phổ thông sắc nét)</option>
                        <option value="PLA Tough">PLA Tough (Chịu va đập)</option>
                        <option value="PETG Chịu nhiệt">PETG (Bền nhiệt 70°C)</option>
                        <option value="Nylon PA-CF">Nylon PA-CF (Sợi Carbon siêu cứng)</option>
                        <option value="Resin 8K Tiêu chuẩn">Resin 8K Tiêu chuẩn (Figure)</option>
                        <option value="Resin ABS-Like">Resin ABS-Like (Cơ khí chính xác)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-2">
                        Gói Hậu Kỳ Hoàn Thiện
                      </label>
                      <select
                        value={quoteParams.postProcessing}
                        onChange={(e) => {
                          const newParams = {
                            ...quoteParams,
                            postProcessing: e.target.value as any,
                          };
                          setQuoteParams(newParams);
                          onCalculateQuote(newParams);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-2xs font-semibold"
                      >
                        <option value="none">Nguyên bản sau in (Tự bóc support)</option>
                        <option value="support_removal">Thợ làm sạch &amp; bóc Support (+30k)</option>
                        <option value="sanding_primer">Mài nhẵn + Phun lót Primer (+90k)</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 4: Optional AI 3D Model Generation Tier */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        <span>3. Kèm Tạo Mô Hình 3D AI Từ Ảnh (Tùy Chọn):</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'Không dùng AI', price: '+0 đ', sub: 'Đã có file 3D' },
                        { id: 'tripo_fast', label: '1. In Thường', price: '+500 đ', sub: 'Tripo H3.1' },
                        { id: 'trellis_pro', label: '2. In Nâng Cao', price: '+2.500 đ', sub: 'Trellis 2' },
                        { id: 'meshy_ultra', label: '3. In 4K Master', price: '+40.000 đ', sub: 'Meshy 6' },
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => {
                            const newParams = { ...quoteParams, aiTier: tier.id as any };
                            setQuoteParams(newParams);
                            onCalculateQuote(newParams);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            (quoteParams.aiTier || 'none') === tier.id
                              ? 'bg-cyan-50/90 border-cyan-400 ring-2 ring-cyan-400/40 text-slate-900 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-900">{tier.label}</div>
                          <div className="text-[10px] text-emerald-700 font-mono font-bold">{tier.price}</div>
                          <div className="text-[9px] text-slate-500">{tier.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Result Card */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-xs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Bảng Chi Phí Dự Kiến
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {isCalculatingQuote ? 'Đang tính...' : 'Tự Động Tính'}
                      </span>
                    </div>

                    {quoteResult && (
                      <div className="space-y-2.5 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span>Chi phí in ({quoteParams.weightGrams}g):</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {quoteResult.materialCostVnd.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        {quoteResult.postProcessingCostVnd > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Phí xử lý hậu kỳ:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              +{quoteResult.postProcessingCostVnd.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        )}

                        {quoteResult.aiFeeVnd > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Phí tạo mô hình 3D AI:</span>
                            <span className="font-bold text-amber-700 font-mono">
                              +{quoteResult.aiFeeVnd.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span>Thời gian in ước tính:</span>
                          <span className="font-bold text-cyan-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            ~{quoteResult.estimatedPrintHours} giờ
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Thời gian giao hàng:</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" />
                            {quoteResult.estimatedDeliveryDays === 1 ? 'Trong 24 giờ' : '48 giờ'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                          <span className="text-sm font-black text-slate-900">Tổng chi phí:</span>
                          <div className="text-right">
                            <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                              {quoteResult.totalVnd.toLocaleString('vi-VN')} đ
                            </div>
                            <span className="text-[10px] text-slate-500">Đã bao gồm VAT &amp; vật liệu</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
                    <button
                      onClick={() => onOpenOrderModal(undefined, quoteResult || undefined)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Đặt In Theo Báo Giá Này</span>
                    </button>

                    <p className="text-[10px] text-center text-slate-500">
                      Hỗ trợ kiểm tra file 3D (.STL, .3MF, .STEP) miễn phí trước khi bấm máy in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 CORE PRINTING PACKAGES CARDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-600" />
                <span>Các Gói Dịch Vụ In 3D Chuyên Nghiệp</span>
              </h2>
              <span className="text-xs text-slate-500 font-semibold">{services.length} công nghệ sẵn sàng</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="rounded-[32px] vision-glass hover:border-cyan-400 p-6 transition-all duration-300 flex flex-col justify-between border border-slate-200/90 text-slate-900 shadow-xs bg-white/90"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{srv.name}</h3>
                          {srv.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-900 border border-cyan-200">
                              {srv.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-emerald-700 font-bold font-mono mt-1">
                          Đơn giá: {srv.pricePerGramVnd.toLocaleString('vi-VN')} đ / gram
                        </div>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shrink-0 overflow-hidden relative shadow-2xs">
                        <Image
                          src={srv.thumbnailUrl}
                          alt={srv.name}
                          width={36}
                          height={36}
                          unoptimized={srv.thumbnailUrl?.endsWith?.('.svg')}
                          className="object-contain max-w-full max-h-full"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{srv.description}</p>

                    {/* Specs Table */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div>
                        <span className="text-slate-500">Độ chính xác:</span>{' '}
                        <span className="text-slate-900 font-semibold">{srv.precision}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Thời gian trả:</span>{' '}
                        <span className="text-slate-900 font-semibold">{srv.turnaroundTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Khổ in tối đa:</span>{' '}
                        <span className="text-slate-900 font-semibold">
                          {srv.maxVolumeMm.x}×{srv.maxVolumeMm.y}×{srv.maxVolumeMm.z} mm
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Đơn tối thiểu:</span>{' '}
                        <span className="text-slate-900 font-semibold font-mono">
                          {srv.minOrderVnd.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Vật liệu: <span className="text-slate-900 font-semibold">{srv.materialsAvailable.join(', ')}</span>
                    </span>

                    <button
                      onClick={() => onOpenOrderModal(srv)}
                      className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                    >
                      Đặt in gói này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: THƯ VIỆN PROFILE IN CHUYÊN NGHIỆP */}
      {subTab === 'profiles' && (
        <div className="space-y-6">
          {/* Slicer filter chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 vision-glass p-4 rounded-[28px] border border-slate-200/90 shadow-xs bg-white/85">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">Phần mềm Slicer:</span>
              <div className="flex flex-wrap gap-1">
                {slicers.map((sl) => (
                  <button
                    key={sl}
                    onClick={() => setSelectedSlicer(sl)}
                    className={`px-3.5 py-1.5 rounded-full transition-all text-xs font-bold cursor-pointer ${
                      selectedSlicer === sl
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {sl === 'all' ? 'Tất cả Slicer' : sl}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Được test thực tế trên máy in trước khi chia sẻ</span>
            </div>
          </div>

          {/* Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {profiles.map((prof) => {
              const isDownloaded = downloadedProfiles.includes(prof.id);
              const isFree = prof.priceVnd === 0;

              return (
                <div
                  key={prof.id}
                  className="rounded-[32px] vision-glass hover:border-cyan-400 p-6 transition-all duration-300 flex flex-col justify-between border border-slate-200/90 text-slate-900 shadow-xs bg-white/90"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{prof.title}</h3>
                          {prof.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                              {prof.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-cyan-800 font-bold mt-1">
                          Máy in: {prof.printerModel}
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                        {prof.slicer}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{prof.description}</p>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                      <div>
                        <div className="text-slate-500">Độ dày layer</div>
                        <div className="font-bold text-slate-900 mt-0.5">{prof.layerHeightMm}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Đầu phun</div>
                        <div className="font-bold text-slate-900 mt-0.5">{prof.nozzleSizeMm}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Tốc độ thành</div>
                        <div className="font-bold text-emerald-700 mt-0.5">
                          {prof.estimatedSpeedMmS > 0 ? `${prof.estimatedSpeedMmS} mm/s` : 'SLA Fine'}
                        </div>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1">
                      {prof.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {isFree ? (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          Miễn phí 100%
                        </span>
                      ) : (
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {prof.priceVnd.toLocaleString('vi-VN')} đ
                        </div>
                      )}
                      <span className="text-[11px] text-slate-500 ml-2">
                        {prof.downloads} lượt tải
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadProfile(prof)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs cursor-pointer"
                    >
                      {isFree ? (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>{isDownloaded ? 'Tải lại Profile' : 'Tải File Cấu Hình'}</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          <span>Mở khóa Profile Pro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
