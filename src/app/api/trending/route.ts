import { NextResponse } from 'next/server';

type SimpleItem = {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  overview?: string | null;
};

export async function GET() {
  try {
    const V4 = process.env.NEXT_PUBLIC_TMDB_READ_TOKEN;
    const V3 = process.env.NEXT_PUBLIC_TMDB_KEY;

    let res: Response;

    if (V4) {
      res = await fetch('https://api.themoviedb.org/3/trending/movie/week?language=en-US', {
        headers: {
          Authorization: `Bearer ${V4}`,
          'Content-Type': 'application/json;charset=utf-8',
        },
        cache: 'no-store',
      });
    } else if (V3) {
      res = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${V3}&language=en-US`,
        { cache: 'no-store' }
      );
    } else {
      return NextResponse.json<SimpleItem[]>([]);
    }

    if (!res.ok) {
      return NextResponse.json<SimpleItem[]>([]);
    }

    const json = await res.json();
    const results: any[] = json?.results ?? [];

    const normalized: SimpleItem[] = results.map((r) => ({
      tmdb_id: Number(r.id),
      media_type: 'movie',
      title: r.title ?? r.name ?? 'Untitled',
      poster_path: r.poster_path ?? null,
      overview: r.overview ?? null,
    }));

    return NextResponse.json<SimpleItem[]>(normalized.slice(0, 20));
  } catch (err) {
    console.error('trending crash:', err);
    return NextResponse.json<SimpleItem[]>([]);
  }
}
