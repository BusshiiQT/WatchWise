'use client';

import { useMemo } from 'react';

export default function Rating10({
  value,
  onChange,
  readonly = false,
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const intVal = useMemo(() => Math.max(0, Math.min(10, Math.round(value ?? 0))), [value]);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }).map((_, i) => {
        const filled = i < intVal;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${i + 1}/10`}
            className={`h-6 w-6 rounded-full border ${filled ? 'bg-yellow-500 border-yellow-600' : 'bg-transparent border-zinc-400'} ${readonly ? 'pointer-events-none opacity-70' : 'hover:scale-105 transition'}`}
            onClick={() => onChange?.(i + 1)}
          />
        );
      })}
      <span className="ml-2 text-sm opacity-70">{intVal}/10</span>
    </div>
  );
}
