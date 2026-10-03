"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Img = { url: string; caption?: string | null };

export default function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState<number | null>(null);
  const step = useCallback((d: number) => setI((c) => (c === null ? c : (c + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (i === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setI(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  }, [i, step]);

  if (!images.length) return <p className="text-sm text-black/50">This photographer has not added portfolio photos yet.</p>;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, n) => (
          <button key={img.url} onClick={() => setI(n)} aria-label={`Open photo ${n + 1} of ${images.length}`}
            className="group relative aspect-square overflow-hidden bg-[#f3eee7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption || `${name} portfolio photo ${n + 1}`} loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {i !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-label={`${name} portfolio`}>
          <button onClick={() => setI(null)} aria-label="Close" className="absolute right-4 top-4 text-white"><X size={28} /></button>
          <button onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-3 text-white md:left-8"><ChevronLeft size={40} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[i].url} alt={images[i].caption || `${name} portfolio photo ${i + 1}`} className="max-h-[88vh] max-w-[88vw] object-contain" />
          <button onClick={() => step(1)} aria-label="Next photo" className="absolute right-3 text-white md:right-8"><ChevronRight size={40} /></button>
          <p className="absolute bottom-4 text-xs uppercase tracking-[0.25em] text-white/70">{name} · {i + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
