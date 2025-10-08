import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item_id, reason } = await req.json().catch(() => ({}));
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const { error } = await supabase
    .from("hidden")
    .upsert({ user_id: user.id, item_id: Number(item_id), reason: reason ?? null }, { onConflict: "user_id,item_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
