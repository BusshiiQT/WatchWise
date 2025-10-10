// src/components/CategoryToggles.tsx
'use client';

type Props = {
  status: 'watchlist' | 'completed';
  favorite: boolean;
  onToggleWatchlist: () => void;
  onToggleCompleted: () => void;
  onToggleFavorite: () => void;
};

export default function CategoryToggles({
  status,
  favorite,
  onToggleWatchlist,
  onToggleCompleted,
  onToggleFavorite,
}: Props) {
  const isWatchlist = status === 'watchlist';
  const isCompleted = status === 'completed';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggleWatchlist}
        className={
          'rounded-full px-3 py-1 text-xs border transition ' +
          (isWatchlist
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100')
        }
        title="Toggle Watchlist"
      >
        Watchlist
      </button>

      <button
        type="button"
        onClick={onToggleCompleted}
        className={
          'rounded-full px-3 py-1 text-xs border transition ' +
          (isCompleted
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100')
        }
        title="Mark as Completed"
      >
        Completed
      </button>

      <button
        type="button"
        onClick={onToggleFavorite}
        className={
          'rounded-full px-3 py-1 text-xs border transition ' +
          (favorite
            ? 'border-rose-500 bg-rose-500 text-white'
            : 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100')
        }
        title="Toggle Favorite"
      >
        ♥ Favorite
      </button>
    </div>
  );
}
