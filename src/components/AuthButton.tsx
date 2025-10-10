// src/components/AuthButton.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function AuthButton() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, [supabase]);

  if (!user) {
    return (
      <a href="/signin">
        <Button className="bg-yellow-500 text-black hover:bg-yellow-400">Sign In</Button>
      </a>
    );
  }

  return (
    <Button
      variant="outline"
      className="border-zinc-600 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }}
    >
      Sign Out
    </Button>
  );
}
