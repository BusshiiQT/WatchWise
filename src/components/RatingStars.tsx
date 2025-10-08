"use client";
import { useState } from "react";


export default function RatingStars({ value, onChange }: { value?: number | null; onChange: (v: number) => void }) {
const [hover, setHover] = useState<number | null>(null);
const rating = hover ?? (value ?? 0);
return (
<div className="inline-flex select-none gap-1">
{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
<button
key={n}
className={"h-5 w-5 rounded-full " + (rating >= n ? "bg-yellow-400" : "bg-zinc-300 dark:bg-zinc-700")}
onMouseEnter={() => setHover(n)}
onMouseLeave={() => setHover(null)}
onClick={() => onChange(n)}
aria-label={`Rate ${n}`}
title={`${n}/10`}
/>
))}
</div>
);
}