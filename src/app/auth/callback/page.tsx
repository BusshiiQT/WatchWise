import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto my-20 max-w-md rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
          <h1 className="text-lg font-semibold">Loading…</h1>
          <p className="mt-2 text-sm opacity-70">Preparing your sign-in session.</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
