"use client";
import { useState } from "react";
import type { Niche } from "@/lib/types";
import PlacePlaceholder from "./PlacePlaceholder";
import { resizeGooglePhoto } from "@/lib/googlePhoto";

// Google's `/gps-cs-s/` photo CDN URLs are session tokens that expire after
// a few weeks — roughly 40% of scraped listing photos 403 by the time a
// visitor loads the page. Swap to the niche placeholder instead of leaving
// a broken-image icon.

// The scrape only ever requested ~203px-wide thumbnails, then the site
// rendered them at hero/card width — visibly blurry. Map the existing
// `size` prop to an actual pixel target and rewrite Google's CDN URL to
// request that size instead of upscaling a tiny image client-side.
const SIZE_TO_WIDTH: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 240,
  md: 480,
  lg: 800,
  xl: 1200,
};

export default function SafeImg({
  src,
  alt,
  className,
  niche,
  size = "md",
  fallbackClassName,
  loading = "lazy",
  decoding,
  fetchPriority,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  niche?: Niche;
  size?: "sm" | "md" | "lg" | "xl";
  // Wraps the fallback placeholder — pass the same positioning classes
  // (e.g. "absolute inset-0") the <img> would have used, since className
  // only applies to the <img> element itself. Falls back to `className`
  // when omitted, matching the plain no-niche gradient fallback.
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
  decoding?: "sync" | "async" | "auto";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const [broken, setBroken] = useState(false);
  const resized = resizeGooglePhoto(src, SIZE_TO_WIDTH[size]);

  if (!resized || broken) {
    if (niche) {
      return fallbackClassName ? (
        <div className={fallbackClassName}>
          <PlacePlaceholder niche={niche} size={size} />
        </div>
      ) : (
        <PlacePlaceholder niche={niche} size={size} />
      );
    }
    return (
      <div
        className={`h-full w-full bg-gradient-to-br from-ink-100 to-ink-200 dark:from-ink-800 dark:to-ink-900 ${fallbackClassName ?? className ?? ""}`}
        aria-hidden="true"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resized}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={() => setBroken(true)}
    />
  );
}
