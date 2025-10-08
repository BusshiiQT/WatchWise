"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthButton() {
  const supabase = supabaseBrowser();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setSignedIn(!!data.user);
    };
    run();
  }, [supabase]);

  if (signedIn) {
    return (
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          location.reload();
        }}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/signin"
      className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
    >
      Sign in
    </Link>
  );
}
