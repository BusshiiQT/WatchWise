// src/app/profile/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  privacy_public: boolean;
};

export default function ProfilePage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [privacyPublic, setPrivacyPublic] = useState<boolean>(true);

  // Local (client) settings
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

  // Auth management
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Danger zone: delete
  const [deleteTyping, setDeleteTyping] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const deletePhrase = 'DELETE MY ACCOUNT';

  // Load user + profile
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user) {
          setUserId(null);
          setEmail(null);
          setProfile(null);
          setUsername('');
          setAvatarUrl(null);
          setPrivacyPublic(true);
          return;
        }

        setUserId(user.id);
        setEmail(user.email ?? null);

        // ensure profile exists
        const { data: existing, error: selErr } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, privacy_public')
          .eq('id', user.id)
          .maybeSingle();

        if (selErr) {
          console.warn('profiles select error:', selErr.message);
        }

        if (!existing) {
          // create a simple default profile
          const defaultUsername =
            (user.email?.split('@')[0] ?? 'user') + '_' + user.id.slice(0, 8);

          const { data: inserted, error: insErr } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: defaultUsername,
              avatar_url: null,
              privacy_public: true,
            })
            .select('id, username, avatar_url, privacy_public')
            .single();

          if (insErr) {
            console.warn('profiles insert error (RLS?)', insErr.message);
          } else {
            setProfile(inserted as Profile);
            setUsername(inserted.username);
            setAvatarUrl(inserted.avatar_url);
            setPrivacyPublic(!!inserted.privacy_public);
          }
        } else {
          setProfile(existing as Profile);
          setUsername(existing.username);
          setAvatarUrl(existing.avatar_url);
          setPrivacyPublic(!!existing.privacy_public);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  // Load theme from localStorage
  useEffect(() => {
    const t = (localStorage.getItem('st_theme') as 'system' | 'light' | 'dark') || 'system';
    setTheme(t);
    applyTheme(t);
  }, []);

  function applyTheme(next: 'system' | 'light' | 'dark') {
    const root = document.documentElement;
    if (next === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', next);
    }
  }

  async function handleSaveProfile() {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          avatar_url: avatarUrl,
          privacy_public: privacyPublic,
        })
        .eq('id', userId);

      if (error) {
        alert('Failed to save profile: ' + error.message);
        return;
      }
      setProfile((p) =>
        p
          ? {
              ...p,
              username: username.trim(),
              avatar_url: avatarUrl,
              privacy_public: privacyPublic,
            }
          : p
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Image too large (max 3MB)');
      return;
    }

    const ext = file.name.split('.').pop() || 'png';
    const path = `${userId}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (upErr) {
      alert('Upload failed: ' + upErr.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicURL = urlData?.publicUrl ?? null;

    setAvatarUrl(publicURL);
  }

  function handleThemeChange(next: 'system' | 'light' | 'dark') {
    setTheme(next);
    localStorage.setItem('st_theme', next);
    applyTheme(next);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUserId(null);
    setEmail(null);
    setProfile(null);
    setUsername('');
    setAvatarUrl(null);
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    if (!newEmail.trim()) {
      setEmailMsg('Enter a new email address.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailMsg('Failed to update email: ' + error.message);
      return;
    }
    setEmailMsg('Check your new email inbox to confirm the change.');
    setNewEmail('');
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg('Failed to update password: ' + error.message);
      return;
    }
    setPasswordMsg('Password updated.');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleDeleteAccount() {
    if (!userId) return;
    if (deleteTyping !== deletePhrase) return;

    setDeleteBusy(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: deletePhrase }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        alert('Delete failed: ' + (t || res.statusText));
        return;
      }
      // sign out locally and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800 mb-6 animate-pulse" />
        <div className="h-40 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Profile</h1>
        <p className="opacity-70 mb-6">Please sign in to customize your profile.</p>
        <a
          href="/auth"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Go to Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {/* Profile Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        {/* Top row: avatar + email */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={username || 'avatar'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">👤</div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm opacity-70">Signed in as</p>
            <p className="font-medium">{email ?? '—'}</p>
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="text-sm file:mr-3 file:rounded-lg file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:dark:border-zinc-700 file:dark:bg-zinc-900"
            />
          </div>
        </div>

        <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

        {/* Username */}
        <div className="grid gap-2">
          <label className="text-sm opacity-80" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400/50"
            placeholder="Your username"
          />
        </div>

        {/* Privacy */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
          <div>
            <p className="font-medium">Public Profile</p>
            <p className="text-sm opacity-70">
              When off, your reviews and activity will be private.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={privacyPublic}
              onChange={(e) => setPrivacyPublic(e.target.checked)}
            />
            <span className="h-6 w-11 rounded-full bg-zinc-300 peer-checked:bg-emerald-500 relative transition">
              <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
            </span>
          </label>
        </div>

        {/* Theme */}
        <div className="mt-6 grid gap-2">
          <label className="text-sm opacity-80">Theme</label>
          <div className="flex gap-2">
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('system')}
            >
              System
            </Button>
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('light')}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('dark')}
            >
              Dark
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-3">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Auth Settings */}
      <div className="mt-8 grid gap-8">
        {/* Change Email */}
        <form
          onSubmit={handleChangeEmail}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Change Email</h2>
          <div className="grid gap-2">
            <label className="text-sm opacity-80" htmlFor="newEmail">New email</label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400/50"
              placeholder="you@domain.com"
            />
          </div>
          {emailMsg && <p className="mt-2 text-sm opacity-80">{emailMsg}</p>}
          <div className="mt-4">
            <Button type="submit">Update Email</Button>
          </div>
        </form>

        {/* Change Password */}
        <form
          onSubmit={handleChangePassword}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <div className="grid gap-2">
            <label className="text-sm opacity-80" htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400/50"
              placeholder="••••••••"
            />
          </div>
          <div className="mt-3 grid gap-2">
            <label className="text-sm opacity-80" htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400/50"
              placeholder="••••••••"
            />
          </div>
          {passwordMsg && <p className="mt-2 text-sm opacity-80">{passwordMsg}</p>}
          <div className="mt-4">
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="mt-8 rounded-2xl border border-red-300/60 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Danger Zone</h2>
        <p className="mt-1 text-sm opacity-80">
          Permanently delete your account and all associated data (watchlist, reviews, profile).
        </p>
        <div className="mt-4 grid gap-2">
          <label className="text-sm opacity-80" htmlFor="deleteConfirm">
            Type <span className="font-mono">{deletePhrase}</span> to confirm
          </label>
          <input
            id="deleteConfirm"
            value={deleteTyping}
            onChange={(e) => setDeleteTyping(e.target.value)}
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/50"
            placeholder={deletePhrase}
          />
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={handleDeleteAccount}
            disabled={deleteTyping !== deletePhrase || deleteBusy}
          >
            {deleteBusy ? 'Deleting…' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}
