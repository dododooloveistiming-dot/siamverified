"use client";
import { useEffect } from "react";

// AdSense publisher ID (e.g. "ca-pub-1234567890123456"). Unset until the
// site has an approved AdSense account — this component renders nothing at
// all until then, so it's safe to place at every reclaimed affiliate slot
// now and it'll start serving ads the moment the env var + slot IDs exist,
// with no further code changes.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function AdSlot({
  slot,
  format = "auto",
  className,
  minHeight,
}: {
  slot: string;
  format?: string;
  className?: string;
  minHeight?: number;
}) {
  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* ad blocker or script not loaded yet — non-fatal */
    }
  }, []);

  if (!ADSENSE_CLIENT) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block", minHeight }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
