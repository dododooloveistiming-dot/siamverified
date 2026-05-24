import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlacesByNiche } from "@/lib/data";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import PlacePlaceholder from "@/components/PlacePlaceholder";

export const dynamic = "force-static";

// ─── Slug definitions ─────────────────────────────────────────────────────
// /[lang]/guide/[city]-[niche]/ — auto-generated city × niche guide.
// e.g. /en/guide/bangkok-yoga-pilates/

const CITY_SLUGS: Array<{ slug: string; label: string; matches: string[] }> = [
  { slug: "bangkok", label: "Bangkok", matches: ["bangkok"] },
  { slug: "chiang-mai", label: "Chiang Mai", matches: ["chiang mai", "chiangmai"] },
  { slug: "phuket", label: "Phuket", matches: ["phuket"] },
  { slug: "pattaya", label: "Pattaya", matches: ["pattaya"] },
  { slug: "hua-hin", label: "Hua Hin", matches: ["hua hin", "huahin"] },
  { slug: "koh-samui", label: "Koh Samui", matches: ["koh samui", "samui"] },
];

const NICHE_SLUGS: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

function parseSlug(slug: string): { city: typeof CITY_SLUGS[0]; niche: Niche } | null {
  for (const c of CITY_SLUGS) {
    for (const n of NICHE_SLUGS) {
      if (slug === `${c.slug}-${n}`) {
        return { city: c, niche: n };
      }
    }
  }
  return null;
}

function placesInCity(places: Place[], city: typeof CITY_SLUGS[0]): Place[] {
  return places.filter((p) => {
    const c = (p.city || "").toLowerCase();
    return city.matches.some((m) => c === m || c.includes(m));
  });
}

