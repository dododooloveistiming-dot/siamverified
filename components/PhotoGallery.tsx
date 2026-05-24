"use client";
import { useEffect, useState } from "react";

export default function PhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = photos.length;

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowLeft") setActive((i) => (i === null ? null : (i - 1 + total) % total));
      if (e.key === "ArrowRight") setActive((i) => (i === null ? null : (i + 1) % total));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, total]);

  if (total === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {photos.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setActive(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-ink-50 transition hover:opacity-90 dark:bg-ink-800"
            aria-label={`View photo ${i + 1} of ${total}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} photo ${i + 1}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
            {i === photos.length - 1 && total > 8 && (
              <span className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-bold text-white">
                +{total - 8} more
              </span>
            )}
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActive(null); }}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActive((i) => (i === null ? null : (i - 1 + total) % total)); }}
            aria-label="Previous"
            className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActive((i) => (i === null ? null : (i + 1) % total)); }}
            aria-label="Next"
            className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ›
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[active]}
            alt={`${alt} photo ${active + 1}`}
            className="max-h-[88vh] max-w-[88vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {active + 1} / {total}
          </div>
        </div>
      )}
    </>
  );
}
