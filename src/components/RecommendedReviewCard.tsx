"use client";
import Avatar from "./Avatar";

export default function RecommendedReviewCard({
  username,
  avatar_url,
  title,
  poster_path,
  rating,
  review,
  when,
}: {
  username: string;
  avatar_url?: string | null;
  title: string;
  poster_path?: string | null;
  rating?: number | null;
  review?: string | null;
  when: string;
}) {
  const img = poster_path ? `https://image.tmdb.org/t/p/w185${poster_path}` : undefined;

  return (
    <div className="card-hover flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Avatar name={username} src={avatar_url ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <span className="font-medium">{username}</span>{" "}
          <span className="opacity-80">reviewed</span>{" "}
          <span className="font-medium">{title}</span>
          {typeof rating === "number" && (
            <span className="ml-2 rounded-full bg-rose-600 px-2 py-[2px] text-xs text-white">
              {rating}/10
            </span>
          )}
        </div>
        <div className="text-xs opacity-70">{when}</div>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={title}
            className="mt-2 h-32 w-24 rounded-md object-cover"
            width={96}
            height={128}
          />
        )}
        {review && (
          <p className="mt-2 line-clamp-2 text-sm opacity-90">{review}</p>
        )}
      </div>
    </div>
  );
}
