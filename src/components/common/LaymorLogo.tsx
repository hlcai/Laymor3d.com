'use client';

import React from 'react';
import { RefTagType } from '@/backend/domain/laymor-catalog';

interface LaymorLogoProps {
  variant?: 'wordmark' | 'full' | 'mark' | 'wordmark-slogan';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  invertOnDark?: boolean;
  /** Mặc định tự động đảo chữ đen sang trắng trên nền Dark Mode mà vẫn giữ nguyên sắc xanh LAYMOR */
  adaptiveTheme?: boolean;
}

const SIZE_CLASSES: Record<
  NonNullable<LaymorLogoProps['variant']>,
  Record<NonNullable<LaymorLogoProps['size']>, { cls: string; w: number; h: number }>
> = {
  wordmark: {
    xs: { cls: 'h-[18px] w-auto', w: 82, h: 18 },
    sm: { cls: 'h-6 w-auto', w: 109, h: 24 },
    md: { cls: 'h-7 sm:h-8 w-auto', w: 146, h: 32 },
    lg: { cls: 'h-9 sm:h-10 w-auto', w: 182, h: 40 },
    xl: { cls: 'h-12 sm:h-14 w-auto', w: 255, h: 56 },
  },
  'wordmark-slogan': {
    xs: { cls: 'h-7 w-auto', w: 95, h: 28 },
    sm: { cls: 'h-9 w-auto', w: 122, h: 36 },
    md: { cls: 'h-11 sm:h-12 w-auto', w: 162, h: 48 },
    lg: { cls: 'h-14 sm:h-16 w-auto', w: 216, h: 64 },
    xl: { cls: 'h-18 sm:h-20 w-auto', w: 270, h: 80 },
  },
  full: {
    xs: { cls: 'h-10 w-auto', w: 43, h: 40 },
    sm: { cls: 'h-14 w-auto', w: 60, h: 56 },
    md: { cls: 'h-20 w-auto', w: 85, h: 80 },
    lg: { cls: 'h-28 w-auto', w: 119, h: 112 },
    xl: { cls: 'h-36 w-auto', w: 153, h: 144 },
  },
  mark: {
    xs: { cls: 'h-5 w-auto', w: 18, h: 20 },
    sm: { cls: 'h-7 w-auto', w: 25, h: 28 },
    md: { cls: 'h-9 w-auto', w: 32, h: 36 },
    lg: { cls: 'h-12 w-auto', w: 43, h: 48 },
    xl: { cls: 'h-16 w-auto', w: 57, h: 64 },
  },
};

const SRC_MAP: Record<NonNullable<LaymorLogoProps['variant']>, string> = {
  wordmark: '/brand/laymor-wordmark.png',
  'wordmark-slogan': '/brand/laymor-wordmark-slogan.png',
  full: '/brand/laymor-full.png',
  mark: '/brand/laymor-mark.png',
};

export function LaymorLogo({
  variant = 'wordmark',
  size = 'md',
  className = '',
  invertOnDark = false,
  adaptiveTheme = true,
}: LaymorLogoProps) {
  const src = SRC_MAP[variant];
  const spec = SIZE_CLASSES[variant][size];
  const filterCls = invertOnDark
    ? 'brightness-0 invert'
    : adaptiveTheme && variant !== 'mark'
    ? 'laymor-logo-adaptive'
    : '';

  return (
    <img
      src={src}
      width={spec.w}
      height={spec.h}
      style={{ height: `${spec.h}px`, maxHeight: `${spec.h}px`, width: 'auto' }}
      alt="LAYMOR — From layers to form"
      className={`object-contain select-none shrink-0 ${spec.cls} ${filterCls} ${className}`}
      draggable={false}
    />
  );
}

/**
 * Ref tag chuẩn theo trang 2 của Guideline khách hàng:
 * - "New": Viền cam, chữ cam
 * - "Coming soon": Viền xanh dương, chữ xanh dương
 */
export function LaymorRefTag({
  type,
  size = 'sm',
  className = '',
}: {
  type?: RefTagType;
  size?: 'xs' | 'sm';
  className?: string;
}) {
  if (!type) return null;

  const isNew = type === 'new';
  const sizeClass =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[9px] rounded-md'
      : 'px-2.5 py-0.5 text-[11px] rounded-lg';

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold leading-none border bg-white dark:bg-slate-900/90 whitespace-nowrap ${sizeClass} ${
        isNew
          ? 'border-[#F59E0B] text-[#EA580C] dark:text-[#FBBF24]'
          : 'border-[#2563EB] text-[#1D4ED8] dark:border-[#3FA9F5] dark:text-[#3FA9F5]'
      } ${className}`}
    >
      {isNew ? 'New' : 'Coming soon'}
    </span>
  );
}
