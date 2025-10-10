// src/app/api/comments/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_item_id, content } = body || {};
    if (!user_item_id || !content) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      user_item_id,
      content: String(content).slice(0, 1000),
    });

    if (error) {
      console.warn('comment error:', error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
