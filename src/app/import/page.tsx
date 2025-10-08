"use client";

import { useMemo, useRef, useState } from "react";
import Papa, { ParseResult } from "papaparse";

type RawRow = Record<string, string>;
type CleanRow = {
  media_type: "movie" | "tv";
  title: string;
  year?: number;
  status: "watchlist" | "completed";
  favorite: boolean;
  rating: number | null;
  review: string | null;
  tmdb_id?: number;
  poster_path?: string | null;
  release_date?: string | null;
  genres?: number[] | null;
};

type MatchProgress =
  | { phase: "idle" }
  | { phase: "parsing" }
  | { phase: "matching"; current: number; total: number }
  | { phase: "importing"; current: number; total: number }
  | { phase: "done"; ok: number; failed: number };

function normalizeLetterboxd(row: RawRow): CleanRow | null {
  const title = row["Title"]?.trim();
  if (!title) return null;
  const year = Number(row["Year"]) || undefined;

  const status = row["WatchedDate"]?.trim() ? "completed" : "watchlist";
  const ratingRaw = row["Rating"];
  const rating = ratingRaw ? Number(ratingRaw) : null;

  const favorite = (row["Tags"] ?? "").toLowerCase().includes("favorite");
  const review = row["Review"]?.trim() || null;

  return {
    media_type: "movie",
    title,
    year,
    status,
    favorite,
    rating,
    review,
  };
}

function normalizeTrakt(row: RawRow): CleanRow | null {
  const type = (row["type"] ?? "").toLowerCase();
  const media_type =
    type.includes("show") || type === "episode" || type === "tv" ? "tv" : "movie";

  const title =
    row["title"]?.trim() ||
    row["movie_title"]?.trim() ||
    row["show_title"]?.trim();
  if (!title) return null;

  const year =
    Number(row["year"] ?? row["movie_year"] ?? row["show_year"]) || undefined;

  const action = (row["action"] ?? "").toLowerCase();
  const status =
    action === "watchlisted" || action === "watchlist" ? "watchlist" : "completed";

  const ratingStr = row["rating"] ?? row["user_rating"];
  const rating = ratingStr ? Number(ratingStr) : null;

  const review = row["review"]?.trim() || null;

  return {
    media_type,
    title,
    year,
    status,
    favorite: false,
    rating,
    review,
  };
}

