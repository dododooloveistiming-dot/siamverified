import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlacesByNiche } from "@/lib/data";
import { getCityBySlug, placesInCity } from "@/lib/cities";
import { SITE, SUPPORTED_LANGS, t, tf, withXDefault } from "@/lib/i18n";
import { genericOgImage } from "@/lib/og";
import type { Lang, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import { seasonForMonth, monthName, MONTH_SLUGS, monthFromSlug } from "@/lib/seasons";
import SafeImg from "@/components/SafeImg";

// /[lang]/thailand-in/[month]/ — 12 evergreen seasonal landing pages built
// from the hand-written, already-translated month content in lib/seasons.ts
// (previously used ONLY as a homepage widget). "Best time to visit
// Thailand" / "Thailand in {month}" is recurring annual search demand with
// almost no SEA-language competition.

export const dynamic = "force-static";

export function generateStaticParams() {
  const params: Array<{ lang: Lang; month: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const slug of MONTH_SLUGS.slice(1)) {
      params.push({ lang, month: slug });
    }
  }
  return params;
}

function topPicksForSeason(season: ReturnType<typeof seasonForMonth>, limit = 6): Place[] {
  if (!season) return [];
  const validCities = season.cities.map((c) => getCityBySlug(c)).filter((c): c is NonNullable<typeof c> => !!c);
  const out: Place[] = [];
  for (const niche of season.niches) {
    const nichePlaces = getPlacesByNiche(niche);
    const pool = validCities.length
      ? validCities.flatMap((c) => placesInCity(nichePlaces, c))
      : nichePlaces;
    out.push(...[...pool].sort((a, b) => b.trust_score - a.trust_score).slice(0, limit));
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; month: string };
}): Promise<Metadata> {
  const monthNum = monthFromSlug(params.month);
  if (!monthNum) return {};
  const season = seasonForMonth(monthNum);
  if (!season) return {};
  const lang = params.lang;
  const label = monthName(monthNum, lang);
  const url = `${SITE.origin}/${lang}/thailand-in/${params.month}/`;
  const title = tf("season_meta_title", lang, { month: label });
  const description = (season.context[lang] ?? season.context.en).slice(0, 200);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: withXDefault(Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/thailand-in/${params.month}/`]),
      )),
    },
    openGraph: { title, description, url, type: "article", images: genericOgImage(title, description, season.emoji) },
  };
}

export default function SeasonMonthPage({
  params,
}: {
  params: { lang: Lang; month: string };
}) {
  const monthNum = monthFromSlug(params.month);
  if (!monthNum) notFound();
  const season = seasonForMonth(monthNum);
  if (!season) notFound();
  const lang = params.lang;
  const label = monthName(monthNum, lang);
  const url = `${SITE.origin}/${lang}/thailand-in/${params.month}/`;
  const validCities = season.cities.map((c) => getCityBySlug(c)).filter((c): c is NonNullable<typeof c> => !!c);
  const topPicks = topPicksForSeason(season);

  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: tf("season_faq_good_q", lang, { month: label }),
      a: season.context[lang] ?? season.context.en,
    },
    {
      q: tf("season_faq_book_q", lang, { month: label }),
      a: tf("season_faq_book_a", lang, {
        niches: season.niches.map((n) => nicheName(n, lang)).join(", "),
        month: label,
      }),
    },
    ...(validCities.length > 0
      ? [{
          q: tf("season_faq_where_q", lang, { month: label }),
          a: tf("season_faq_where_a", lang, {
            cities: validCities.map((c) => c.label).join(", "),
            month: label,
          }),
        }]
      : []),
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: `${SITE.origin}/${lang}/` },
      { "@type": "ListItem", position: 2, name: tf("season_crumb", lang, { month: label }), item: url },
    ],
  };
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: tf("season_meta_title", lang, { month: label }),
    itemListElement: topPicks.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE.origin}/${lang}/place/${p.slug}/`,
      name: p.name,
    })),
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <main className="pb-20">
        <section className="border-b border-ink-100 bg-gradient-to-br from-amber-50/80 to-rose-50/60 py-10 dark:border-ink-800 dark:from-amber-950/30 dark:to-rose-950/20">
          <div className="mx-auto max-w-5xl px-4">
            <nav className="text-xs muted">
              <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
              <span className="mx-2">/</span>
              <span>{tf("season_crumb", lang, { month: label })}</span>
            </nav>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              <span className="mr-2">{season.emoji}</span>
              {tf("season_meta_title", lang, { month: label })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-700 dark:text-ink-300">
              {season.context[lang] ?? season.context.en}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {season.niches.map((n) => (
                <Link
                  key={n}
                  href={`/${lang}/c/${n}/`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:bg-ink-900 dark:text-emerald-400"
                >
                  <span>{NICHE_META[n].emoji}</span>
                  <span>{nicheName(n, lang)}</span>
                </Link>
              ))}
              {validCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${lang}/city/${c.slug}/`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition hover:bg-emerald-50 dark:bg-ink-900 dark:text-ink-300"
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          {topPicks.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold tracking-tight">
                {tf("season_picks_title", lang, { month: label })}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                    </div>
                    <div className="p-2.5">
                      <div className="line-clamp-2 text-xs font-bold leading-tight">{p.name}</div>
                      <div className="mt-1 text-[10px] muted">{NICHE_META[p.niche].emoji} {nicheName(p.niche, lang)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight">{t("faq_section", lang)}</h2>
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

          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight">{t("season_other_months_title", lang)}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {MONTH_SLUGS.slice(1).map((slug, i) => {
                const m = i + 1;
                const active = m === monthNum;
                return (
                  <Link
                    key={slug}
                    href={`/${lang}/thailand-in/${slug}/`}
                    className={`rounded-xl border p-2 text-center text-xs font-semibold transition ${
                      active
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "border-ink-100 bg-white hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900"
                    }`}
                  >
                    {monthName(m, lang)}
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="mt-10 flex items-center justify-between text-xs muted">
            <Link href={`/${lang}/thailand-in/${MONTH_SLUGS[prevMonth]}/`} className="hover:underline">
              ← {monthName(prevMonth, lang)}
            </Link>
            <Link href={`/${lang}/`} className="hover:underline">
              {SITE.name}
            </Link>
            <Link href={`/${lang}/thailand-in/${MONTH_SLUGS[nextMonth]}/`} className="hover:underline">
              {monthName(nextMonth, lang)} →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
