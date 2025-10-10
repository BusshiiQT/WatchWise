// src/components/ItemCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import RatingStars from './RatingStars';
import CategoryToggles from './CategoryToggles';

export type MediaType = 'movie' | 'tv' | 'book';

export type Item = {
  id?: number; // items.id (if known)
  tmdb_id?: number; // TMDb id (for movie/tv)
  media_type: MediaType;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  release_date?: string | null;
  genres?: number[] | null;
};

type UserItemStatus = {
  status: 'watchlist' | 'completed';
  favorite: boolean;
  rating: number | null;
  review: string | null;
};

type Props = {
  item: Item;
  initialStatus?: Partial<UserItemStatus>;
  showControls?: boolean;
};

export default function ItemCard({ item, initialStatus, showControls = true }: Props) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const pathname = usePathname();

  const [userId, setUserId] = useState<string | null>(null);
  const [dbItemId, setDbItemId] = useState<number | null>(item.id ?? null);

  const [hasEntry, setHasEntry] = useState<boolean>(!!initialStatus);
  const [status, setStatus] = useState<'watchlist' | 'completed'>(initialStatus?.status ?? 'watchlist');
  const [favorite, setFavorite] = useState<boolean>(initialStatus?.favorite ?? false);
  const [rating, setRating] = useState<number | null>(initialStatus?.rating ?? null);
  const [review, setReview] = useState<string>(initialStatus?.review ?? '');
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const img = useMemo(
    () => (item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined),
    [item.poster_path]
  );

  const detailHref =
    item.tmdb_id && (item.media_type === 'movie' || item.media_type === 'tv')
      ? `/title/${item.media_type}/${item.tmdb_id}`
      : undefined;

  // 1) Get current user
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setAuthChecked(true);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Helper: find or create items.id for this card
  async function ensureItemRow(): Promise<number | null> {
    if (dbItemId) return dbItemId;
    if (item.tmdb_id) {
      const { data: existing, error: qErr } = await supabase
        .from('items')
        .select('id')
        .eq('tmdb_id', item.tmdb_id)
        .eq('media_type', item.media_type)
        .maybeSingle();
      if (qErr) {
        console.error(qErr);
        alert(qErr.message);
        return null;
      }
      if (existing?.id) {
        setDbItemId(existing.id);
        return existing.id as number;
      }
    }

    const { data: inserted, error: insErr } = await supabase
      .from('items')
      .insert({
        tmdb_id: item.tmdb_id ?? null,
        media_type: item.media_type,
        title: item.title,
        overview: item.overview ?? null,
        poster_path: item.poster_path ?? null,
        release_date: item.release_date ?? null,
        genres: item.genres ?? null,
      })
      .select('id')
      .single();

    if (insErr) {
      console.error(insErr);
      alert(insErr.message);
      return null;
    }

    setDbItemId(inserted.id as number);
    return inserted.id as number;
  }

  // 2) Hydrate from DB so state persists across navigation
  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      if (!userId) return;
      let itemId = dbItemId;
      if (!itemId) {
        itemId = await ensureItemRow();
        if (!itemId) return;
      }
      const { data, error } = await supabase
        .from('user_items')
        .select('status, favorite, rating, review')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        console.error(error);
        return;
      }
      if (data) {
        setHasEntry(true);
        setStatus(data.status === 'completed' ? 'completed' : 'watchlist');
        setFavorite(!!data.favorite);
        setRating(data.rating ?? null);
        setReview(data.review ?? '');
      } else {
        setHasEntry(false);
      }
    };
    hydrate();
    return () => {
      mounted = false;
    };
  }, [userId, dbItemId]); // eslint-disable-line

  // 3) Upsert helper
  async function upsertUserItem(
    patch: Partial<{
      status: 'watchlist' | 'completed';
      favorite: boolean;
      rating: number | null;
      review: string | null;
    }>
  ) {
    if (!userId) {
      alert('Sign in first');
      return;
    }
    setSaving(true);
    const itemId = await ensureItemRow();
    if (!itemId) {
      setSaving(false);
      return;
    }

    const payload = {
      user_id: userId,
      item_id: itemId,
      status,
      favorite,
      rating,
      review: review || null,
      ...patch,
    };

    const { error } = await supabase.from('user_items').upsert(payload, { onConflict: 'user_id,item_id' });
    setSaving(false);
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    if (typeof patch.status !== 'undefined') setStatus(patch.status);
    if (typeof patch.favorite !== 'undefined') setFavorite(patch.favorite);
    if (typeof patch.rating !== 'undefined') setRating(patch.rating);
    if (typeof patch.review !== 'undefined') setReview(patch.review ?? '');
    setHasEntry(true);
  }

  async function clearRating() {
    await upsertUserItem({ rating: null });
  }

  async function removeFromLibrary() {
    if (!userId) {
      alert('Sign in first');
      return;
    }
    setSaving(true);
    const itemId = await ensureItemRow();
    if (!itemId) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('user_items').delete().eq('user_id', userId).eq('item_id', itemId);
    setSaving(false);
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
    setHasEntry(false);
    setFavorite(false);
    setRating(null);
    setReview('');
    setStatus('watchlist');
    if (pathname?.startsWith('/library')) {
      location.reload();
    }
  }

  const controlsVisible = showControls && authChecked && !!userId;

  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {img ? (
        detailHref ? (
          <Link href={detailHref} className="shrink-0">
            <Image
              src={img}
              alt={item.title}
              width={92}
              height={138}
              className="h-[138px] w-[92px] rounded-md object-cover"
            />
          </Link>
        ) : (
          <Image
            src={img}
            alt={item.title}
            width={92}
            height={138}
            className="h-[138px] w-[92px] rounded-md object-cover"
          />
        )
      ) : (
        <div className="grid h-[138px] w-[92px] place-items-center rounded-md bg-zinc-200 text-xs dark:bg-zinc-800">
          No image
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            {detailHref ? (
              <Link href={detailHref} className="truncate text-base font-medium hover:underline">
                {item.title}
              </Link>
            ) : (
              <div className="truncate text-base font-medium">{item.title}</div>
            )}
            {item.release_date ? <div className="text-xs opacity-70">{item.release_date}</div> : null}
          </div>

          {controlsVisible && hasEntry ? (
            <div className="flex gap-2">
              {rating !== null ? (
                <button
                  onClick={clearRating}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                  title="Clear rating"
                >
                  Clear rating
                </button>
              ) : null}
              <button
                onClick={removeFromLibrary}
                className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                title="Remove from Library"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>

        {controlsVisible ? (
          hasEntry ? (
            <div>
              <CategoryToggles
                status={status}
                favorite={favorite}
                onToggleWatchlist={() => upsertUserItem({ status: 'watchlist' })}
                onToggleCompleted={() => upsertUserItem({ status: 'completed' })}
                onToggleFavorite={() => upsertUserItem({ favorite: !favorite })}
              />

              <div className="mt-2 flex items-center gap-3">
                <RatingStars value={rating ?? undefined} onChange={(v: number) => upsertUserItem({ rating: v })} />
                {saving ? <span className="text-xs opacity-70">Saving…</span> : null}
              </div>

              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                onBlur={() => upsertUserItem({ review })}
                placeholder="Write a short review (optional)…"
                className="mt-2 min-h-[60px] w-full resize-y rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              ></textarea>
            </div>
          ) : (
            <div className="pt-1">
              <button
                onClick={() => upsertUserItem({ status: 'watchlist' })}
                className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                aria-label="Add to watchlist"
                title="Add to watchlist"
              >
                + Add to Watchlist
              </button>
              {saving ? <span className="ml-3 text-xs opacity-70">Saving…</span> : null}
            </div>
          )
        ) : (
          <p className="text-xs opacity-70">Sign in to add and rate.</p>
        )}
      </div>
    </div>
  );
}
