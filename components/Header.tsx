"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import DarkModeToggle from "./DarkModeToggle";

const NAV_NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
  "halal-food", "muslim-hotel", "halal-tour", "mosque", "halal-clinic", "halal-beauty",
];

const LANG_LABEL: Record<Lang, string> = {
  en: "English", ko: "한국어", th: "ไทย", zh: "中文", ja: "日本語", ar: "العربية",
};

export default function Header({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/85 backdrop-blur dark:border-ink-800 dark:bg-ink-950/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href={`/${lang}/`}
          className="flex items-center gap-2 font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <span className="text-sm sm:text-base">{SITE.name}</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-3 overflow-x-auto text-xs font-medium md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_NICHES.map((n) => (
            <Link
              key={n}
              href={`/${lang}/c/${n}/`}
              className="muted whitespace-nowrap transition hover:text-emerald-600"
            >
              {NICHE_META[n].emoji} {nicheName(n, lang)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => { window.location.href = `/${e.target.value}/`; }}
            className="hidden rounded-md border border-ink-200 bg-transparent px-2 py-1.5 text-xs font-semibold dark:border-ink-700 sm:block"
            aria-label="Language"
          >
            {SUPPORTED_LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <DarkModeToggle />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-ink-200 transition hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-800 md:hidden"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 top-14 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="fixed inset-x-0 top-14 z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-ink-100 bg-white shadow-lg dark:border-ink-800 dark:bg-ink-950 md:hidden"
            aria-label="Mobile navigation"
          >
            <ul className="grid grid-cols-2 gap-2 p-4">
              {NAV_NICHES.map((n) => (
                <li key={n}>
                  <Link
                    href={`/${lang}/c/${n}/`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[56px] items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3 py-3 text-sm font-medium transition hover:border-emerald-400 active:scale-[0.98] dark:border-ink-800 dark:bg-ink-900"
                  >
                    <span className="text-xl">{NICHE_META[n].emoji}</span>
                    <span className="leading-tight">{nicheName(n, lang)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink-100 px-4 py-3 dark:border-ink-800">
              <div className="muted mb-2 text-xs">Language</div>
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_LANGS.map((l) => (
                  <a
                    key={l}
                    href={`/${l}/`}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
                      l === lang
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "muted border-ink-200 dark:border-ink-700"
                    }`}
                  >
                    {LANG_LABEL[l]}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