async function tmdbMatchOne(clean: CleanRow): Promise<CleanRow> {
  if (clean.tmdb_id) return clean;

  const q = `${clean.title}${clean.year ? " " + clean.year : ""}`;
  const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(q)}`);
  const data = await res.json();
  const results: any[] = data?.results ?? [];

  const filtered = results.filter((r) =>
    clean.media_type === "tv" ? r.media_type === "tv" : r.media_type === "movie"
  );

  let best: any = filtered[0] ?? results[0];
  if (!best) return clean;

  if (clean.year) {
    const withYear = filtered.length ? filtered : results;
    let minDelta = Infinity;
    for (const r of withYear) {
      const yStr = r.release_date ?? r.first_air_date ?? "";
      const y = yStr ? Number(String(yStr).slice(0, 4)) : undefined;
      const delta = y ? Math.abs(y - clean.year!) : 9999;
      if (delta < minDelta) {
        minDelta = delta;
        best = r;
      }
    }
  }

  return {
    ...clean,
    tmdb_id: Number(best.id),
    poster_path: best.poster_path ?? null,
    release_date: best.release_date ?? best.first_air_date ?? null,
    genres: best.genre_ids ?? null,
  };
}

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<CleanRow[]>([]);
  const [progress, setProgress] = useState<MatchProgress>({ phase: "idle" });
  const [source, setSource] = useState<"letterboxd" | "trakt">("letterboxd");
  const [onlyWatchlist, setOnlyWatchlist] = useState(false);

  const readyToImport = useMemo(() => rows.length > 0, [rows]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgress({ phase: "parsing" });
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: ParseResult<RawRow>) => {
        const raw = result.data as RawRow[];
        const cleaned: CleanRow[] = raw
          .map((r) => (source === "letterboxd" ? normalizeLetterboxd(r) : normalizeTrakt(r)))
          .filter(Boolean) as CleanRow[];

        setRows(cleaned);
        setProgress({ phase: "idle" });
      },
      error: () => {
        setProgress({ phase: "idle" });
        alert("Failed to parse CSV");
      },
    });
  }

  async function matchAll() {
    if (!rows.length) return;
    setProgress({ phase: "matching", current: 0, total: rows.length });

    const matched: CleanRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const m = await tmdbMatchOne(r);
      matched.push(m);
      setProgress({ phase: "matching", current: i + 1, total: rows.length });
    }
    setRows(matched);
    setProgress({ phase: "idle" });
  }

  async function runImport() {
    const toSend = rows
      .filter((r) => (onlyWatchlist ? r.status === "watchlist" : true))
      .map((r) => ({
        tmdb_id: r.tmdb_id,
        media_type: r.media_type,
        title: r.title,
        year: r.year,
        status: r.status,
        favorite: r.favorite,
        rating: r.rating,
        review: r.review,
        poster_path: r.poster_path ?? null,
        release_date: r.release_date ?? null,
        genres: r.genres ?? null,
      }));

    if (toSend.length === 0) {
      alert("Nothing to import (filtered out).");
      return;
    }

    setProgress({ phase: "importing", current: 0, total: toSend.length });

    const chunkSize = 75;
    let okTotal = 0;
    let failTotal = 0;

    for (let i = 0; i < toSend.length; i += chunkSize) {
      const chunk = toSend.slice(i, i + chunkSize);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunk }),
      });
      const data = await res.json().catch(() => ({}));
      okTotal += data?.ok ?? 0;
      failTotal += data?.failed ?? 0;
      setProgress({
        phase: "importing",
        current: Math.min(i + chunk.length, toSend.length),
        total: toSend.length,
      });
    }

    setProgress({ phase: "done", ok: okTotal, failed: failTotal });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Import</h1>
        <a
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          href="/library"
        >
          Go to Library
        </a>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm">Source:</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as any)}
            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="letterboxd">Letterboxd CSV</option>
            <option value="trakt">Trakt CSV</option>
          </select>

          <label className="ml-4 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyWatchlist}
              onChange={(e) => setOnlyWatchlist(e.target.checked)}
            />
            Import only Watchlist rows
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={inputRef} type="file" accept=".csv" onChange={onPickFile} />
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Choose CSV…
          </button>

          <button
            onClick={matchAll}
            disabled={!rows.length || progress.phase !== "idle"}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            title="Find TMDb matches for every row"
          >
            1) Match with TMDb
          </button>

          <button
            onClick={runImport}
            disabled={!rows.length || progress.phase !== "idle"}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            2) Import to Library
          </button>
        </div>

        {/* Progress */}
        <div className="mt-3 text-sm">
          {progress.phase === "parsing" && <span>Parsing CSV…</span>}
          {progress.phase === "matching" && (
            <span>Matching {progress.current}/{progress.total}…</span>
          )}
          {progress.phase === "importing" && (
            <span>Importing {progress.current}/{progress.total}…</span>
          )}
          {progress.phase === "done" && (
            <span>Done. Imported {progress.ok} rows, {progress.failed} failed.</span>
          )}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <div className="mb-2 text-xs opacity-70">
            Preview (first {Math.min(20, rows.length)} of {rows.length})
          </div>
          <div className="grid grid-cols-6 gap-2">
            <div className="font-medium">Title</div>
            <div className="font-medium">Type</div>
            <div className="font-medium">Year</div>
            <div className="font-medium">Status</div>
            <div className="font-medium">Rating</div>
            <div className="font-medium">TMDb</div>
            {rows.slice(0, 20).map((r, i) => (
              <FragmentRow key={i} r={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentRow({ r }: { r: CleanRow }) {
  return (
    <>
      <div className="truncate">{r.title}</div>
      <div className="truncate">{r.media_type}</div>
      <div className="truncate">{r.year ?? ""}</div>
      <div className="truncate">{r.status}</div>
      <div className="truncate">{r.rating ?? ""}</div>
      <div className="truncate">{r.tmdb_id ?? ""}</div>
    </>
  );
}
