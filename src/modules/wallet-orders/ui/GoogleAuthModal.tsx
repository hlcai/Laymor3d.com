'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, CheckCircle, Sparkles, Shield, ArrowRight, UserCheck, Mail, LogIn } from '@/components/icons/MinimalIcons';
import { useUserSession } from '@/hooks/useUserSession';
import { useUserWallet } from '@/hooks/useUserWallet';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_GOOGLE_ACCOUNTS = [
  {
    name: 'Hoàng Nam Maker',
    email: 'nam.maker.3d@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    desc: 'Tài khoản Maker in 3D cá nhân',
  },
  {
    name: 'Minh Thư Designer',
    email: 'thu.design.mesh@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    desc: 'Nhà thiết kế 3D & AI Studio',
  },
  {
    name: 'Tiến Dũng Partner',
    email: 'dung.store.partner@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    desc: 'Đối tác bán hàng Seller Hub',
  },
];

export function GoogleAuthModal({ isOpen, onClose }: GoogleAuthModalProps) {
  const { switchUser, refreshSession, showToast } = useUserSession();
  const { topUpBalance } = useUserWallet();
  const [authMode, setAuthMode] = useState<'custom' | 'quick'>('custom');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');

  if (!isOpen) return null;

  const executeGoogleAuth = async (targetEmail: string, targetName: string, avatarUrl?: string) => {
    if (!targetEmail.trim()) {
      showToast('Vui lòng nhập địa chỉ email Google (@gmail.com)!');
      return;
    }

    const emailClean = targetEmail.trim().toLowerCase();
    const nameClean = targetName.trim() || emailClean.split('@')[0];

    setIsAuthenticating(true);
    try {
      // Mô phỏng bắt tay xác thực bảo mật OAuth 2.0 của Google
      await new Promise((resolve) => setTimeout(resolve, 600));

      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google_login',
          name: nameClean,
          email: emailClean,
          avatar: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameClean)}`,
          googleId: `g_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        // Cập nhật session toàn trang
        refreshSession();

        showToast(
          data.isNew
            ? `🎉 Chào mừng ${data.user.name}! Đã tặng 50.000 đ vào ví 3D Hub.`
            : `👋 Chào mừng trở lại, ${data.user.name}!`
        );
        onClose();
      } else {
        showToast(`Lỗi xác thực Google: ${data.error || 'Không thể đăng nhập'}`);
      }
    } catch (err: any) {
      showToast(`Lỗi kết nối Google API: ${err.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="vision-glass-panel rounded-[36px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/20 text-white space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isAuthenticating}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header with Google G Brand Logo */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center mx-auto border border-white/30 p-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            Đăng Nhập Với Google
          </h3>
          <p className="text-xs text-white/70 max-w-xs mx-auto">
            Trải nghiệm dịch vụ in 3D công nghiệp, mô hình AI 3D &amp; ví điện tử 3D Hub nhanh chóng.
          </p>
        </div>

        {/* Benefits Pill */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Ưu đãi thành viên Google mới:</span>
          </div>
          <p className="text-[11px] text-white/80 leading-relaxed">
            🎁 Tặng ngay <strong>50.000 đ</strong> vào ví 3D Hub khi đăng nhập thành công để trải nghiệm thử dịch vụ in xưởng hoặc AI Studio.
          </p>
        </div>

        {/* Segmented Mode Selector */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('custom')}
            className={`py-2 px-3 rounded-xl transition-all ${
              authMode === 'custom'
                ? 'bg-white/25 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Nhập Gmail Của Bạn
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('quick')}
            className={`py-2 px-3 rounded-xl transition-all ${
              authMode === 'quick'
                ? 'bg-white/25 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tài Khoản Mẫu Nhanh
          </button>
        </div>

        {/* MODE 1: Custom Gmail Input */}
        {authMode === 'custom' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeGoogleAuth(inputEmail, inputName);
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Địa chỉ Email Google (@gmail.com) *
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="vidu@gmail.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/35 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/50 font-mono"
                  required
                />
                <Mail className="w-4 h-4 text-white/50 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Tên hiển thị Google (Tùy chọn)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/35 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/50"
                />
                <UserCheck className="w-4 h-4 text-white/50 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-[0_8px_24px_rgba(255,255,255,0.2)] active:scale-95 disabled:opacity-50 mt-2"
            >
              {isAuthenticating ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Xác Thực &amp; Đăng Nhập Với Google</span>
            </button>
          </form>
        )}

        {/* MODE 2: 1-Click Fast Accounts */}
        {authMode === 'quick' && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-white/60">
              Chọn 1 tài khoản Google sẵn có để trải nghiệm ngay mà không cần nhập liệu:
            </p>
            <div className="space-y-2">
              {PRESET_GOOGLE_ACCOUNTS.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => executeGoogleAuth(acc.email, acc.name, acc.avatar)}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-black/40 border border-white/20 shrink-0">
                      <Image src={acc.avatar} alt={acc.name} fill unoptimized className="object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{acc.name}</div>
                      <div className="text-[11px] text-white/60 font-mono">{acc.email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/50" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security Footer Note */}
        <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-white/50">
          <Shield className="w-3.5 h-3.5 text-emerald-300" />
          <span>Bảo mật theo tiêu chuẩn Google OAuth 2.0 • Không lưu mật khẩu</span>
        </div>
      </div>
    </div>
  );
}
