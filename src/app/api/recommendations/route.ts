import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type SimpleItem = {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  overview?: string | null;
};

// Helper for server-side Supabase client
async function supabaseServer() {
  const cookieStore = await cookies(); // 👈 Await here!
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // No user → fallback handled on client
      return NextResponse.json<SimpleItem[]>([]);
    }

    // Fetch user’s favorites and highly rated titles
    const { data, error } = await supabase
      .from('user_items')
      .select(`
        rating,
        favorite,
        items ( tmdb_id, media_type, title, poster_path )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('recommendations error:', error.message);
      return NextResponse.json<SimpleItem[]>([]);
    }

    const rows = (data || []) as any[];

    // Prefer favorites or rating >= 4
    const liked = rows.filter(
      (r) => r.favorite === true || (typeof r.rating === 'number' && r.rating >= 4)
    );

    const unique = new Map<string, SimpleItem>();
    for (const r of liked) {
      const it = Array.isArray(r.items) ? r.items[0] : r.items;
      if (!it || !it.tmdb_id || !it.media_type) continue;
      const key = `${it.media_type}-${it.tmdb_id}`;
      if (!unique.has(key)) {
        unique.set(key, {
          tmdb_id: Number(it.tmdb_id),
          media_type: it.media_type,
          title: it.title ?? 'Untitled',
          poster_path: it.poster_path ?? null,
        });
      }
    }

    // Return list or empty array if no liked items
    return NextResponse.json<SimpleItem[]>(Array.from(unique.values()).slice(0, 20));
  } catch (err) {
    console.error('recommendations crash:', err);
    return NextResponse.json<SimpleItem[]>([]);
  }
}
