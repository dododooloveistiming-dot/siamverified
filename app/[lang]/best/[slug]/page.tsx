import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlaces, getPlacesByNiche } from "@/lib/data";
import { CITIES, getCityBySlug, placesInCity } from "@/lib/cities";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import PlacePlaceholder from "@/components/PlacePlaceholder";
import PlaceFAQ, { type FAQItem } from "@/components/PlaceFAQ";

// /best/{city}-{niche}-established — handcrafted SEO landing for the exact
// long-tail query: "established/oldest/most-trusted {niche} in {city}".
// Distinct from /c/{niche}/established/ (Thailand-wide). Path-based so each
// gets unique title/H1/meta and shows up as its own search result.

export const dynamic = "force-static";

const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

// Decide which (city, niche) combos ship by checking match counts.
// Keeps thin-content pages out of the sitemap. ≥5 = enough to be a real list.
const MIN_PLACES = 5;

function parseSlug(slug: string): { citySlug: string; niche: Niche } | null {
  if (!slug.endsWith("-established")) return null;
  const core = slug.slice(0, -"-established".length);
  for (const niche of NICHES) {
    const suffix = `-${niche}`;
    if (core.endsWith(suffix)) {
      const citySlug = core.slice(0, -suffix.length);
      if (CITIES.find((c) => c.slug === citySlug)) {
        return { citySlug, niche };
      }
    }
  }
  return null;
}

function viableCombos(): Array<{ citySlug: string; niche: Niche; count: number }> {
  const bundle = loadPlaces();
  const out: Array<{ citySlug: string; niche: Niche; count: number }> = [];
  for (const city of CITIES) {
    for (const niche of NICHES) {
      const nichePlaces = getPlacesByNiche(niche);
      const list = placesInCity(nichePlaces, city).filter((p) => p.is_established);
      if (list.length >= MIN_PLACES) {
        out.push({ citySlug: city.slug, niche, count: list.length });
      }
    }
  }
  return out;
}

export function generateStaticParams() {
  const combos = viableCombos();
  const params: Array<{ lang: Lang; slug: string }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const c of combos) {
      params.push({ lang, slug: `${c.citySlug}-${c.niche}-established` });
    }
  }
  return params;
}

function h1(city: string, niche: string, lang: Lang): string {
  const T: Record<Lang, string> = {
    en: `Most established ${niche} in ${city} (5+ years operating)`,
    ko: `${city}에서 5년+ 운영된 ${niche}`,
    th: `${niche} ใน${city} ที่ดำเนินกิจการมายาวนานที่สุด (5+ ปี)`,
    zh: `${city}经营 5 年以上的${niche}`,
    ja: `${city}で5年以上営業する老舗${niche}`,
    ar: `الأكثر رسوخاً من ${niche} في ${city} (5+ سنوات)`,
  };
  return T[lang];
}

function intro(city: string, niche: string, lang: Lang, count: number): string {
  const T: Record<Lang, string> = {
    en: `${count} ${niche} venues in ${city} have a documented archive.org footprint going back at least 5 years. We surface them here because long-tenure is one of the few trust signals that can't be manufactured overnight — and most travel directories don't check.`,
    ko: `${city}의 ${niche} ${count}곳이 archive.org에 5년+ 전부터 기록되어 있음. 오래된 운영 기록은 위조 불가능한 신뢰 신호 중 하나 — 대부분의 여행 디렉토리는 확인하지 않음.`,
    th: `${niche} ${count} แห่งใน${city}มีร่องรอยบน archive.org ย้อนหลังอย่างน้อย 5 ปี ระยะเวลาดำเนินกิจการที่ยาวนานเป็นสัญญาณความน่าเชื่อถือที่ปลอมแปลงได้ยาก`,
    zh: `${city}有 ${count} 家${niche}场所在 archive.org 上有至少 5 年的记录。长期经营是少数无法伪造的信任信号之一`,
    ja: `${city}の${niche}${count}店舗がarchive.orgに5年以上前から記録されています。長期間の運営履歴は偽造が困難な信頼性の証です。`,
    ar: `${count} من أماكن ${niche} في ${city} لها أثر على archive.org يعود لـ 5 سنوات على الأقل. طول مدة التشغيل من أصعب الإشارات تزويفاً.`,
  };
  return T[lang];
}

