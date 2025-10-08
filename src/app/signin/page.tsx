"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        // good -> go home & refresh
        router.replace("/");
        // give the cookie a tick to persist, then refresh RSC data
        setTimeout(() => window.location.reload(), 50);
        return;
      }

      // --- SIGN UP path ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        // keep redirect if you later enable confirm-emails (optional)
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;

      // If your project auto-confirms emails, a session may already exist.
      // If not, sign-in will work immediately ONLY if confirmations are disabled.
      // Try to sign in right away (best UX for dev / non-confirmed flows):
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });

      if (!signInErr) {
        router.replace("/");
        setTimeout(() => window.location.reload(), 50);
        return;
      }

      // If we get here, sign-in failed most likely due to "Email not confirmed"
      // Show helpful guidance instead of quietly redirecting.
      const needsConfirm =
        signInErr.message?.toLowerCase().includes("email not confirmed") ||
        signInErr.message?.toLowerCase().includes("invalid login credentials");

      if (needsConfirm) {
        setInfo(
          "Account created. Please confirm your email, then return here to sign in."
        );
      } else {
        setErr(signInErr.message);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
      // redirect happens automatically
    } catch (e: any) {
      setErr(e?.message ?? "Google sign-in failed (check Supabase OAuth settings)");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Welcome</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("signin")}
          className={
            "rounded-full px-3 py-1 text-sm " +
            (mode === "signin"
              ? "bg-rose-600 text-white"
              : "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700")
          }
        >
          Sign in
        </button>
        <button
          onClick={() => setMode("signup")}
          className={
            "rounded-full px-3 py-1 text-sm " +
            (mode === "signup"
              ? "bg-rose-600 text-white"
              : "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700")
          }
        >
          Create account
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-800"
            placeholder="you@domain.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <div className="flex gap-2">
            <input
              type={showPw ? "text" : "password"}
              required
              minLength={6}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {mode === "signup" && (
            <p className="text-xs opacity-70">Use at least 6 characters.</p>
          )}
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {info && <p className="text-sm text-amber-600">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-md bg-zinc-900 text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading
            ? mode === "signin"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>

        <div className="text-center text-xs opacity-70">or</div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          title="Requires Google OAuth configured in Supabase"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
