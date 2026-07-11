import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlacesByNiche } from "@/lib/data";
import { SITE, SUPPORTED_LANGS, t, tf, withXDefault } from "@/lib/i18n";
import type { Lang, Niche } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import SafeImg from "@/components/SafeImg";
import { cleanReviewText, isThaiText } from "@/lib/reviews";
import {
  CITY_SLUGS,
  NICHE_SLUGS,
  MIN_GUIDE_PLACES,
  parseGuideSlug,
  placesInGuideCity,
  hasEnoughGuidePlaces,
} from "@/lib/guides";

export const dynamic = "force-static";

// /[lang]/guide/[city]-[niche]/ — auto-generated city × niche guide.
// e.g. /en/guide/bangkok-yoga-pilates/. Slug/city/niche definitions and the
// MIN_GUIDE_PLACES threshold live in lib/guides.ts, shared with sitemap.ts.

export function generateStaticParams() {
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const c of CITY_SLUGS) {
      for (const n of NICHE_SLUGS) {
        if (!hasEnoughGuidePlaces(c, n)) continue;
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
  const parsed = parseGuideSlug(params.slug);
  if (!parsed) return {};
  const { city, niche } = parsed;
  if (!hasEnoughGuidePlaces(city, niche)) return {};
  const url = `${SITE.origin}/${params.lang}/guide/${params.slug}/`;
  const placesAll = getPlacesByNiche(niche);
  const cityPlaces = placesInGuideCity(placesAll, city);
  const nLabel = nicheName(niche, params.lang);
  const title = `${tf("g_meta_title", params.lang, { n: Math.min(cityPlaces.length, 10), niche: nLabel, city: city.label })} · ${SITE.name}`;
  const description = tf("g_meta_desc", params.lang, { niche: nLabel, city: city.label });
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/guide/${params.slug}/`]),
      )),
    },
    openGraph: { title, description, url, type: "article" },
  };
}

export default function GuidePage({
  params,
}: {
  params: { lang: Lang; slug: string };
}) {
  const parsed = parseGuideSlug(params.slug);
  if (!parsed) notFound();
  const { city, niche } = parsed;
  if (!hasEnoughGuidePlaces(city, niche)) notFound();
  const lang = params.lang;
  const meta = NICHE_META[niche];

  const all = getPlacesByNiche(niche);
  const places = placesInGuideCity(all, city)
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

  // FAQ — answered from the actual data, localized via tf() (placeholders keep
  // live counts/names; surrounding prose is translated per locale).
  const N = nicheName(niche, lang);
  const C = city.label;
  const inCity = placesInGuideCity(all, city).length;
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: tf("gf_count_q", lang, { niche: N, city: C }),
      a: tf("gf_count_a", lang, { all: all.length, niche: N, n: inCity, city: C }),
    },
    ...(priceLo
      ? [{
          q: tf("gf_price_q", lang, { niche: N, city: C }),
          a: tf("gf_price_a", lang, { lo: priceLo.toLocaleString(), hi: (priceHi ?? priceLo).toLocaleString() }),
        }]
      : []),
    ...(koFriendlyCount > 0
      ? [{
          q: tf("gf_korean_q", lang, { niche: N, city: C }),
          a: tf("gf_korean_a", lang, { n: koFriendlyCount, top: places.length, city: C, niche: N }),
        }]
      : []),
    ...(beginnerCount > 0
      ? [{
          q: t("gf_beginner_q", lang),
          a: tf("gf_beginner_a", lang, { n: beginnerCount, top: places.length, city: C, niche: N }),
        }]
      : []),
    ...(has24h
      ? [{
          q: t("gf_24h_q", lang),
          a: tf("gf_24h_a", lang, { city: C, niche: N }),
        }]
      : []),
    {
      q: t("gf_paid_q", lang),
      a: t("gf_paid_a", lang),
    },
  ];

  return (
    <main className="pb-20">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <SafeImg
            src={heroPlace?.top_photo_url}
            alt={cityNicheLabel}
            niche={niche}
            size="xl"
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
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
              {tf("g_title", lang, { n: places.length, niche: N, city: C })}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/90 sm:text-lg">
              {t("g_sub", lang)}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/30">
              {koFriendlyCount > 0 && <span>🇰🇷 {tf("city_badge_korean", lang, { n: koFriendlyCount })}</span>}
              {koFriendlyCount > 0 && <span>·</span>}
              <span>📍 {city.label}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* SUMMARY */}
        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">{t("g_summary", lang)}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryCard label={t("g_card_verified", lang)} value={places.length} />
            <SummaryCard
              label={t("filter_korean_friendly", lang)}
              value={koFriendlyCount}
              sub={tf("g_of_top", lang, { n: places.length })}
            />
            <SummaryCard
              label={t("filter_beginner", lang)}
              value={beginnerCount}
              sub={tf("g_of_top", lang, { n: places.length })}
            />
            <SummaryCard
              label={t("g_card_price", lang)}
              value={priceLo ? `฿${priceLo.toLocaleString()}+` : "—"}
              sub={priceHi && priceLo ? tf("g_to_price", lang, { n: priceHi.toLocaleString() }) : ""}
            />
          </dl>
        </section>

        {/* RANKED LIST */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">
            {tf("g_list_title", lang, { n: places.length })}
          </h2>
          <p className="mt-1 text-sm muted">
            {t("g_list_sub", lang)}
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
                    <SafeImg
                      src={p.top_photo_url}
                      alt={p.name}
                      niche={p.niche}
                      size="sm"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
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
                      {p.is_beginner_friendly && <span>🐣 {t("filter_beginner", lang)}</span>}
                    </div>
                    {(() => {
                      const body = cleanReviewText(p.top_review_text || "");
                      if (!body) return null;
                      const bodyIsThai = isThaiText(body);
                      return (
                        <p className="mt-2 line-clamp-2 text-xs leading-snug muted italic">
                          {bodyIsThai && lang !== "th" && <span className="not-italic">🇹🇭 </span>}
                          &ldquo;{body}&rdquo;
                        </p>
                      );
                    })()}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">
            {t("faq_section", lang)}
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
          <h2 className="text-xl font-bold tracking-tight">{t("g_related", lang)}</h2>
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
            {tf("g_back", lang, { niche: nicheName(niche, lang) })}
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
