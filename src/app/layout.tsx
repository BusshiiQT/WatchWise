import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'WatchWise',
  description: 'Track movies and TV shows, powered by Supabase + TMDB',
};

const themeInit = `
  try {
    const saved = localStorage.getItem('st_theme') || 'system';
    const root = document.documentElement;
    if (saved === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', saved);
    }
  } catch {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Ensure theme is applied before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
