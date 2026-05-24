// Niche-specific illustrated placeholder. Pure inline SVG + CSS so it builds
// statically and looks distinctive (waves for diving, mountain for yoga, etc).

import type { Niche } from "@/lib/types";

type Theme = {
  bg: string; // gradient classes
  // Decorative inline SVG layer — niche-distinctive shapes
  illustration: React.ReactNode;
  emoji: string;
  label: string;
};

const THEMES: Record<Niche, Theme> = {
  "muay-thai": {
    bg: "bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500",
    emoji: "🥊",
    label: "Muay Thai",
    illustration: (
      <>
        <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M0,150 Q50,80 100,150 T200,150 L200,200 L0,200 Z" fill="white" />
        </svg>
        <span className="absolute right-4 top-4 text-2xl opacity-50">⚡</span>
      </>
    ),
  },
  "yoga-pilates": {
    bg: "bg-gradient-to-br from-violet-400 via-pink-400 to-fuchsia-500",
    emoji: "🧘",
    label: "Yoga & Pilates",
    illustration: (
      <>
        <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 200 200" preserveAspectRatio="none">
          <circle cx="50" cy="60" r="40" fill="white" opacity="0.5" />
          <circle cx="150" cy="140" r="60" fill="white" opacity="0.4" />
        </svg>
        <span className="absolute right-4 top-4 text-2xl opacity-50">🌸</span>
      </>
    ),
  },
  wellness: {
    bg: "bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500",
    emoji: "🌿",
    label: "Wellness",
    illustration: (
      <>
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M30,180 Q40,100 60,180 M80,180 Q90,90 110,180 M130,180 Q140,110 160,180" stroke="white" strokeWidth="2" fill="none" />
        </svg>
        <span className="absolute right-4 top-4 text-2xl opacity-60">🍃</span>
      </>
    ),
  },
  cooking: {
    bg: "bg-gradient-to-br from-amber-400 via-orange-400 to-red-400",
    emoji: "🍲",
    label: "Cooking",
    illustration: (
      <>
        <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 200 200" preserveAspectRatio="none">
          <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="3" fill="none" />
          <circle cx="100" cy="100" r="40" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
        </svg>
        <span className="absolute right-4 top-4 text-2xl opacity-50">🌶️</span>
      </>
    ),
  },
  diving: {
    bg: "bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600",
    emoji: "🤿",
    label: "Diving",
    illustration: (
      <>
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 200 200" preserveAspectRatio="none">
          {/* Wavy lines */}
          <path d="M0,40 Q25,20 50,40 T100,40 T150,40 T200,40" stroke="white" strokeWidth="2" fill="none" />
          <path d="M0,70 Q25,50 50,70 T100,70 T150,70 T200,70" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M0,100 Q25,80 50,100 T100,100 T150,100 T200,100" stroke="white" strokeWidth="2" fill="none" opacity="0.5" />
          {/* Bubbles */}
          <circle cx="40" cy="160" r="6" fill="white" opacity="0.4" />
          <circle cx="160" cy="150" r="8" fill="white" opacity="0.4" />
          <circle cx="100" cy="170" r="4" fill="white" opacity="0.4" />
        </svg>
        <span className="absolute right-4 top-4 text-2xl opacity-50">🐟</span>
      </>
    ),
  },
  spa: {
    bg: "bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500",
    emoji: "💆",
    label: "Spa & Massage",
    illustration: (
      <>
        <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 200 200" preserveAspectRatio="none">
          {/* Lotus petals */}
          <ellipse cx="100" cy="100" rx="60" ry="20" fill="white" opacity="0.4" transform="rotate(0 100 100)" />
          <ellipse cx="100" cy="100" rx="60" ry="20" fill="white" opacity="0.3" transform="rotate(45 100 100)" />
          <ellipse cx="100" cy="100" rx="60" ry="20" fill="white" opacity="0.3" transform="rotate(90 100 100)" />
          <ellipse cx="100" cy="100" rx="60" ry="20" fill="white" opacity="0.3" transform="rotate(135 100 100)" />
          <circle cx="100" cy="100" r="12" fill="white" opacity="0.7" />
        </svg>
        <span className="absolute right-4 top-4 text-2xl opacity-50">🕯️</span>
      </>
    ),
  },
  coworking: {
    bg: "bg-gradient-to-br from-slate-500 via-zinc-500 to-stone-600",
    emoji: "💻",
    label: "Coworking",
    illustration: (
      <>
        <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 200 200" preserveAspectRatio="none">
          {/* Grid pattern suggesting workspace */}
          <g stroke="white" strokeWidth="1" opacity="0.5">
            <line x1="0" y1="40" x2="200" y2="40" />
            <line x1="0" y1="80" x2="200" y2="80" />
            <line x1="0" y1="120" x2="200" y2="120" />
            <line x1="0" y1="160" x2="200" y2="160" />
            <line x1="40" y1="0" x2="40" y2="200" />
            <line x1="80" y1="0" x2="80" y2="200" />
            <line x1="120" y1="0" x2="120" y2="200" />
            <line x1="160" y1="0" x2="160" y2="200" />
          </g>
          <rect x="50" y="60" width="100" height="60" rx="6" fill="white" opacity="0.4" />
        </svg>
        <span className="absolute right-4 top-4 text-2xl opacity-50">☕</span>
      </>
    ),
  },
};

export default function PlacePlaceholder({
  niche,
  size = "md",
}: {
  niche: Niche;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const theme = THEMES[niche];
  const emojiSize =
    size === "sm" ? "text-4xl"
    : size === "md" ? "text-6xl"
    : size === "lg" ? "text-8xl"
    : "text-[10rem]";

  return (
    <div className={`relative grid h-full w-full place-items-center overflow-hidden text-white ${theme.bg}`}>
      {theme.illustration}
      {/* Big niche emoji */}
      <span className={`relative ${emojiSize} drop-shadow-lg`} aria-hidden="true">
        {theme.emoji}
      </span>
      {/* Niche label at bottom */}
      {size !== "sm" && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
          {theme.label}
        </span>
      )}
    </div>
  );
}
