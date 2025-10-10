// src/app/api/feed/hide/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { item_id } = await req.json().catch(() => ({}));
  if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 });

  const { error } = await supabase
    .from('hidden')
    .upsert({ user_id: user.id, item_id }, { onConflict: 'user_id,item_id' });

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
  const item_id = searchParams.get('item_id');
  if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 });

  const { error } = await supabase
    .from('hidden')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', item_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
