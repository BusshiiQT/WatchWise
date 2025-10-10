// src/app/api/feed/mute/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { muted_user_id } = (await req.json().catch(() => ({}))) as {
    muted_user_id?: string;
  };
  if (!muted_user_id) {
    return NextResponse.json({ error: 'muted_user_id required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('muted_users')
    .upsert(
      { user_id: user.id, muted_user_id },
      { onConflict: 'user_id,muted_user_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const muted_user_id = searchParams.get('muted_user_id');
  if (!muted_user_id) {
    return NextResponse.json({ error: 'muted_user_id required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('muted_users')
    .delete()
    .eq('user_id', user.id)
    .eq('muted_user_id', muted_user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
