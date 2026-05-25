"use client";
// Airbnb-style photo mosaic — 1 large hero on left + 2x2 thumbnail grid on
// right. The bottom-right thumb shows a "+N more / Show all" overlay when
// there are more than 5 photos. Click any tile to open a fullscreen
// lightbox carousel. Replaces the single-photo gradient hero.
//
// Why: Airbnb/Booking/Klook all lead with a photo mosaic, not a single
// photo. Photos drive 60-70% of place-detail conversion — burying them
// below the fold wastes the highest-converting asset.

import { useEffect, useState } from "react";

export default function HeroMosaic({
  photos,
  alt,
  placeholder,
}: {
  photos: string[];
  alt: string;
  placeholder?: React.ReactNode;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = photos.length;

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowLeft")
        setActive((i) => (i === null ? null : (i - 1 + total) % total));
      if (e.key === "ArrowRight")
        setActive((i) => (i === null ? null : (i + 1) % total));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, total]);

  if (total === 0) {
    return (
      <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl">
        {placeholder}
      </div>
    );
  }

  // The 5-up Airbnb mosaic. With <5 photos, gracefully degrade.
  const hero = photos[0];
  const thumbs = photos.slice(1, 5);
  const extraCount = total - 5;

  return (
    <>
      <div className="grid h-[280px] gap-1.5 sm:h-[380px] sm:grid-cols-2 sm:gap-2 md:h-[460px]">
        {/* Hero photo */}
        <button
          type="button"
          onClick={() => setActive(0)}
          className="group relative overflow-hidden rounded-l-2xl rounded-r-2xl bg-ink-100 transition active:scale-[0.998] sm:rounded-r-none dark:bg-ink-800"
          aria-label={`View photo 1 of ${total}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt={`${alt} photo 1`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="eager"
          />
        </button>

        {/* Thumb grid — hidden on mobile (saves vertical), 2x2 on sm+ */}
        {thumbs.length > 0 && (
          <div className="hidden grid-cols-2 gap-2 sm:grid">
            {thumbs.map((src, i) => {
              const idx = i + 1;
              const isLastVisible = i === thumbs.length - 1;
              const showOverlay = isLastVisible && extraCount > 0;
              const isTopRight = i === 1;
              const isBottomRight = i === 3;
              return (
                <button
                  key={src + idx}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={`group relative overflow-hidden bg-ink-100 transition active:scale-[0.99] dark:bg-ink-800 ${
                    isTopRight ? "rounded-tr-2xl" : ""
                  } ${isBottomRight ? "rounded-br-2xl" : ""}`}
                  aria-label={`View photo ${idx + 1} of ${total}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${alt} photo ${idx + 1}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    loading={i < 2 ? "eager" : "lazy"}
                  />
                  {showOverlay && (
                    <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-bold text-white">
                      +{extraCount} more
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* "Show all photos" button — bottom-right overlay style */}
      {total > 1 && (
        <div className="-mt-12 mb-4 flex justify-end pr-4 sm:-mt-14 sm:pr-6">
          <button
            type="button"
            onClick={() => setActive(0)}
            className="rounded-full border border-ink-900/10 bg-white/95 px-4 py-2 text-xs font-bold text-ink-900 shadow-lg backdrop-blur hover:bg-white dark:border-white/10 dark:bg-ink-900/90 dark:text-white"
          >
            ▦ Show all {total} photos
          </button>
        </div>
      )}

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActive(null);
            }}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? null : (i - 1 + total) % total));
            }}
            aria-label="Previous"
            className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? null : (i + 1) % total));
            }}
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
