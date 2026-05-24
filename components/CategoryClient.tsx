"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META } from "@/lib/types";
import { t } from "@/lib/i18n";
import PlacePlaceholder from "@/components/PlacePlaceholder";

// nicheName is imported from lib/types when needed

type Sort = "trust" | "reviews" | "rating";
type PriceBand = "" | "budget" | "mid" | "premium" | "luxury";

const PB_LABEL: Record<Exclude<PriceBand, "">, { icon: string; key: "price_budget" | "price_mid" | "price_premium" | "price_luxury" }> = {
  budget: { icon: "💵", key: "price_budget" },
  mid: { icon: "💵💵", key: "price_mid" },
  premium: { icon: "💵💵💵", key: "price_premium" },
  luxury: { icon: "💎", key: "price_luxury" },
};

function trustTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 45) return "mid";
  return "low";
}

export default function CategoryClient({
  places,
  lang,
  niche,
}: {
  places: Place[];
  lang: Lang;
  niche: Niche;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [priceBand, setPriceBand] = useState<PriceBand>("");
  const [koOnly, setKoOnly] = useState(false);
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [open24Only, setOpen24Only] = useState(false);
  const [hideViral, setHideViral] = useState(true);
  const [sort, setSort] = useState<Sort>("trust");

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
    const urlSort = searchParams.get("sort");
    if (urlSort && ["trust", "reviews", "rating"].includes(urlSort)) {
      setSort(urlSort as Sort);
    }
    const urlQ = searchParams.get("q");
    if (urlQ) setQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = places.filter((p) => {
      if (hideViral && p.is_suspected_viral) return false;
      if (city && p.city !== city) return false;
      if (priceBand && p.price_band !== priceBand) return false;
      if (koOnly && !p.languages.ko) return false;
      if (beginnerOnly && !p.is_beginner_friendly) return false;
      if (open24Only && !p.is_open_24h) return false;
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
  }, [places, query, city, priceBand, koOnly, beginnerOnly, open24Only, hideViral, sort]);

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
            placeholder={t("search_ph", lang)}
            className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-ink-700 dark:bg-ink-900"
            aria-label={t("search_ph", lang)}
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl border border-ink-200 bg-white px-3 py-3 text-sm font-medium dark:border-ink-700 dark:bg-ink-900"
          aria-label={t("sort_by", lang)}
        >
          <option value="trust">⭐ {t("sort_trust", lang)}</option>
          <option value="reviews">💬 {t("sort_reviews", lang)}</option>
          <option value="rating">★ {t("sort_rating", lang)}</option>
        </select>
      </div>

      {cities.length > 0 && (
        <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip selected={!city} onClick={() => setCity("")}>{t("all_label", lang)}</Chip>
          {cities.map((c) => (
            <Chip key={c} selected={city === c} onClick={() => setCity(c)}>{c}</Chip>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Pill on={koOnly} onClick={() => setKoOnly((v) => !v)}>🇰🇷 {t("filter_korean_friendly", lang)}</Pill>
        <Pill on={beginnerOnly} onClick={() => setBeginnerOnly((v) => !v)}>🐣 {t("filter_beginner", lang)}</Pill>
        <Pill on={open24Only} onClick={() => setOpen24Only((v) => !v)}>🌙 {t("filter_24h", lang)}</Pill>
        <span className="mx-1 hidden border-r border-ink-200 dark:border-ink-700 sm:inline-block" aria-hidden="true" />
        {(["budget","mid","premium","luxury"] as const).map((pb) => (
          <Pill key={pb} on={priceBand === pb} onClick={() => setPriceBand(priceBand === pb ? "" : pb)}>
            {PB_LABEL[pb].icon} {t(PB_LABEL[pb].key, lang)}
          </Pill>
        ))}
        <Pill on={hideViral} onClick={() => setHideViral((v) => !v)} tone="warn">🚫 {t("filter_out_viral", lang)}</Pill>
      </div>

      <div className="mt-4 flex items-baseline justify-between text-xs muted">
        <span>{filtered.length.toLocaleString()} / {places.length.toLocaleString()} {t("places_count", lang)}</span>
        {(query || city || priceBand || koOnly || beginnerOnly || open24Only) && (
          <button
            type="button"
            onClick={() => { setQuery(""); setCity(""); setPriceBand(""); setKoOnly(false); setBeginnerOnly(false); setOpen24Only(false); }}
            className="rounded-md px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            ✕ {t("reset", lang)}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <p className="text-base font-bold">{t("no_matches", lang)}</p>
          <p className="mt-1 text-sm muted">{t("try_remove_filters", lang)}</p>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <PlaceCard p={p} lang={lang} fallbackEmoji={meta.emoji} />
            </li>
          ))}
        </ul>
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

function PlaceCard({ p, lang, fallbackEmoji }: { p: Place; lang: Lang; fallbackEmoji: string }) {
  const tier = trustTier(p.trust_score);
  const tierClass =
    tier === "high"
      ? "bg-emerald-500 text-white"
      : tier === "mid"
      ? "bg-amber-500 text-white"
      : "bg-rose-500 text-white";
  const pbLabel = p.price_band !== "unknown" ? PB_LABEL[p.price_band as Exclude<PriceBand, "">] : null;

  const hasAffiliate =
    !!(p.affiliate.klook || p.affiliate.viator || p.affiliate.getyourguide || p.affiliate.agoda || p.affiliate.bookimed);

  return (
    <Link
      href={`/${lang}/place/${p.slug}/`}
      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-ink-50 dark:bg-ink-800">
        {p.top_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.top_photo_url} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <PlacePlaceholder niche={p.niche} size="lg" />
        )}
        <div className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black tabular-nums shadow-sm ${tierClass}`}>
          {p.trust_score}
          <span className="text-[9px] font-semibold opacity-90">/100</span>
        </div>
        {p.is_partner && (
          <div className="absolute left-2 top-2 rounded-md bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            ★ Partner
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <h3 className="line-clamp-2 text-base font-bold leading-tight">{p.name}</h3>

        <div className="flex items-center gap-2 text-xs muted">
          {p.city && <span className="truncate">📍 {p.city}</span>}
          {p.rating != null && (
            <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">
              ★ {p.rating.toFixed(1)}
              {p.review_count ? <span className="ml-0.5 font-normal muted">({p.review_count.toLocaleString()})</span> : null}
            </span>
          )}
        </div>

        {p.top_review_text && (
          <p className="line-clamp-2 text-[11px] leading-snug muted italic">
            &ldquo;{p.top_review_text}&rdquo;
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[10px]">
          {p.is_beginner_friendly && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              🐣 {t("filter_beginner", lang)}
            </span>
          )}
          {p.languages.ko && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              🇰🇷 KO
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
          {hasAffiliate && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              ⚡ {t("bookable_label", lang)}
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
