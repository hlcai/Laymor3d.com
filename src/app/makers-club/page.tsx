'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
} from '@/components/icons/MinimalIcons';
import { LaymorLogo, LaymorRefTag } from '@/components/common/LaymorLogo';

const BLOG_ARTICLES = [
  {
    id: 'blog-1',
    category: 'Kỹ Thuật In 3D',
    title: 'Hướng Dẫn Tối Ưu Tree Support Trên Bambu Studio Không Để Lại Sẹo Bề Mặt',
    excerpt:
      'Cách thiết lập Top Z Distance, Support Interface Layers và góc Branch Angle chuẩn xác cho nhựa PLA Matte và PETG-HF.',
    date: '10/11/2026',
    readTime: '6 phút đọc',
    href: '/3dsim',
  },
  {
    id: 'blog-2',
    category: 'Đánh Giá Máy In',
    title: 'So Sánh Thực Chiến Bambu Lab H2D, X2D, P2S Với Creality K3 & Snapmaker U1',
    excerpt:
      'Phân tích chi tiết tốc độ CoreXY, khả năng in đa màu AMS/CFS và độ ổn định khi vận hành xưởng Print Farm 24/7.',
    date: '08/11/2026',
    readTime: '8 phút đọc',
    href: '/shop?category=printers',
  },
  {
    id: 'blog-3',
    category: 'AI & Thiết Kế 3D',
    title: 'Quy Trình Chuyển Ảnh Chụp 2D Thành Sản Phẩm Quà Tặng Doanh Nghiệp 3D',
    excerpt:
      'Ứng dụng công cụ AI Image-to-3D kết hợp buồng giả lập cắt lớp trực tuyến để rút ngắn 80% thời gian tạo mẫu.',
    date: '05/11/2026',
    readTime: '5 phút đọc',
    href: '/studio',
  },
];

export default function MakersClubPage() {
  return (
    <div className="space-y-14 pb-10">
      {/* 1. HERO BANNER: LAYMOR MAKERS CLUB (TRANG 6 PDF) */}
      <section className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#0B192C] via-[#0F2942] to-[#1E40AF] text-white p-8 sm:p-14 shadow-[0_24px_60px_rgba(15,41,66,0.22)] border border-[#1E3A8A]">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 50%, #3FA9F5 0%, transparent 55%), repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 28px)',
          }}
        />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#8CE0FF] text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>CỘNG ĐỒNG SÁNG TẠO IN 3D VIỆT NAM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-wide uppercase text-white">
            LAYMOR MAKERS CLUB
          </h1>

          <p className="text-base sm:text-xl text-sky-100 font-semibold">
            Hãy tham gia cùng chúng tôi — Giao lưu, kết nối và tạo sân chơi cộng đồng cho những
            người đam mê thiết kế &amp; in 3D.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-sky-50 text-[#0F2942] font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition"
            >
              <span>Tham Gia Cộng Đồng Facebook</span>
              <ExternalLink className="w-4 h-4 text-[#1A75FF]" />
            </a>
            <Link
              href="#contest"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs sm:text-sm transition"
            >
              <span>Xem Cuộc Thi Thiết Kế (Contest)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. BA TRỤ CỘT CỦA MAKERS CLUB (COMMUNITY • CONTEST • BLOG - TRANG 2 PDF) */}
      <section id="community" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Community */}
        <div className="rounded-3xl bg-white border border-slate-200 p-7 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F2942] to-[#1D4ED8] text-white flex items-center justify-center shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Community</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cộng đồng giao lưu, kết nối các Maker có cùng niềm đam mê in 3D. Chia sẻ thông số
              Profile Bambu Studio, hỏi đáp xử lý lỗi bản in và trưng bày tác phẩm thực tế.
            </p>
          </div>

          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1A75FF] hover:underline pt-2"
          >
            <span>Kết nối trên Group Cộng Đồng FB</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 2: Contest (Coming soon) */}
        <div
          id="contest"
          className="rounded-3xl bg-white border border-slate-200 p-7 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1A75FF] to-[#3FA9F5] text-white flex items-center justify-center shadow-sm">
                <Award className="w-7 h-7" />
              </div>
              <LaymorRefTag type="coming_soon" size="sm" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Contest</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sân chơi sáng tạo cho cộng đồng maker — thiết kế, in 3D, và chia sẻ thành phẩm của
              bạn với mọi người cùng cơ hội nhận giải thưởng máy in &amp; cuộn nhựa chính hãng từ
              LAYMOR.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 pt-2">
            <span>Sự kiện mùa đầu tiên đang chuẩn bị ra mắt</span>
          </div>
        </div>

        {/* Card 3: Blog */}
        <div className="rounded-3xl bg-white border border-slate-200 p-7 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-sm">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Blog</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kho bài viết chuyên sâu về vật liệu nhựa in 3D, hướng dẫn sử dụng Bambu Studio /
              OrcaSlicer, bảo dưỡng máy định kỳ và xu hướng công nghệ in 3D thế giới.
            </p>
          </div>

          <a
            href="#blog"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1A75FF] hover:underline pt-2"
          >
            <span>Đọc các bài viết mới nhất</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* 3. CHUYÊN MỤC BLOG & CẨM NANG KỸ THUẬT IN 3D */}
      <section id="blog" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1A75FF]">
              LAYMOR KNOWLEDGE &amp; BLOG
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Bài Viết &amp; Hướng Dẫn Kỹ Thuật Mới Nhất
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_ARTICLES.map((post) => (
            <Link
              key={post.id}
              href={post.href}
              className="group rounded-3xl bg-white border border-slate-200 hover:border-[#3FA9F5] p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-[#1D4ED8] font-bold border border-sky-200">
                    {post.category}
                  </span>
                  <span className="text-slate-400">{post.readTime}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A75FF] transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{post.excerpt}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1D4ED8]">
                <span>Ngày đăng: {post.date}</span>
                <span className="flex items-center gap-1">
                  Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
