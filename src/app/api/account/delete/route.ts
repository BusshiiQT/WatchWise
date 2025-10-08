import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { confirm } = await req.json().catch(() => ({}));
    if (confirm !== 'DELETE MY ACCOUNT') {
      return new NextResponse('Bad confirm phrase', { status: 400 });
    }

    // 1) Get current user via cookie-based client
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Not authenticated', { status: 401 });
    }

    // 2) Clean user-owned rows first (avoid orphaned FKs)
    // (Assumes user_items.user_id -> profiles.id; profiles.id = auth.users.id)
    await supabase.from('user_items').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);

    // 3) Delete Auth user with service role
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
      { auth: { persistSession: false } }
    );

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return new NextResponse('Admin delete failed: ' + delErr.message, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse('Unexpected error: ' + (e?.message ?? 'unknown'), { status: 500 });
  }
}
