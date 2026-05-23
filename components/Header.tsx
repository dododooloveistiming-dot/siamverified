"use client";
import Link from "next/link";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META } from "@/lib/types";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import DarkModeToggle from "./DarkModeToggle";

const NAV_NICHES: Niche[] = ["muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking"];

export default function Header({ lang }: { lang: Lang }) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-ink-100 dark:border-ink-800 bg-[rgb(var(--bg))/.85] px-4 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4">
        <Link href={`/${lang}/`} className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z"/></svg>
          </span>
          <span className="text-sm">{SITE.name}</span>
        </Link>
        <nav className="hidden items-center gap-3 overflow-x-auto text-xs font-medium md:flex">
          {NAV_NICHES.map((n) => (
            <Link key={n} href={`/${lang}/c/${n}/`} className="muted whitespace-nowrap hover:text-emerald-600">
              {NICHE_META[n].emoji} {NICHE_META[n].en}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <select
            defaultValue={lang}
            onChange={(e) => { window.location.href = `/${e.target.value}/`; }}
            className="rounded-md border border-ink-200 dark:border-ink-700 bg-transparent px-2 py-1 text-[11px] font-semibold"
          >
            {SUPPORTED_LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
