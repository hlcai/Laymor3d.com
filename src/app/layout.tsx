import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/common/Navbar';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '3D HUB - Spatial 3D Studio & Maker Intelligence',
  description: 'Nền tảng 3D Hub đỉnh cao: Dựng hình 3D từ ảnh bằng AI Vision, dịch vụ in FDM & SLA xưởng Bambu Lab chuyên nghiệp, phân tích xu hướng thiết kế toàn cầu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} h-full overflow-x-hidden bg-[var(--background)] text-[var(--vision-text-primary)] antialiased transition-colors duration-500`}>
      <body className={`${plusJakartaSans.className} min-h-full overflow-x-hidden flex flex-col bg-[var(--background)] [background-image:var(--page-radial)] text-[var(--vision-text-primary)] relative selection:bg-cyan-100 selection:text-cyan-900 transition-colors duration-500`}>
        {/* Subtle Ambient Spatial Glow Behind Everything */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[15%] w-[680px] h-[540px] rounded-full bg-[var(--glow-1)] blur-[140px] pointer-events-none" />
          <div className="absolute top-[35%] right-[10%] w-[580px] h-[480px] rounded-full bg-[var(--glow-2)] blur-[150px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[30%] w-[520px] h-[440px] rounded-full bg-[var(--glow-warm)] blur-[140px] pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden w-full">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-[var(--vision-border)] bg-[var(--vision-glass-panel)] backdrop-blur-2xl py-8 text-xs text-[var(--vision-text-muted)] transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--vision-text-primary)]">3D HUB Spatial Studio</span>
                <span className="text-slate-300">•</span>
                <span className="text-[var(--vision-text-secondary)]">Apple VisionOS Spatial Glass • Clean Architecture v2</span>
              </div>
              <div className="flex items-center gap-6 text-[var(--vision-text-muted)]">
                <a href="/overview" className="text-cyan-700 font-semibold hover:underline">Báo Cáo Tiến Độ Dự Án (/overview)</a>
                <span className="hover:text-[var(--vision-text-primary)] transition-colors cursor-pointer">Bảo mật</span>
                <span className="hover:text-[var(--vision-text-primary)] transition-colors cursor-pointer">Điều khoản</span>
                <span>© 2026 3D HUB Inc.</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
