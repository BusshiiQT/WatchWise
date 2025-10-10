// src/app/api/feed/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * GET /api/feed?cursor=ISO&limit=20
 * Returns global activity, filtered by viewer's mutes/hidden (if signed in).
 * Cursor = ISO string for ui.updated_at; we fetch rows strictly older than it.
 */
export async function GET(req: Request) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get('limit') || '20';
  const limit = Math.min(parseInt(limitParam, 10) || 20, 50);
  const cursor = searchParams.get('cursor'); // ISO date string

  // Build base query
  let query = supabase
    .from('user_items')
    .select(
      `
      user_id,
      status,
      favorite,
      rating,
      review,
      updated_at,
      item:items(
        id,
        tmdb_id,
        media_type,
        title,
        poster_path,
        release_date,
        genres
      ),
      profile:profiles(
        username,
        avatar_url
      )
    `
    );

  if (cursor) {
    // Only older than cursor
    query = query.lt('updated_at', cursor);
  }

  query = query.order('updated_at', { ascending: false }).limit(limit + 1);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let rows = data ?? [];

  // If signed in, filter out muted users and hidden items
  if (user) {
    const [{ data: mutes }, { data: hidden }] = await Promise.all([
      supabase.from('muted_users').select('muted_user_id').eq('user_id', user.id),
      supabase.from('hidden').select('item_id').eq('user_id', user.id),
    ]);

    const mutedSet = new Set((mutes ?? []).map((m: any) => String(m.muted_user_id)));
    const hiddenSet = new Set((hidden ?? []).map((h: any) => Number(h.item_id)));

    rows = rows.filter((r: any) => {
      const it = Array.isArray(r.item) ? r.item[0] : r.item;
      const pid = String(r.user_id);
      const iid = it?.id ? Number(it.id) : null;
      if (mutedSet.has(pid)) return false;
      if (iid && hiddenSet.has(iid)) return false;
      return true;
    });
  }

  // Keyset-ish pagination by updated_at
  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const nextCursor = hasMore ? slice[slice.length - 1]?.updated_at : null;

  return NextResponse.json({ items: slice, nextCursor });
}
