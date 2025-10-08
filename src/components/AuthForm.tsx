"use client";
import AuthButton from "./AuthButton";
export default function AuthForm() {
return (
<div className="mx-auto max-w-md rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
<h2 className="mb-2 text-xl font-semibold">Welcome</h2>
<p className="mb-4 text-sm opacity-80">Sign in with a magic link to save your library.</p>
<AuthButton />
</div>
);
}