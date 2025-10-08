'use client';
export const dynamic = 'force-dynamic'; // always SSR
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type FeedItem = {
  id: string;
  rating: number | null;
  review: string | null;
  updated_at: string;
  profiles: { username: string; avatar_url: string | null };
  items: { title: string; poster_path: string | null; media_type: string; tmdb_id?: number };
};

function tmdbPoster(path?: string | null, size: 'w342'|'w500'|'w780'|'original' = 'w342') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

const EMOJIS = ['👍','❤️','😂','🤯','😢'];

export default function FeedPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_items')
          .select(`
            id,
            rating,
            review,
            updated_at,
            profiles(username, avatar_url),
            items(title, poster_path, media_type, tmdb_id)
          `)
          .not('review', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(40);

        if (error) console.warn(error.message);

        const rows = (data || []).map((r: any) => ({
          id: String(r.id),
          rating: r.rating,
          review: r.review,
          updated_at: r.updated_at,
          profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
          items: Array.isArray(r.items) ? r.items[0] : r.items,
        })) as FeedItem[];

        setFeed(rows);

        // load reaction counts
        const ids = rows.map((r) => r.id);
        if (ids.length) {
          const { data: rx } = await supabase
            .from('reactions')
            .select('user_item_id, emoji')
            .in('user_item_id', ids);

          const map: Record<string, Record<string, number>> = {};
          (rx || []).forEach((row: any) => {
            if (!map[row.user_item_id]) map[row.user_item_id] = {};
            map[row.user_item_id][row.emoji] = (map[row.user_item_id][row.emoji] || 0) + 1;
          });
          setReactions(map);

          const { data: cm } = await supabase
            .from('comments')
            .select('user_item_id')
            .in('user_item_id', ids);
          const cmMap: Record<string, number> = {};
          (cm || []).forEach((c: any) => {
            cmMap[c.user_item_id] = (cmMap[c.user_item_id] || 0) + 1;
          });
          setCommentsCount(cmMap);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  async function react(userItemId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Sign in to react.');

    // optimistic update
    setReactions((prev) => {
      const rec = { ...(prev[userItemId] || {}) };
      rec[emoji] = (rec[emoji] || 0) + 1;
      return { ...prev, [userItemId]: rec };
    });

    await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_item_id: userItemId, emoji }),
    });
  }

  async function addComment(userItemId: string) {
    const text = prompt('Write a comment:')?.trim();
    if (!text) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Sign in to comment.');

    // optimistic count
    setCommentsCount((p) => ({ ...p, [userItemId]: (p[userItemId] || 0) + 1 }));

    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_item_id: userItemId, content: text }),
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🎬 Community Feed</h1>
        <Link href="/profile"><Button variant="outline">Profile</Button></Link>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading feed…</p>
      ) : feed.length === 0 ? (
        <p className="text-zinc-500">No reviews yet.</p>
      ) : (
        <div className="space-y-6">
          {feed.map((item) => {
            const poster = tmdbPoster(item.items?.poster_path, 'w342');
            const rx = reactions[item.id] || {};
            const cmCount = commentsCount[item.id] || 0;

            return (
              <div key={item.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 flex gap-4">
                <div className="flex-shrink-0">
                  {poster ? (
                    <Image src={poster} alt={item.items.title} width={92} height={138} className="rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800" />
                  ) : (
                    <div className="w-[92px] h-[138px] rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <span className="font-medium">{item.profiles.username}</span>
                    <span className="text-xs opacity-60">{new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>

                  <h2 className="font-semibold text-lg">{item.items.title}</h2>
                  {typeof item.rating === 'number' && (
                    <p className="text-sm font-medium">🔟 {item.rating}/10</p>
                  )}
                  {item.review && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{item.review}</p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/title/${item.items.media_type}/${item.items.tmdb_id ?? ''}`} prefetch={false}>
                      <Button size="sm" variant="outline">View Details</Button>
                    </Link>

                    <div className="ml-2 flex items-center gap-1">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          className="rounded-full px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => react(item.id, e)}
                          title={`React ${e}`}
                        >
                          {e} <span className="opacity-70 text-xs">{rx[e] || 0}</span>
                        </button>
                      ))}
                      <button
                        className="ml-2 rounded-full px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => addComment(item.id)}
                        title="Add comment"
                      >
                        💬 <span className="opacity-70 text-xs">{cmCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
