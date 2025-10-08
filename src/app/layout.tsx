import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/providers/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'WatchWise',
    template: '%s · WatchWise',
  },
  description:
    'WatchWise — track movies/TV/books, rate & review, build your watchlist, and get AI-powered recommendations.',
  applicationName: 'WatchWise',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
