'use client';

import React, { useState } from 'react';
import { X, Shield, Lock, User, LogIn, Eye, EyeOff, AlertCircle, CheckCircle2 } from '@/components/icons/MinimalIcons';
import { useUserSession } from '@/hooks/useUserSession';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleAuthModal({ isOpen, onClose }: GoogleAuthModalProps) {
  const { login, showToast } = useUserSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ ID Đăng nhập và Mật khẩu!');
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await login(identifier.trim(), password);
      if (result.ok && result.user) {
        showToast(`Đăng nhập thành công: ${result.user.name} (${result.user.username})`);
        setIdentifier('');
        setPassword('');
        onClose();
      } else {
        setErrorMsg(result.error || 'ID đăng nhập hoặc mật khẩu không chính xác!');
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối máy chủ: ${err.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="vision-glass-panel rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200/90 bg-white text-slate-900 space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isAuthenticating}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-all disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 shadow-sm flex items-center justify-center mx-auto border border-cyan-200">
            <Shield className="w-7 h-7 text-cyan-600" />
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Đăng Nhập Hệ Thống Laymor 3D
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Nhập tài khoản được cấp phát bởi Quản trị viên để truy cập các phân vùng chức năng &amp; công cụ giả lập in 3D.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              ID Tài Khoản / Username (hoặc Email) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập ID tài khoản..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Mật Khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isAuthenticating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{isAuthenticating ? 'Đang Xác Thực...' : 'Đăng Nhập Hệ Thống'}</span>
          </button>
        </form>

        {/* Security Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Phân quyền truy cập RBAC &amp; Kiểm soát vùng chức năng theo tài khoản</span>
        </div>
      </div>
    </div>
  );
}
