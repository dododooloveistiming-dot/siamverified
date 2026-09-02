"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import { FLAG, lookup } from "@/lib/verify";
import type { HandleIndex, VerifyHit, VerifyResult, VerifyStrings } from "@/lib/verify";

// Strings arrive as a prop rather than through lib/i18n: that module pulls
// the full 8-locale ui_i18n.json at module scope, which would land in this
// client bundle (same reason Header.tsx imports lib/site). See
// resolveVerifyStrings() in lib/i18n.ts.

const PLATFORM_ICON: Record<string, string> = {
  ig: "📸", tt: "🎵", fb: "👥", yt: "▶️", ln: "💬", w: "🌐",
};

function scoreTone(trust: number): string {
  if (trust >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (trust >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function badges(hit: VerifyHit, s: VerifyStrings): string[] {
  const out: string[] = [];
  if (hit.flags & FLAG.VETERAN) out.push(`🏛️ ${s.flag.veteran}`);
  else if (hit.flags & FLAG.ESTABLISHED) out.push(`🏗️ ${s.flag.established}`);
  if (hit.flags & FLAG.VERY_ACTIVE) out.push(`🔥 ${s.flag.veryActive}`);
  else if (hit.flags & FLAG.ACTIVE) out.push(`✅ ${s.flag.active}`);
  if (hit.flags & FLAG.GOV_CERT) out.push(`🇹🇭 ${s.flag.govCert}`);
  if (hit.flags & FLAG.VIRAL) out.push(`📈 ${s.flag.viral}`);
  return out;
}

function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function HitCard({
  hit, lang, s, primary,
}: { hit: VerifyHit; lang: Lang; s: VerifyStrings; primary: boolean }) {
  const href = `/${lang}/place/${hit.slug}/`;
  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-4 transition hover:border-clinic ${
        primary
          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20"
          : "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-center">
          <div className={`font-mono text-3xl font-bold leading-none ${scoreTone(hit.trust)}`}>
            {hit.trust}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide muted">trust</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{hit.name}</div>
          <div className="mt-0.5 truncate text-sm muted">
            {hit.city ? `${hit.city} · ` : ""}{hit.niche}
          </div>
          <div className="mt-2 text-sm">
            {fill(s.sourcesLine, { n: hit.sourceCount, total: 9 })}
          </div>
          <div className="text-sm muted">
            {hit.rating
              ? fill(s.googleLine, { rating: hit.rating, n: hit.reviewCount.toLocaleString() })
              : s.noRating}
          </div>
          {badges(hit, s).length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {badges(hit, s).map((b) => (
                <li key={b} className="rounded-lg bg-ink-100 px-2 py-0.5 text-xs font-semibold dark:bg-ink-700">
                  {b}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 text-sm font-semibold text-clinic">{s.fullReport} →</div>
        </div>
      </div>
    </Link>
  );
}

export default function VerifyBox({
  lang, strings, autoFocus = false,
}: { lang: Lang; strings: VerifyStrings; autoFocus?: boolean }) {
  const s = strings;
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<HandleIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const loadStarted = useRef(false);

  // 452 KB (~122 KB gzipped) — fetched on first interaction, not on page load,
  // so the page itself stays light for the many visitors who only read it.
  const ensureIndex = useCallback(async () => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    setLoading(true);
    try {
      const res = await fetch("/data/handles.json");
      if (res.ok) setIndex((await res.json()) as HandleIndex);
    } catch {
      loadStarted.current = false;   // let a later keystroke retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!index) { setResult(null); return; }
    const q = query.trim();
    if (!q) { setResult(null); return; }
    const id = setTimeout(() => setResult(lookup(index, q)), 120);
    return () => clearTimeout(id);
  }, [query, index]);

  const pending = query.trim().length > 0 && !index;

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{s.placeholder}</span>
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          onFocus={ensureIndex}
          onChange={(e) => { ensureIndex(); setQuery(e.target.value); }}
          placeholder={s.placeholder}
          className="w-full rounded-2xl border-2 border-ink-200 bg-white px-5 py-4 text-base outline-none transition focus:border-clinic dark:border-ink-700 dark:bg-ink-800"
        />
      </label>

      <div aria-live="polite" className="mt-4">
        {pending && <p className="text-sm muted">{loading ? s.loading : s.checking}</p>}

        {result?.kind === "exact" && (
          <div>
            <p className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {PLATFORM_ICON[result.via]} {s.verifiedTitle} · {s.viaLabel[result.via]}
            </p>
            <HitCard hit={result.hit} lang={lang} s={s} primary />
          </div>
        )}

        {result?.kind === "name" && (
          <div>
            <p className="mb-1 text-sm font-semibold">{s.maybeTitle}</p>
            <p className="mb-3 text-sm muted">{s.maybeSub}</p>
            <ul className="grid gap-2">
              {result.hits.map((h) => (
                <li key={h.slug}>
                  <HitCard hit={h} lang={lang} s={s} primary={false} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {result?.kind === "unknown" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="font-bold">{s.unknownTitle}</p>
            <p className="mt-1 text-sm">{s.unknownSub}</p>
            <p className="mt-3 text-sm muted">{s.unknownChecked}</p>
            <Link href={`/${lang}/`} className="mt-3 inline-block text-sm font-semibold text-clinic">
              {s.browseAll} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
