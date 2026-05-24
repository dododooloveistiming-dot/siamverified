// Cartoon-style illustrated placeholder for places without a photo.
// Each niche gets a distinctive gradient + decorative shapes + big emoji.
// Pure CSS/inline-SVG so it renders fast at build time.

import type { Niche } from "@/lib/types";
import { NICHE_META } from "@/lib/types";

const NICHE_THEME: Record<Niche, { from: string; via: string; to: string; bg: string }> = {
  "muay-thai": {
    from: "from-rose-100",
    via: "via-orange-50",
    to: "to-amber-100",
    bg: "dark:from-rose-950/40 dark:via-orange-950/30 dark:to-amber-950/30",
  },
  "yoga-pilates": {
    from: "from-violet-100",
    via: "via-pink-50",
    to: "to-fuchsia-100",
    bg: "dark:from-violet-950/40 dark:via-pink-950/30 dark:to-fuchsia-950/30",
  },
  wellness: {
    from: "from-emerald-100",
    via: "via-teal-50",
    to: "to-cyan-100",
    bg: "dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/30",
  },
  cooking: {
    from: "from-amber-100",
    via: "via-yellow-50",
    to: "to-orange-100",
    bg: "dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30",
  },
  diving: {
    from: "from-sky-100",
    via: "via-cyan-50",
    to: "to-blue-100",
    bg: "dark:from-sky-950/40 dark:via-cyan-950/30 dark:to-blue-950/30",
  },
  spa: {
    from: "from-pink-100",
    via: "via-rose-50",
    to: "to-purple-100",
    bg: "dark:from-pink-950/40 dark:via-rose-950/30 dark:to-purple-950/30",
  },
  coworking: {
    from: "from-slate-100",
    via: "via-zinc-50",
    to: "to-stone-100",
    bg: "dark:from-slate-800 dark:via-zinc-800 dark:to-stone-800",
  },
};

export default function PlacePlaceholder({
  niche,
  size = "md",
}: {
  niche: Niche;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const meta = NICHE_META[niche];
  const theme = NICHE_THEME[niche];
  const emojiSize =
    size === "sm" ? "text-3xl"
    : size === "md" ? "text-5xl"
    : size === "lg" ? "text-7xl"
    : "text-9xl";

  return (
    <div
      className={`relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br ${theme.from} ${theme.via} ${theme.to} ${theme.bg}`}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
      {/* Subtle dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Niche emoji */}
      <span className={`relative ${emojiSize} drop-shadow-sm`} aria-hidden="true">
        {meta.emoji}
      </span>
      {/* Niche name watermark */}
      <span className="absolute bottom-2 right-2 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-800 dark:bg-ink-900/70 dark:text-ink-100">
        {niche.replace(/-/g, " ")}
      </span>
    </div>
  );
}