function buildFAQs(city: string, niche: string, oldestYear: number | null, lang: Lang): FAQItem[] {
  const faqs: FAQItem[] = [];
  faqs.push({
    q: `What makes a ${niche} venue in ${city} "established"?`,
    a: `We define established as having an archive.org snapshot going back at least 5 years. That means a real website was live and being crawled long before today's traveler directories listed the place. It's one of the few signals that can't be backfilled — pop-ups and short-lived ventures won't appear in old archives.`,
  });
  if (oldestYear) {
    faqs.push({
      q: `What's the oldest ${niche} venue in ${city} on this list?`,
      a: `The venue with the earliest archive.org capture on this list goes back to ${oldestYear} — over ${new Date().getFullYear() - oldestYear} years of online presence. See the trust badges on each card for individual years.`,
    });
  }
  faqs.push({
    q: `How is this different from a regular "best of ${city}" list?`,
    a: `Most "best of" lists pull from a single source (Google reviews, paid promotions, or one editor's opinion). We require evidence: a 5+ year archive.org footprint AND cross-source verification across Google, Reddit, Naver, Pantip, YouTube, and the venue's own website. No paid placement — order is based on our trust score.`,
  });
  faqs.push({
    q: `Are these venues still operating today?`,
    a: `The list filters for established (5+ year history) — for current activity, see our companion list: ${city} ${niche} with reviews in the last 90 days. Some old venues may have reduced activity; combine both signals for the strongest picks.`,
  });
  return faqs;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; slug: string };
}): Promise<Metadata> {
  const parsed = parseSlug(params.slug);
  if (!parsed) return {};
  const city = getCityBySlug(parsed.citySlug);
  if (!city) return {};
  const nName = nicheName(parsed.niche, params.lang);
  const url = `${SITE.origin}/${params.lang}/best/${params.slug}/`;
  const title = `${h1(city.label, nName, params.lang)} | ${SITE.name}`;
  const desc: Record<Lang, string> = {
    en: `Long-running ${nName} venues in ${city.label}, verified via archive.org footprint. Cross-checked across Google · Reddit · Naver · Pantip · YouTube. No paid placement.`,
    ko: `${city.label}의 오래된 ${nName} — archive.org 기록으로 검증. 구글·Reddit·네이버·Pantip·유튜브 교차 검증.`,
    th: `${nName} ใน${city.label}ที่ดำเนินกิจการมายาวนาน ตรวจสอบจาก archive.org และข้ามแหล่งกับ Google, Reddit, Naver, Pantip, YouTube`,
    zh: `${city.label}经营悠久的${nName}，由 archive.org 印记佐证，跨 Google · Reddit · Naver · Pantip · YouTube 多源验证`,
    ja: `${city.label}で長く営業している${nName}。archive.orgの記録で検証し、Google · Reddit · Naver · Pantip · YouTubeで横断確認。`,
    ar: `${nName} في ${city.label} موثّق على archive.org ومتحقق منه عبر Google و Reddit و Naver و Pantip و YouTube`,
  };
  return {
    title,
    description: desc[params.lang],
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/best/${params.slug}/`]),
      ),
    },
    openGraph: { title, description: desc[params.lang], url, type: "article" },
  };
}

export default function BestPage({ params }: { params: { lang: Lang; slug: string } }) {
  const parsed = parseSlug(params.slug);
  if (!parsed) notFound();
  const city = getCityBySlug(parsed.citySlug);
  if (!city) notFound();

  const lang = params.lang;
  const niche = parsed.niche;
  const nName = nicheName(niche, lang);
  const meta = NICHE_META[niche];

  const nichePlaces = getPlacesByNiche(niche);
  const places = placesInCity(nichePlaces, city)
    .filter((p) => p.is_established)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 30);

  const oldestYear = places
    .map((p) => p.founding_year)
    .filter((y): y is number => typeof y === "number")
    .reduce<number | null>((acc, y) => (acc === null || y < acc ? y : acc), null);

  const faqs = buildFAQs(city.label, nName, oldestYear, lang);
  const url = `${SITE.origin}/${lang}/best/${params.slug}/`;

  // JSON-LD: ItemList (helps Google understand this is a ranked list)
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1(city.label, nName, lang),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: places.length,
    itemListElement: places.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE.origin}/${lang}/place/${p.slug}/`,
      name: p.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <main className="pb-20">
        <section className="border-b border-ink-100 bg-gradient-to-b from-amber-50/60 to-white py-10 dark:border-ink-800 dark:from-amber-950/20 dark:to-ink-950">
          <div className="mx-auto max-w-5xl px-4">
            <nav className="text-xs muted">
              <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
              <span className="mx-2">/</span>
              <Link href={`/${lang}/city/${city.slug}/`} className="hover:underline">{city.label}</Link>
              <span className="mx-2">/</span>
              <Link href={`/${lang}/c/${niche}/`} className="hover:underline">{nName}</Link>
              <span className="mx-2">/</span>
              <span>Established</span>
            </nav>
            <div className="mt-4 flex items-center gap-2 text-3xl">
              <span>{city.emoji}</span>
              <span>{meta.emoji}</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {h1(city.label, nName, lang)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed muted">
              {intro(city.label, nName, lang, places.length)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                🏛 {places.length} established
              </span>
              {oldestYear && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 font-semibold dark:bg-ink-800">
                  Earliest: {oldestYear}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✓ No paid placement
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/${lang}/place/${p.slug}/`}
                  className="group flex h-full gap-3 overflow-hidden rounded-xl border border-ink-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-800">
                    {p.top_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.top_photo_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <PlacePlaceholder niche={p.niche} size="sm" />
                    )}
                    <div className="absolute right-1 top-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                      {p.trust_score}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      #{i + 1}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight">{p.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {p.founding_year && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                          🏛 {p.founding_year}
                        </span>
                      )}
                      {p.is_very_active && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          🟢 Active 30d
                        </span>
                      )}
                      {p.rating != null && (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          ★ {p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>

          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">Frequently asked questions</h2>
            <PlaceFAQ items={faqs} />
          </section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-6 text-sm dark:border-ink-800">
            <Link href={`/${lang}/c/${niche}/`} className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
              ← All {nName}
            </Link>
            <Link href={`/${lang}/city/${city.slug}/`} className="text-emerald-700 hover:underline dark:text-emerald-400">
              More in {city.label} →
            </Link>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </main>
    </>
  );
}
