import { useState, useEffect, useCallback } from 'react';

export type LaymorUserRole = 'admin' | 'mod' | 'seller' | 'staff' | 'user';

export interface ILaymorFeaturePermissions {
  canEditPrintProfile: boolean;
  canExport3MF: boolean;
  canSubmitDefectKnowledge: boolean;
  canUseAI3DGenerator: boolean;
  canUseCrossReference: boolean;
  canOrderPrintService: boolean;
  canManageKnowledgeBase: boolean;
}

export interface ILaymorUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: LaymorUserRole;
  avatar: string;
  walletBalanceVnd: number;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended';
  allowedModules?: Record<string, boolean>;
  allowedFeatures?: Partial<ILaymorFeaturePermissions>;
}

const STORAGE_UID_KEY = 'laymor_session_uid';
const STORAGE_USER_KEY = 'laymor_session_user';
const AUTH_CHANGE_EVENT = 'laymor-auth-change';
const AUTH_BROADCAST_CHANNEL = 'laymor_auth_sync_v1';

function readCachedUser(): ILaymorUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ILaymorUser;
    if (parsed && parsed.id && parsed.status !== 'suspended') {
      return parsed;
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

function broadcastAuthSync(action: 'login' | 'logout', uid: string | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      bc.postMessage({ type: 'LAYMOR_AUTH_SYNC', action, uid, timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // Ignore BroadcastChannel errors
  }
}

export function useLaymorAuth(onStatusToast?: (msg: string) => void) {
  const [currentUser, setCurrentUser] = useState<ILaymorUser | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSession = useCallback(async () => {
    try {
      const savedUid =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_UID_KEY) || '' : '';
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: savedUid ? { 'x-laymor-uid': savedUid } : {},
      });

      if (!res.ok) {
        // Nếu đang chạy độc lập không có backend Next.js, giữ nguyên phiên cache localStorage
        setCurrentUser(readCachedUser());
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setCurrentUser(readCachedUser());
        return;
      }

      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_UID_KEY, data.user.id);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        }
      } else {
        setCurrentUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_UID_KEY);
          localStorage.removeItem(STORAGE_USER_KEY);
        }
      }
    } catch {
      // Giữ trạng thái cache nếu offline tạm thời
      setCurrentUser(readCachedUser());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    if (typeof window === 'undefined') return;

    const handleAuthChange = () => {
      fetchSession();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_UID_KEY || e.key === STORAGE_USER_KEY) {
        const cached = readCachedUser();
        setCurrentUser(cached);
        fetchSession();
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchSession();
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
        bc.onmessage = () => {
          setCurrentUser(readCachedUser());
          fetchSession();
        };
      }
    } catch {
      // Ignore
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      bc?.close();
    };
  }, [fetchSession]);

  const login = useCallback(
    async (
      identifier: string,
      password: string
    ): Promise<{ ok: boolean; error?: string; user?: ILaymorUser }> => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', identifier, password }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setCurrentUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_UID_KEY, data.user.id);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
            broadcastAuthSync('login', data.user.id);
          }
          onStatusToast?.(`✓ Đã đồng bộ đăng nhập: ${data.user.name} (@${data.user.username})`);
          return { ok: true, user: data.user };
        }
        return { ok: false, error: data.error || 'Sai thông tin đăng nhập!' };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Không thể kết nối máy chủ xác thực' };
      }
    },
    [onStatusToast]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/me', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Ignore network error
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_UID_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      broadcastAuthSync('logout', null);
    }
    onStatusToast?.('✓ Đã đăng xuất đồng bộ trên toàn hệ thống LAYMOR.');
  }, [onStatusToast]);

  const isFeatureAllowed = useCallback(
    (featureKey: keyof ILaymorFeaturePermissions): boolean => {
      if (!currentUser) {
        return true; // Cho phép khách trải nghiệm mô phỏng, trừ khi tài khoản bị giới hạn rõ ràng bởi Admin
      }
      if (currentUser.role === 'admin' || currentUser.username === 'hlcai_admin') {
        return true;
      }
      if (currentUser.allowedFeatures && currentUser.allowedFeatures[featureKey] !== undefined) {
        return Boolean(currentUser.allowedFeatures[featureKey]);
      }
      return true;
    },
    [currentUser]
  );

  return {
    currentUser,
    isLoading,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === 'admin',
    refreshSession: fetchSession,
    login,
    logout,
    isFeatureAllowed,
  };
}
