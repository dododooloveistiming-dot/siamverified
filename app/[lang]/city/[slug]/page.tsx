import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlacesByNiche } from "@/lib/data";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName, nicheTagline } from "@/lib/types";
import { CITIES, getCityBySlug, placesInCity, countNichesInCity } from "@/lib/cities";
import PlacePlaceholder from "@/components/PlacePlaceholder";

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
  const title = `${city.label}, Thailand — ${cityPlaces.length} Verified Places · ${SITE.name}`;
  const description = (city.blurb[params.lang] || city.blurb.en) ?? "";
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/city/${city.slug}/`]),
      ),
    },
    openGraph: { title, description, url, type: "article" },
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

  // FAQ data — answers from real data
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How many verified places are listed in ${city.label}?`,
      a: `Verified Thai lists ${cityPlaces.length} cross-checked places in ${city.label}, spanning ${nichesAvailable.length} categories. Each is scored independently across 6 sources (Google, Reddit, Naver, Pantip, YouTube, official sites).`,
    },
    ...(koCount > 0
      ? [{
          q: `Are there Korean-friendly options in ${city.label}?`,
          a: `${koCount} of the ${cityPlaces.length} ${city.label} listings have Korean-language reviews or Korean-speaking staff signals — surfaced from Naver and YouTube mentions.`,
        }]
      : []),
    ...(beginnerCount > 0
      ? [{
          q: `Are any places in ${city.label} beginner-friendly?`,
          a: `${beginnerCount} ${city.label} listings are flagged as beginner-friendly across our reviews aggregation — see the beginner badge on individual listings.`,
        }]
      : []),
    {
      q: `What's the best category in ${city.label}?`,
      a: `${city.label} is densest in ${nichesAvailable
        .slice(0, 3)
        .map((n) => `${nicheName(n, lang)} (${nicheCounts[n]})`)
        .join(", ")}. See per-category guides below for ranked top-10 lists.`,
    },
    {
      q: `Does Verified Thai accept paid placement in ${city.label}?`,
      a: `No. Listings are ranked purely by an independent Trust Score combining Google reviews, Reddit, Naver, Pantip, YouTube mentions, and official website signals. We accept zero payment to rank a business.`,
    },
  ];

  const blurb = (city.blurb[lang] || city.blurb.en) ?? "";

  return (
    <main className="pb-20">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {heroPlace?.top_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroPlace.top_photo_url}
              alt={city.label}
              className="h-full w-full object-cover"
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
            <span>Cities</span>
            <span className="mx-2">/</span>
            <span>{city.label}</span>
          </nav>

          <div className="mt-16 sm:mt-24">
            <div className="text-5xl">{city.emoji}</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
              {city.label}, Thailand
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {blurb}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-white">
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/30 backdrop-blur-sm">
                📍 {cityPlaces.length} verified places
              </span>
              {koCount > 0 && (
                <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/30 backdrop-blur-sm">
                  🇰🇷 {koCount} Korean-friendly
                </span>
              )}
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/30 backdrop-blur-sm">
                🏷️ {nichesAvailable.length} categories
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* BROWSE BY CATEGORY in this city */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">
            Browse {city.label} by category
          </h2>
          <p className="mt-1 text-sm muted">
            {nichesAvailable.length} categories with verified places · Tap a card to see the ranked top-10 guide.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nichesAvailable.map((n) => {
              const meta = NICHE_META[n];
              const photo = topPerNiche[n]?.top_photo_url;
              const count = nicheCounts[n] ?? 0;
              return (
                <Link
                  key={n}
                  href={`/${lang}/guide/${city.slug}-${n}/`}
                  className="group relative block aspect-[5/3] overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={`${nicheName(n, lang)} in ${city.label}`}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <PlacePlaceholder niche={n} size="lg" />
                    </div>
                  )}
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
                  Top picks in {city.label}
                </h2>
                <p className="mt-1 text-sm muted">
                  Highest cross-source trust scores across all categories.
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
                    {p.top_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.top_photo_url}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                        loading="lazy"
                      />
                    ) : (
                      <PlacePlaceholder niche={p.niche} size="md" />
                    )}
                    <div className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                      {p.trust_score}
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

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">
            FAQ — {city.label}
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
          <h2 className="text-2xl font-bold tracking-tight">Other cities in Thailand</h2>
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
            Compare:{" "}
            {CITIES.filter((c) => c.slug !== city.slug).slice(0, 3).map((c, i) => (
              <span key={c.slug}>
                {i > 0 && " · "}
                <Link
                  href={`/${lang}/compare/${city.slug}-vs-${c.slug}/`}
                  className="text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {city.label} vs {c.label}
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
          ]),
        }}
      />
    </main>
  );
}
