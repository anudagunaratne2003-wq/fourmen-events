/** Read-only star rating, e.g. ★★★★☆ 4.3 (12 reviews). */
export default function Stars({ value, count, size = "text-base", showNumber = true }: { value: number; count?: number; size?: string; showNumber?: boolean }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${value.toFixed(1)} out of 5${count != null ? ` from ${count} review${count === 1 ? "" : "s"}` : ""}`}>
      <span className={`${size} leading-none tracking-[0.05em]`} aria-hidden="true">
        <span className="text-[#c8891f]">{"★".repeat(full)}</span><span className="text-black/20">{"★".repeat(5 - full)}</span>
      </span>
      {showNumber && <span className="text-sm text-black/60" aria-hidden="true">{value.toFixed(1)}{count != null && ` (${count})`}</span>}
    </span>
  );
}
