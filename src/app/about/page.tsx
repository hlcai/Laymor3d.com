'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Printer,
  Layers,
  Sparkles,
  Users,
  ShieldCheck,
  Wrench,
  Truck,
  Award,
  ArrowRight,
  CheckCircle2,
} from '@/components/icons/MinimalIcons';
import { LaymorLogo } from '@/components/common/LaymorLogo';

export default function AboutPage() {
  return (
    <div className="space-y-14 pb-10">
      {/* 1. HERO GIỚI THIỆU LAYMOR — FROM LAYERS TO FORM */}
      <section className="rounded-[32px] bg-white border border-slate-200/90 p-8 sm:p-12 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#1D4ED8] text-xs font-extrabold uppercase tracking-wider">
            <span>CÔNG TY TNHH HALOCOM E-COMMERCE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            Hệ Sinh Thái Công Nghệ In 3D Toàn Diện —{' '}
            <span className="text-[#1A75FF]">From Layers To Form</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            <strong>LAYMOR</strong> (vận hành bởi <strong>Công ty TNHH Halocom E-commerce</strong>)
            là hệ sinh thái tích hợp trọn vẹn từ phân phối máy in 3D chính hãng (Bambu Lab,
            Flashforge, Snapmaker, Creality, Elegoo), cuộn nhựa in chất lượng cao, dịch vụ quà tặng
            &amp; sản xuất 3D doanh nghiệp, đến bộ công cụ <strong>AI Studio (2D → 3D &amp; Mô
            phỏng in 3D)</strong> và sân chơi cộng đồng <strong>LAYMOR Makers Club</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              href="/shop?category=printers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1A75FF] hover:bg-[#1D4ED8] text-white font-extrabold text-xs sm:text-sm transition shadow-sm"
            >
              <span>Khám Phá Cửa Hàng LAYMOR</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#showroom"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition"
            >
              <MapPin className="w-4 h-4 text-[#1A75FF]" />
              <span>Ghé Thăm Showroom Thủ Đức</span>
            </a>
          </div>
        </div>

        {/* Logo Đầy Đủ LAYMOR (3D Layers Emblem + Wordmark + Slogan) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-50 border border-slate-200/80">
          <LaymorLogo variant="full" size="xl" />
          <div className="flex items-center gap-2.5 mt-6">
            <span className="w-7 h-7 rounded-full bg-[#8CE0FF] border border-white shadow-xs" />
            <span className="w-7 h-7 rounded-full bg-[#3FA9F5] border border-white shadow-xs" />
            <span className="w-7 h-7 rounded-full bg-[#1A75FF] border border-white shadow-xs" />
            <span className="w-7 h-7 rounded-full bg-[#1E40AF] border border-white shadow-xs" />
          </div>
        </div>
      </section>

      {/* 2. BỐN TRỤ CỘT CỐT LÕI "VỀ LAYMOR" (TRANG 5 PDF) */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">Về</span>
            <LaymorLogo variant="wordmark" size="md" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            4 mảng dịch vụ cốt lõi tạo nên hệ sinh thái in 3D khép kín của LAYMOR
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/shop?category=filaments"
            className="rounded-3xl bg-white border border-slate-200 hover:border-[#3FA9F5] p-6 shadow-xs space-y-3 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#1A75FF] flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase">MATERIALS</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Nhựa cuộn và sản phẩm, quà tặng doanh nghiệp. Cung cấp nhựa Bambu Lab, Creality và
              dòng nhựa LAYMOR chuyên dụng.
            </p>
          </Link>

          <Link
            href="/shop?category=printers"
            className="rounded-3xl bg-white border border-slate-200 hover:border-[#3FA9F5] p-6 shadow-xs space-y-3 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#1A75FF] flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase">MACHINES</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Máy in 3D &amp; linh kiện chính hãng: Bambu Lab (A1, A2L, H2D, X2D, P2S), Flashforge,
              Snapmaker, Creality, Elegoo.
            </p>
          </Link>

          <Link
            href="/studio"
            className="rounded-3xl bg-white border border-slate-200 hover:border-[#3FA9F5] p-6 shadow-xs space-y-3 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#1A75FF] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase">AI STUDIO</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sáng tạo và mô phỏng in 3D: Chuyển đổi hình ảnh 2D sang 3D bằng AI, kiểm tra lớp in
              và dựng Tree Support trực tuyến.
            </p>
          </Link>

          <Link
            href="/makers-club"
            className="rounded-3xl bg-white border border-slate-200 hover:border-[#3FA9F5] p-6 shadow-xs space-y-3 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#1A75FF] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase">COMMUNITY</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Giao lưu, kết nối và tạo sân chơi cộng đồng Maker qua các cuộc thi thiết kế Contest và
              Blog chia sẻ kinh nghiệm.
            </p>
          </Link>
        </div>
      </section>

      {/* 3. THÔNG TIN SHOWROOM & TRỤ SỞ (TRANG 8 PDF) */}
      <section
        id="showroom"
        data-force-dark="true"
        className="rounded-[32px] bg-gradient-to-br from-[#0F2942] via-[#1E3A8A] to-[#1D4ED8] text-white p-8 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
      >
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-[#8CE0FF]" />
            <span>LAYMOR SHOWROOM HỒ CHÍ MINH</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black">
            Công ty TNHH Halocom E-commerce — Showroom Trải Nghiệm Thực Tế
          </h2>

          <div className="space-y-3 text-sm text-sky-100 leading-relaxed">
            <p className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#8CE0FF] shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Địa chỉ Showroom:</strong> Shop house B1.15 - Tháp B
                - The Bliss, Dự án Urban Green, Số 1 Đường số 6, KP 26, Phường Hiệp Bình Phước,
                Thành phố Thủ Đức, TP.HCM
              </span>
            </p>

            <p className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#8CE0FF] shrink-0" />
              <span>
                <strong className="text-white">Hotline tư vấn &amp; kỹ thuật:</strong>{' '}
                <a href="tel:0775015612" className="font-extrabold text-white underline">
                  0775015612
                </a>
              </span>
            </p>

            <p className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#8CE0FF] shrink-0" />
              <span>
                <strong className="text-white">Giờ làm việc:</strong> Thứ 2 – Thứ 6 | 9:00 AM –
                18:00 PM
              </span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-extrabold text-white">
            Đặc Quyền Khi Trải Nghiệm Tại Showroom LAYMOR
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-sky-100">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#8CE0FF] shrink-0" />
              <span>Trực tiếp xem máy Bambu Lab H2D, X2D, P2S, A1 vận hành đa màu</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#8CE0FF] shrink-0" />
              <span>In thử mẫu thực tế và kiểm tra độ mịn từng loại nhựa PLA, PETG, CF</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#8CE0FF] shrink-0" />
              <span>Hỗ trợ kỹ thuật 1:1 &amp; Bảo trì trọn đời cho mọi máy phân phối</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
