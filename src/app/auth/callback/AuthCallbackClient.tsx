// src/app/auth/callback/AuthCallbackClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState<'working' | 'ok' | 'error'>('working');
  const [detail, setDetail] = useState<string>('');

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const run = async () => {
      const error =
        searchParams.get('error_description') || searchParams.get('error');

      if (error) {
        setMsg('error');
        setDetail(error);
        return;
      }

      // If we have a `code` in the URL, this is an OAuth/OTP callback.
      const code = searchParams.get('code');

      try {
        if (code) {
          // Supabase v2: finalize session from the full URL
          await supabase.auth.exchangeCodeForSession(window.location.href);
        } else {
          // No code: ensure we have (or don't have) a session
          await supabase.auth.getSession();
        }

        setMsg('ok');

        const redirectTo = sessionStorage.getItem('postAuthRedirect') || '/';
        sessionStorage.removeItem('postAuthRedirect');
        router.replace(redirectTo);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : 'Unknown authentication error';
        setMsg('error');
        setDetail(message);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto my-20 max-w-md rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
      {msg === 'working' && (
        <>
          <h1 className="text-lg font-semibold">Signing you in…</h1>
          <p className="mt-2 text-sm opacity-70">
            Exchanging your Supabase auth code. This should only take a second.
          </p>
        </>
      )}

      {msg === 'ok' && (
        <>
          <h1 className="text-lg font-semibold">Success!</h1>
          <p className="mt-2 text-sm opacity-70">Redirecting…</p>
        </>
      )}

      {msg === 'error' && (
        <>
          <h1 className="text-lg font-semibold">Auth error</h1>
          <p className="mt-2 text-sm text-red-600">{detail}</p>
          <button
            className="mt-4 rounded-full bg-rose-600 px-4 py-2 text-white"
            onClick={() => router.replace('/signin')}
          >
            Back to Sign In
          </button>
        </>
      )}
    </div>
  );
}
