"use client";

export default function WatchProvidersBadge({
  providers,
  country = "US",
}: {
  providers: any;
  country?: string;
}) {
  const entry = providers?.results?.[country];
  if (!entry) return null;

  const flat = entry.flatrate ?? entry.rent ?? entry.buy ?? [];
  if (!flat.length) return null;

  const names = flat.map((p: any) => p.provider_name).slice(0, 3).join(", ");

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
      Available on {names}
    </span>
  );
}
