'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  toggle: () => void; // quick light/dark toggle (ignores system)
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'ww-theme';

// figure out initial theme on client without flicker
function getInitial(): Theme {
  if (typeof window === 'undefined') return 'system';
  const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
  return saved;
}

function resolveTheme(t: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  if (t === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // mount -> read saved & apply
  useEffect(() => {
    const init = getInitial();
    setThemeState(init);
    const r = resolveTheme(init);
    setResolvedTheme(r);
    document.documentElement.classList.toggle('dark', r === 'dark');
    setMounted(true);
  }, []);

  // react to system changes when in system mode
  useEffect(() => {
    if (!mounted) return;
    if (theme !== 'system') return;
    const mm = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r = mm.matches ? 'dark' : 'light';
      setResolvedTheme(r);
      document.documentElement.classList.toggle('dark', r === 'dark');
    };
    mm.addEventListener('change', handler);
    return () => mm.removeEventListener('change', handler);
  }, [mounted, theme]);

  function setTheme(t: Theme) {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    const r = resolveTheme(t);
    setResolvedTheme(r);
    document.documentElement.classList.toggle('dark', r === 'dark');
  }

  function toggle() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  const value: ThemeContextValue = { theme, resolvedTheme, setTheme, toggle };

  return (
    <ThemeContext.Provider value={value}>
      {/* Avoid rendering children until we applied the class to <html> to prevent flashes */}
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
