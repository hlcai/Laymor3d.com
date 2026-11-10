'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Truck,
  Wrench,
  Award,
  CheckCircle2,
  ExternalLink,
  Users,
} from '@/components/icons/MinimalIcons';
import { LaymorLogo } from '@/components/common/LaymorLogo';

export function Footer() {
  return (
    <footer className="mt-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors duration-300">
      {/* 1. DẢI CAM KẾT DỊCH VỤ PHÍA TRÊN FOOTER (TRANG 8 PDF - TONE XANH LAYMOR) */}
      <div
        data-force-dark="true"
        className="bg-gradient-to-r from-[#0F2942] via-[#1D4ED8] to-[#3FA9F5] text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                Hỗ Trợ 1:1
              </div>
              <div className="text-[11px] text-sky-100">Kỹ sư đồng hành trực tiếp</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                Bảo Trì Trọn Đời
              </div>
              <div className="text-[11px] text-sky-100">Chăm sóc máy chính hãng</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                Giao Hàng Toàn Quốc
              </div>
              <div className="text-[11px] text-sky-100">Đóng gói an toàn tiêu chuẩn</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                Giá Cạnh Tranh
              </div>
              <div className="text-[11px] text-sky-100">Phân phối chính ngạch VAT</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NỘI DUNG CHÍNH 3 CỘT CỦA FOOTER (TRANG 8 PDF) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* CỘT 1: CÔNG TY TNHH HALOCOM E-COMMERCE (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <LaymorLogo variant="wordmark" size="lg" />
            </Link>

            <div className="pt-1 space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F2942]">
                Công ty TNHH Halocom E-commerce
              </h3>

              <div className="text-xs font-bold uppercase text-[#1D4ED8] tracking-wide">
                Hồ Chí Minh:
              </div>

              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <MapPin className="w-4 h-4 text-[#1A75FF] shrink-0 mt-1" />
                <span>
                  <strong className="text-slate-900">Showroom:</strong> Shop house B1.15 - Tháp B -
                  The Bliss, Dự án Urban Green, Số 1 Đường số 6, KP 26, Phường Hiệp Bình Phước,
                  Thành phố Thủ Đức, TP.HCM
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600">
                <Phone className="w-4 h-4 text-[#1A75FF] shrink-0" />
                <span>
                  <strong className="text-slate-900">Hotline:</strong>{' '}
                  <a
                    href="tel:0775015612"
                    className="font-bold text-[#1D4ED8] hover:underline"
                  >
                    0775015612
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600">
                <Mail className="w-4 h-4 text-[#1A75FF] shrink-0" />
                <span>
                  <strong className="text-slate-900">Email:</strong>{' '}
                  <a
                    href="mailto:contact@laymor3d.com"
                    className="text-slate-700 hover:text-[#1D4ED8] hover:underline"
                  >
                    contact@laymor3d.com
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* CỘT 2: VỀ LAYMOR & GIỜ LÀM VIỆC (3 cols) */}
          <div className="md:col-span-3 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F2942]">
                Về LAYMOR
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-[#1A75FF] font-medium transition-colors"
                  >
                    Giới thiệu
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about#showroom"
                    className="hover:text-[#1A75FF] font-medium transition-colors"
                  >
                    Showroom
                  </Link>
                </li>
                <li>
                  <Link
                    href="/makers-club"
                    className="hover:text-[#1A75FF] font-medium transition-colors"
                  >
                    LAYMOR Makers Club
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop"
                    className="hover:text-[#1A75FF] font-medium transition-colors"
                  >
                    Chính sách bảo hành &amp; đổi trả
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1D4ED8] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>GIỜ LÀM VIỆC</span>
              </h4>
              <p className="text-xs sm:text-sm font-bold text-slate-900">Thứ 2 - Thứ 6</p>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">9:00 AM - 18:00 PM</p>
            </div>
          </div>

          {/* CỘT 3: KÊNH TMĐT VÀ MXH + TAG BỘ CÔNG THƯƠNG (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F2942]">
              KÊNH TMĐT VÀ MXH
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 inline-block">
              <LaymorLogo variant="wordmark" size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-[#3FA9F5]/10 border border-slate-200 hover:border-[#1A75FF] text-xs font-bold text-slate-800 hover:text-[#1D4ED8] transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                    TT
                  </span>
                  <span>Tiktok</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>

              <a
                href="https://shopee.vn"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-400 text-xs font-bold text-slate-800 hover:text-orange-600 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#EE4D2D] text-white flex items-center justify-center text-[10px] font-black">
                    S
                  </span>
                  <span>Shopee</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-[#1A75FF] text-xs font-bold text-slate-800 hover:text-[#1D4ED8] transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-black">
                    f
                  </span>
                  <span>Page</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>

              <Link
                href="/makers-club"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-[#1A75FF] text-xs font-bold text-slate-800 hover:text-[#1D4ED8] transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#1E40AF] text-white flex items-center justify-center text-[10px] font-black">
                    MC
                  </span>
                  <span>Cộng đồng FB</span>
                </span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Link>
            </div>

            {/* Huy hiệu ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG */}
            <div className="pt-2" data-force-dark="true">
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#00529B] text-white shadow-xs border border-[#003F7A]">
                <div className="w-8 h-8 rounded-full bg-white text-[#00529B] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-black uppercase tracking-wider">
                    ĐÃ THÔNG BÁO
                  </div>
                  <div className="text-[10px] font-semibold text-sky-100 uppercase">
                    BỘ CÔNG THƯƠNG
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM COPYRIGHT BAR */}
      <div className="border-t border-slate-200/80 bg-slate-50 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 <strong className="text-slate-800">LAYMOR</strong> — Bản quyền thuộc Công ty TNHH
            Halocom E-commerce.
          </div>
          <div className="flex items-center gap-5">
            <Link href="/overview" className="text-[#1D4ED8] font-bold hover:underline">
              Báo Cáo Tiến Độ Dự Án (/overview)
            </Link>
            <Link href="/about" className="hover:text-slate-900">
              Chính sách bảo mật
            </Link>
            <Link href="/about#showroom" className="hover:text-slate-900">
              Showroom Thủ Đức
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
