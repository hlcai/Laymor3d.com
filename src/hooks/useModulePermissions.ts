'use client';

import { useState, useEffect, useCallback } from 'react';
import { SystemModuleKey, IModuleRoleMatrix, DEFAULT_MODULE_PERMISSIONS } from '@/backend/domain/config';
import { UserRole } from '@/backend/domain/user';
import { useUserSession } from './useUserSession';

export function useModulePermissions() {
  const { currentUser } = useUserSession();
  const [matrix, setMatrix] = useState<IModuleRoleMatrix>(DEFAULT_MODULE_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      if (res.ok && data.config?.modulePermissions) {
        setMatrix({
          ...DEFAULT_MODULE_PERMISSIONS,
          ...data.config.modulePermissions,
        });
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình module permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const isModuleVisible = useCallback(
    (moduleKey: SystemModuleKey, explicitRole?: UserRole): boolean => {
      // Nếu kiểm tra ma trận theo explicitRole (ví dụ trong bảng AdminModulesManager)
      if (explicitRole) {
        if (!matrix[moduleKey]) return true;
        return matrix[moduleKey][explicitRole] ?? true;
      }

      // Master Admin luôn thấy tất cả vùng chức năng
      if (currentUser?.role === 'admin' || currentUser?.username === 'hlcai_admin') {
        return true;
      }

      // Nếu tài khoản đang đăng nhập có cấu hình vùng hiển thị riêng (allowedModules) do Admin thiết lập
      if (currentUser?.allowedModules && currentUser.allowedModules[moduleKey] !== undefined) {
        return Boolean(currentUser.allowedModules[moduleKey]);
      }

      const role: UserRole = currentUser?.role || 'user';
      if (!matrix[moduleKey]) return true;
      return matrix[moduleKey][role] ?? true;
    },
    [matrix, currentUser]
  );

  const toggleModuleForRole = async (
    moduleKey: SystemModuleKey,
    role: UserRole,
    isEnabled: boolean
  ): Promise<boolean> => {
    setMatrix((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || DEFAULT_MODULE_PERMISSIONS[moduleKey]),
        [role]: isEnabled,
      },
    }));

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'modulePermissions',
          moduleKey,
          role,
          isEnabled,
        }),
      });
      if (!res.ok) {
        await fetchPermissions();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Lỗi lưu phân quyền module:', err);
      await fetchPermissions();
      return false;
    }
  };

  return {
    matrix,
    isLoading,
    isModuleVisible,
    toggleModuleForRole,
    refreshPermissions: fetchPermissions,
  };
}
