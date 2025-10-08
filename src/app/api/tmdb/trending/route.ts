import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return NextResponse.json({ results: [] }, { status: 200 });

  const res = await fetch("https://api.themoviedb.org/3/trending/all/day?language=en-US", {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json;charset=utf-8" },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ results: [] }, { status: 200 });
  const data = await res.json();
  return NextResponse.json({ results: data?.results ?? [] });
}
