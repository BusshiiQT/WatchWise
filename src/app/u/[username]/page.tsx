import { supabaseServer } from "@/lib/supabase/server";
import ItemCard, { Item } from "@/components/ItemCard";
import Image from "next/image";

function normalize<T extends Record<string, any> | null | undefined>(x: T | T[]): Record<string, any> | null {
  if (!x) return null;
  return Array.isArray(x) ? (x[0] ?? null) : (x as any);
}

type Row = {
  status: "watchlist" | "completed";
  favorite: boolean;
  rating: number | null;
  review: string | null;
  updated_at: string;
  item: Item;
};

export default async function PublicProfile({
  params,
}: {
  params: { username: string };
}) {
  const supabase = await supabaseServer();

  // Find the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("username", params.username)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="opacity-70">No user with that username.</p>
      </div>
    );
  }

  // Pull recent items for this user
  const { data } = await supabase
    .from("user_items")
    .select(
      "status, favorite, rating, review, updated_at, item:items(id, tmdb_id, media_type, title, poster_path, release_date, genres)"
    )
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(200);

  const rows: Row[] =
    (data ?? [])
      .map((r: any) => {
        const it = normalize(r.item);
        if (!it) return null;
        const item: Item = {
          id: Number(it.id),
          tmdb_id: it.tmdb_id ? Number(it.tmdb_id) : undefined,
          media_type: (it.media_type ?? "movie") as Item["media_type"],
          title: it.title ?? "Untitled",
          poster_path: (it.poster_path ?? null) as string | null,
          release_date: (it.release_date ?? null) as string | null,
          genres: (it.genres ?? null) as number[] | null,
        };
        return {
          status: r.status === "completed" ? "completed" : "watchlist",
          favorite: !!r.favorite,
          rating: r.rating ?? null,
          review: r.review ?? null,
          updated_at: String(r.updated_at),
          item,
        } as Row;
      })
      .filter(Boolean) as Row[];

  const favorites = rows.filter((r) => r.favorite).slice(0, 12);
  const latestReviews = rows.filter((r) => (r.review?.trim().length ?? 0) > 0).slice(0, 6);
  const recentlyCompleted = rows.filter((r) => r.status === "completed").slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.username}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-200 text-sm dark:bg-zinc-800">
            {profile.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="text-2xl font-semibold">@{profile.username}</h1>
      </div>

      {/* Favorites */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Favorites</h2>
        {favorites.length === 0 ? (
          <p className="opacity-70">No favorites yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {favorites.map((r) => (
              <ItemCard key={`fav-${r.item.id}`} item={r.item} initialStatus={{ favorite: true, status: r.status, rating: r.rating, review: r.review }} />
            ))}
          </div>
        )}
      </section>

      {/* Latest Reviews */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Latest reviews</h2>
        {latestReviews.length === 0 ? (
          <p className="opacity-70">No reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {latestReviews.map((r) => (
              <ItemCard key={`rev-${r.item.id}-${r.updated_at}`} item={r.item} initialStatus={{ status: r.status, rating: r.rating, review: r.review, favorite: r.favorite }} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Completed */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recently completed</h2>
        {recentlyCompleted.length === 0 ? (
          <p className="opacity-70">No completed titles yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recentlyCompleted.map((r) => (
              <ItemCard key={`comp-${r.item.id}-${r.updated_at}`} item={r.item} initialStatus={{ status: "completed", favorite: r.favorite, rating: r.rating, review: r.review }} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
