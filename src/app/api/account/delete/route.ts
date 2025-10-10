// src/app/api/account/delete/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { confirm } = (await req.json().catch(() => ({}))) as { confirm?: string };
    if (confirm !== 'DELETE MY ACCOUNT') {
      return new NextResponse('Bad confirm phrase', { status: 400 });
    }

    // 1) Get current user via cookie-based server client
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Not authenticated', { status: 401 });
    }

    // 2) Clean user-owned rows first (avoid orphaned FKs)
    await supabase.from('user_items').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);

    // 3) Delete Auth user with service role (server-only key — NOT NEXT_PUBLIC)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return new NextResponse('Admin delete failed: ' + delErr.message, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return new NextResponse('Unexpected error: ' + msg, { status: 500 });
  }
}
