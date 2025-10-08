'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type SimpleItem = {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  overview?: string | null;
};

type TMDbMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  overview?: string;
};

type TMDbGenre = { id: number; name: string };

function tmdbPoster(
  path?: string | null,
  size: 'w342' | 'w500' | 'w780' | 'original' = 'w342'
) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function authHeaders() {
  const v4 = process.env.NEXT_PUBLIC_TMDB_READ_TOKEN;
  const v3 = process.env.NEXT_PUBLIC_TMDB_KEY;
  return v4
    ? { headers: { Authorization: `Bearer ${v4}`, 'Content-Type': 'application/json;charset=utf-8' } }
    : {} as RequestInit & { headers?: Record<string, string> };
}

async function tmdbFetchJSON(url: string) {
  const v4 = process.env.NEXT_PUBLIC_TMDB_READ_TOKEN;
  const v3 = process.env.NEXT_PUBLIC_TMDB_KEY;
  let full = url;
  if (!v4 && v3) {
    const sep = url.includes('?') ? '&' : '?';
    full = `${url}${sep}api_key=${v3}`;
  }
  const res = await fetch(full, authHeaders());
  if (!res.ok) throw new Error(`TMDb ${res.status}`);
  return res.json();
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<SimpleItem[]>([]);
  const [genres, setGenres] = useState<TMDbGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreResults, setGenreResults] = useState<TMDbMovie[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);

  // Load default recommendations + trending
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [recRes, trendRes] = await Promise.all([
          fetch('/api/recommendations', { credentials: 'same-origin' }),
          fetch('/api/trending', { credentials: 'same-origin' }),
        ]);
        const recData: SimpleItem[] = recRes.ok ? await recRes.json() : [];
        const trendData: SimpleItem[] = trendRes.ok ? await trendRes.json() : [];

        // Merge unique: personalized first, then trending to fill
        const map = new Map<string, SimpleItem>();
        for (const x of [...recData, ...trendData]) {
          const key = `${x.media_type}-${x.tmdb_id}`;
          if (!map.has(key)) map.set(key, x);
        }
        setRecs(Array.from(map.values()).slice(0, 20));
      } catch {
        setRecs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load movie genres (chips)
  useEffect(() => {
    (async () => {
      try {
        const data = await tmdbFetchJSON('https://api.themoviedb.org/3/genre/movie/list?language=en-US');
        setGenres((data?.genres || []).slice(0, 18)); // cap for neat row
      } catch {
        setGenres([]);
      }
    })();
  }, []);

  // When a genre is selected, fetch discover movies for that genre
  useEffect(() => {
    if (!selectedGenre) return;
    (async () => {
      setGenreLoading(true);
      try {
        const data = await tmdbFetchJSON(
          `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&with_genres=${selectedGenre}`
        );
        setGenreResults(data?.results || []);
      } catch {
        setGenreResults([]);
      } finally {
        setGenreLoading(false);
      }
    })();
  }, [selectedGenre]);

  const list = useMemo(() => {
    if (selectedGenre) {
      // show genre results (movies only) when a chip is selected
      return (genreResults || []).map((m) => ({
        tmdb_id: m.id,
        media_type: 'movie' as const,
        title: m.title,
        poster_path: m.poster_path,
        overview: m.overview,
      }));
    }
    return recs;
  }, [selectedGenre, genreResults, recs]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🍿 Discover</h1>
          <p className="text-sm opacity-70 mt-1">
            Top picks tailored to you. Browse by genre or explore trending.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/feed"><Button variant="outline">Community Feed</Button></Link>
          <Link href="/library"><Button variant="outline">Your Library</Button></Link>
        </div>
      </div>

      {/* Genre chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          className={`rounded-full border px-3 py-1 text-sm ${
            selectedGenre === null
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          onClick={() => setSelectedGenre(null)}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            className={`rounded-full border px-3 py-1 text-sm ${
              selectedGenre === g.id
                ? 'bg-yellow-500 text-black border-yellow-500'
                : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            onClick={() => setSelectedGenre(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {(selectedGenre ? genreLoading : loading) ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {list.map((item) => {
            const poster = tmdbPoster(item.poster_path, 'w342');
            return (
              <div
                key={`${item.media_type}-${item.tmdb_id}`}
                className="group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md transition"
              >
                <Link href={`/title/${item.media_type}/${item.tmdb_id}`} prefetch={false}>
                  {poster ? (
                    <Image
                      src={poster}
                      alt={item.title}
                      width={300}
                      height={450}
                      className="h-auto w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[2/3] w-full bg-zinc-200 dark:bg-zinc-800" />
                  )}
                  <div className="p-3">
                    <p className="font-medium line-clamp-2">{item.title}</p>
                    {item.overview && (
                      <p className="mt-1 text-xs opacity-70 line-clamp-3">{item.overview}</p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
