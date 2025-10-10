// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'WatchWise',
  description: 'Track movies & TV with Supabase + TMDB',
};

// Inline script to set dark mode ASAP (prevents flash)
function ThemeScript() {
  const js = `
    (function () {
      try {
        var stored = localStorage.getItem('ww_theme') || 'system';
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var useDark = stored === 'dark' || (stored === 'system' && prefersDark);
        var html = document.documentElement;

        if (useDark) {
          html.classList.add('dark');
          html.style.colorScheme = 'dark';
        } else {
          html.classList.remove('dark');
          if (stored === 'light') {
            html.style.colorScheme = 'light';
          } else {
            html.style.removeProperty('color-scheme');
          }
        }
      } catch (_) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
