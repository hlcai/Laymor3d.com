'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, ShoppingBag } from '@/components/icons/MinimalIcons';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { useUserSession } from '@/hooks/useUserSession';
import { SystemModuleKey } from '@/backend/domain/config';

interface ModuleRouteGuardProps {
  moduleKey: SystemModuleKey;
  moduleName?: string;
  children: React.ReactNode;
}

export function ModuleRouteGuard({
  moduleKey,
  moduleName,
  children,
}: ModuleRouteGuardProps) {
  const { currentUser } = useUserSession();
  const { isModuleVisible, isLoading } = useModulePermissions();

  if (isLoading) {
    return <>{children}</>;
  }

  const allowed = isModuleVisible(moduleKey, currentUser?.role);

  if (!allowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full vision-glass-panel rounded-[36px] p-8 text-center space-y-5 shadow-2xl border border-rose-500/30">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 mx-auto flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              Quyền Truy Cập Bị Giới Hạn
            </h2>
            <p className="text-xs text-white/70 leading-relaxed">
              Tính năng <strong className="text-cyan-300">&ldquo;{moduleName || moduleKey}&rdquo;</strong> hiện đang bị tạm khóa đối với vai trò{' '}
              <strong className="text-amber-300 uppercase">{currentUser?.role || 'Khách'}</strong> theo chính sách phân quyền RBAC của Quản trị viên.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/shop"
              className="vision-pill-btn flex items-center justify-center gap-2 py-3 rounded-full text-white text-xs font-bold shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Quay Lại Cửa Hàng</span>
            </Link>

            <Link
              href="/"
              className="py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Về Trang Chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
