'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { useState } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, toggle, setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Toggle theme"
        className="rounded-lg border border-zinc-600/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-800"
        onClick={() => setOpen((v) => !v)}
      >
        {resolvedTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <button
            className={`block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              theme === 'light' ? 'font-semibold' : ''
            }`}
            onClick={() => {
              setTheme('light');
              setOpen(false);
            }}
          >
            ☀️ Light
          </button>
          <button
            className={`block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              theme === 'dark' ? 'font-semibold' : ''
            }`}
            onClick={() => {
              setTheme('dark');
              setOpen(false);
            }}
          >
            🌙 Dark
          </button>
          <button
            className={`block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              theme === 'system' ? 'font-semibold' : ''
            }`}
            onClick={() => {
              setTheme('system');
              setOpen(false);
            }}
          >
            💻 System
          </button>
          <div className="border-t border-zinc-200 dark:border-zinc-800" />
          <button
            className="block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => {
              toggle();
              setOpen(false);
            }}
          >
            ⇄ Quick Toggle
          </button>
        </div>
      )}
    </div>
  );
}
