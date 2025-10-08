'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type MediaType = 'all' | 'movie' | 'tv';
type TMDbResult =
  | {
      id: number;
      media_type: 'movie';
      title: string;
      poster_path: string | null;
      overview?: string | null;
      vote_average?: number;
      release_date?: string | null;
    }
  | {
      id: number;
      media_type: 'tv';
      name: string;
      poster_path: string | null;
      overview?: string | null;
      vote_average?: number;
      first_air_date?: string | null;
    };

function tmdbPoster(path?: string | null, size: 'w342'|'w500'|'w780'|'original' = 'w342') {
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

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState<MediaType>('all');
  const [year, setYear] = useState<string>('');        // e.g. 2024
  const [minRating, setMinRating] = useState<string>(''); // 0–10
  const [sortBy, setSortBy] = useState<'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc'>('popularity.desc');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TMDbResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // run search when pressing enter or clicking button
  async function runSearch() {
    setLoading(true);
    setError(null);
    try {
      // If there’s a search query, use TMDb search (supports keywords & titles)
      // If no query but filters are set, use discover
      if (q.trim()) {
        const endpoint =
          type === 'movie'
            ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=en-US`
            : type === 'tv'
            ? `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(q)}&include_adult=false&language=en-US`
            : `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&include_adult=false&language=en-US`;

        const data = await tmdbFetchJSON(endpoint);
        let res: TMDbResult[] = (data?.results || []).filter(
          (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
        );

        // optional post-filter by year/minRating if the user provided them
        if (year) {
          res = res.filter((r: any) => {
            const y =
              r.media_type === 'movie'
                ? (r.release_date || '').slice(0, 4)
                : (r.first_air_date || '').slice(0, 4);
            return y === year;
          });
        }
        if (minRating) {
          const min = Number(minRating);
          res = res.filter((r: any) => (r.vote_average ?? 0) >= min);
        }

        // optional re-sort
        if (sortBy === 'vote_average.desc') {
          res.sort((a: any, b: any) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
        }

        setResults(res);
      } else {
        // Discover with filters (no q)
        const base =
          type === 'tv'
            ? 'https://api.themoviedb.org/3/discover/tv'
            : 'https://api.themoviedb.org/3/discover/movie';
        const params = new URLSearchParams();
        params.set('include_adult', 'false');
        params.set('include_video', 'false');
        params.set('language', 'en-US');
        params.set('sort_by', sortBy);
        if (year) {
          if (type === 'tv') {
            params.set('first_air_date_year', year);
          } else {
            params.set('primary_release_year', year);
          }
        }
        if (minRating) params.set('vote_average.gte', minRating);

        const data = await tmdbFetchJSON(`${base}?${params.toString()}`);
        const res: TMDbResult[] = (data?.results || []).map((r: any) =>
          type === 'tv'
            ? { ...r, media_type: 'tv' as const }
            : { ...r, media_type: 'movie' as const }
        );
        setResults(res);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // initial empty discover (popular)
  useEffect(() => {
    (async () => {
      await runSearch();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">🔎 Search</h1>

      {/* Controls */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6 bg-white dark:bg-zinc-900">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="text-xs uppercase opacity-60">Title / Keywords</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="e.g. Oppenheimer, time travel, Nolan"
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400/40"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase opacity-60">Type</label>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as MediaType)}
            >
              <option value="all">All</option>
              <option value="movie">Movies</option>
              <option value="tv">TV</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase opacity-60">Year</label>
            <input
              type="number"
              min={1900}
              max={2100}
              placeholder="2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase opacity-60">Min Rating</label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              placeholder="7.5"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-12">
            <label className="text-xs uppercase opacity-60">Sort</label>
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-3 py-1 text-sm ${
                  sortBy === 'popularity.desc'
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                onClick={() => setSortBy('popularity.desc')}
              >
                Popularity
              </button>
              <button
                className={`rounded-full border px-3 py-1 text-sm ${
                  sortBy === 'vote_average.desc'
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                onClick={() => setSortBy('vote_average.desc')}
              >
                Rating
              </button>
              <button
                className={`rounded-full border px-3 py-1 text-sm ${
                  sortBy === 'primary_release_date.desc'
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                onClick={() => setSortBy('primary_release_date.desc')}
                disabled={type === 'tv'} // primary_release_date is movie field
                title={type === 'tv' ? 'Sort by release date is for movies' : ''}
              >
                Newest
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={runSearch}>Search</Button>
          <Button
            variant="outline"
            onClick={() => {
              setQ('');
              setType('all');
              setYear('');
              setMinRating('');
              setSortBy('popularity.desc');
              setResults([]);
              setTimeout(runSearch, 0);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4 text-sm">Error: {error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="opacity-70">No results yet. Try a title, person, studio, or a keyword like “heist”.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {results.map((r) => {
            const isMovie = r.media_type === 'movie';
            const title = isMovie ? (r as any).title : (r as any).name;
            const poster = tmdbPoster((r as any).poster_path, 'w342');
            const tmdbId = r.id;
            const mt = isMovie ? 'movie' : 'tv';
            return (
              <div
                key={`${mt}-${tmdbId}`}
                className="group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md transition"
              >
                <Link href={`/title/${mt}/${tmdbId}`} prefetch={false}>
                  {poster ? (
                    <Image
                      src={poster}
                      alt={title}
                      width={300}
                      height={450}
                      className="h-auto w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[2/3] w-full bg-zinc-200 dark:bg-zinc-800" />
                  )}
                  <div className="p-3">
                    <p className="font-medium line-clamp-2">{title}</p>
                    {typeof (r as any).vote_average === 'number' && (
                      <p className="text-xs opacity-70 mt-1">Rating: {(r as any).vote_average.toFixed(1)}/10</p>
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
