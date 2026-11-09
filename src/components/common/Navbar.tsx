'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Sparkles,
  Wallet,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Search,
  ChevronDown,
  Building2,
  ChevronRight,
  Store,
  User,
  Users,
  Menu,
  X,
  Cpu,
  LogIn,
  LogOut,
  ShieldCheck,
  BookOpen,
  Printer,
  Layers,
  Wrench,
  Award,
  FileText,
} from '@/components/icons/MinimalIcons';
import { useUserWallet } from '@/hooks/useUserWallet';
import { useUserSession } from '@/hooks/useUserSession';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { GoogleAuthModal } from '@/components/common/GoogleAuthModal';
import { LaymorLogo, LaymorRefTag } from '@/components/common/LaymorLogo';
import {
  LAYMOR_PRINTER_BRANDS,
  LAYMOR_PRINTERS_CATALOG,
  LAYMOR_FILAMENT_BRANDS,
  LAYMOR_FILAMENTS_CATALOG,
  LAYMOR_ACCESSORIES_CATALOG,
} from '@/backend/domain/laymor-catalog';
import { UserRole } from '@/backend/domain/user';

type ActiveMegaMenu = 'shop' | 'ai_studio' | 'makers_club' | null;
type ShopRootCategory = 'printers' | 'filaments' | 'accessories';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { balanceVnd, isTopUpModalOpen, setIsTopUpModalOpen, topUpBalance } = useUserWallet();
  const { currentUser, permissions, logout } = useUserSession();
  const { isModuleVisible } = useModulePermissions();

  const [activeMegaMenu, setActiveMegaMenu] = useState<ActiveMegaMenu>(null);
  const [shopCategory, setShopCategory] = useState<ShopRootCategory>('printers');
  const [selectedPrinterBrand, setSelectedPrinterBrand] = useState<string>('Bambu Lab');
  const [selectedFilamentBrand, setSelectedFilamentBrand] = useState<string>('Bambu Lab');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMega = (menu: ActiveMegaMenu) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMegaMenu(menu);
  };

  const scheduleCloseMega = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 160);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveMegaMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveMegaMenu(null);
  }, [pathname]);

  useEffect(() => {
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('laymor-open-login', handleOpenLogin);
      return () => window.removeEventListener('laymor-open-login', handleOpenLogin);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(searchInput.trim())}`);
    setIsSearchOpen(false);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return { text: 'ADMIN', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'mod':
        return { text: 'MOD', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'seller':
        return { text: 'SELLER', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'staff':
        return { text: 'STAFF', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      default:
        return { text: 'USER', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const currentBadge = getRoleBadge(currentUser?.role);
  const isAdmin = currentUser?.role === 'admin';
  const hasAdminAccess =
    Boolean(currentUser) && permissions.canAccessAdmin && isModuleVisible('admin_hub');

  const activePrinters = LAYMOR_PRINTERS_CATALOG.filter(
    (p) => p.brand === selectedPrinterBrand
  );
  const activeFilaments = LAYMOR_FILAMENTS_CATALOG.filter(
    (f) => f.brand === selectedFilamentBrand
  );

  return (
    <>
      <header
        ref={headerRef}
        onMouseLeave={scheduleCloseMega}
        className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
      >
        <div className="max-w-7xl mx-auto h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* 1. LOGO LAYMOR CHÍNH THỨC (TRÁI - TRANG 1 PDF) */}
          <Link
            href="/"
            className="flex items-center shrink-0 py-2 focus:outline-none group"
            onMouseEnter={() => setActiveMegaMenu(null)}
          >
            <LaymorLogo
              variant="wordmark"
              size="md"
              className="group-hover:opacity-95 transition-opacity"
            />
          </Link>

          {/* 2. THANH MENU TRUNG TÂM 5 MỤC: HOME | SHOP | AI STUDIO | MAKERS CLUB | ABOUT */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
            {/* HOME */}
            <Link
              href="/"
              onMouseEnter={() => setActiveMegaMenu(null)}
              className={`text-sm font-bold uppercase tracking-wider py-6 border-b-2 transition-colors ${
                pathname === '/'
                  ? 'border-[#1A75FF] text-[#1A75FF]'
                  : 'border-transparent text-slate-900 hover:text-[#1A75FF]'
              }`}
            >
              HOME
            </Link>

            {/* SHOP (Có Mega-Menu Cây Thư Mục 3 Cấp - Trang 2, 3, 4) */}
            <div
              onMouseEnter={() => openMega('shop')}
              className="relative py-6"
            >
              <Link
                href="/shop"
                className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider border-b-2 pb-0.5 transition-colors ${
                  pathname.startsWith('/shop') || activeMegaMenu === 'shop'
                    ? 'border-[#1A75FF] text-[#1A75FF]'
                    : 'border-transparent text-slate-900 hover:text-[#1A75FF]'
                }`}
              >
                <span>SHOP</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMegaMenu === 'shop' ? 'rotate-180 text-[#1A75FF]' : 'text-slate-500'
                  }`}
                />
              </Link>
            </div>

            {/* AI STUDIO (Kèm Tag "New" & Hiển thị thẳng 3 mục - Trang 2 & 3) */}
            {isModuleVisible('studio') && (
              <div
                onMouseEnter={() => openMega('ai_studio')}
                className="relative py-6"
              >
                <Link
                  href="/studio"
                  className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider border-b-2 pb-0.5 transition-colors ${
                    pathname.startsWith('/studio') || activeMegaMenu === 'ai_studio'
                      ? 'border-[#1A75FF] text-[#1A75FF]'
                      : 'border-transparent text-slate-900 hover:text-[#1A75FF]'
                  }`}
                >
                  <span>AI STUDIO</span>
                  <LaymorRefTag type="new" size="xs" />
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeMegaMenu === 'ai_studio' ? 'rotate-180 text-[#1A75FF]' : 'text-slate-500'
                    }`}
                  />
                </Link>
              </div>
            )}

            {/* MAKERS CLUB (Hiển thị thẳng 3 mục Community, Contest, Blog - Trang 2 & 3) */}
            <div
              onMouseEnter={() => openMega('makers_club')}
              className="relative py-6"
            >
              <Link
                href="/makers-club"
                className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider border-b-2 pb-0.5 transition-colors ${
                  pathname.startsWith('/makers-club') || activeMegaMenu === 'makers_club'
                    ? 'border-[#1A75FF] text-[#1A75FF]'
                    : 'border-transparent text-slate-900 hover:text-[#1A75FF]'
                }`}
              >
                <span>MAKERS CLUB</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMegaMenu === 'makers_club'
                      ? 'rotate-180 text-[#1A75FF]'
                      : 'text-slate-500'
                  }`}
                />
              </Link>
            </div>

            {/* ABOUT */}
            <Link
              href="/about"
              onMouseEnter={() => setActiveMegaMenu(null)}
              className={`text-sm font-bold uppercase tracking-wider py-6 border-b-2 transition-colors ${
                pathname.startsWith('/about')
                  ? 'border-[#1A75FF] text-[#1A75FF]'
                  : 'border-transparent text-slate-900 hover:text-[#1A75FF]'
              }`}
            >
              ABOUT
            </Link>
          </nav>

          {/* 3. CỤM BIỂU TƯỢNG BÊN PHẢI: SEARCH | CART | ACCOUNT (+ ADMIN / WALLET KHI ĐĂNG NHẬP) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Nút Quản Trị nhanh cho Admin/Mod */}
            {hasAdminAccess && (
              <Link
                href="/admin"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  pathname === '/admin'
                    ? 'bg-blue-50 text-[#1D4ED8] border-blue-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Trung tâm Quản trị hệ thống"
              >
                <Building2 className="w-3.5 h-3.5 text-[#1A75FF]" />
                <span className="hidden xl:inline">Quản Trị</span>
              </Link>
            )}

            {/* Ví điện tử khi đã đăng nhập */}
            {currentUser && isModuleVisible('wallet') && (
              <button
                onClick={() => setIsTopUpModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                title="Số dư ví LAYMOR"
              >
                <Wallet className="w-3.5 h-3.5 text-[#1A75FF]" />
                <span suppressHydrationWarning className="font-mono text-[#0F2942]">
                  {new Intl.NumberFormat('en-US').format(
                    currentUser.walletBalanceVnd ?? balanceVnd
                  )}{' '}
                  đ
                </span>
              </button>
            )}

            {/* Icon 1: Tìm kiếm (Search - Trang 1 PDF) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full text-slate-800 hover:text-[#1A75FF] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tìm kiếm máy in, nhựa in & mô hình 3D"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Icon 2: Giỏ hàng (Cart - Trang 1 PDF) */}
            <Link
              href="/shop"
              className="relative p-2 rounded-full text-slate-800 hover:text-[#1A75FF] hover:bg-slate-100 transition-colors"
              title="Giỏ hàng & Cửa hàng LAYMOR"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {/* Icon 3: Tài khoản (Account - Trang 1 PDF) */}
            {!currentUser ? (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="p-2 rounded-full text-slate-800 hover:text-[#1A75FF] hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Đăng nhập tài khoản LAYMOR"
              >
                <div className="w-7 h-7 rounded-full border-2 border-slate-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </button>
            ) : (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 pr-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                >
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-[#1A75FF] text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.avatar ? (
                      <Image
                        src={currentUser.avatar}
                        alt={currentUser.name || 'User'}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span>{(currentUser.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${currentBadge.bg}`}
                  >
                    {currentBadge.text}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl p-2 bg-white border border-slate-200 shadow-2xl z-50 space-y-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {currentUser.name}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${currentBadge.bg}`}
                        >
                          {currentBadge.text}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        ID: <span className="font-mono font-semibold">{currentUser.username}</span>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-[#1A75FF]" />
                        <span>Hồ Sơ &amp; Lịch Sử Đơn In</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                          Quyền Quản Trị Viên Tối Cao
                        </div>
                        <Link
                          href="/admin?tab=users"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-800 bg-rose-50/70 hover:bg-rose-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-rose-600" />
                            <span>Tạo Tài Khoản &amp; Tắt/Mở Vùng UI</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-500" />
                        </Link>
                        <Link
                          href="/admin?tab=knowledge"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4 text-amber-600" />
                            <span>Chỉnh Sửa Kiến Thức Giả Lập</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                        </Link>
                      </>
                    )}

                    {hasAdminAccess && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-[#1A75FF]" />
                          <span>Trung Tâm Quản Trị Hệ Thống</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#1A75FF]" />
                      </Link>
                    )}

                    <div className="pt-1 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Đăng Xuất Tài Khoản</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-100"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* THANH TÌM KIẾM NHANH KHI BẤM ICON SEARCH */}
        {isSearchOpen && (
          <div className="border-t border-slate-200 bg-slate-50/95 py-3 px-4">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-3xl mx-auto flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm máy in Bambu Lab H2D, X2D, P2S, A1, Creality K3, nhựa PLA/PETG..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#1A75FF]"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#1A75FF] hover:bg-[#1D4ED8] text-white text-xs font-bold transition cursor-pointer"
              >
                Tìm kiếm
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* =====================================================================
            MEGA-MENU 1: CHỈ MỤC "SHOP" — CÂY THƯ MỤC 3 CỘT (TRANG 2, 3, 4 PDF)
            Quy tắc trang 4:
            - Nền bình thường: trắng trơn, không vẽ khung, chỉ có dấu ">"
            - Khung nào được chọn thì hiện màu xanh giống xanh logo + dấu ">" - hiện thư mục con
           ===================================================================== */}
        {activeMegaMenu === 'shop' && (
          <div
            onMouseEnter={() => openMega('shop')}
            onMouseLeave={scheduleCloseMega}
            className="hidden lg:block w-full bg-white border-t border-slate-200 shadow-[0_24px_48px_rgba(15,23,42,0.12)] animate-fadeIn"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-7 grid grid-cols-12 gap-6">
              {/* CỘT 1 (3 cols): DANH MỤC GỐC SHOP (Máy in 3D • Nhựa in 3D • Linh kiện) */}
              <div className="col-span-3 pr-4 border-r border-slate-100 space-y-1.5">
                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Danh mục sản phẩm
                </div>

                {/* Mục 1: Máy in 3D */}
                <button
                  type="button"
                  onMouseEnter={() => setShopCategory('printers')}
                  onClick={() => {
                    router.push('/shop?category=printers');
                    setActiveMegaMenu(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                    shopCategory === 'printers'
                      ? 'bg-[#3FA9F5] text-white font-bold shadow-xs'
                      : 'bg-white text-slate-800 hover:text-[#1A75FF] font-semibold'
                  }`}
                >
                  <span>Máy in 3D</span>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      shopCategory === 'printers' ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Mục 2: Nhựa in 3D */}
                <button
                  type="button"
                  onMouseEnter={() => setShopCategory('filaments')}
                  onClick={() => {
                    router.push('/shop?category=filaments');
                    setActiveMegaMenu(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                    shopCategory === 'filaments'
                      ? 'bg-[#3FA9F5] text-white font-bold shadow-xs'
                      : 'bg-white text-slate-800 hover:text-[#1A75FF] font-semibold'
                  }`}
                >
                  <span>Nhựa in 3D</span>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      shopCategory === 'filaments' ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Mục 3: Linh kiện (tag "Coming soon") */}
                <button
                  type="button"
                  onMouseEnter={() => setShopCategory('accessories')}
                  onClick={() => {
                    router.push('/shop?category=accessories');
                    setActiveMegaMenu(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                    shopCategory === 'accessories'
                      ? 'bg-[#3FA9F5] text-white font-bold shadow-xs'
                      : 'bg-white text-slate-800 hover:text-[#1A75FF] font-semibold'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>Linh kiện</span>
                    <LaymorRefTag type="coming_soon" size="xs" />
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      shopCategory === 'accessories' ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                </button>
              </div>

              {/* CỘT 2 (3 cols): ĐỂ TÊN HÃNG (Nền trắng trơn chỉ có dấu >, khi chọn hiện nền xanh + dấu >) */}
              <div className="col-span-3 pr-4 border-r border-slate-100 space-y-1.5">
                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {shopCategory === 'printers'
                    ? 'Thương hiệu máy in'
                    : shopCategory === 'filaments'
                    ? 'Thương hiệu nhựa in'
                    : 'Nhóm linh kiện & hãng'}
                </div>

                {shopCategory === 'printers' &&
                  LAYMOR_PRINTER_BRANDS.map((brand) => {
                    const isSelected = selectedPrinterBrand === brand.name;
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onMouseEnter={() => setSelectedPrinterBrand(brand.name)}
                        onClick={() => {
                          router.push(
                            `/shop?category=printers&brand=${encodeURIComponent(brand.name)}`
                          );
                          setActiveMegaMenu(null);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A75FF] text-white font-bold shadow-xs'
                            : 'bg-white text-slate-800 hover:text-[#1A75FF] font-medium'
                        }`}
                      >
                        <span>{brand.name}</span>
                        <ChevronRight
                          className={`w-4 h-4 ${
                            isSelected ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                      </button>
                    );
                  })}

                {shopCategory === 'filaments' &&
                  LAYMOR_FILAMENT_BRANDS.map((brand) => {
                    const isSelected = selectedFilamentBrand === brand.name;
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onMouseEnter={() => setSelectedFilamentBrand(brand.name)}
                        onClick={() => {
                          router.push(
                            `/shop?category=filaments&brand=${encodeURIComponent(brand.name)}`
                          );
                          setActiveMegaMenu(null);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A75FF] text-white font-bold shadow-xs'
                            : 'bg-white text-slate-800 hover:text-[#1A75FF] font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{brand.name}</span>
                          {brand.refTag && <LaymorRefTag type={brand.refTag} size="xs" />}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 ${
                            isSelected ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                      </button>
                    );
                  })}

                {shopCategory === 'accessories' &&
                  ['Build Plate', 'Hotend', 'Upgrade Parts', 'Air & Filtration'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        router.push(`/shop?category=accessories&type=${encodeURIComponent(type)}`);
                        setActiveMegaMenu(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm bg-white text-slate-800 hover:bg-[#3FA9F5] hover:text-white font-medium transition-all cursor-pointer group"
                    >
                      <span>{type}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    </button>
                  ))}
              </div>

              {/* CỘT 3 (6 cols): ĐỂ DÒNG MÁY / SẢN PHẨM CỦA HÃNG TƯƠNG ỨNG (TRANG 3 PDF) */}
              <div className="col-span-6 pl-2">
                {shopCategory === 'printers' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                          Dòng máy {selectedPrinterBrand}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {
                            LAYMOR_PRINTER_BRANDS.find((b) => b.name === selectedPrinterBrand)
                              ?.tagline
                          }
                        </p>
                      </div>
                      <Link
                        href={`/shop?category=printers&brand=${encodeURIComponent(
                          selectedPrinterBrand
                        )}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-xs font-bold text-[#1A75FF] hover:underline flex items-center gap-1"
                      >
                        <span>Xem tất cả ({activePrinters.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activePrinters.map((printer) => (
                        <Link
                          key={printer.id}
                          href={`/shop?category=printers&brand=${encodeURIComponent(
                            printer.brand
                          )}&model=${encodeURIComponent(printer.modelCode)}`}
                          onClick={() => setActiveMegaMenu(null)}
                          className="group p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {printer.brand}
                            </span>
                            {printer.refTag && <LaymorRefTag type={printer.refTag} size="xs" />}
                          </div>

                          <div className="py-2 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                              <Printer className="w-6 h-6 text-[#1A75FF]" />
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-extrabold text-slate-900 group-hover:text-[#1A75FF]">
                              {printer.modelCode}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {printer.buildVolumeMm}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {shopCategory === 'filaments' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                          Nhựa in 3D {selectedFilamentBrand}
                        </h4>
                        {selectedFilamentBrand === 'LAYMOR' && (
                          <LaymorRefTag type="coming_soon" size="xs" />
                        )}
                      </div>
                      <Link
                        href={`/shop?category=filaments&brand=${encodeURIComponent(
                          selectedFilamentBrand
                        )}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-xs font-bold text-[#1A75FF] hover:underline flex items-center gap-1"
                      >
                        <span>Xem toàn bộ bảng màu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {activeFilaments.map((fil) => (
                        <Link
                          key={fil.id}
                          href={`/shop?category=filaments&brand=${encodeURIComponent(fil.brand)}`}
                          onClick={() => setActiveMegaMenu(null)}
                          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex items-center gap-3"
                        >
                          <div
                            className="w-10 h-10 rounded-full border-4 border-white shadow-sm shrink-0"
                            style={{ backgroundColor: fil.colorHex }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {fil.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {fil.colorName} • {fil.priceVnd.toLocaleString('vi-VN')} đ
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {shopCategory === 'accessories' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                          Linh Kiện &amp; Phụ Kiện Chính Hãng
                        </h4>
                        <LaymorRefTag type="coming_soon" size="xs" />
                      </div>
                      <Link
                        href="/shop?category=accessories"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-xs font-bold text-[#1A75FF] hover:underline flex items-center gap-1"
                      >
                        <span>Xem trang Linh kiện</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {LAYMOR_ACCESSORIES_CATALOG.slice(0, 4).map((acc) => (
                        <Link
                          key={acc.id}
                          href="/shop?category=accessories"
                          onClick={() => setActiveMegaMenu(null)}
                          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 hover:border-[#3FA9F5] transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-[#1D4ED8]">
                              {acc.accessoryType}
                            </span>
                            <LaymorRefTag type="coming_soon" size="xs" />
                          </div>
                          <div className="text-xs font-bold text-slate-900 line-clamp-1">
                            {acc.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Tương thích: {acc.compatibleModels.slice(0, 4).join(', ')}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MEGA-MENU 2: "AI STUDIO" — HIỂN THỊ THẲNG 3 MỤC NHƯ HÌNH (TRANG 2 & 3 PDF)
           ===================================================================== */}
        {activeMegaMenu === 'ai_studio' && (
          <div
            onMouseEnter={() => openMega('ai_studio')}
            onMouseLeave={scheduleCloseMega}
            className="hidden lg:block w-full bg-white border-t border-slate-200 shadow-[0_24px_48px_rgba(15,23,42,0.12)] animate-fadeIn"
          >
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 grid grid-cols-3 gap-6">
              {/* 1. Image to 3D */}
              <Link
                href="/studio"
                onClick={() => setActiveMegaMenu(null)}
                className="group p-5 rounded-2xl bg-slate-50/70 hover:bg-sky-50/60 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex items-start gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F2942] to-[#1A75FF] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A75FF]">
                      Image to 3D
                    </h4>
                    <LaymorRefTag type="new" size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Chuyển đổi hình ảnh 2D thành mô hình 3D bằng AI.
                  </p>
                </div>
              </Link>

              {/* 2. 3D Print Simulator */}
              <a
                href="/3dsim"
                onClick={() => setActiveMegaMenu(null)}
                className="group p-5 rounded-2xl bg-slate-50/70 hover:bg-sky-50/60 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex items-start gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#3FA9F5] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Cpu className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A75FF]">
                      3D Print Simulator
                    </h4>
                    <LaymorRefTag type="new" size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mô phỏng quá trình in 3D, kiểm tra lớp in và quy trình sản xuất.
                  </p>
                </div>
              </a>

              {/* 3. 3D Models */}
              <Link
                href="/shop?category=models"
                onClick={() => setActiveMegaMenu(null)}
                className="group p-5 rounded-2xl bg-slate-50/70 hover:bg-sky-50/60 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex items-start gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Box className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A75FF]">
                    3D Models
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Thư viện mô hình 3D, khám phá và sưu tầm file thiết kế.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* =====================================================================
            MEGA-MENU 3: "MAKERS CLUB" — HIỂN THỊ THẲNG 3 MỤC NHƯ HÌNH (TRANG 2 & 3 PDF)
           ===================================================================== */}
        {activeMegaMenu === 'makers_club' && (
          <div
            onMouseEnter={() => openMega('makers_club')}
            onMouseLeave={scheduleCloseMega}
            className="hidden lg:block w-full bg-white border-t border-slate-200 shadow-[0_24px_48px_rgba(15,23,42,0.12)] animate-fadeIn"
          >
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 grid grid-cols-3 gap-6">
              {/* 1. Community */}
              <Link
                href="/makers-club#community"
                onClick={() => setActiveMegaMenu(null)}
                className="group p-5 rounded-2xl bg-slate-50/70 hover:bg-sky-50/60 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex items-start gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F2942] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A75FF]">
                    Community
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cộng đồng giao lưu, kết nối các Maker có cùng niềm đam mê in 3D.
                  </p>
                </div>
              </Link>

              {/* 2. Contest (tag "Coming soon") */}
              <Link
                href="/makers-club#contest"
                onClick={() => setActiveMegaMenu(null)}
                className="group p-5 rounded-2xl bg-slate-50/70 hover:bg-sky-50/60 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex items-start gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A75FF] to-[#3FA9F5] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Award className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A75FF]">
                      Contest
                    </h4>
                    <LaymorRefTag type="coming_soon" size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sân chơi sáng tạo cho cộng đồng maker — thiết kế, in 3D, và chia sẻ thành phẩm
                    của bạn với mọi người.
                  </p>
                </div>
              </Link>

              {/* 3. Blog */}
              <Link
                href="/makers-club#blog"
                onClick={() => setActiveMegaMenu(null)}
                className="group p-5 rounded-2xl bg-slate-50/70 hover:bg-sky-50/60 border border-slate-200/80 hover:border-[#3FA9F5] transition-all flex items-start gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#1A75FF]">
                    Blog
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cẩm nang kỹ thuật in 3D, đánh giá dòng máy mới và chia sẻ kinh nghiệm thực
                    chiến.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* MOBILE DRAWER */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-xl">
            <div className="flex flex-col space-y-1">
              <Link
                href="/"
                className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 hover:bg-slate-100"
              >
                HOME
              </Link>
              <Link
                href="/shop?category=printers"
                className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 hover:bg-slate-100 flex items-center justify-between"
              >
                <span>SHOP — Máy in 3D &amp; Nhựa in</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/studio"
                className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 hover:bg-slate-100 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span>AI STUDIO (Image to 3D)</span>
                  <LaymorRefTag type="new" size="xs" />
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <a
                href="/3dsim"
                className="px-3 py-2.5 rounded-xl text-sm font-bold text-[#1A75FF] bg-sky-50 flex items-center justify-between"
              >
                <span>3D Print Simulator (/3dsim)</span>
                <ChevronRight className="w-4 h-4 text-[#1A75FF]" />
              </a>
              <Link
                href="/makers-club"
                className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 hover:bg-slate-100 flex items-center justify-between"
              >
                <span>MAKERS CLUB</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/about"
                className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 hover:bg-slate-100"
              >
                ABOUT &amp; SHOWROOM
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* TopUp Modal */}
      {isTopUpModalOpen && (
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          currentBalanceVnd={currentUser?.walletBalanceVnd ?? balanceVnd}
          onTopUp={topUpBalance}
        />
      )}

      {/* Login Modal */}
      <GoogleAuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