export function generateStaticParams() {
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const c of CITY_SLUGS) {
      for (const n of NICHE_SLUGS) {
        params.push({ lang, slug: `${c.slug}-${n}` });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; slug: string };
}): Promise<Metadata> {
  const parsed = parseSlug(params.slug);
  if (!parsed) return {};
  const { city, niche } = parsed;
  const url = `${SITE.origin}/${params.lang}/guide/${params.slug}/`;
  const placesAll = getPlacesByNiche(niche);
  const cityPlaces = placesInCity(placesAll, city);
  const cityNicheLabel = `${city.label} ${nicheName(niche, params.lang)}`;
  const title = `${cityNicheLabel} — Top ${Math.min(cityPlaces.length, 10)} Verified · ${SITE.name}`;
  const description = `Independent guide to the top ${nicheName(
    niche,
    params.lang,
  )} in ${city.label}, Thailand. Cross-checked across 6 sources. No paid promotion. Real Korean / Thai / English reviews.`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/guide/${params.slug}/`]),
      ),
    },
    openGraph: { title, description, url, type: "article" },
  };
}

export default function GuidePage({
  params,
}: {
  params: { lang: Lang; slug: string };
}) {
  const parsed = parseSlug(params.slug);
  if (!parsed) notFound();
  const { city, niche } = parsed;
  const lang = params.lang;
  const meta = NICHE_META[niche];

  const all = getPlacesByNiche(niche);
  const places = placesInCity(all, city)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 10);

  const koFriendlyCount = places.filter((p) => p.languages.ko).length;
  const beginnerCount = places.filter((p) => p.is_beginner_friendly).length;
  const has24h = places.some((p) => p.is_open_24h);
  const priceRanges = places
    .map((p) => p.price_min_thb)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  const priceLo = priceRanges[0] ?? null;
  const priceHi = priceRanges[priceRanges.length - 1] ?? null;
  const heroPlace = places.find((p) => p.top_photo_url) ?? places[0];

  const cityNicheLabel = `${city.label} ${nicheName(niche, lang)}`;
  const url = `${SITE.origin}/${lang}/guide/${params.slug}/`;

  // FAQ — answered from the actual data
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How many verified ${nicheName(niche, lang)} places are there in ${city.label}?`,
      a: `Verified Thai lists ${all.length} ${nicheName(niche, lang)} places across Thailand and ${placesInCity(all, city).length} specifically in ${city.label}, each cross-checked across Google, Reddit, Naver, Pantip, YouTube, and official websites.`,
    },
    ...(priceLo
      ? [{
          q: `How much does ${nicheName(niche, lang)} cost in ${city.label}?`,
          a: `Based on our data, prices range from about ฿${priceLo.toLocaleString()} to ฿${(priceHi ?? priceLo).toLocaleString()}. Exact pricing varies by studio — check each listing for current rates.`,
        }]
      : []),
    ...(koFriendlyCount > 0
      ? [{
          q: `Are there Korean-friendly ${nicheName(niche, lang)} options in ${city.label}?`,
          a: `Yes — ${koFriendlyCount} of our top ${places.length} ${city.label} ${nicheName(niche, lang)} listings have Korean-language reviews or Korean-speaking staff signals.`,
        }]
      : []),
    ...(beginnerCount > 0
      ? [{
          q: `Are there beginner-friendly options?`,
          a: `${beginnerCount} of the top ${places.length} ${city.label} ${nicheName(niche, lang)} places are flagged as beginner-friendly in our reviews aggregation.`,
        }]
      : []),
    ...(has24h
      ? [{
          q: `Are any places open 24 hours?`,
          a: `Yes — at least one of our top ${city.label} ${nicheName(niche, lang)} listings operates 24 hours. Check individual listing hours for confirmation.`,
        }]
      : []),
    {
      q: `Does Verified Thai accept paid placements?`,
      a: `No. Listings are ranked purely by our independent Trust Score — a composite of Google reviews, Reddit, Naver, Pantip, YouTube mentions, and official website verification.`,
    },
  ];

  return (
    <main className="pb-20">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {heroPlace?.top_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroPlace.top_photo_url}
              alt={cityNicheLabel}
              className="h-full w-full object-cover"
            />
          ) : (
            <PlacePlaceholder niche={niche} size="xl" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pt-12 pb-10 sm:pt-16 sm:pb-14">
          <nav className="text-xs text-white/80">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${lang}/c/${niche}/`} className="hover:underline">
              {nicheName(niche, lang)}
            </Link>
            <span className="mx-2">/</span>
            <span>{city.label}</span>
          </nav>

          <div className="mt-20 sm:mt-24">
            <div className="text-5xl">{meta.emoji}</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
              Top {places.length} {nicheName(niche, lang)} in {city.label}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/90 sm:text-lg">
              Independently scored across 6 sources. No paid placement. Updated continuously.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/30">
              {koFriendlyCount > 0 && <span>🇰🇷 {koFriendlyCount} Korean-friendly</span>}
              {koFriendlyCount > 0 && <span>·</span>}
              <span>📍 {city.label}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* SUMMARY */}
        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">Quick summary</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryCard label="Verified places" value={places.length} />
            <SummaryCard
              label="Korean-friendly"
              value={koFriendlyCount}
              sub={`of top ${places.length}`}
            />
            <SummaryCard
              label="Beginner-friendly"
              value={beginnerCount}
              sub={`of top ${places.length}`}
            />
            <SummaryCard
              label="Price (THB)"
              value={priceLo ? `฿${priceLo.toLocaleString()}+` : "—"}
              sub={priceHi && priceLo ? `to ฿${priceHi.toLocaleString()}` : ""}
            />
          </dl>
        </section>

        {/* RANKED LIST */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">
            The list — top {places.length} ranked by Trust Score
          </h2>
          <p className="mt-1 text-sm muted">
            Trust Score combines Google reviews, Reddit / Pantip mentions, Naver blog posts,
            YouTube videos, and official website signals.
          </p>
          <ol className="mt-5 space-y-3">
            {places.map((p, i) => (
              <li
                key={p.id}
                className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-4 transition hover:border-emerald-400 hover:shadow dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="shrink-0 text-3xl font-black tabular-nums muted">
                  #{i + 1}
                </div>
                <Link
                  href={`/${lang}/place/${p.slug}/`}
                  className="grid flex-1 grid-cols-[80px_1fr] gap-3 sm:grid-cols-[140px_1fr]"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-800">
                    {p.top_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.top_photo_url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <PlacePlaceholder niche={p.niche} size="sm" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h3 className="text-base font-bold sm:text-lg">{p.name}</h3>
                      <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                        {p.trust_score}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs muted">
                      {p.rating != null && (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          ★ {p.rating.toFixed(1)}
                          {p.review_count ? ` (${p.review_count.toLocaleString()})` : ""}
                        </span>
                      )}
                      {p.price_min_thb > 0 && (
                        <span>
                          ฿{p.price_min_thb.toLocaleString()}
                          {p.price_max_thb > p.price_min_thb ? `–${p.price_max_thb.toLocaleString()}` : ""}
                        </span>
                      )}
                      {p.languages.ko && <span>🇰🇷</span>}
                      {p.is_beginner_friendly && <span>🐣 Beginner-friendly</span>}
                    </div>
                    {p.top_review_text && (
                      <p className="mt-2 line-clamp-2 text-xs leading-snug muted italic">
                        &ldquo;{p.top_review_text}&rdquo;
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">
            Frequently asked questions
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

        {/* RELATED LINKS */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">Related guides</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {NICHE_SLUGS.filter((n) => n !== niche).slice(0, 4).map((n) => (
              <Link
                key={n}
                href={`/${lang}/guide/${city.slug}-${n}/`}
                className="block rounded-xl border border-ink-100 bg-white p-3 text-sm hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
              >
                <span className="mr-2">{NICHE_META[n].emoji}</span>
                {city.label} {nicheName(n, lang)}
              </Link>
            ))}
            {CITY_SLUGS.filter((c) => c.slug !== city.slug).slice(0, 3).map((c) => (
              <Link
                key={c.slug}
                href={`/${lang}/guide/${c.slug}-${niche}/`}
                className="block rounded-xl border border-ink-100 bg-white p-3 text-sm hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
              >
                <span className="mr-2">{meta.emoji}</span>
                {c.label} {nicheName(niche, lang)}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12 text-xs muted">
          <Link href={`/${lang}/c/${niche}/`} className="hover:underline">
            ← All {nicheName(niche, lang)} in Thailand
          </Link>
        </div>
      </div>

      {/* Schema.org ItemList + FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "@id": url,
              name: `Top ${places.length} ${nicheName(niche, lang)} in ${city.label}`,
              numberOfItems: places.length,
              itemListElement: places.map((p, i) => ({
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

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
      <div className="text-[10px] font-semibold uppercase tracking-wide muted">{label}</div>
      <div className="mt-1 text-xl font-black tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] muted">{sub}</div>}
    </div>
  );
}
