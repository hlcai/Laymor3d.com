'use client';

import React from 'react';
import { RefTagType } from '@/backend/domain/laymor-catalog';

interface LaymorLogoProps {
  variant?: 'wordmark' | 'full' | 'mark' | 'wordmark-slogan';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  invertOnDark?: boolean;
}

const SIZE_CLASSES: Record<
  NonNullable<LaymorLogoProps['variant']>,
  Record<NonNullable<LaymorLogoProps['size']>, string>
> = {
  wordmark: {
    xs: 'h-4.5 w-auto',
    sm: 'h-6 w-auto',
    md: 'h-7 sm:h-8 w-auto',
    lg: 'h-9 sm:h-11 w-auto',
    xl: 'h-12 sm:h-14 w-auto',
  },
  'wordmark-slogan': {
    xs: 'h-7 w-auto',
    sm: 'h-9 w-auto',
    md: 'h-11 sm:h-12 w-auto',
    lg: 'h-14 sm:h-16 w-auto',
    xl: 'h-18 sm:h-20 w-auto',
  },
  full: {
    xs: 'h-10 w-auto',
    sm: 'h-14 w-auto',
    md: 'h-20 w-auto',
    lg: 'h-28 w-auto',
    xl: 'h-36 w-auto',
  },
  mark: {
    xs: 'h-5 w-auto',
    sm: 'h-7 w-auto',
    md: 'h-9 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
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
}: LaymorLogoProps) {
  const src = SRC_MAP[variant];
  const sizeCls = SIZE_CLASSES[variant][size];

  return (
    <img
      src={src}
      alt="LAYMOR — From layers to form"
      className={`object-contain select-none ${sizeCls} ${
        invertOnDark ? 'brightness-0 invert' : ''
      } ${className}`}
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
      className={`inline-flex items-center justify-center font-semibold leading-none border bg-white whitespace-nowrap ${sizeClass} ${
        isNew
          ? 'border-[#F59E0B] text-[#EA580C]'
          : 'border-[#2563EB] text-[#1D4ED8]'
      } ${className}`}
    >
      {isNew ? 'New' : 'Coming soon'}
    </span>
  );
}
