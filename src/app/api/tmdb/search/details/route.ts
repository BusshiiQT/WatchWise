import { NextRequest, NextResponse } from "next/server";


const TMDB_BASE = "https://api.themoviedb.org/3";


export async function GET(req: NextRequest) {
const { searchParams } = new URL(req.url);
const id = searchParams.get("id");
const media_type = searchParams.get("media_type"); // movie|tv
if (!id || !media_type) return NextResponse.json({ error: "Missing id or media_type" }, { status: 400 });
const url = `${TMDB_BASE}/${media_type}/${id}?append_to_response=images,credits`;
const res = await fetch(url, {
headers: { Authorization: `Bearer ${process.env.TMDB_BEARER}`, accept: "application/json" },
cache: "no-store",
});
const data = await res.json();
return NextResponse.json(data);
}