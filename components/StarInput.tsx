"use client";
import { useState } from "react";

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Five-star picker built on radio buttons, so it works with a keyboard and screen readers. */
export default function StarInput({ defaultValue = 0 }: { defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset>
      <legend className="mb-1 block text-xs text-black/55">Your rating</legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
            <input type="radio" name="rating" value={n} required checked={value === n} onChange={() => setValue(n)} className="peer sr-only" />
            <span aria-hidden="true" className={`block text-3xl leading-none transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#9b5b2b] ${n <= shown ? "text-[#c8891f]" : "text-black/20"}`}>★</span>
            <span className="sr-only">{n} star{n > 1 ? "s" : ""}, {WORDS[n]}</span>
          </label>
        ))}
        <span className="ml-3 text-sm text-black/60" aria-live="polite">{WORDS[shown]}</span>
      </div>
    </fieldset>
  );
}
