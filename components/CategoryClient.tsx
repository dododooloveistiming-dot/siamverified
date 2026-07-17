"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Lang, Niche, PlaceCard as PlaceCardData } from "@/lib/types";
import { NICHE_META } from "@/lib/types";
// Type-only import — erased at compile time, so this doesn't pull lib/i18n.ts's
// 201KB ui_i18n.json into the client bundle. Strings are resolved server-side
// by the parent page via resolveCategoryStrings() and passed in as a prop.
import type { CategoryStrings } from "@/lib/i18n";
import SafeImg from "@/components/SafeImg";
import WishlistButton from "@/components/WishlistButton";
import { cleanReviewText, isThaiText } from "@/lib/reviews";

// nicheName is imported from lib/types when needed

type Sort = "trust" | "reviews" | "rating";
type PriceBand = "" | "budget" | "mid" | "premium" | "luxury";

// Category grids run to ~2,000 cards on the biggest niches — rendering all
// of them (and their SafeImg hydration cost) up front was the biggest single
// contributor to INP/hydration jank on mobile. Render a page at a time.
const PAGE_SIZE = 30;

const PB_LABEL: Record<Exclude<PriceBand, "">, { icon: string }> = {
  budget: { icon: "💵" },
  mid: { icon: "💵💵" },
  premium: { icon: "💵💵💵" },
  luxury: { icon: "💎" },
};
const PRICE_STRINGS: Record<Exclude<PriceBand, "">, (s: CategoryStrings) => string> = {
  budget: (s) => s.priceBudget,
  mid: (s) => s.priceMid,
  premium: (s) => s.pricePremium,
  luxury: (s) => s.priceLuxury,
};

function trustTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 45) return "mid";
  return "low";
}

// Card review excerpts were rendering the raw scrape (owner-reply text,
// "Local Guide · N reviews" metadata lines) — only the place detail page
// cleaned it. Shared here so both card layouts below get the same fix.
function ReviewExcerpt({ text, lang, className }: { text: string | undefined; lang: Lang; className: string }) {
  const body = cleanReviewText(text || "");
  if (!body) return null;
  const bodyIsThai = isThaiText(body);
  return (
    <p className={className}>
      {bodyIsThai && lang !== "th" && <span className="not-italic">🇹🇭 </span>}
      &ldquo;{body}&rdquo;
    </p>
  );
}

