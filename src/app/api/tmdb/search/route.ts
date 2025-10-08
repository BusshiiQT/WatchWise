import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("query") ?? "";
  const token = process.env.TMDB_READ_TOKEN;

  if (!q.trim() || !token) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(
    q
  )}&include_adult=false&language=en-US&page=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json;charset=utf-8",
    },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ results: [] }, { status: 200 });
  const data = await res.json();
  return NextResponse.json({ results: data?.results ?? [] });
}
