"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

function parseHash(hash: string): Record<string, string> {
  // hash like "#access_token=...&refresh_token=...&token_type=bearer&type=signup"
  const out: Record<string, string> = {};
  const s = hash.startsWith("#") ? hash.slice(1) : hash;
  for (const part of s.split("&")) {
    const [k, v] = part.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return out;
}

export default function AuthCallbackPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Finishing sign in…");

  useEffect(() => {
    async function run() {
      try {
        // 1) PKCE / OAuth path: ?code=...
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setMsg("Signed in! Redirecting…");
          router.replace("/");
          return;
        }

        // 2) Email confirmation / magic-link path: #access_token=...&refresh_token=...
        const hash = window.location.hash ?? "";
        if (hash && hash.includes("access_token")) {
          const q = parseHash(hash);
          const access_token = q["access_token"];
          const refresh_token = q["refresh_token"];
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            setMsg("Email confirmed. Signed in! Redirecting…");
            // Clear the hash so it doesn't stick around in history
            window.history.replaceState(null, "", window.location.pathname);
            router.replace("/");
            return;
          }
        }

        // 3) Nothing usable in URL
        setMsg("Missing auth info. If you opened this from an email, open it on the same device/browser you used to sign up.");
      } catch (e: any) {
        setMsg(e?.message ?? "Unexpected auth error");
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-semibold">Auth</h1>
      <p className="opacity-80">{msg}</p>
    </div>
  );
}
