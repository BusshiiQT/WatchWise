// src/app/api/reactions/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { user_item_id, emoji } = (await req.json().catch(() => ({}))) as {
      user_item_id?: string | number;
      emoji?: string;
    };

    if (!user_item_id || !emoji) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { error } = await supabase.from('reactions').insert({
      user_id: user.id,
      user_item_id,
      emoji: String(emoji).slice(0, 8),
    });

    if (error) {
      // ignore dupes (unique optional, if you add later)
      console.warn('reaction error:', error.message);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
