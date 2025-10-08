import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return NextResponse.json({ results: [] }, { status: 200 });

  // Movies only; change to /tv/popular for TV
  const res = await fetch("https://api.themoviedb.org/3/movie/popular?language=en-US&page=1", {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json;charset=utf-8" },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ results: [] }, { status: 200 });
  const data = await res.json();
  return NextResponse.json({ results: data?.results ?? [] });
}
