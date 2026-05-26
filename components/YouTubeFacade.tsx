"use client";

import { useState } from "react";

/**
 * Lite YouTube embed — renders just the thumbnail + play button by default
 * (a single <img> + a tiny SVG), and only mounts the real <iframe> after the
 * user clicks. Saves ~500KB per video that's never played, and dodges the
 * Lighthouse penalty for embedding YT directly on a content page.
 *
 * Privacy: uses youtube-nocookie.com so no cookies until interaction.
 */
export default function YouTubeFacade({
  videoId,
  title,
  channel,
  aspect = "video",
}: {
  videoId: string;
  title: string;
  channel?: string;
  aspect?: "video" | "square";
}) {
  const [active, setActive] = useState(false);

  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-video";

  if (active) {
    return (
      <div className={`relative ${aspectClass} w-full overflow-hidden rounded-xl bg-black`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play video: ${title}`}
      className={`group relative ${aspectClass} w-full overflow-hidden rounded-xl bg-black focus:outline-none focus:ring-2 focus:ring-red-500`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      {/* Play button — YouTube red */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition group-hover:scale-110">
        <svg
          width="68"
          height="48"
          viewBox="0 0 68 48"
          aria-hidden="true"
          className="drop-shadow-lg"
        >
          <path
            d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74 0 13.05 0 24 0 24s0 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C68 34.95 68 24 68 24s0-10.95-1.48-16.26z"
            fill="#f00"
          />
          <path d="M45 24L27 14v20" fill="#fff" />
        </svg>
      </div>
      {/* Title overlay (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <div className="line-clamp-2 text-xs font-bold leading-snug text-white">{title}</div>
        {channel && <div className="mt-0.5 text-[10px] text-white/80">{channel}</div>}
      </div>
    </button>
  );
}
