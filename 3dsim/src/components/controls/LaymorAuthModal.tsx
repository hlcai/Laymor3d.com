import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  User,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Wallet,
} from '@/components/icons/MinimalIcons';
import { ILaymorUser, LaymorUserRole } from '@/hooks/useLaymorAuth';

interface LaymorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ILaymorUser | null;
  onLogin: (
    identifier: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; user?: ILaymorUser }>;
  onLogout: () => Promise<void>;
}

function getRoleBadgeMeta(role?: LaymorUserRole): { label: string; className: string } {
  switch (role) {
    case 'admin':
      return {
        label: 'ADMIN',
        className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/35',
      };
    case 'mod':
      return {
        label: 'MOD',
        className:
          'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/35',
      };
    case 'seller':
      return {
        label: 'SELLER',
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/35',
      };
    case 'staff':
      return {
        label: 'STAFF',
        className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/35',
      };
    default:
      return {
        label: 'MEMBER',
        className:
          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35',
      };
  }
}

export function LaymorAuthModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}: LaymorAuthModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!identifier.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ ID Tài khoản / Username và Mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onLogin(identifier.trim(), password);
      if (res.ok) {
        setIdentifier('');
        setPassword('');
        onClose();
      } else {
        setErrorMsg(res.error || 'ID đăng nhập hoặc mật khẩu không chính xác!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutClick = async () => {
    setIsSubmitting(true);
    try {
      await onLogout();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const badge = getRoleBadgeMeta(currentUser?.role);
  const canAccessAdminHub =
    currentUser && ['admin', 'mod', 'staff'].includes(currentUser.role);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl studio-popover p-6 sm:p-7 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Đóng hộp thoại tài khoản"
          className="absolute top-5 right-5 w-8 h-8 rounded-full studio-card hover:border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
        >
          <X size={15} />
        </button>

        {currentUser ? (
          <>
            {/* Trạng thái Đã Đăng Nhập (Đồng bộ SSO 2 chiều với Trang chủ /) */}
            <div className="flex items-center gap-3.5 pr-8">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-13 h-13 rounded-2xl object-cover border border-[var(--border-strong)] shrink-0"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl studio-gold-badge flex items-center justify-center text-base font-black shrink-0">
                  {(currentUser.name || currentUser.username || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                    {currentUser.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] truncate mt-0.5">
                  @{currentUser.username} • {currentUser.email}
                </p>
              </div>
            </div>

            {/* Số dư ví & Trạng thái đồng bộ SSO */}
            <div className="rounded-2xl glass-panel-subtle p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Wallet size={14} className="text-[var(--accent-gold)]" />
                  <span>Số dư Ví LAYMOR:</span>
                </span>
                <span className="text-sm font-mono font-bold text-[var(--accent-gold)]">
                  {Number(currentUser.walletBalanceVnd || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="pt-2 border-t studio-border flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Đã đồng bộ phiên đăng nhập 2 chiều với Trang chủ LAYMOR</span>
              </div>
            </div>

            {/* Liên kết nhanh về các phân vùng trên Trang chủ */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/profile"
                target="_top"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl studio-card hover:border-[var(--accent-gold)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <User size={13} className="text-[var(--accent-gold)]" />
                <span>Hồ Sơ &amp; Ví</span>
              </a>

              {canAccessAdminHub ? (
                <a
                  href="/admin"
                  target="_top"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl studio-gold-badge hover:opacity-90 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Shield size={13} />
                  <span>Quản Trị Admin</span>
                </a>
              ) : (
                <a
                  href="/studio"
                  target="_top"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl studio-gold-badge hover:opacity-90 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Shield size={13} />
                  <span>Mở AI Studio</span>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogoutClick}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogOut size={14} />
              <span>{isSubmitting ? 'Đang đăng xuất...' : 'Đăng Xuất Khỏi Toàn Hệ Thống'}</span>
            </button>
          </>
        ) : (
          <>
            {/* Trạng thái Chưa Đăng Nhập: Form SSO hợp nhất với Trang chủ */}
            <div className="text-center space-y-2 pt-1">
              <div className="w-13 h-13 rounded-2xl studio-gold-badge flex items-center justify-center mx-auto">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight">
                Đăng Nhập Hệ Thống LAYMOR 3D
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
                Đăng nhập 1 lần để đồng bộ xuyên suốt giữa <strong>Buồng Giả Lập /3dsim</strong> và{' '}
                <strong>Trang chủ LAYMOR</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/12 border border-rose-500/35 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
                  ID Tài Khoản / Username (hoặc Email) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập ID tài khoản (VD: hlcai_admin)..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                    required
                  />
                  <User
                    size={14}
                    className="text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
                  Mật Khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl glass-input text-xs font-mono"
                    required
                  />
                  <Lock
                    size={14}
                    className="text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-5 rounded-xl studio-cta-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <LogIn size={15} />
                <span>{isSubmitting ? 'Đang Xác Thực SSO...' : 'Đăng Nhập & Đồng Bộ'}</span>
              </button>
            </form>

            <div className="pt-2 border-t studio-border flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>Tự động chia sẻ phiên đăng nhập, Ví &amp; Quyền RBAC với Trang chủ</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
