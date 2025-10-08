// src/app/u/[username]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabaseServer } from '@/lib/supabase/server';
import ItemCard, { Item } from '@/components/ItemCard';
import Link from 'next/link';

type ParamsPromise = Promise<{ username: string }>;

function normalizeItem<T extends Record<string, any> | null | undefined>(
  item: T | T[]
): (Record<string, any> & {
  id?: number;
  tmdb_id?: number;
  media_type?: string;
  title?: string;
  poster_path?: string | null;
  release_date?: string | null;
  genres?: number[] | null;
}) | null {
  if (!item) return null;
  return Array.isArray(item) ? (item[0] ?? null) : (item as any);
}

type PublicRow = {
  status: 'watchlist' | 'completed';
  favorite: boolean;
  rating: number | null;
  review: string | null;
  item: Item;
  updated_at?: string;
};

export default async function PublicProfilePage({
  params,
}: {
  params: ParamsPromise;
}) {
  const { username } = await params;

  const supabase = await supabaseServer();

  // fetch profile by username
  const { data: prof, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('username', username)
    .maybeSingle();

  if (profErr) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">User</h1>
        <p className="text-sm text-red-600">Error: {profErr.message}</p>
      </div>
    );
  }

  if (!prof) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">User</h1>
        <p className="opacity-70">No user found for “{username}”.</p>
        <Link className="underline" href="/">
          Go home
        </Link>
      </div>
    );
  }

  // recent activity for this user
  const { data, error } = await supabase
    .from('user_items')
    .select(
      'status, favorite, rating, review, updated_at, item:items(id, tmdb_id, media_type, title, poster_path, release_date, genres)'
    )
    .eq('user_id', prof.id)
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{prof.username}</h1>
        <p className="text-sm text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  const rows: PublicRow[] = (data ?? [])
    .map((r: any) => {
      const it = normalizeItem(r.item);
      if (!it) return null;
      const item: Item = {
        id: Number(it.id),
        tmdb_id: it.tmdb_id ? Number(it.tmdb_id) : undefined,
        media_type: (it.media_type ?? 'movie') as Item['media_type'],
        title: it.title ?? 'Untitled',
        poster_path: (it.poster_path ?? null) as string | null,
        release_date: (it.release_date ?? null) as string | null,
        genres: (it.genres ?? null) as number[] | null,
      };
      return {
        status: r.status === 'completed' ? 'completed' : 'watchlist',
        favorite: !!r.favorite,
        rating: r.rating ?? null,
        review: r.review ?? null,
        updated_at: r.updated_at ?? null,
        item,
      } as PublicRow;
    })
    .filter(Boolean) as PublicRow[];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">@{prof.username}</h1>
          <p className="text-sm opacity-70">Recent activity · {rows.length} items</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="opacity-70">No public activity yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((ui) => (
            <ItemCard
              key={`${ui.item.media_type}-${ui.item.id}`}
              item={ui.item}
              initialStatus={{
                // ❗️No `item` here — only fields defined in UserItemStatus
                status: ui.status,
                favorite: ui.favorite,
                rating: ui.rating,
                review: ui.review,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
