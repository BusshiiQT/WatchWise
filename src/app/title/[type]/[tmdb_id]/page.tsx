'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Rating10 from '@/components/Rating10';

type TitleDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number | null;
  number_of_episodes?: number | null;
};

type ReviewRow = {
  id: number;
  rating: number | null;
  review: string | null;
  updated_at: string;
  favorite: boolean | null;
  profiles:
    | { username: string; avatar_url: string | null }
    | { username: string; avatar_url: string | null }[]
    | null;
};

type Review = {
  id: number; // real bigint from DB
  rating: number | null;
  review: string | null;
  updated_at: string;
  favorite: boolean;
  profile: { username: string; avatar_url: string | null } | null;
};

type Comment = {
  id: number;
  user_item_id: number;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

type ReactionCounts = Record<string, number>; // emoji -> count

const EMOJIS = ['👍', '❤️', '😂', '🤯', '😢'];

function tmdbPoster(
  path?: string | null,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export default function TitlePage() {
  const { type, tmdb_id } = useParams<{ type: string; tmdb_id: string }>();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [details, setDetails] = useState<TitleDetails | null>(null);

  // user & item
  const [itemId, setItemId] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  // current user’s controls
  const [inWatchlist, setInWatchlist] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);

  // social
  const [loadingSocial, setLoadingSocial] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [reactions, setReactions] = useState<Record<number, ReactionCounts>>({}); // by user_item_id

  const numericTmdbId = Number(tmdb_id);

  // TMDb details
  useEffect(() => {
    (async () => {
      try {
        const V4 = process.env.NEXT_PUBLIC_TMDB_READ_TOKEN;
        const V3 = process.env.NEXT_PUBLIC_TMDB_KEY;

        let res: Response;
        if (V4) {
          res = await fetch(`https://api.themoviedb.org/3/${type}/${tmdb_id}?language=en-US`, {
            headers: { Authorization: `Bearer ${V4}`, 'Content-Type': 'application/json;charset=utf-8' },
          });
        } else if (V3) {
          res = await fetch(
            `https://api.themoviedb.org/3/${type}/${tmdb_id}?api_key=${V3}&language=en-US`
          );
        } else {
          throw new Error('Set NEXT_PUBLIC_TMDB_READ_TOKEN or NEXT_PUBLIC_TMDB_KEY');
        }

        if (!res.ok) throw new Error(`TMDb ${res.status}`);
        const json = (await res.json()) as TitleDetails;
        setDetails(json);
      } catch {
        setDetails(null);
      }
    })();
  }, [type, tmdb_id]);

  // auth + ensure profile, ensure items row, load current user's user_items
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setSignedIn(!!user);

      if (user) {
        // ensure profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (!prof) {
          await supabase.from('profiles').insert({
            id: user.id,
            username: (user.email?.split('@')[0] ?? 'user') + '_' + user.id.slice(0, 8),
            avatar_url: null,
          });
        }
      }

      // ensure items row exists
      const { data: it } = await supabase
        .from('items')
        .select('id')
        .eq('media_type', type)
        .or(`tmdb_id.eq.${String(numericTmdbId)},tmdb_id.eq.${numericTmdbId}`)
        .maybeSingle();

      let id = it?.id as number | undefined;
      if (!id && details) {
        const { data: inserted } = await supabase
          .from('items')
          .insert({
            tmdb_id: String(numericTmdbId),
            media_type: type,
            title: details.title || details.name || 'Untitled',
            poster_path: details.poster_path ?? null,
          })
          .select('id')
          .single();
        id = inserted?.id;
      }
      if (id) setItemId(id);

      // load current user's entry
      if (user && id) {
        const { data: ui } = await supabase
          .from('user_items')
          .select('status, favorite, rating, review')
          .eq('user_id', user.id)
          .eq('item_id', id)
          .maybeSingle();

        setInWatchlist(Boolean(ui?.status === 'watchlist'));
        setFavorite(Boolean(ui?.favorite));
        setRating(typeof ui?.rating === 'number' ? ui!.rating : null);
        setReview(ui?.review ?? '');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, type, numericTmdbId, details?.title]);

  // helper to load reviews + reactions + comments with real ids
  const loadSocial = useMemo(
    () => async () => {
      if (!itemId) return;
      setLoadingSocial(true);
      try {
        // reviews
        const { data: revs } = await supabase
          .from('user_items')
          .select('id, rating, review, favorite, updated_at, profiles(username, avatar_url)')
          .eq('item_id', itemId)
          .not('review', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(50);

        const cleaned: Review[] = (revs || []).map((r: ReviewRow) => {
          const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return {
            id: Number(r.id),
            rating: r.rating,
            review: r.review,
            favorite: Boolean(r.favorite),
            updated_at: r.updated_at,
            profile: prof ? { username: prof.username, avatar_url: prof.avatar_url } : null,
          };
        });
        setReviews(cleaned);

        // reactions (aggregate by emoji)
        if (cleaned.length) {
          const ids = cleaned.map((r) => r.id);
          const { data: rx } = await supabase
            .from('reactions')
            .select('user_item_id, emoji')
            .in('user_item_id', ids);

          const rxMap: Record<number, ReactionCounts> = {};
          (rx || []).forEach((row: any) => {
            const uid = Number(row.user_item_id);
            rxMap[uid] = rxMap[uid] || {};
            rxMap[uid][row.emoji] = (rxMap[uid][row.emoji] || 0) + 1;
          });
          setReactions(rxMap);

          // comments (list per user_item)
          const { data: cms } = await supabase
            .from('comments')
            .select('id, user_item_id, content, created_at, profiles(username, avatar_url)')
            .in('user_item_id', ids)
            .order('created_at', { ascending: true });

          const cmMap: Record<number, Comment[]> = {};
          (cms || []).forEach((c: any) => {
            const uid = Number(c.user_item_id);
            const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
            (cmMap[uid] = cmMap[uid] || []).push({
              id: c.id,
              user_item_id: uid,
              content: c.content,
              created_at: c.created_at,
              profiles: prof ? { username: prof.username, avatar_url: prof.avatar_url } : null,
            });
          });
          setComments(cmMap);
        } else {
          setReactions({});
          setComments({});
        }
      } finally {
        setLoadingSocial(false);
      }
    },
    [supabase, itemId]
  );

  // initial social load
  useEffect(() => {
    loadSocial();
  }, [loadSocial]);

  const poster = tmdbPoster(details?.poster_path, 'w500');

  // actions
  async function toggleWatchlist() {
    if (!signedIn || !itemId) return alert('Please sign in first.');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = inWatchlist ? null : 'watchlist';
      const { error } = await supabase
        .from('user_items')
        .upsert({ user_id: user.id, item_id: itemId, status: newStatus }, { onConflict: 'user_id,item_id' });
      if (!error) setInWatchlist(!inWatchlist);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite() {
    if (!signedIn || !itemId) return alert('Please sign in first.');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('user_items')
        .upsert({ user_id: user.id, item_id: itemId, favorite: !favorite }, { onConflict: 'user_id,item_id' });
      if (!error) setFavorite(!favorite);
    } finally {
      setSaving(false);
    }
  }

  async function saveRatingReview() {
    if (!signedIn || !itemId) return alert('Please sign in first.');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const clean = review.trim() || null;

      // ✅ Upsert and SELECT the real row to get the numeric id
      const { data: up, error } = await supabase
        .from('user_items')
        .upsert(
          { user_id: user.id, item_id: itemId, rating: rating ?? null, review: clean },
          { onConflict: 'user_id,item_id' }
        )
        .select('id') // <-- get the actual bigint id
        .single();

      if (error) {
        alert('Failed to save review: ' + error.message);
        return;
      }

      // ✅ Now reload the social data so every review has a real numeric id
      await loadSocial();
    } finally {
      setSaving(false);
    }
  }

  async function reactTo(userItemId: number, emoji: string) {
  if (!Number.isFinite(userItemId)) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert('Please sign in to react.');

  // See if this user already reacted with this emoji
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('user_item_id', userItemId)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    // remove reaction
    await supabase.from('reactions').delete().eq('id', existing.id);
    setReactions((prev) => {
      const cur = { ...(prev[userItemId] || {}) };
      cur[emoji] = Math.max(0, (cur[emoji] || 1) - 1);
      return { ...prev, [userItemId]: cur };
    });
  } else {
    // add new reaction
    const { error } = await supabase.from('reactions').insert({
      user_id: user.id,
      user_item_id: userItemId,
      emoji: String(emoji).slice(0, 8),
    });

    if (!error) {
      setReactions((prev) => {
        const cur = { ...(prev[userItemId] || {}) };
        cur[emoji] = (cur[emoji] || 0) + 1;
        return { ...prev, [userItemId]: cur };
      });
    } else {
      console.error('Reaction insert failed:', error.message);
    }
  }
}


  async function addComment(userItemId: number) {
    if (!Number.isFinite(userItemId)) return; // guard
    const text = prompt('Write a comment:')?.trim();
    if (!text) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please sign in to comment.');

    // optimistic
    const optimistic: Comment = {
      id: Math.floor(Math.random() * 1e9),
      user_item_id: userItemId,
      content: text,
      created_at: new Date().toISOString(),
      profiles: { username: user.email?.split('@')[0] ?? 'you', avatar_url: null },
    };
    setComments((p) => ({ ...p, [userItemId]: [...(p[userItemId] || []), optimistic] }));

    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      user_item_id: userItemId,
      content: text.slice(0, 1000),
    });
    if (error) {
      // rollback
      setComments((p) => ({
        ...p,
        [userItemId]: (p[userItemId] || []).filter((c) => c.id !== optimistic.id),
      }));
      alert('Failed to comment: ' + error.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          {poster ? (
            <Image
              src={poster}
              alt={details?.title || details?.name || 'Poster'}
              width={300}
              height={450}
              className="rounded-xl object-cover shadow bg-zinc-100 dark:bg-zinc-800"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          ) : (
            <div className="w-[300px] h-[450px] rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{details?.title || details?.name || '—'}</h1>
          <p className="mt-2 text-sm opacity-80">
            {(details?.release_date || details?.first_air_date) ?? '—'} •{' '}
            {details?.runtime
              ? `${details.runtime} min`
              : details?.number_of_episodes
              ? `${details.number_of_episodes} episodes`
              : type === 'tv'
              ? 'TV Series'
              : 'Film'}
          </p>
          {details?.overview && (
            <p className="mt-4 text-sm leading-relaxed opacity-90">{details.overview}</p>
          )}

          {/* Controls */}
          <div className="mt-6 grid gap-3">
            <div className="flex gap-3">
              <Button onClick={toggleWatchlist} disabled={saving} variant={inWatchlist ? 'default' : 'outline'}>
                {inWatchlist ? '✓ In Watchlist' : 'Add to Watchlist'}
              </Button>
              <Button onClick={toggleFavorite} disabled={saving} variant={favorite ? 'default' : 'outline'}>
                {favorite ? '★ Favorited' : 'Favorite'}
              </Button>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Rating</span>
                <Rating10 value={rating ?? 0} onChange={(v) => setRating(v)} />
              </div>
              <textarea
                className="mt-3 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400/40"
                rows={3}
                placeholder="Write a quick review…"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <div className="mt-2">
                <Button onClick={saveRatingReview} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews + Threads */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">User Reviews</h2>

        {loadingSocial ? (
          <p className="text-sm opacity-70">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm opacity-70">No reviews yet — be the first to review!</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => {
              const rx = reactions[r.id] || {};
              const cm = comments[r.id] || [];
              return (
                <li key={r.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div>
                      <p className="font-medium text-sm">@{r.profile?.username ?? 'user'}</p>
                      <p className="text-xs opacity-70">{new Date(r.updated_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {typeof r.rating === 'number' && (
                      <p className="text-sm font-medium">🔟 {r.rating}/10</p>
                    )}
                    {r.favorite && <p className="text-xs text-yellow-600">★ Favorited</p>}
                    {r.review && <p className="text-sm leading-relaxed">{r.review}</p>}
                  </div>

                  {/* Reactions Bar */}
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        className="rounded-full px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => reactTo(r.id, e)}
                        title={`React ${e}`}
                      >
                        {e} <span className="opacity-70 text-xs">{rx[e] || 0}</span>
                      </button>
                    ))}
                    <button
                      className="rounded-full px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => addComment(r.id)}
                      title="Add comment"
                    >
                      💬 <span className="opacity-70 text-xs">{cm.length}</span>
                    </button>
                  </div>

                  {/* Comment Thread */}
                  {cm.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {cm.map((c) => (
                        <div key={c.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                            <span className="text-sm font-medium">
                              @{c.profiles?.username ?? 'user'}
                            </span>
                            <span className="text-xs opacity-60">
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
