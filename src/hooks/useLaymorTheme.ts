'use client';

import { useState, useEffect, useCallback } from 'react';

export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY_PRIMARY = 'laymor_theme';
const STORAGE_KEY_SIM = 'printsim_theme';
const CUSTOM_EVENT_NAME = 'laymor-theme-change';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredOverride(): ResolvedTheme | null {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const queryTheme = urlParams.get('theme');
    if (queryTheme === 'dark' || queryTheme === 'light') {
      return queryTheme;
    }
    const saved =
      window.localStorage.getItem(STORAGE_KEY_PRIMARY) ||
      window.localStorage.getItem(STORAGE_KEY_SIM);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // Ignore storage restriction errors
  }
  return null;
}

export function applyDocumentTheme(override: ResolvedTheme | null): ResolvedTheme {
  const resolved: ResolvedTheme = override ?? getSystemTheme();
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    root.classList.toggle('dark', resolved === 'dark');
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute('content', override ?? 'light dark');
    }
  }
  return resolved;
}

export function useLaymorTheme() {
  const [theme, setThemeState] = useState<ResolvedTheme>(() => {
    if (typeof document !== 'undefined') {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'dark' || attr === 'light') return attr;
    }
    return getStoredOverride() ?? getSystemTheme();
  });

  useEffect(() => {
    const syncFromEnvironment = () => {
      const next = applyDocumentTheme(getStoredOverride());
      setThemeState(next);
    };

    syncFromEnvironment();

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (!getStoredOverride()) {
        syncFromEnvironment();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_KEY_PRIMARY || e.key === STORAGE_KEY_SIM) {
        syncFromEnvironment();
      }
    };

    const handleCustom = () => {
      syncFromEnvironment();
    };

    mql.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(CUSTOM_EVENT_NAME, handleCustom);

    return () => {
      mql.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CUSTOM_EVENT_NAME, handleCustom);
    };
  }, []);

  const setExplicitTheme = useCallback((target: ResolvedTheme) => {
    const sys = getSystemTheme();
    const nextOverride: ResolvedTheme | null = target === sys ? null : target;
    try {
      if (nextOverride === null) {
        window.localStorage.removeItem(STORAGE_KEY_PRIMARY);
        window.localStorage.removeItem(STORAGE_KEY_SIM);
      } else {
        window.localStorage.setItem(STORAGE_KEY_PRIMARY, nextOverride);
        window.localStorage.setItem(STORAGE_KEY_SIM, nextOverride);
      }
    } catch {
      // Ignore storage restriction errors
    }
    const resolved = applyDocumentTheme(nextOverride);
    setThemeState(resolved);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CUSTOM_EVENT_NAME));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const current: ResolvedTheme =
      (typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.documentElement.getAttribute('data-theme') === 'light')
        ? (document.documentElement.getAttribute('data-theme') as ResolvedTheme)
        : null) ??
      getStoredOverride() ??
      getSystemTheme();

    const target: ResolvedTheme = current === 'dark' ? 'light' : 'dark';
    setExplicitTheme(target);
  }, [setExplicitTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: setExplicitTheme,
  };
}
