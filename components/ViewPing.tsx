"use client";
import { useEffect } from "react";

/**
 * Fires one POST to /api/places/{placeId}/view after the page mounts.
 * Rendered on the public place page so business owners can see traffic
 * to their listing in the dashboard analytics card.
 */
export default function ViewPing({ placeId }: { placeId: string }) {
  useEffect(() => {
    // Tiny delay to avoid counting accidental bounces
    const t = window.setTimeout(() => {
      try {
        fetch(`/api/places/${encodeURIComponent(placeId)}/view`, {
          method: "POST",
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }, 1500);
    return () => window.clearTimeout(t);
  }, [placeId]);
  return null;
}
