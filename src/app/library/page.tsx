// src/app/library/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getSupabaseServer } from '@/lib/supabase/server';
import ItemCard, { Item } from '@/components/ItemCard';
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

/* Normalize related row that might arrive as object OR array */
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

type LibraryRow = {
  status: 'watchlist' | 'completed';
  favorite: boolean;
  rating: number | null;
  review: string | null;
  item: Item;
};

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        'rounded-full px-3 py-1 text-sm ' +
        (active
          ? 'bg-rose-600 text-white'
          : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700')
      }
    >
      {children}
    </Link>
  );
}

function SubTab({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        'rounded-md px-2 py-1 text-xs ' +
        (active
          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700')
      }
    >
      {children}
    </Link>
  );
}

// Next 15 typing for searchParams
type SPromise = Promise<Record<string, string | string[] | undefined>>;

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: SPromise;
}) {
  const raw = await searchParams;
  const filter = ((
    typeof raw?.filter === 'string' ? raw.filter : 'watchlist'
  ) as 'watchlist' | 'completed' | 'favorites' | 'all');

  const type = ((
    typeof raw?.type === 'string' ? raw.type : 'all'
  ) as 'all' | 'movie' | 'tv');

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your Library</h1>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          <p className="mb-3 text-sm opacity-80">
            Sign in to view your watchlist, completed items, and favorites.
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  // Base query: join items
  let query = supabase
    .from('user_items')
    .select(
      'status, favorite, rating, review, item:items(id, tmdb_id, media_type, title, poster_path, release_date, genres)'
    )
    .eq('user_id', user.id);

  if (filter === 'watchlist') {
    query = query.eq('status', 'watchlist');
  } else if (filter === 'completed') {
    query = query.eq('status', 'completed');
  } else if (filter === 'favorites') {
    query = query.eq('favorite', true);
  }

  // Make sure latest changes show first
  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Your Library</h1>
        <p className="text-sm text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  const rows: LibraryRow[] = (data ?? [])
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
        item,
      } as LibraryRow;
    })
    .filter(Boolean) as LibraryRow[];

  const filteredRows =
    filter === 'completed' && type !== 'all'
      ? rows.filter((r) => r.item.media_type === type)
      : rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold">Your Library</h1>
        <div className="flex flex-wrap gap-2">
          <TabLink href="/library?filter=watchlist" active={filter === 'watchlist'}>
            Watchlist
          </TabLink>
          <TabLink href="/library?filter=completed" active={filter === 'completed'}>
            Completed
          </TabLink>
          <TabLink href="/library?filter=favorites" active={filter === 'favorites'}>
            Favorites
          </TabLink>
          <TabLink href="/library?filter=all" active={filter === 'all'}>
            All
          </TabLink>
        </div>
      </div>

      {filter === 'completed' && (
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Show:</span>
          <SubTab href="/library?filter=completed&type=all" active={type === 'all'}>
            All
          </SubTab>
          <SubTab href="/library?filter=completed&type=movie" active={type === 'movie'}>
            Movies
          </SubTab>
          <SubTab href="/library?filter=completed&type=tv" active={type === 'tv'}>
            TV
          </SubTab>
        </div>
      )}

      {filteredRows.length === 0 && (
        <p className="opacity-70">
          Nothing here yet. Go to{' '}
          <Link className="underline" href="/search">
            Search
          </Link>{' '}
          to add your first item.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredRows.map((ui) => (
          <ItemCard
            key={`${ui.item.media_type}-${ui.item.id}`}
            item={ui.item}
            initialStatus={ui}
          />
        ))}
      </div>
    </div>
  );
}
