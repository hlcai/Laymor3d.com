'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Printer,
  Box,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Users,
  MapPin,
  Phone,
  Clock,
  ShoppingBag,
  Wrench,
  Check,
} from '@/components/icons/MinimalIcons';
import { ThreeCanvasViewer } from '@/modules/studio/ui/ThreeCanvasViewer';
import { useModelViewer } from '@/modules/studio/hooks/useModelViewer';
import { SAMPLE_PRINT_MODELS, SampleModelId } from '@/backend/domain/sample-models';
import { LaymorLogo, LaymorRefTag } from '@/components/common/LaymorLogo';
import {
  HERO_SLIDE_BANNERS,
  LAYMOR_PRINTERS_CATALOG,
  LAYMOR_FILAMENTS_CATALOG,
} from '@/backend/domain/laymor-catalog';

const ABOUT_PILLARS = [
  {
    id: 'materials',
    title: 'MATERIALS',
    description: 'Nhựa cuộn và sản phẩm, quà tặng doanh nghiệp',
    detail: 'Bambu Lab • Creality • LAYMOR Studio Filament',
    href: '/shop?category=filaments',
    icon: Layers,
    accent: 'from-[#3FA9F5] to-[#1A75FF]',
  },
  {
    id: 'machines',
    title: 'MACHINES',
    description: 'Máy in 3D & linh kiện',
    detail: 'Bambu Lab • Flashforge • Snapmaker • Creality • Elegoo',
    href: '/shop?category=printers',
    icon: Printer,
    accent: 'from-[#1A75FF] to-[#1E40AF]',
  },
  {
    id: 'ai-studio',
    title: 'AI STUDIO',
    description: 'Sáng tạo và mô phỏng in 3D',
    detail: 'Chuyển ảnh 2D → 3D & Buồng giả lập cắt lớp chuẩn Bambu',
    href: '/studio',
    icon: Sparkles,
    accent: 'from-[#0284C7] to-[#1D4ED8]',
  },
  {
    id: 'community',
    title: 'COMMUNITY',
    description: 'Giao lưu, kết nối và tạo sân chơi cộng đồng',
    detail: 'LAYMOR Makers Club • Contest sáng tạo • Blog kỹ thuật',
    href: '/makers-club',
    icon: Users,
    accent: 'from-[#0F2942] to-[#1E40AF]',
  },
];

