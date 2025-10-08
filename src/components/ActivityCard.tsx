"use client";
import Avatar from "./Avatar";
import Link from "next/link";

export default function ActivityCard({
  username,
  avatar_url,
  action,
  title,
  poster_path,
  when,
}: {
  username: string;
  avatar_url?: string | null;
  action: "completed" | "favorited";
  title: string;
  poster_path?: string | null;
  when: string;
}) {
  const img = poster_path
    ? `https://image.tmdb.org/t/p/w185${poster_path}`
    : undefined;

  return (
    <div className="card-hover flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Avatar name={username} src={avatar_url ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <span className="font-medium">{username}</span>{" "}
          {action === "completed" ? "completed" : "favorited"}{" "}
          <span className="font-medium">{title}</span>
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
      </div>
    </div>
  );
}
