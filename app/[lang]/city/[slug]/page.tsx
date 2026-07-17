import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlacesByNiche, toMapMarker } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, t, tf, withXDefault } from "@/lib/i18n";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName, nicheTagline } from "@/lib/types";
import { CITIES, getCityBySlug, placesInCity, countNichesInCity } from "@/lib/cities";
import { hasEnoughGuidePlaces } from "@/lib/guides";
import { BEST_KINDS, bestSlug, hasEnoughBestPlaces } from "@/lib/best";
import { genericOgImage } from "@/lib/og";
import SafeImg from "@/components/SafeImg";
import WishlistButton from "@/components/WishlistButton";
import PlaceMap from "@/components/PlaceMap";

export const dynamic = "force-static";

const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

export function generateStaticParams() {
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const c of CITIES) {
      params.push({ lang, slug: c.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; slug: string };
}): Promise<Metadata> {
  const city = getCityBySlug(params.slug);
  if (!city) return {};
  const bundle = loadPlaces();
  const cityPlaces = placesInCity(bundle.places, city);
  const url = `${SITE.origin}/${params.lang}/city/${city.slug}/`;
  const title = `${tf("city_meta_title", params.lang, { city: city.label, n: cityPlaces.length })} · ${SITE.name}`;
  const description = (city.blurb[params.lang] || city.blurb.en) ?? "";
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/city/${city.slug}/`]),
      )),
    },
    openGraph: { title, description, url, type: "article", images: genericOgImage(title, description, city.emoji) },
  };
}

export default function CityHubPage({
  params,
}: {
  params: { lang: Lang; slug: string };
}) {
  const city = getCityBySlug(params.slug);
  if (!city) notFound();
  const lang = params.lang;

  const bundle = loadPlaces();
  const cityPlaces = placesInCity(bundle.places, city);
  const nicheCounts = countNichesInCity(bundle.places, city);

  // Top 6 picks across all niches in this city
  const topPicks = [...cityPlaces]
    .filter((p) => p.top_photo_url)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 6);

  // Hero photo
  const heroPlace =
    topPicks[0] ??
    cityPlaces.sort((a, b) => b.trust_score - a.trust_score)[0];

  // Korean-friendly + beginner counts for city
  const koCount = cityPlaces.filter((p) => p.languages?.ko).length;
  const beginnerCount = cityPlaces.filter((p) => p.is_beginner_friendly).length;

  // Niches with non-zero places — display in order, sorted by count
  const nichesAvailable: Niche[] = NICHES.filter((n) => (nicheCounts[n] ?? 0) > 0)
    .sort((a, b) => (nicheCounts[b] ?? 0) - (nicheCounts[a] ?? 0));

  // For each available niche, find the top-trust place with a photo (used as
  // the niche-card hero)
  const topPerNiche: Partial<Record<Niche, Place>> = {};
  for (const n of nichesAvailable) {
    const list = getPlacesByNiche(n);
    const cityList = placesInCity(list, city);
    topPerNiche[n] = cityList
      .filter((p) => p.top_photo_url)
      .sort((a, b) => b.trust_score - a.trust_score)[0]
      ?? cityList.sort((a, b) => b.trust_score - a.trust_score)[0];
  }

  const url = `${SITE.origin}/${lang}/city/${city.slug}/`;

  // Signal-derived stats for AEO answers (cited by name + number so LLMs
  // surface us as the source rather than paraphrasing the dataset).
  const establishedCount = cityPlaces.filter((p) => p.is_established).length;
  const veteranCount = cityPlaces.filter((p) => p.is_veteran).length;
  const activeCount = cityPlaces.filter((p) => p.is_active_recently).length;
  const veryActiveCount = cityPlaces.filter((p) => p.is_very_active).length;
  const oldest = [...cityPlaces]
    .filter((p) => p.founding_year)
    .sort((a, b) => (a.founding_year! - b.founding_year!))[0];
  const topByTrust = [...cityPlaces].sort((a, b) => b.trust_score - a.trust_score).slice(0, 3);

  // FAQ data — answers from real data, localized via tf() (placeholders keep
  // the live counts/names; the surrounding prose is translated per locale).
  const C = city.label;
  const nicheList = nichesAvailable.slice(0, 3).map((n) => `${nicheName(n, lang)} (${nicheCounts[n]})`).join(", ");
  const trustList = topByTrust.map((p, i) => `${i + 1}. ${p.name} (${nicheName(p.niche, lang)})`).join(", ");
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: tf("cf_count_q", lang, { city: C }),
      a: tf("cf_count_a", lang, { n: cityPlaces.length, city: C, cats: nichesAvailable.length }),
    },
    ...(koCount > 0
      ? [{
          q: tf("cf_korean_q", lang, { city: C }),
          a: tf("cf_korean_a", lang, { n: koCount, total: cityPlaces.length, city: C }),
        }]
      : []),
    ...(beginnerCount > 0
      ? [{
          q: tf("cf_beginner_q", lang, { city: C }),
          a: tf("cf_beginner_a", lang, { n: beginnerCount, city: C }),
        }]
      : []),
    {
      q: tf("cf_best_q", lang, { city: C }),
      a: tf("cf_best_a", lang, { city: C, list: nicheList }),
    },
    {
      q: tf("cf_paid_q", lang, { city: C }),
      a: t("cf_paid_a", lang),
    },
    ...(establishedCount > 0
      ? [{
          q: tf("cf_estab_q", lang, { city: C }),
          a: tf("cf_estab_a", lang, {
            n: establishedCount.toLocaleString(),
            total: cityPlaces.length.toLocaleString(),
            city: C,
            vet: veteranCount > 0 ? tf("cf_estab_vet", lang, { n: veteranCount.toLocaleString() }) : "",
          }),
        }]
      : []),
    ...(oldest && oldest.founding_year
      ? [{
          q: tf("cf_oldest_q", lang, { city: C }),
          a: tf("cf_oldest_a", lang, {
            name: oldest.name,
            niche: nicheName(oldest.niche, lang),
            city: C,
            year: oldest.founding_year,
            years: new Date().getFullYear() - oldest.founding_year,
          }),
        }]
      : []),
    ...(activeCount > 0
      ? [{
          q: tf("cf_active_q", lang, { city: C }),
          a: tf("cf_active_a", lang, {
            n: activeCount.toLocaleString(),
            total: cityPlaces.length.toLocaleString(),
            city: C,
            recent: veryActiveCount > 0 ? tf("cf_active_recent", lang, { n: veryActiveCount.toLocaleString() }) : "",
          }),
        }]
      : []),
    ...(topByTrust.length >= 3
      ? [{
          q: tf("cf_toptrust_q", lang, { city: C }),
          a: tf("cf_toptrust_a", lang, { city: C, list: trustList }),
        }]
      : []),
  ];

  const blurb = (city.blurb[lang] || city.blurb.en) ?? "";

  return (
    <main className="pb-20">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {heroPlace?.top_photo_url ? (
            <SafeImg
              src={heroPlace.top_photo_url}
              alt={city.label}
              fallbackClassName="h-full w-full"
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-300 to-amber-300" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-10 sm:pt-16 sm:pb-14">
          <nav className="text-xs text-white/80">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <span>{t("city_crumb", lang)}</span>
            <span className="mx-2">/</span>
            <span>{city.label}</span>
          </nav>

          <div className="mt-16 sm:mt-24">
            <div className="text-5xl">{city.emoji}</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
              {tf("city_title", lang, { city: city.label })}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {blurb}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-white">
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/30 backdrop-blur-sm">
                📍 {tf("city_badge_verified", lang, { n: cityPlaces.length })}
              </span>
              {koCount > 0 && (
                <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/30 backdrop-blur-sm">
                  🇰🇷 {tf("city_badge_korean", lang, { n: koCount })}
                </span>
              )}
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/30 backdrop-blur-sm">
                🏷️ {tf("city_badge_cats", lang, { n: nichesAvailable.length })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* BROWSE BY CATEGORY in this city */}
        {(() => {
          const mapped = cityPlaces.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
          if (mapped.length < 3) return null;
          return (
            <section className="mt-10">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{tf("city_map_title", lang, { city: city.label })}</h2>
                <span className="text-xs muted">{tf("city_map_count", lang, { n: mapped.length })}</span>
              </div>
              <PlaceMap places={mapped.slice(0, 200).map(toMapMarker)} lang={lang} height={500} />
            </section>
          );
        })()}

        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {tf("city_browse_title", lang, { city: city.label })}
          </h2>
          <p className="mt-1 text-sm muted">
            {tf("city_browse_sub", lang, { n: nichesAvailable.length })}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nichesAvailable.map((n) => {
              const meta = NICHE_META[n];
              const photo = topPerNiche[n]?.top_photo_url;
              const count = nicheCounts[n] ?? 0;
              const guideReady = hasEnoughGuidePlaces(city, n);
              return (
                <Link
                  key={n}
                  href={guideReady ? `/${lang}/guide/${city.slug}-${n}/` : `/${lang}/c/${n}/?city=${city.slug}`}
                  className="group relative block aspect-[5/3] overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <SafeImg
                    src={photo}
                    alt={`${nicheName(n, lang)} in ${city.label}`}
                    niche={n}
                    size="lg"
                    fallbackClassName="absolute inset-0"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black tabular-nums shadow-md dark:bg-ink-900/95">
                    {count}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="text-2xl">{meta.emoji}</div>
                    <h3 className="mt-1 text-xl font-black tracking-tight">
                      {nicheName(n, lang)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-white/80">
                      {nicheTagline(n, lang)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* TOP PICKS in this city */}
        {topPicks.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {tf("city_toppicks_title", lang, { city: city.label })}
                </h2>
                <p className="mt-1 text-sm muted">
                  {t("city_toppicks_sub", lang)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {topPicks.map((p) => (
                <Link
                  key={p.id}
                  href={`/${lang}/place/${p.slug}/`}
                  className="group block overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="relative aspect-square overflow-hidden bg-ink-50 dark:bg-ink-800">
                    <SafeImg
                      src={p.top_photo_url}
                      alt={p.name}
                      niche={p.niche}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                    <div className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow" title={`Trust ${p.trust_score}/100`}>
                      {p.trust_score}<span className="font-semibold opacity-80">/100</span>
                    </div>
                    <div className="absolute left-1.5 bottom-1.5">
                      <WishlistButton place={p} />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="line-clamp-2 text-xs font-bold leading-tight">{p.name}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] muted">
                      <span className="truncate">{NICHE_META[p.niche].emoji} {nicheName(p.niche, lang)}</span>
                      {p.rating != null && (
                        <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">
                          ★ {p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* BEST-OF LINKS — cross-link into the sharper long-tail /best/
            pages for this city, when enough places qualify. These pages
            previously had zero inbound links anywhere on the site. */}
        {(() => {
          const bestLinks = nichesAvailable.flatMap((n) =>
            BEST_KINDS.filter((k) => hasEnoughBestPlaces(city, n, k)).map((k) => ({ n, k })),
          );
          if (bestLinks.length === 0) return null;
          return (
            <section className="mt-14">
              <h2 className="text-2xl font-bold tracking-tight">
                {tf("city_best_title", lang, { city: city.label })}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {bestLinks.map(({ n, k }) => (
                  <Link
                    key={`${n}-${k}`}
                    href={`/${lang}/best/${bestSlug(city, n, k)}/`}
                    className="block rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-sm font-semibold text-emerald-800 hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                  >
                    {NICHE_META[n].emoji}{" "}
                    {tf(k === "established" ? "bp_companion_est" : "bp_companion_act", lang, { niche: nicheName(n, lang) })}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">
            {tf("city_faq_title", lang, { city: city.label })}
          </h2>
          <div className="mt-4 space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
              >
                <summary className="cursor-pointer list-none text-sm font-bold flex items-center justify-between">
                  <span>{f.q}</span>
                  <span className="text-xs muted group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* OTHER CITIES */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">{t("city_other_cities", lang)}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/${lang}/city/${c.slug}/`}
                className="group rounded-xl border border-ink-100 bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="text-2xl">{c.emoji}</div>
                <div className="mt-1 text-xs font-bold">{c.label}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* COMPARE LINKS */}
        <section className="mt-10 text-center">
          <p className="text-xs muted">
            {t("city_compare", lang)}{" "}
            {CITIES.filter((c) => c.slug !== city.slug).slice(0, 3).map((c, i) => (
              <span key={c.slug}>
                {i > 0 && " · "}
                <Link
                  href={`/${lang}/compare/${city.slug}-vs-${c.slug}/`}
                  className="text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {tf("city_vs", lang, { a: city.label, b: c.label })}
                </Link>
              </span>
            ))}
          </p>
        </section>
      </div>

      {/* Schema.org TouristDestination + FAQPage + ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "TouristDestination",
              "@id": url,
              name: `${city.label}, Thailand`,
              description: blurb,
              url,
              touristType: ["Tourist", "Wellness traveler", "Long-stay visitor"],
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `Top picks in ${city.label}`,
              numberOfItems: topPicks.length,
              itemListElement: topPicks.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE.origin}/${lang}/place/${p.slug}/`,
                name: p.name,
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE.name, item: `${SITE.origin}/${lang}/` },
                { "@type": "ListItem", position: 2, name: city.label, item: url },
              ],
            },
          ]),
        }}
      />
    </main>
  );
}
