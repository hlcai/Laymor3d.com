'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  IUser,
  UserRole,
  IPermission,
  ROLE_PERMISSIONS,
  IUserFeaturePermissions,
  DEFAULT_USER_FEATURE_PERMISSIONS,
} from '@/backend/domain/user';

const STORAGE_UID_KEY = 'laymor_session_uid';
const STORAGE_USER_KEY = 'laymor_session_user';
const AUTH_CHANGE_EVENT = 'laymor-auth-change';

export function useUserSession() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [permissions, setPermissions] = useState<IPermission>(ROLE_PERMISSIONS.user);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const savedUid =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_UID_KEY) || '' : '';
      const res = await fetch('/api/auth/me', {
        headers: savedUid ? { 'x-laymor-uid': savedUid } : {},
      });
      const data = await res.json();
      if (res.ok) {
        setAllUsers(data.allUsers || []);
        if (data.user) {
          setCurrentUser(data.user);
          setPermissions(data.permissions || ROLE_PERMISSIONS[data.user.role as UserRole]);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_UID_KEY, data.user.id);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
          }
        } else {
          setCurrentUser(null);
          setPermissions(ROLE_PERMISSIONS.user);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_UID_KEY);
            localStorage.removeItem(STORAGE_USER_KEY);
          }
        }
      }
    } catch (err) {
      console.error('Session fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    const handleAuthChange = () => {
      fetchSession();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    }
  }, [fetchSession]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<{ ok: boolean; error?: string; user?: IUser }> => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', identifier, password }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setCurrentUser(data.user);
          setPermissions(data.permissions || ROLE_PERMISSIONS[data.user.role as UserRole]);
          if (data.allUsers) setAllUsers(data.allUsers);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_UID_KEY, data.user.id);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
            window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
          }
          showToast(data.message || `Chào mừng ${data.user.name}!`);
          return { ok: true, user: data.user };
        }
        return { ok: false, error: data.error || 'Sai thông tin đăng nhập' };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // ignore network error
    }
    setCurrentUser(null);
    setPermissions(ROLE_PERMISSIONS.user);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_UID_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
    }
    showToast('Đã đăng xuất khỏi tài khoản.');
  }, [showToast]);

  const switchUser = useCallback(async (userId: string) => {
    // Deprecated mock switcher - no-op unless already admin
    return false;
  }, []);

  const switchRole = useCallback(async (newRole: UserRole) => {
    return false;
  }, []);

  const isFeatureAllowed = useCallback(
    (featureKey: keyof IUserFeaturePermissions): boolean => {
      if (!currentUser) {
        // Guest chưa đăng nhập: chỉ xem mô phỏng cơ bản, không được xuất 3MF hay chỉnh sửa tri thức
        return featureKey === 'canEditPrintProfile';
      }
      if (currentUser.role === 'admin' || currentUser.username === 'hlcai_admin') {
        return true;
      }
      if (currentUser.allowedFeatures && currentUser.allowedFeatures[featureKey] !== undefined) {
        return Boolean(currentUser.allowedFeatures[featureKey]);
      }
      const roleDefaults =
        DEFAULT_USER_FEATURE_PERMISSIONS[currentUser.role] || DEFAULT_USER_FEATURE_PERMISSIONS.user;
      return Boolean(roleDefaults[featureKey]);
    },
    [currentUser]
  );

  return {
    currentUser,
    permissions,
    allUsers,
    isLoading,
    toastMessage,
    showToast,
    refreshSession: fetchSession,
    login,
    logout,
    switchUser,
    switchRole,
    isFeatureAllowed,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === 'admin',
    isMod: currentUser?.role === 'mod',
    isStaff: currentUser?.role === 'staff',
    isCustomer: currentUser?.role === 'user',
  };
}
