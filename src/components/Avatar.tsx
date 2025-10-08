"use client";
export default function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  const initials = name?.slice(0, 2)?.toUpperCase() || "UU";
  return (
    <div
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full bg-rose-600 text-white"
    >
      <span className="text-xs">{initials}</span>
    </div>
  );
}
