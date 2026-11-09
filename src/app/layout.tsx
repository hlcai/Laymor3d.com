import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LAYMOR — From layers to form | Máy In 3D, Nhựa In & AI Studio',
  description:
    'Hệ sinh thái in 3D toàn diện LAYMOR (Công ty TNHH Halocom E-commerce): Phân phối máy in 3D Bambu Lab, Creality, Snapmaker, Flashforge, Elegoo, nhựa in chính hãng, AI Studio 2D sang 3D và Mô phỏng in 3D.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} h-full overflow-x-hidden bg-[var(--background)] text-[var(--vision-text-primary)] antialiased transition-colors duration-500`}>
      <body className={`${plusJakartaSans.className} min-h-full overflow-x-hidden flex flex-col bg-[var(--background)] [background-image:var(--page-radial)] text-[var(--vision-text-primary)] relative selection:bg-sky-100 selection:text-sky-900 transition-colors duration-500`}>
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
          <Footer />
        </div>
      </body>
    </html>
  );
}
