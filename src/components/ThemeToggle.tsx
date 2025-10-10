'use client';

import { useEffect, useState } from 'react';

type Mode = 'system' | 'light' | 'dark';

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  // hydrate current mode
  useEffect(() => {
    const stored = (localStorage.getItem('ww_theme') as Mode) || 'system';
    setMode(stored);
    apply(stored);
  }, []);

  function apply(next: Mode) {
    const html = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = next === 'dark' || (next === 'system' && prefersDark);

    if (useDark) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      if (next === 'light') {
        html.style.colorScheme = 'light';
      } else {
        html.style.removeProperty('color-scheme');
      }
    }
  }

  function setTheme(next: Mode) {
    localStorage.setItem('ww_theme', next);
    setMode(next);
    apply(next);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className={`rounded-md px-2 py-1 text-xs border ${mode==='system' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700'}`}
        onClick={() => setTheme('system')}
        title="System"
      >
        Sys
      </button>
      <button
        className={`rounded-md px-2 py-1 text-xs border ${mode==='light' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700'}`}
        onClick={() => setTheme('light')}
        title="Light"
      >
        Light
      </button>
      <button
        className={`rounded-md px-2 py-1 text-xs border ${mode==='dark' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700'}`}
        onClick={() => setTheme('dark')}
        title="Dark"
      >
        Dark
      </button>
    </div>
  );
}
