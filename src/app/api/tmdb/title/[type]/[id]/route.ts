import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { type: string; id: string } }
) {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) return NextResponse.json({ ok: false }, { status: 200 });

  const { type, id } = params;
  const base = "https://api.themoviedb.org/3";
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json;charset=utf-8",
  };

  const urls = [
    `${base}/${type}/${id}?language=en-US`,
    `${base}/${type}/${id}/credits?language=en-US`,
    `${base}/${type}/${id}/videos?language=en-US`,
    `${base}/${type}/${id}/watch/providers`,
  ];

  const [dRes, cRes, vRes, pRes] = await Promise.all(urls.map((u) => fetch(u, { headers, cache: "no-store" })));
  const [details, credits, videos, providers] = await Promise.all([
    dRes.ok ? dRes.json() : null,
    cRes.ok ? cRes.json() : null,
    vRes.ok ? vRes.json() : null,
    pRes.ok ? pRes.json() : null,
  ]);

  return NextResponse.json({ details, credits, videos, providers });
}
