'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Search', href: '/search' },
    { name: 'Feed', href: '/feed' },
    { name: 'Library', href: '/library' },
    ...(user ? [{ name: 'Profile', href: '/profile' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-zinc-950 px-4 py-3 text-white shadow-md">
      <Link href="/" className="text-xl font-semibold">
        🎬 WatchWise
      </Link>

      <div className="flex items-center gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`transition ${
              pathname === l.href
                ? 'text-yellow-400 font-semibold'
                : 'text-zinc-300 hover:text-yellow-300'
            }`}
          >
            {l.name}
          </Link>
        ))}

        <ThemeToggle />

        {user ? (
          <Button
            variant="outline"
            className="border-zinc-600 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={async () => {
              const supabase = supabaseBrowser();
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
          >
            Sign Out
          </Button>
        ) : (
          <Link href="/signin">
            <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
