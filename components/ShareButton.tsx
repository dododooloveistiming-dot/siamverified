"use client";

import { useState } from "react";

/**
 * Uses the native Web Share API — on mobile this surfaces the OS share sheet
 * (Kakao Talk, LINE, Telegram, etc. all installed by default for KR/JP/TH
 * audiences). On desktop falls back to clipboard copy with brief toast.
 *
 * Zero external SDK, zero auth setup, zero bundle bloat.
 */
export default function ShareButton({
  url,
  title,
  text,
  label = "Share",
}: {
  url: string;
  title: string;
  text?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: unknown }).share) {
      try {
        await navigator.share({ url, title, text });
      } catch {
        // User dismissed — no-op
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Last resort: open mail with link
      window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-emerald-950/40"
      aria-label={label}
    >
      <span>{copied ? "✓" : "🔗"}</span>
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
