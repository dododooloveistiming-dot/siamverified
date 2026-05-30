"use client";

import { useCallback, useEffect, useState } from "react";
import type { Place } from "@/lib/types";

const KEY = "verifiedthai.wishlist";

export type WishlistItem = {
  id: string;
  slug: string;
  name: string;
  city: string;
  niche: string;
  rating?: number;
  trust_score: number;
  top_photo_url?: string;
  price_min_thb?: number;
  price_max_thb?: number;
  addedAt: number;
};

export function loadWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(items)); }
  catch {}
  // Notify other components on the same page
  window.dispatchEvent(new CustomEvent("wishlist-changed"));
}

function placeToItem(p: Place): WishlistItem {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    city: p.city || "",
    niche: p.niche,
    rating: p.rating ?? undefined,
    trust_score: p.trust_score,
    top_photo_url: p.top_photo_url || undefined,
    price_min_thb: p.price_min_thb || undefined,
    price_max_thb: p.price_max_thb || undefined,
    addedAt: Date.now(),
  };
}

export default function WishlistButton({ place }: { place: Place }) {
  const [starred, setStarred] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStarred(loadWishlist().some((w) => w.id === place.id));
    setHydrated(true);
    const onChange = () => setStarred(loadWishlist().some((w) => w.id === place.id));
    window.addEventListener("wishlist-changed", onChange);
    return () => window.removeEventListener("wishlist-changed", onChange);
  }, [place.id]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const list = loadWishlist();
    if (list.some((w) => w.id === place.id)) {
      saveWishlist(list.filter((w) => w.id !== place.id));
    } else {
      saveWishlist([...list, placeToItem(place)]);
    }
  }, [place]);

  if (!hydrated) {
    // Render a stable placeholder during SSR + first paint to avoid hydration
    // mismatch. The button needs identical markup pre- and post-hydration.
    return (
      <button
        type="button"
        aria-label="Save to wishlist"
        className="rounded-full bg-white/95 px-2 py-1 text-base opacity-70 backdrop-blur-sm shadow dark:bg-ink-900/95"
      >
        ☆
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={starred ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={starred}
      title={starred ? "Remove from wishlist" : "Save to wishlist"}
      className={`rounded-full px-2 py-1 text-base backdrop-blur-sm shadow transition ${
        starred
          ? "bg-amber-400 text-amber-950"
          : "bg-white/95 text-ink-700 hover:bg-amber-100 dark:bg-ink-900/95 dark:text-ink-300"
      }`}
    >
      {starred ? "★" : "☆"}
    </button>
  );
}
