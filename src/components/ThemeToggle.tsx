'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Theme = 'system' | 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('st_theme') as Theme) || 'system';
      setTheme(saved);
      applyTheme(saved);
    } catch {}
  }, []);

  function applyTheme(next: Theme) {
    const root = document.documentElement;
    if (next === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', next);
    }
  }

  function setAndApply(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem('st_theme', next);
    } catch {}
    applyTheme(next);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={theme === 'system' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setAndApply('system')}
        title="Use system theme"
      >
        System
      </Button>
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setAndApply('light')}
        title="Light theme"
      >
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setAndApply('dark')}
        title="Dark theme"
      >
        Dark
      </Button>
    </div>
  );
}
