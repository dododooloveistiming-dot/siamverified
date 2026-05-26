"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import DarkModeToggle from "./DarkModeToggle";

// Top 4 in desktop nav — rest live in the "More" dropdown to declutter.
const NAV_NICHES_PRIMARY: Niche[] = ["spa", "yoga-pilates", "muay-thai", "diving"];
const NAV_NICHES_SECONDARY: Niche[] = ["wellness", "cooking", "coworking"];
const NAV_NICHES: Niche[] = [...NAV_NICHES_PRIMARY, ...NAV_NICHES_SECONDARY];

const HEADER_CITIES: Array<{ slug: string; label: string; emoji: string }> = [
  { slug: "bangkok", label: "Bangkok", emoji: "🏙️" },
  { slug: "chiang-mai", label: "Chiang Mai", emoji: "🏔️" },
  { slug: "phuket", label: "Phuket", emoji: "🏝️" },
  { slug: "pattaya", label: "Pattaya", emoji: "🏖️" },
  { slug: "hua-hin", label: "Hua Hin", emoji: "🌅" },
  { slug: "koh-samui", label: "Koh Samui", emoji: "🌴" },
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

        <nav className="hidden flex-1 items-center gap-3 text-xs font-medium md:flex lg:gap-4">
          {NAV_NICHES_PRIMARY.slice(0, 3).map((n) => (
            <Link
              key={n}
              href={`/${lang}/c/${n}/`}
              className="muted whitespace-nowrap transition hover:text-emerald-600"
            >
              {NICHE_META[n].emoji} {nicheName(n, lang)}
            </Link>
          ))}

          {/* Cities dropdown — promoted to primary nav because /city hub pages are high-AEO landing pages */}
          <div className="group relative">
            <button
              type="button"
              className="muted inline-flex items-center gap-1 whitespace-nowrap transition hover:text-emerald-600"
              aria-haspopup="true"
            >
              🏙️ Cities <span className="text-[8px]">▼</span>
            </button>
            <div className="absolute left-0 top-full hidden w-[240px] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-xl group-hover:block dark:border-ink-800 dark:bg-ink-900">
              <div className="border-b border-ink-100 bg-ink-50/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                Cities
              </div>
              <div className="p-1.5">
                {HEADER_CITIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${lang}/city/${c.slug}/`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span>{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Guides dropdown — surface wiki content (currently 252 city×niche pages buried) */}
          <div className="group relative">
            <button
              type="button"
              className="muted inline-flex items-center gap-1 whitespace-nowrap transition hover:text-emerald-600"
              aria-haspopup="true"
            >
              📖 Guides <span className="text-[8px]">▼</span>
            </button>
            <div className="absolute left-0 top-full hidden w-[260px] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-xl group-hover:block dark:border-ink-800 dark:bg-ink-900">
              <div className="border-b border-ink-100 bg-ink-50/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                Popular guides
              </div>
              <div className="p-1.5">
                {[
                  { href: `/${lang}/guide/bangkok-yoga-pilates/`, label: "Bangkok yoga", emoji: "🧘" },
                  { href: `/${lang}/guide/phuket-diving/`, label: "Phuket diving", emoji: "🤿" },
                  { href: `/${lang}/guide/phuket-muay-thai/`, label: "Phuket Muay Thai", emoji: "🥊" },
                  { href: `/${lang}/guide/chiang-mai-cooking/`, label: "Chiang Mai cooking", emoji: "🍜" },
                  { href: `/${lang}/guide/bangkok-spa/`, label: "Bangkok spa", emoji: "💆" },
                ].map((g) => (
                  <Link
                    key={g.href}
                    href={g.href}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                  >
                    <span className="text-base">{g.emoji}</span>
                    <span>{g.label}</span>
                  </Link>
                ))}
              </div>
              <div className="border-t border-ink-100 bg-ink-50/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                Reference
              </div>
              <div className="p-1.5">
                <Link
                  href={`/${lang}/faq/`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                >
                  <span className="text-base">❓</span>
                  <span>All FAQs</span>
                </Link>
                <Link
                  href={`/${lang}/compare/bangkok-vs-chiang-mai/`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                >
                  <span className="text-base">⚖️</span>
                  <span>City vs city</span>
                </Link>
              </div>
            </div>
          </div>

          {/* More — leftover niches + blog */}
          <div className="group relative">
            <button
              type="button"
              className="muted inline-flex items-center gap-1 whitespace-nowrap transition hover:text-emerald-600"
              aria-haspopup="true"
            >
              More <span className="text-[8px]">▼</span>
            </button>
            <div className="absolute left-0 top-full hidden w-[260px] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-xl group-hover:block dark:border-ink-800 dark:bg-ink-900">
              <div className="border-b border-ink-100 bg-ink-50/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                More categories
              </div>
              <div className="p-1.5">
                {/* diving lives in primary already; show wellness/cooking/coworking + the 4th primary fallback */}
                <Link
                  href={`/${lang}/c/diving/`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                >
                  <span className="text-base">{NICHE_META["diving"].emoji}</span>
                  <span>{nicheName("diving", lang)}</span>
                </Link>
                {NAV_NICHES_SECONDARY.map((n) => (
                  <Link
                    key={n}
                    href={`/${lang}/c/${n}/`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                  >
                    <span className="text-base">{NICHE_META[n].emoji}</span>
                    <span>{nicheName(n, lang)}</span>
                  </Link>
                ))}
              </div>
              <div className="border-t border-ink-100 bg-ink-50/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                Explore
              </div>
              <div className="p-1.5">
                <Link
                  href={`/${lang}/blog/`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  <span className="text-base">✍️</span>
                  <span>Korean Travel Blog</span>
                </Link>
                <Link
                  href="/for-business"
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                >
                  <span className="text-base">🏢</span>
                  <span>For Business Owners</span>
                </Link>
                <Link
                  href={`/${lang}/about/`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                >
                  <span className="text-base">ℹ️</span>
                  <span>About &amp; Contact</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/for-business"
            className="hidden rounded-md border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 lg:inline-flex"
            title="For business owners"
          >
            For Business →
          </Link>
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
            {/* Cities first — most useful nav for tourists */}
            <div className="px-4 pb-1 pt-4 text-[10px] font-black uppercase tracking-wider muted">
              🏙️ Cities
            </div>
            <ul className="grid grid-cols-2 gap-2 px-4 pb-3">
              {HEADER_CITIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${lang}/city/${c.slug}/`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[56px] items-center gap-3 rounded-xl border border-ink-100 bg-emerald-50/40 px-3 py-3 text-sm font-medium transition active:scale-[0.98] dark:border-ink-800 dark:bg-emerald-950/20"
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="leading-tight">{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink-100 px-4 pb-1 pt-3 text-[10px] font-black uppercase tracking-wider muted dark:border-ink-800">
              🏷️ Categories
            </div>
            <ul className="grid grid-cols-2 gap-2 px-4 pb-3">
              {NAV_NICHES.map((n) => (
                <li key={n}>
                  <Link
                    href={`/${lang}/c/${n}/`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[52px] items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3 py-3 text-sm font-medium transition active:scale-[0.98] dark:border-ink-800 dark:bg-ink-900"
                  >
                    <span className="text-xl">{NICHE_META[n].emoji}</span>
                    <span className="leading-tight">{nicheName(n, lang)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink-100 px-4 pb-2 pt-3 text-[10px] font-black uppercase tracking-wider muted dark:border-ink-800">
              📖 Wiki / Reference
            </div>
            <div className="px-4 pb-3">
              <Link
                href={`/${lang}/guide/bangkok-yoga-pilates/`}
                onClick={() => setOpen(false)}
                className="mb-1.5 flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-3 text-sm font-medium dark:border-ink-800 dark:bg-ink-900"
              >
                <span>🧘 Sample guide — Bangkok yoga</span>
                <span className="text-ink-400">→</span>
              </Link>
              <Link
                href={`/${lang}/faq/`}
                onClick={() => setOpen(false)}
                className="mb-1.5 flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-3 text-sm font-medium dark:border-ink-800 dark:bg-ink-900"
              >
                <span>❓ All FAQs</span>
                <span className="text-ink-400">→</span>
              </Link>
              <Link
                href={`/${lang}/compare/bangkok-vs-chiang-mai/`}
                onClick={() => setOpen(false)}
                className="mb-1.5 flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-3 text-sm font-medium dark:border-ink-800 dark:bg-ink-900"
              >
                <span>⚖️ Compare cities</span>
                <span className="text-ink-400">→</span>
              </Link>
              <Link
                href={`/${lang}/blog/`}
                onClick={() => setOpen(false)}
                className="mb-1.5 flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-3 text-sm font-bold dark:border-ink-800 dark:bg-ink-900"
              >
                <span>✍️ Korean Travel Blog</span>
                <span className="text-ink-400">→</span>
              </Link>
            </div>

            <div className="border-t border-ink-100 px-4 py-3 dark:border-ink-800">
              <Link
                href="/for-business"
                onClick={() => setOpen(false)}
                className="mb-4 flex items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <span>🏢 For Business — Claim your listing</span>
                <span>→</span>
              </Link>
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