export default function CategoryClient({
  places,
  lang,
  niche,
  strings,
}: {
  places: PlaceCardData[];
  lang: Lang;
  niche: Niche;
  strings: CategoryStrings;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [priceBand, setPriceBand] = useState<PriceBand>("");
  const [koOnly, setKoOnly] = useState(false);
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [open24Only, setOpen24Only] = useState(false);
  const [establishedOnly, setEstablishedOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [hideViral, setHideViral] = useState(true);
  const [sort, setSort] = useState<Sort>("trust");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Gate the URL-sync effect below until the initial read-from-URL pass has
  // finished — otherwise it fires once with default state and clobbers an
  // incoming ?city=...&price=... URL before it's ever read.
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  // The exact URL this component mounted with (before any sync rewrites it) —
  // used as the sessionStorage key so "Load more" progress survives a
  // back-navigation to this same filtered view.
  const mountKey = useRef<string>(
    typeof window !== "undefined" ? `${pathname}${window.location.search}` : pathname,
  );

  // Keep the search input itself instant; defer the (expensive, ~2k-item)
  // filter+sort recompute so typing never blocks on it.
  const deferredQuery = useDeferredValue(query);

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) {
      if (p.city) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([c]) => c);
  }, [places]);

  // Initialize from URL params (?city=bangkok&price=mid&ko=1...)
  // Static export friendly — we use useSearchParams (works on the client after hydration).
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!searchParams) return;
    const urlCity = searchParams.get("city");
    if (urlCity) {
      // Match case-insensitively / slug-ish against the actual city list.
      const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
      const match = cities.find((c) => norm(c) === norm(urlCity));
      if (match) setCity(match);
    }
    const urlPrice = searchParams.get("price");
    if (urlPrice && ["budget", "mid", "premium", "luxury"].includes(urlPrice)) {
      setPriceBand(urlPrice as PriceBand);
    }
    if (searchParams.get("ko") === "1") setKoOnly(true);
    if (searchParams.get("beginner") === "1") setBeginnerOnly(true);
    if (searchParams.get("open24") === "1") setOpen24Only(true);
    if (searchParams.get("est") === "1") setEstablishedOnly(true);
    if (searchParams.get("active") === "1") setActiveOnly(true);
    const urlSort = searchParams.get("sort");
    if (urlSort && ["trust", "reviews", "rating"].includes(urlSort)) {
      setSort(urlSort as Sort);
    }
    const urlQ = searchParams.get("q");
    if (urlQ) setQuery(urlQ);
    try {
      const savedCount = sessionStorage.getItem(`vt_cat_visible:${mountKey.current}`);
      if (savedCount) {
        const n = parseInt(savedCount, 10);
        if (Number.isFinite(n) && n > PAGE_SIZE) setVisibleCount(n);
      }
    } catch {
      // sessionStorage unavailable (private mode etc.) — fall back to PAGE_SIZE
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = places.filter((p) => {
      if (hideViral && p.is_suspected_viral) return false;
      if (city && p.city !== city) return false;
      if (priceBand && p.price_band !== priceBand) return false;
      if (koOnly && !p.languages.ko) return false;
      if (beginnerOnly && !p.is_beginner_friendly) return false;
      if (open24Only && !p.is_open_24h) return false;
      if (establishedOnly && !p.is_established) return false;
      if (activeOnly && !p.is_active_recently) return false;
      if (q) {
        const hay = `${p.name} ${p.city} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      if (sort === "trust") return b.trust_score - a.trust_score;
      if (sort === "reviews") return (b.review_count ?? 0) - (a.review_count ?? 0);
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return 0;
    });
    return list;
  }, [places, deferredQuery, city, priceBand, koOnly, beginnerOnly, open24Only, establishedOnly, activeOnly, hideViral, sort]);

  // Reset paging whenever the result set changes underneath it — otherwise
  // "500 of 12 matched" could persist after narrowing a filter. Skipped on
  // the first post-hydration run so restoring filters/visibleCount from the
  // URL + sessionStorage (on a back-navigation) doesn't immediately wipe
  // the restored "Load more" progress back to page 1.
  const hydratedOnce = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (!hydratedOnce.current) {
      hydratedOnce.current = true;
      return;
    }
    setVisibleCount(PAGE_SIZE);
  }, [filtered, hydrated]);

  // Persist "Load more" progress so a back-navigation to this exact filtered
  // view (matched via mountKey below) restores where the user left off.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(`vt_cat_visible:${mountKey.current}`, String(visibleCount));
    } catch {
      // ignore — sessionStorage unavailable
    }
  }, [hydrated, visibleCount]);

  // Sync filters/sort/query back to the URL so the address bar reflects the
  // current view and a back-navigation restores it. Gated on `hydrated` —
  // firing before the initial URL read completes would overwrite an
  // incoming ?city=...&price=... with empty defaults.
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (priceBand) params.set("price", priceBand);
    if (koOnly) params.set("ko", "1");
    if (beginnerOnly) params.set("beginner", "1");
    if (open24Only) params.set("open24", "1");
    if (establishedOnly) params.set("est", "1");
    if (activeOnly) params.set("active", "1");
    if (sort !== "trust") params.set("sort", sort);
    if (deferredQuery) params.set("q", deferredQuery);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, city, priceBand, koOnly, beginnerOnly, open24Only, establishedOnly, activeOnly, sort, deferredQuery]);

  const visible = filtered.slice(0, visibleCount);
  const meta = NICHE_META[niche];

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={strings.searchPh}
            className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-ink-700 dark:bg-ink-900"
            aria-label={strings.searchPh}
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm font-medium dark:border-ink-700 dark:bg-ink-900"
          aria-label={strings.sortBy}
        >
          <option value="trust">⭐ {strings.sortTrust}</option>
          <option value="reviews">💬 {strings.sortReviews}</option>
          <option value="rating">★ {strings.sortRating}</option>
        </select>
      </div>

      {cities.length > 0 && (
        <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip selected={!city} onClick={() => setCity("")}>{strings.allLabel}</Chip>
          {cities.map((c) => (
            <Chip key={c} selected={city === c} onClick={() => setCity(c)}>{c}</Chip>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Pill on={establishedOnly} onClick={() => setEstablishedOnly((v) => !v)}>🏛 {strings.filterEstablished}</Pill>
        <Pill on={activeOnly} onClick={() => setActiveOnly((v) => !v)}>🟢 {strings.filterActive}</Pill>
        <Pill on={koOnly} onClick={() => setKoOnly((v) => !v)}>🇰🇷 {strings.filterKorean}</Pill>
        <Pill on={beginnerOnly} onClick={() => setBeginnerOnly((v) => !v)}>🐣 {strings.filterBeginner}</Pill>
        <Pill on={open24Only} onClick={() => setOpen24Only((v) => !v)}>🌙 {strings.filter24h}</Pill>
        <span className="mx-1 hidden border-r border-ink-200 dark:border-ink-700 sm:inline-block" aria-hidden="true" />
        {(["budget","mid","premium","luxury"] as const).map((pb) => (
          <Pill key={pb} on={priceBand === pb} onClick={() => setPriceBand(priceBand === pb ? "" : pb)}>
            {PB_LABEL[pb].icon} {PRICE_STRINGS[pb](strings)}
          </Pill>
        ))}
        <Pill on={hideViral} onClick={() => setHideViral((v) => !v)} tone="warn">🚫 {strings.filterOutViral}</Pill>
      </div>

      <div className="mt-4 flex items-baseline justify-between text-xs muted">
        <span>{filtered.length.toLocaleString()} / {places.length.toLocaleString()} {strings.placesCount}</span>
        {(query || city || priceBand || koOnly || beginnerOnly || open24Only || establishedOnly || activeOnly) && (
          <button
            type="button"
            onClick={() => { setQuery(""); setCity(""); setPriceBand(""); setKoOnly(false); setBeginnerOnly(false); setOpen24Only(false); setEstablishedOnly(false); setActiveOnly(false); }}
            className="rounded-md px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            ✕ {strings.reset}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <p className="text-base font-bold">{strings.noMatches}</p>
          <p className="mt-1 text-sm muted">{strings.tryRemoveFilters}</p>
        </div>
      ) : (
        <>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => {
              // Every 7th card spans 2 columns and uses the horizontal "Featured"
              // layout (photo left + info right) — breaks up the uniform grid.
              const featured = i > 0 && i % 7 === 0;
              return (
                <li key={p.id} className={featured ? "sm:col-span-2" : ""}>
                  {featured ? (
                    <FeaturedListCard p={p} lang={lang} fallbackEmoji={meta.emoji} />
                  ) : (
                    <PlaceCard p={p} lang={lang} fallbackEmoji={meta.emoji} filterBeginner={strings.filterBeginner} />
                  )}
                </li>
              );
            })}
          </ul>
          {visibleCount < filtered.length && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="rounded-xl border border-ink-200 bg-white px-6 py-2.5 text-sm font-bold transition hover:border-emerald-400 hover:text-emerald-700 dark:border-ink-700 dark:bg-ink-900 dark:hover:text-emerald-400"
              >
                {strings.loadMore} ({(filtered.length - visibleCount).toLocaleString()})
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        selected
          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
          : "border-ink-200 bg-white text-ink-700 hover:border-emerald-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
      }`}
    >
      {children}
    </button>
  );
}

function Pill({ on, onClick, children, tone = "default" }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: "default" | "warn" }) {
  const activeColor =
    tone === "warn"
      ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
      : "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 font-medium transition ${
        on ? activeColor : "border-ink-200 bg-white text-ink-600 hover:border-emerald-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
      }`}
      aria-pressed={on}
    >
      {children}
    </button>
  );
}

function FeaturedListCard({ p, lang, fallbackEmoji }: { p: PlaceCardData; lang: Lang; fallbackEmoji: string }) {
  const tier = trustTier(p.trust_score);
  const tierClass =
    tier === "high"
      ? "bg-emerald-500 text-white"
      : tier === "mid"
      ? "bg-amber-500 text-white"
      : "bg-rose-500 text-white";
  return (
    <Link
      href={`/${lang}/place/${p.slug}/`}
      className="group relative grid h-full gap-0 overflow-hidden rounded-2xl border-2 border-amber-300 bg-white transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg dark:border-amber-700 dark:bg-ink-900 sm:grid-cols-[1.2fr_1fr]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-50 dark:bg-ink-800 sm:aspect-auto">
        <SafeImg src={p.top_photo_url} alt={p.name} niche={p.niche} size="lg" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-md bg-amber-400 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-950 shadow">
          ★ Editor&apos;s pick
        </span>
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black tabular-nums shadow ${tierClass}`}>
          {p.trust_score}
          <span className="text-[9px] opacity-90">/100</span>
        </span>
        <div className="absolute right-3 bottom-3">
          <WishlistButton place={p} />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="line-clamp-2 text-lg font-black leading-tight">{p.name}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs muted">
          {p.city && <span className="truncate">📍 {p.city}</span>}
          {p.rating != null && (
            <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">
              ★ {p.rating.toFixed(1)}
              {p.review_count ? <span className="ml-1 font-normal muted">({p.review_count.toLocaleString()})</span> : null}
            </span>
          )}
        </div>
        <ReviewExcerpt
          text={p.top_review_text}
          lang={lang}
          className="line-clamp-3 text-xs italic leading-relaxed text-ink-600 dark:text-ink-400"
        />
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[10px]">
          {p.is_beginner_friendly && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">🐣 Beginner</span>
          )}
          {p.languages.ko && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">🇰🇷 KO</span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}

function PlaceCard({ p, lang, fallbackEmoji, filterBeginner }: { p: PlaceCardData; lang: Lang; fallbackEmoji: string; filterBeginner: string }) {
  const tier = trustTier(p.trust_score);
  const tierClass =
    tier === "high"
      ? "bg-emerald-500 text-white"
      : tier === "mid"
      ? "bg-amber-500 text-white"
      : "bg-rose-500 text-white";
  const pbLabel = p.price_band !== "unknown" ? PB_LABEL[p.price_band as Exclude<PriceBand, "">] : null;

  return (
    <Link
      href={`/${lang}/place/${p.slug}/`}
      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-ink-50 dark:bg-ink-800">
        <SafeImg src={p.top_photo_url} alt={p.name} niche={p.niche} size="lg" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
        <div className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black tabular-nums shadow-sm ${tierClass}`}>
          {p.trust_score}
          <span className="text-[9px] font-semibold opacity-90">/100</span>
        </div>
        {p.is_partner && (
          <div className="absolute left-2 top-2 rounded-md bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            ★ Partner
          </div>
        )}
        <div className="absolute right-2 bottom-2">
          <WishlistButton place={p} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <h3 className="line-clamp-2 text-base font-bold leading-tight">{p.name}</h3>

        <div className="flex items-center justify-between gap-2 text-xs muted">
          <div className="flex items-center gap-2 min-w-0">
            {p.city && <span className="truncate">📍 {p.city}</span>}
            {p.rating != null && (
              <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">
                ★ {p.rating.toFixed(1)}
                {p.review_count ? <span className="ml-0.5 font-normal muted">({p.review_count.toLocaleString()})</span> : null}
              </span>
            )}
          </div>
          {p.price_min_thb > 0 ? (
            <span className="shrink-0 font-black tabular-nums text-emerald-700 dark:text-emerald-400">
              ฿{p.price_min_thb.toLocaleString()}
              {p.price_max_thb > p.price_min_thb ? `–${p.price_max_thb.toLocaleString()}` : ""}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] muted italic">price on inquiry</span>
          )}
        </div>

        <ReviewExcerpt
          text={p.top_review_text}
          lang={lang}
          className="line-clamp-2 text-[11px] leading-snug muted italic"
        />

        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[10px]">
          {p.is_very_active && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" title="At least one review in the last 30 days">
              🟢 Active
            </span>
          )}
          {p.is_veteran && p.founding_year && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300" title={`Online since ${p.founding_year} (archive.org)`}>
              🏛 {p.founding_year}
            </span>
          )}
          {p.is_beginner_friendly && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              🐣 {filterBeginner}
            </span>
          )}
          {p.languages.ko && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              🇰🇷 KO
            </span>
          )}
          {p.kr_mentions && p.kr_mentions > 0 && (
            <span
              className="rounded-full bg-rose-50 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
              title={`${p.kr_mentions} mentions across Naver blogs + cafes`}
            >
              🇰🇷 {p.kr_mentions} mentions
            </span>
          )}
          {p.languages.ja && (
            <span className="rounded-full bg-pink-100 px-2 py-0.5 font-medium text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
              🇯🇵 JA
            </span>
          )}
          {p.is_open_24h && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              🌙 24h
            </span>
          )}
          {pbLabel && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium dark:bg-ink-800">
              {pbLabel.icon}
            </span>
          )}
          {p.is_suspected_viral && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              ⚠ low signal
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
