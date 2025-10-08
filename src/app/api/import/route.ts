import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const PayloadSchema = z.object({
  items: z.array(z.object({
    tmdb_id: z.number().optional(),
    media_type: z.enum(["movie","tv"]),
    title: z.string(),
    year: z.number().optional(),
    status: z.enum(["watchlist","completed"]).optional().default("watchlist"),
    favorite: z.boolean().optional().default(false),
    rating: z.number().nullable().optional(),
    review: z.string().nullable().optional(),
    poster_path: z.string().nullable().optional(),
    release_date: z.string().nullable().optional(),
    genres: z.array(z.number()).nullable().optional(),
  })),
});

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const items = parsed.data.items;

  const results: { ok: boolean; title: string; reason?: string }[] = [];

  for (const row of items) {
    try {
      // 1) Ensure items row exists (by tmdb_id if present; otherwise title+year as fallback)
      let itemId: number | null = null;

      if (row.tmdb_id) {
        const { data: existing, error: qErr } = await supabase
          .from("items")
          .select("id")
          .eq("tmdb_id", row.tmdb_id)
          .eq("media_type", row.media_type)
          .maybeSingle();
        if (qErr) throw qErr;
        if (existing?.id) {
          itemId = existing.id;
        }
      }

      if (!itemId) {
        // Try lookup by title + media_type + release_date (best-effort)
        if (row.title) {
          const { data: byTitle } = await supabase
            .from("items")
            .select("id")
            .eq("media_type", row.media_type)
            .ilike("title", row.title)
            .limit(1);
          if (byTitle && byTitle.length > 0) itemId = byTitle[0].id;
        }
      }

      if (!itemId) {
        // Insert minimal item
        const { data: ins, error: insErr } = await supabase
          .from("items")
          .insert({
            tmdb_id: row.tmdb_id ?? null,
            media_type: row.media_type,
            title: row.title,
            poster_path: row.poster_path ?? null,
            release_date: row.release_date ?? null,
            genres: row.genres ?? null,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        itemId = ins.id as number;
      }

      // 2) Upsert into user_items
      const payload = {
        user_id: user.id,
        item_id: itemId,
        status: row.status ?? "watchlist",
        favorite: !!row.favorite,
        rating: row.rating ?? null,
        review: row.review ?? null,
      };

      const { error: upErr } = await supabase
        .from("user_items")
        .upsert(payload, { onConflict: "user_id,item_id" });
      if (upErr) throw upErr;

      results.push({ ok: true, title: row.title });
    } catch (e: any) {
      results.push({ ok: false, title: row.title, reason: e?.message ?? "unknown error" });
    }
  }

  const ok = results.filter(r => r.ok).length;
  const failed = results.length - ok;

  return NextResponse.json({ ok, failed, results });
}
