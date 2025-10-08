"use client";
export default function CategoryToggles({
status,
favorite,
onToggleWatchlist,
onToggleCompleted,
onToggleFavorite,
}: {
status: "watchlist" | "completed";
favorite: boolean;
onToggleWatchlist: () => void;
onToggleCompleted: () => void;
onToggleFavorite: () => void;
}) {
return (
<div className="flex flex-wrap gap-2 text-xs">
<button onClick={onToggleWatchlist} className={"rounded-full px-2.5 py-1 " + (status === "watchlist" ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-700")}>Watchlist</button>
<button onClick={onToggleCompleted} className={"rounded-full px-2.5 py-1 " + (status === "completed" ? "bg-emerald-600 text-white" : "bg-zinc-200 dark:bg-zinc-700")}>Completed</button>
<button onClick={onToggleFavorite} className={"rounded-full px-2.5 py-1 " + (favorite ? "bg-pink-600 text-white" : "bg-zinc-200 dark:bg-zinc-700")}>★ Favorite</button>
</div>
);
}