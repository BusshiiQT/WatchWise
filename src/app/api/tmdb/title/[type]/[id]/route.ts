// src/app/api/tmdb/title/[type]/[id]/route.ts
import { NextResponse } from 'next/server';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

function tmdbHeaders() {
  const v4 = process.env.NEXT_PUBLIC_TMDB_READ_TOKEN;
  const v3 = process.env.NEXT_PUBLIC_TMDB_KEY;

  if (v4) {
    return {
      Authorization: `Bearer ${v4}`,
      'Content-Type': 'application/json;charset=utf-8',
    } as const;
  }
  if (v3) return undefined; // use v3 key via query param
  throw new Error('TMDb token missing. Set NEXT_PUBLIC_TMDB_READ_TOKEN or NEXT_PUBLIC_TMDB_KEY.');
}

/**
 * NOTE: Next 15 can pass `params` either directly or as a Promise in its type-checking layer.
 * We accept `context: any` and normalize `params` to keep the build happy.
 */
export async function GET(_req: Request, context: any) {
  // Normalize params whether it's `{ params: {...} }` or `{ params: Promise<...> }`
  const maybeParams = context?.params;
  const params =
    maybeParams && typeof maybeParams.then === 'function'
      ? await maybeParams
      : maybeParams;

  const type = params?.type as string | undefined;
  const id = params?.id as string | undefined;

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }
  if (type !== 'movie' && type !== 'tv') {
    return NextResponse.json({ error: 'Invalid type (must be "movie" or "tv")' }, { status: 400 });
  }

  const headers = tmdbHeaders();
  const url = headers
    ? `${TMDB_API_BASE}/${type}/${id}?append_to_response=credits,release_dates,watch/providers,external_ids,images,videos,recommendations,similar`
    : `${TMDB_API_BASE}/${type}/${id}?append_to_response=credits,release_dates,watch/providers,external_ids,images,videos,recommendations,similar&api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`;

  const res = await fetch(url, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      { error: 'TMDb error', status: res.status, detail: text?.slice(0, 500) },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
