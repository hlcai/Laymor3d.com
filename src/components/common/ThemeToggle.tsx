'use client';

import React from 'react';
import { IconSun, IconMoon } from '@/components/icons/MinimalIcons';
import { useLaymorTheme } from '@/hooks/useLaymorTheme';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useLaymorTheme();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        data-testid="main-theme-toggle-pill"
        aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
          isDark
            ? 'bg-slate-800/90 border-slate-700 text-slate-100 hover:border-[#3FA9F5]'
            : 'bg-slate-100 border-slate-200 text-slate-900 hover:border-[#1A75FF]'
        } ${className}`}
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <IconSun size={16} className="text-[#3FA9F5]" aria-hidden="true" />
          ) : (
            <IconMoon size={16} className="text-[#1A75FF]" aria-hidden="true" />
          )}
          <span>{isDark ? 'Giao diện: Tối (Dark Studio)' : 'Giao diện: Sáng (Light Studio)'}</span>
        </span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            isDark ? 'bg-[#3FA9F5]/20 text-[#3FA9F5]' : 'bg-[#1A75FF]/15 text-[#1A75FF]'
          }`}
        >
          Đổi sang {isDark ? 'Sáng' : 'Tối'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-testid="main-theme-toggle-btn"
      aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      title={
        isDark
          ? 'Đang ở chế độ Tối — Nhấn để chuyển sang chế độ Sáng (Đồng bộ với /3dsim)'
          : 'Đang ở chế độ Sáng — Nhấn để chuyển sang chế độ Tối (Đồng bộ với /3dsim)'
      }
      className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
        isDark
          ? 'bg-slate-800/90 border-slate-700 text-[#3FA9F5] hover:bg-slate-700 hover:border-[#3FA9F5]'
          : 'bg-slate-100/90 border-slate-200 text-slate-800 hover:text-[#1A75FF] hover:bg-sky-50 hover:border-[#3FA9F5]'
      } ${className}`}
    >
      <span suppressHydrationWarning className="inline-flex items-center justify-center">
        {isDark ? (
          <IconSun size={18} aria-hidden="true" />
        ) : (
          <IconMoon size={18} aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
