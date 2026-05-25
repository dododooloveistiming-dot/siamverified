import Link from "next/link";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import PlacePlaceholder from "@/components/PlacePlaceholder";

/**
 * Discovery sections that sit ABOVE the filterable grid on category pages.
 * Server-rendered. Breaks up the monotony of an endless grid by giving users
 * multiple visual entry points — city pivots, top rated, korean-friendly,
 * bookable instantly. Inspired by Airbnb / Booking.com category layouts.
 */
export default function CategoryDiscovery({
  places,
  lang,
  niche,
}: {
  places: Place[];
  lang: Lang;
  niche: Niche;
}) {
  const meta = NICHE_META[niche];

  // --- Featured (editor's picks): top 3 by trust_score with a photo
  const featured = places
    .filter((p) => p.top_photo_url && !p.is_suspected_viral)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 3);

  // --- By city: group, take top cities
  const cityMap = new Map<string, Place[]>();
  for (const p of places) {
    if (!p.city) continue;
    if (!cityMap.has(p.city)) cityMap.set(p.city, []);
    cityMap.get(p.city)!.push(p);
  }
  const cityCards = [...cityMap.entries()]
    .map(([city, list]) => ({
      city,
      count: list.length,
      hero: list.find((p) => p.top_photo_url) ?? list[0],
    }))
    .filter((c) => !!c.hero)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // --- Curated rows
  const topRated = places
    .filter((p) => (p.rating ?? 0) >= 4.7 && !p.is_suspected_viral)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 10);

  const koreanFriendly = places
    .filter((p) => p.languages?.ko && !p.is_suspected_viral)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 10);

  const bookable = places
    .filter((p) => p.bookable?.klook || p.affiliate?.klook || p.affiliate?.viator)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 10);

  const beginner = places
    .filter((p) => p.is_beginner_friendly && !p.is_suspected_viral)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 10);

  return (
    <div className="mt-10 space-y-12">
      {/* FEATURED — Editor's picks (3 large cards) */}
      {featured.length >= 2 && (
        <section>
          <SectionHeader
            kicker="EDITOR'S PICKS"
            title={lang === "ko" ? "에디터 추천 베스트 3" : `Top ${nicheName(niche, lang)} picks`}
            subtitle={lang === "ko" ? "6개 소스 종합 점수 기준" : "Highest-trust verified businesses across 6 sources"}
          />
          <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {featured.map((p, i) => (
              <li key={p.id}>
                <FeaturedCard p={p} lang={lang} rank={i + 1} fallbackEmoji={meta.emoji} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CITIES — Pivot to city + niche guides */}
      {cityCards.length >= 3 && (
        <section>
          <SectionHeader
            kicker="BY CITY"
            title={lang === "ko" ? "도시별로 둘러보기" : "Browse by city"}
            subtitle={lang === "ko" ? "원하는 지역을 선택하세요" : "Pick a city to narrow your search"}
          />
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {cityCards.map((c) => (
              <li key={c.city}>
                <Link
                  href={`/${lang}/c/${niche}/?city=${encodeURIComponent(c.city)}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800"
                >
                  {c.hero.top_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.hero.top_photo_url}
                      alt={c.city}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <PlacePlaceholder niche={niche} size="lg" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="text-lg font-black leading-tight">{c.city}</div>
                    <div className="text-[11px] text-white/85">
                      {c.count} {lang === "ko" ? "곳" : "places"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* TOP RATED — horizontal scroll snap */}
      {topRated.length >= 4 && (
        <ScrollRow
          kicker="TOP RATED"
          title={lang === "ko" ? "★ 평점 4.7 이상" : "★ 4.7+ rated"}
          subtitle={lang === "ko" ? "리뷰 평점 최상위" : "Highest-rated places in this category"}
          places={topRated}
          lang={lang}
          accent="amber"
        />
      )}

      {/* KOREAN FRIENDLY */}
      {koreanFriendly.length >= 4 && (
        <ScrollRow
          kicker="🇰🇷 KOREAN OK"
          title={lang === "ko" ? "한국어 가능한 곳" : "Korean-friendly spots"}
          subtitle={lang === "ko" ? "한국어 응대 가능 / 한국어 자료 있음" : "Korean-speaking staff or Korean materials available"}
          places={koreanFriendly}
          lang={lang}
          accent="rose"
        />
      )}

      {/* BOOKABLE INSTANTLY */}
      {bookable.length >= 3 && (
        <ScrollRow
          kicker="BOOKABLE NOW"
          title={lang === "ko" ? "⚡ 즉시 예약 가능" : "⚡ Bookable instantly"}
          subtitle={lang === "ko" ? "Klook / Viator로 바로 예약" : "Reserve via Klook or Viator without contacting the venue"}
          places={bookable}
          lang={lang}
          accent="emerald"
        />
      )}

      {/* BEGINNER FRIENDLY */}
      {beginner.length >= 4 && (
        <ScrollRow
          kicker="BEGINNER FRIENDLY"
          title={lang === "ko" ? "🐣 입문자 환영" : "🐣 Beginner-friendly"}
          subtitle={lang === "ko" ? "처음이어도 부담 없는 곳" : "Welcoming to first-timers, no pressure"}
          places={beginner}
          lang={lang}
          accent="sky"
        />
      )}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
        {kicker}
      </div>
      <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm muted">{subtitle}</p>
    </div>
  );
}

function FeaturedCard({
  p,
  lang,
  rank,
  fallbackEmoji,
}: {
  p: Place;
  lang: Lang;
  rank: number;
  fallbackEmoji: string;
}) {
  return (
    <Link
      href={`/${lang}/place/${p.slug}/`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xl dark:border-ink-800 dark:bg-ink-900"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-50 dark:bg-ink-800">
        {p.top_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.top_photo_url}
            alt={p.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <PlacePlaceholder niche={p.niche} size="xl" />
        )}
        <div className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-white text-base font-black text-emerald-600 shadow-md">
          #{rank}
        </div>
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-1 text-xs font-black text-white shadow-sm">
          {p.trust_score}
          <span className="text-[9px] opacity-80">/100</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-lg font-black leading-tight">{p.name}</h3>
        <div className="flex items-center gap-2 text-xs">
          {p.city && <span className="muted">📍 {p.city}</span>}
          {p.rating != null && (
            <span className="font-black text-amber-600 dark:text-amber-400">
              ★ {p.rating.toFixed(1)}
              {p.review_count ? (
                <span className="ml-1 text-[10px] font-normal muted">
                  ({p.review_count.toLocaleString()})
                </span>
              ) : null}
            </span>
          )}
        </div>
        {p.top_review_text && (
          <p className="mt-1 line-clamp-3 text-[12px] italic leading-relaxed text-ink-600 dark:text-ink-400">
            &ldquo;{p.top_review_text}&rdquo;
          </p>
        )}
      </div>
    </Link>
  );
}

function ScrollRow({
  kicker,
  title,
  subtitle,
  places,
  lang,
  accent,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  places: Place[];
  lang: Lang;
  accent: "amber" | "rose" | "emerald" | "sky";
}) {
  const accentRing = {
    amber: "ring-amber-300",
    rose: "ring-rose-300",
    emerald: "ring-emerald-300",
    sky: "ring-sky-300",
  }[accent];

  return (
    <section>
      <SectionHeader kicker={kicker} title={title} subtitle={subtitle} />
      <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]">
        <ul className="flex snap-x snap-mandatory gap-4">
          {places.map((p) => (
            <li
              key={p.id}
              className="w-[230px] shrink-0 snap-start sm:w-[260px]"
            >
              <Link
                href={`/${lang}/place/${p.slug}/`}
                className={`group block overflow-hidden rounded-2xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 ${accentRing} dark:border-ink-800 dark:bg-ink-900`}
              >
                <div className="relative aspect-[4/3] bg-ink-50 dark:bg-ink-800">
                  {p.top_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.top_photo_url}
                      alt={p.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <PlacePlaceholder niche={p.niche} size="md" />
                  )}
                  {p.bookable?.klook && (
                    <span className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                      ⚡ Klook
                    </span>
                  )}
                  {p.is_partner && !p.bookable?.klook && (
                    <span className="absolute right-2 top-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-black text-white shadow">
                      ★ Partner
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-bold leading-tight">{p.name}</h3>
                    {p.rating != null && (
                      <span className="shrink-0 text-xs font-black text-amber-600 dark:text-amber-400">
                        ★ {p.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] muted">
                    {p.city && <span className="truncate">📍 {p.city}</span>}
                    {p.review_count ? (
                      <span className="shrink-0">{p.review_count.toLocaleString()} {lang === "ko" ? "리뷰" : "reviews"}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