export default function HomePage() {
  // 1. State cho 5 Banner Hero Slider (Trang 1 PDF)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 2. State cho khu vực giới thiệu 2 AI Tool phong cách Meshy (Trang 7 PDF)
  const [activeAiToolTab, setActiveAiToolTab] = useState<'2d_to_3d' | 'simulator'>('2d_to_3d');
  const [selectedModelId, setSelectedModelId] = useState<SampleModelId>('dragon');

  // 3. State cho tab trưng bày Máy in / Nhựa / Showroom trên Trang chủ (Trang 2 PDF)
  const [homeCatalogTab, setHomeCatalogTab] = useState<'printers' | 'filaments' | 'showroom'>(
    'printers'
  );

  const {
    options: viewerOptions,
    toggleAutoRotate,
    toggleWireframe,
    toggleDimensions,
  } = useModelViewer('#3FA9F5');

  const selectedModel =
    SAMPLE_PRINT_MODELS.find((m) => m.id === selectedModelId) || SAMPLE_PRINT_MODELS[0];

  // Tự động chuyển slide mỗi 6 giây
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDE_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentBanner = HERO_SLIDE_BANNERS[activeSlideIndex];

  const handlePrevSlide = () => {
    setActiveSlideIndex(
      (prev) => (prev - 1 + HERO_SLIDE_BANNERS.length) % HERO_SLIDE_BANNERS.length
    );
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDE_BANNERS.length);
  };

  return (
    <div className="space-y-16">
      {/* =====================================================================
          PHẦN 1: HERO SLIDER 5 BANNER THEO TỪNG DỊCH VỤ (TRANG 1 PDF)
          1. Máy in | 2. Nhựa | 3. Mô hình và file mô hình | 4. Mô phỏng in 3D | 5. Showroom
          Mỗi banner kèm nút "MUA NGAY" link tới trang sản phẩm tương ứng
         ===================================================================== */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#121316] via-[#241B15] to-[#0F172A] text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] border border-slate-800"
      >
        {/* Ánh sáng studio nền */}
        <div className="absolute -top-24 right-1/4 w-[520px] h-[520px] rounded-full bg-[#3FA9F5]/15 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[420px] h-[420px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

        {/* Thanh chọn nhanh 5 Dịch Vụ trên đầu Banner */}
        <div className="relative z-20 border-b border-white/10 bg-black/25 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { idx: 0, label: '1. Máy in' },
              { idx: 1, label: '2. Nhựa' },
              { idx: 2, label: '3. Mô hình & File mô hình' },
              { idx: 3, label: '4. Mô phỏng in 3D' },
              { idx: 4, label: '5. Showroom' },
            ].map((tab) => {
              const isActive = activeSlideIndex === tab.idx;
              return (
                <button
                  key={tab.idx}
                  type="button"
                  onClick={() => setActiveSlideIndex(tab.idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#1A75FF] text-white shadow-sm'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="hidden md:inline-block text-[11px] font-mono text-sky-300 shrink-0">
            Slide {activeSlideIndex + 1} / 5
          </span>
        </div>

        {/* Nội dung chính của Banner hiện tại */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-6 sm:px-12 py-12 sm:py-16 min-h-[460px]">
          {/* Cột trái: Thông điệp & Nút "MUA NGAY" (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-sky-300 text-xs font-bold tracking-wider uppercase">
              <span>{currentBanner.categoryLabel}</span>
              <span className="text-white/30">•</span>
              <span className="text-white">{currentBanner.badgeText}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-[1.15]">
                {currentBanner.title}
              </h1>
              <p className="text-sm sm:text-base font-semibold text-sky-300">
                {currentBanner.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {currentBanner.description}
              </p>
            </div>

            {/* 3 Chỉ số nổi bật của Banner */}
            <div className="grid grid-cols-3 gap-3 max-w-xl pt-1">
              {currentBanner.specs.map((sp, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    {sp.label}
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                    {sp.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Cụm nút CTA "MUA NGAY" dẫn tới trang sản phẩm tương ứng */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {currentBanner.ctaHref === '/3dsim' ? (
                <a
                  href={currentBanner.ctaHref}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1A75FF] to-[#3FA9F5] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_10px_28px_rgba(26,117,255,0.4)] transition-all active:scale-95"
                >
                  <span>{currentBanner.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  href={currentBanner.ctaHref}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1A75FF] to-[#3FA9F5] hover:from-[#1D4ED8] hover:to-[#0284C7] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_10px_28px_rgba(26,117,255,0.4)] transition-all active:scale-95"
                >
                  <span>{currentBanner.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {currentBanner.secondaryText && currentBanner.secondaryHref && (
                <Link
                  href={currentBanner.secondaryHref}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
                >
                  <span>{currentBanner.secondaryText}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Cột phải: Mô phỏng Thị Giác Studio Đặc Trưng Cho Từng Dịch Vụ (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            {currentBanner.visualType === 'printer' && (
              /* Hình 1: Cụm Máy In 3D Buồng Kín + Dual AMS trên Bục Đế Đen (Chuẩn Trang 1 PDF) */
              <div className="relative w-full max-w-md mx-auto pt-6">
                <div className="relative mx-auto w-64 sm:w-72 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 rounded-2xl p-4 border border-slate-600/80 shadow-2xl">
                  {/* Top AMS Multi-Color Unit */}
                  <div className=" -mt-10 mb-3 mx-auto w-52 h-14 rounded-2xl bg-slate-900/90 border border-slate-500/60 p-2 flex items-center justify-around shadow-lg">
                    {['#EF4444', '#22C55E', '#3FA9F5', '#F59E0B'].map((c, idx) => (
                      <div
                        key={idx}
                        className="w-9 h-9 rounded-full border-4 border-slate-700 shadow-inner"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  {/* Printer Chamber Glass */}
                  <div className="h-52 rounded-xl bg-slate-950 border border-slate-700 p-3 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px] font-mono text-sky-400">
                      <span>BAMBU H2D / X2D</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        600 mm/s
                      </span>
                    </div>
                    {/* Extruder Head & Glowing Model */}
                    <div className="my-auto flex flex-col items-center">
                      <div className="w-36 h-1.5 bg-slate-700 rounded-full relative">
                        <div className="w-6 h-7 bg-slate-300 rounded-sm absolute left-1/2 -translate-x-1/2 -top-2.5 border border-sky-400 shadow-[0_0_15px_#3FA9F5]" />
                      </div>
                      <div className="mt-4 w-20 h-20 rounded-xl bg-gradient-to-tr from-[#1A75FF] to-[#3FA9F5] opacity-90 shadow-[0_0_30px_rgba(63,169,245,0.5)] flex items-center justify-center">
                        <Box className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-sky-400/60 rounded-full" />
                  </div>
                </div>
                {/* Bục trưng bày Studio */}
                <div className="w-full h-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-t-xl border-t border-slate-700 shadow-2xl -mt-1" />
              </div>
            )}

            {currentBanner.visualType === 'filament' && (
              /* Hình 2: Bộ Cuộn Nhựa Chính Hãng Đa Màu */
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
                {[
                  { brand: 'Bambu Lab', name: 'PLA Matte Ice Blue', color: '#3FA9F5' },
                  { brand: 'Bambu Lab', name: 'PETG-HF Royal Blue', color: '#1A75FF' },
                  { brand: 'Creality', name: 'Hyper PLA 600mm/s', color: '#0284C7' },
                  { brand: 'LAYMOR', name: 'LAYMOR PRO (Coming soon)', color: '#1E3A8A' },
                ].map((spool, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col items-center text-center space-y-2"
                  >
                    <div
                      className="w-16 h-16 rounded-full border-[6px] border-slate-900 shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: spool.color }}
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-950 border border-white/30" />
                    </div>
                    <div className="text-[10px] font-bold uppercase text-sky-300">
                      {spool.brand}
                    </div>
                    <div className="text-xs font-extrabold text-white line-clamp-1">
                      {spool.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentBanner.visualType === 'models' && (
              /* Hình 3: Thư viện Mô hình & File 3MF/STL */
              <div className="w-full max-w-sm mx-auto p-6 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300 uppercase">
                    LAYMOR 3D Model Library
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 text-[10px] font-bold">
                    .3MF / .STL
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SAMPLE_PRINT_MODELS.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-1"
                    >
                      <div className="text-xs font-bold text-white truncate">
                        {m.name.split('-')[0].trim()}
                      </div>
                      <div className="text-[10px] text-slate-400">{m.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentBanner.visualType === 'simulator' && (
              /* Hình 4: Mô phỏng in 3D & Tree Support */
              <div className="w-full max-w-sm mx-auto p-6 rounded-3xl bg-slate-900/90 border border-sky-500/40 shadow-[0_0_40px_rgba(26,117,255,0.25)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>3D Print Simulator v2.5</span>
                  </span>
                  <span className="text-[10px] font-mono text-sky-300">2D-SDF + Tree Support</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Cấu trúc cây chống:</span>
                    <span className="text-emerald-400 font-bold">Bambu Organic Tree</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Kiểm tra va chạm:</span>
                    <span className="text-sky-300 font-bold">0% Đâm xuyên mẫu</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Định dạng xuất:</span>
                    <span className="text-amber-300 font-bold">.3MF Kèm Profile In Ngay</span>
                  </div>
                </div>
              </div>
            )}

            {currentBanner.visualType === 'showroom' && (
              /* Hình 5: Showroom Urban Green Thủ Đức */
              <div className="w-full max-w-sm mx-auto p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase">
                  <MapPin className="w-4 h-4" />
                  <span>LAYMOR Flagship Showroom</span>
                </div>
                <div className="text-base font-extrabold text-white leading-snug">
                  Shophouse B1.15 - Tháp B - The Bliss, Dự án Urban Green
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Số 1 Đường số 6, KP 26, Phường Hiệp Bình Phước, Thành phố Thủ Đức, TP.HCM
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-sky-200">
                  <span>Thứ 2 – Thứ 6: 9:00 – 18:00</span>
                  <span className="font-bold">0775 015 612</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Điều hướng Trái/Phải & 5 Vạch Chỉ Báo Ngang Ở Đáy Banner (Chuẩn Trang 1 PDF) */}
        <div className="relative z-20 pb-6 px-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={handlePrevSlide}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition cursor-pointer"
            aria-label="Banner trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 5 vạch ngang (— — — — —) giống hệt hình Trang 1 PDF */}
          <div className="flex items-center gap-2.5">
            {HERO_SLIDE_BANNERS.map((b, idx) => {
              const active = idx === activeSlideIndex;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  aria-label={`Banner ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    active
                      ? 'w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                      : 'w-6 bg-white/35 hover:bg-white/60'
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNextSlide}
            className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition cursor-pointer"
            aria-label="Banner tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* =====================================================================
          PHẦN 2: "Về LAYMOR" — 4 MỤC CHÍNH HỆ SINH THÁI (TRANG 5 PDF)
          1. MATERIALS | 2. MACHINES | 3. AI STUDIO | 4. COMMUNITY
         ===================================================================== */}
      <section className="space-y-8 pt-2">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900">Về</span>
            <LaymorLogo variant="wordmark" size="lg" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Hệ sinh thái in 3D toàn diện kết hợp máy in công nghiệp chính hãng, vật liệu cao cấp,
            trí tuệ nhân tạo AI Studio và cộng đồng sáng tạo LAYMOR Makers Club.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ABOUT_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-[32px] bg-[#E2E8F0]/75 hover:bg-white p-7 border border-slate-200/90 hover:border-[#3FA9F5] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center justify-between gap-5 hover:-translate-y-1"
              >
                <div className="space-y-4 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.accent} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-black tracking-wide text-slate-900 uppercase group-hover:text-[#1A75FF] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-300/70 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#1D4ED8]">
                  <span>Khám phá ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          PHẦN 3: GIAO DIỆN GIỚI THIỆU SƠ VỀ 2 AI TOOL (PHONG CÁCH MESHY - TRANG 7 PDF)
          • 2D → 3D
          • Mô phỏng in 3D
          Nút "Trải nghiệm ->" dẫn đến trang AI tools
         ===================================================================== */}
      <section className="rounded-[36px] bg-gradient-to-br from-[#0B0F17] via-[#111827] to-[#0F2942] text-white p-6 sm:p-10 shadow-[0_24px_60px_rgba(15,23,42,0.18)] border border-slate-800 space-y-8">
        {/* Thanh chuyển đổi 2 công cụ AI ở đỉnh khung (Giống mẫu Meshy Trang 7 PDF) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3FA9F5]">
              <Sparkles className="w-4 h-4" />
              <span>LAYMOR AI STUDIO ECOSYSTEM</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white">
              Bộ Đôi Công Cụ AI Sáng Tạo &amp; Mô Phỏng In 3D
            </h2>
          </div>

          {/* 2 Nút Tab: "2D → 3D" và "Mô phỏng in 3D" */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveAiToolTab('2d_to_3d')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeAiToolTab === '2d_to_3d'
                  ? 'bg-gradient-to-r from-[#1A75FF] to-[#3FA9F5] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>2D → 3D (Image to 3D)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAiToolTab('simulator')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeAiToolTab === 'simulator'
                  ? 'bg-gradient-to-r from-[#1A75FF] to-[#3FA9F5] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Mô phỏng in 3D</span>
            </button>
          </div>
        </div>

        {/* Nội dung chi tiết của từng AI Tool + Cửa sổ Workspace 3D trực quan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Cột trái: Giới thiệu công cụ & Nút "Trải nghiệm ->" (5 cols) */}
          <div className="lg:col-span-5 space-y-6 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800">
            {activeAiToolTab === '2d_to_3d' ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-bold">
                  <span>Công cụ AI 01 • Image to 3D</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Chuyển Đổi Hình Ảnh 2D Độ Trung Thực Cao Sang Mô Hình 3D
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tải lên hình ảnh sản phẩm, bản phác thảo hoặc concept art bất kỳ. AI Studio của
                  LAYMOR sẽ tự động tái tạo khối hình học 3D khép kín (Watertight Mesh), sẵn sàng
                  để đưa vào cắt lớp in 3D hoặc tinh chỉnh kích thước theo milimét.
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3FA9F5] shrink-0" />
                    <span>Tái tạo lưới 3D chi tiết từ 1 bức ảnh chụp 2D</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3FA9F5] shrink-0" />
                    <span>Tự động đo thể tích thực &amp; báo giá in xưởng tức thì</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3FA9F5] shrink-0" />
                    <span>Xuất file .STL / .3MF chuẩn xác cho mọi dòng máy</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <Link
                    href="/studio"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#3FA9F5] to-[#1A75FF] hover:from-[#1A75FF] hover:to-[#1D4ED8] text-white font-black text-sm shadow-[0_10px_25px_rgba(63,169,245,0.35)] transition-all active:scale-95"
                  >
                    <span>Trải nghiệm -&gt;</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <span>Công cụ AI 02 • 3D Print Simulator</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Mô Phỏng Quá Trình In 3D, Kiểm Tra Lớp In &amp; Tree Support
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Kiểm tra toàn diện bản in trước khi bấm lệnh sản xuất: cắt lớp 2D-SDF trực tiếp
                  trên trình duyệt, dựng cây chống Tree Support 2 tầng không đâm xuyên mẫu, nạp
                  trực tiếp file .gcode.3mf từ Bambu Studio và nhận tư vấn 6 nhóm thông số từ AI.
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Xem từng lớp cắt (Layer Scrubbing) &amp; sợi nhựa Volumetric 3D</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Chuyên gia AI tư vấn 6 nhóm thông số &amp; chẩn đoán ảnh lỗi</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Xuất file .3MF kèm hoặc tách riêng Tree Support để in ngay</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <a
                    href="/3dsim"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#3FA9F5] to-[#1A75FF] hover:from-[#1A75FF] hover:to-[#1D4ED8] text-white font-black text-sm shadow-[0_10px_25px_rgba(63,169,245,0.35)] transition-all active:scale-95"
                  >
                    <span>Trải nghiệm -&gt;</span>
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Cột phải: Khung Workspace 3D Tương Tác Trực Tiếp (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
              {/* Thanh tiêu đề cửa sổ kiểu trình duyệt/app chuyên nghiệp như hình mẫu Trang 7 */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">
                    {activeAiToolTab === '2d_to_3d'
                      ? 'laymor3d.com/studio — AI 2D to 3D Mesh Reconstruction'
                      : 'laymor3d.com/3dsim — Bambu Studio Slicer & Tree Support Simulator'}
                  </span>
                </div>

                {/* Chọn mẫu 3D thử nhanh */}
                <div className="flex items-center gap-1">
                  {SAMPLE_PRINT_MODELS.slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModelId(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        selectedModelId === m.id
                          ? 'bg-[#1A75FF] text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.name.split('-')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khung Canvas 3D */}
              <div className="relative h-[360px] sm:h-[400px] bg-slate-900">
                <ThreeCanvasViewer
                  options={viewerOptions}
                  sampleModelId={selectedModelId}
                  dimensionsMm={selectedModel.defaultDimensionsMm}
                  supportConfig={{
                    enabled: activeAiToolTab === 'simulator',
                    type: 'tree',
                    overhangThresholdDegrees: 45,
                    supportDensityPercent: 15,
                    interfaceLayers: 3,
                  }}
                  className="w-full h-full"
                />

                {/* Thanh công cụ nổi trong cửa sổ preview */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleAutoRotate}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                        viewerOptions.autoRotate
                          ? 'bg-[#1A75FF] text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Tự xoay 360°
                    </button>
                    <button
                      type="button"
                      onClick={toggleWireframe}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                        viewerOptions.wireframe
                          ? 'bg-[#1A75FF] text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Lưới Wireframe
                    </button>
                    <button
                      type="button"
                      onClick={toggleDimensions}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                        viewerOptions.showDimensions
                          ? 'bg-[#1A75FF] text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Kích thước mm
                    </button>
                  </div>

                  <span className="hidden sm:inline text-[11px] text-sky-300 font-mono">
                    {selectedModel.defaultDimensionsMm.x}×{selectedModel.defaultDimensionsMm.y}×
                    {selectedModel.defaultDimensionsMm.z} mm
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          PHẦN 4: TRƯNG BÀY SẢN PHẨM TRÊN TRANG CHỦ: MÁY IN • NHỰA • SHOWROOM (TRANG 2 PDF)
         ===================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1A75FF]">
              DANH MỤC CHÍNH HÃNG LAYMOR
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
              Máy In 3D, Nhựa In Chính Hãng &amp; Không Gian Showroom
            </h2>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setHomeCatalogTab('printers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                homeCatalogTab === 'printers'
                  ? 'bg-[#1A75FF] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Máy in 3D ({LAYMOR_PRINTERS_CATALOG.length})
            </button>
            <button
              type="button"
              onClick={() => setHomeCatalogTab('filaments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                homeCatalogTab === 'filaments'
                  ? 'bg-[#1A75FF] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Nhựa in 3D ({LAYMOR_FILAMENTS_CATALOG.length})
            </button>
            <button
              type="button"
              onClick={() => setHomeCatalogTab('showroom')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                homeCatalogTab === 'showroom'
                  ? 'bg-[#1A75FF] text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Showroom Thủ Đức
            </button>
          </div>
        </div>

        {homeCatalogTab === 'printers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LAYMOR_PRINTERS_CATALOG.slice(0, 8).map((printer) => (
              <div
                key={printer.id}
                className="rounded-3xl bg-white border border-slate-200/90 hover:border-[#3FA9F5] p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1D4ED8]">
                      {printer.brand}
                    </span>
                    {printer.refTag && <LaymorRefTag type={printer.refTag} size="xs" />}
                  </div>

                  {/* Khung hình minh họa máy in */}
                  <div className="h-40 rounded-2xl bg-slate-100 border border-slate-200/70 flex flex-col items-center justify-center p-4 relative">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      <Printer className="w-8 h-8 text-[#1A75FF]" />
                    </div>
                    <span className="mt-2 text-xs font-black text-slate-900">
                      {printer.modelCode}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Khổ in: {printer.buildVolumeMm}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                      {printer.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{printer.subtitle}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Giá niêm yết</div>
                    <div className="text-sm font-black text-[#1D4ED8] font-mono">
                      {printer.priceVnd.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <Link
                    href={`/shop?category=printers&brand=${encodeURIComponent(
                      printer.brand
                    )}&model=${encodeURIComponent(printer.modelCode)}`}
                    className="px-4 py-2 rounded-full bg-[#1A75FF] hover:bg-[#1D4ED8] text-white text-xs font-bold transition"
                  >
                    MUA NGAY
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {homeCatalogTab === 'filaments' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LAYMOR_FILAMENTS_CATALOG.map((fil) => (
              <div
                key={fil.id}
                className="rounded-3xl bg-white border border-slate-200/90 hover:border-[#3FA9F5] p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1D4ED8]">
                      {fil.brand}
                    </span>
                    {fil.refTag && <LaymorRefTag type={fil.refTag} size="xs" />}
                  </div>

                  <div className="h-36 rounded-2xl bg-slate-100 border border-slate-200/70 flex flex-col items-center justify-center p-4">
                    <div
                      className="w-16 h-16 rounded-full border-8 border-white shadow-md flex items-center justify-center"
                      style={{ backgroundColor: fil.colorHex }}
                    >
                      <div className="w-4 h-4 rounded-full bg-slate-200" />
                    </div>
                    <span className="mt-2 text-[11px] font-bold text-slate-700">
                      {fil.colorName}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                      {fil.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Nhiệt độ in: {fil.nozzleTemp} • Bàn: {fil.bedTemp}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-black text-[#1D4ED8] font-mono">
                    {fil.priceVnd.toLocaleString('vi-VN')} đ
                  </div>
                  <Link
                    href={`/shop?category=filaments&brand=${encodeURIComponent(fil.brand)}`}
                    className="px-4 py-2 rounded-full bg-[#1A75FF] hover:bg-[#1D4ED8] text-white text-xs font-bold transition"
                  >
                    MUA NGAY
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {homeCatalogTab === 'showroom' && (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xs">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#1D4ED8] text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>KHÔNG GIAN TRƯNG BÀY &amp; TRẢI NGHIỆM MÁY THỰC TẾ</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                LAYMOR Flagship Showroom — The Bliss, Dự Án Urban Green
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Trực tiếp trải nghiệm các dòng máy Bambu Lab A1, A2L, P2S, X2D, H2D, Flashforge
                Creator 5 Pro, Snapmaker U1, Creality K3 / i8 và Elegoo Carbon 2 Combo. Đội ngũ kỹ
                sư hỗ trợ in thử mẫu, hướng dẫn cân chỉnh máy và tư vấn thiết lập Print Farm 1:1.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-slate-900">Địa chỉ Showroom:</div>
                  <div className="text-slate-600 mt-0.5">
                    Shop house B1.15 - Tháp B - The Bliss, Dự án Urban Green, Số 1 Đường số 6, KP
                    26, P. Hiệp Bình Phước, TP. Thủ Đức, TP.HCM
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900">Giờ mở cửa &amp; Liên hệ:</div>
                  <div className="text-slate-600">Thứ 2 – Thứ 6: 9:00 AM – 18:00 PM</div>
                  <div className="font-bold text-[#1D4ED8]">Hotline: 0775 015 612</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-[#0F2942] to-[#1D4ED8] text-white text-center space-y-4">
              <LaymorLogo variant="wordmark" size="lg" invertOnDark />
              <p className="text-xs text-sky-100">
                Đặt lịch hẹn trải nghiệm máy in 3D &amp; nhận mẫu in thử miễn phí tại Showroom Thủ
                Đức
              </p>
              <Link
                href="/about#showroom"
                className="px-6 py-3 rounded-full bg-white text-[#0F2942] font-extrabold text-xs uppercase tracking-wider shadow-md hover:bg-sky-50 transition"
              >
                Xem Chi Tiết Showroom -&gt;
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          PHẦN 5: BANNER CỘNG ĐỒNG "LAYMOR MAKERS CLUB" (TRANG 6 PDF)
          Text:
          LAYMOR MAKERS CLUB
          Hãy tham gia cùng chúng tôi
          Tone theo guideline
         ===================================================================== */}
      <section className="relative rounded-[28px] overflow-hidden bg-gradient-to-r from-[#0B192C] via-[#0F2942] to-[#1E40AF] text-white px-6 sm:px-12 py-10 sm:py-12 shadow-[0_20px_50px_rgba(15,41,66,0.25)] border border-[#1E3A8A]">
        {/* Họa tiết lưới hình học chìm giống ảnh mẫu Trang 6 PDF */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 50%, #3FA9F5 0%, transparent 55%), repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 28px)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8CE0FF]">
              <span>COMMUNITY • CONTEST • BLOG</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-wide uppercase text-white">
              LAYMOR MAKERS CLUB
            </h2>
            <p className="text-sm sm:text-lg text-sky-100 font-medium">
              Hãy tham gia cùng chúng tôi
            </p>
          </div>

          <Link
            href="/makers-club"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white hover:bg-sky-50 text-[#0F2942] font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95 shrink-0"
          >
            <span>THAM GIA CỘNG ĐỒNG</span>
            <ArrowRight className="w-4 h-4 text-[#1A75FF]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
