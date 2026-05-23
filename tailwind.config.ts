import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
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
