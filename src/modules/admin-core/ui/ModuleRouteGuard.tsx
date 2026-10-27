'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home, ShoppingBag } from '@/components/icons/MinimalIcons';
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
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-slate-800">
        <div className="max-w-md w-full bg-white rounded-[36px] p-8 text-center space-y-5 shadow-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-2xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              Quyền Truy Cập Bị Giới Hạn
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tính năng <strong className="text-cyan-700 font-bold">&ldquo;{moduleName || moduleKey}&rdquo;</strong> hiện đang bị tạm khóa đối với vai trò{' '}
              <strong className="text-amber-800 uppercase font-bold">{currentUser?.role || 'Khách'}</strong> theo chính sách phân quyền RBAC của Quản trị viên.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/shop"
              className="flex items-center justify-center gap-2 py-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Quay Lại Cửa Hàng</span>
            </Link>

            <Link
              href="/"
              className="py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Về Trang Chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
