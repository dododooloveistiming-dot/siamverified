import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // PlacePlaceholder generates gradient class names from a per-niche theme
  // object (e.g. `from-rose-100`, `via-pink-50`, `to-amber-100`). Tailwind's
  // JIT scanner can't follow the lookup, so we safelist the full set.
  safelist: [
    // Light gradient stops
    "from-rose-100", "from-violet-100", "from-emerald-100", "from-amber-100",
    "from-sky-100", "from-pink-100", "from-slate-100",
    "via-orange-50", "via-pink-50", "via-teal-50", "via-yellow-50",
    "via-cyan-50", "via-rose-50", "via-zinc-50",
    "to-amber-100", "to-fuchsia-100", "to-cyan-100", "to-orange-100",
    "to-blue-100", "to-purple-100", "to-stone-100",
    // Dark gradient stops
    "dark:from-rose-950/40", "dark:from-violet-950/40", "dark:from-emerald-950/40",
    "dark:from-amber-950/40", "dark:from-sky-950/40", "dark:from-pink-950/40",
    "dark:from-slate-800",
    "dark:via-orange-950/30", "dark:via-pink-950/30", "dark:via-teal-950/30",
    "dark:via-yellow-950/30", "dark:via-cyan-950/30", "dark:via-rose-950/30",
    "dark:via-zinc-800",
    "dark:to-amber-950/30", "dark:to-fuchsia-950/30", "dark:to-cyan-950/30",
    "dark:to-orange-950/30", "dark:to-blue-950/30", "dark:to-purple-950/30",
    "dark:to-stone-800",
  ],
  theme: {
    extend: {
      colors: {
        // Premium fintech / medical: deep ink + clinical green/blue accent
        ink: {
          50: "#f7f8fa", 100: "#eef0f4", 150: "#e3e6ec", 200: "#d6d9e0",
          300: "#aeb3bf", 400: "#7d8493", 500: "#586070", 600: "#3d4250",
          700: "#2a2e3a", 800: "#171a22", 900: "#0a0b0e", 950: "#050608",
        },
        clinic: { DEFAULT: "#0ea5e9", deep: "#0369a1", mint: "#10b981", danger: "#ef4444", violet: "#8b5cf6" },
        trust: { high: "#10b981", mid: "#f59e0b", low: "#ef4444" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Noto Sans KR", "Noto Sans Thai", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "ring-draw": "ring-draw 1.4s cubic-bezier(0.65,0,0.35,1) forwards",
        "shimmer": "shimmer 2.5s linear infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "blob": "blob 14s ease-in-out infinite",
      },
      keyframes: {
        "ring-draw": { from: { strokeDashoffset: "var(--end)" }, to: { strokeDashoffset: "var(--target)" } },
        "shimmer": { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "blob": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(20px,-30px) scale(1.1)" },
          "66%": { transform: "translate(-20px,20px) scale(0.95)" },
        },
      },
      backgroundImage: {
        "grid-light": "linear-gradient(to right, rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.04) 1px, transparent 1px)",
        "grid-dark":  "linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
