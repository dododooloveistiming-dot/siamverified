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
import PlaceMap from "@/components/PlaceMap";

// /best/{city}-{niche}-{kind}/ — handcrafted SEO landings targeting exact
// long-tail queries like "established Muay Thai gym Bangkok" or "active
// dive shops Phuket". Distinct from the Thailand-wide /c/{niche}/{filter}/
// pages — these scope by city for sharper match.

export const dynamic = "force-static";

const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

type Kind = "established" | "active";
const KINDS: Kind[] = ["established", "active"];

const MIN_PLACES = 5;

function predicate(kind: Kind): (p: Place) => boolean {
  return kind === "established"
    ? (p) => p.is_established === true
    : (p) => p.is_active_recently === true;
}

function parseSlug(slug: string): { citySlug: string; niche: Niche; kind: Kind } | null {
  for (const kind of KINDS) {
    const suffix = `-${kind}`;
    if (!slug.endsWith(suffix)) continue;
    const core = slug.slice(0, -suffix.length);
    for (const niche of NICHES) {
      const nicheSuffix = `-${niche}`;
      if (core.endsWith(nicheSuffix)) {
        const citySlug = core.slice(0, -nicheSuffix.length);
        if (CITIES.find((c) => c.slug === citySlug)) {
          return { citySlug, niche, kind };
        }
      }
    }
  }
  return null;
}

function viableCombos(): Array<{ citySlug: string; niche: Niche; kind: Kind; count: number }> {
  loadPlaces();
  const out: Array<{ citySlug: string; niche: Niche; kind: Kind; count: number }> = [];
  for (const city of CITIES) {
    for (const niche of NICHES) {
      const nichePlaces = getPlacesByNiche(niche);
      for (const kind of KINDS) {
        const list = placesInCity(nichePlaces, city).filter(predicate(kind));
        if (list.length >= MIN_PLACES) {
          out.push({ citySlug: city.slug, niche, kind, count: list.length });
        }
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
      params.push({ lang, slug: `${c.citySlug}-${c.niche}-${c.kind}` });
    }
  }
  return params;
}

type Content = {
  h1: (city: string, niche: string) => string;
  intro: (city: string, niche: string, count: number) => string;
  desc: (city: string, niche: string) => string;
  crumbLabel: string;
  heroBgLight: string;   // tailwind class fragment
  heroBgDark: string;
};

// Per-(kind, lang) content. Keeps the JSX small.
const CONTENT: Record<Kind, Record<Lang, Content>> = {
  established: {
    en: {
      h1: (c, n) => `Most established ${n} in ${c} (5+ years operating)`,
      intro: (c, n, k) => `${k} ${n} venues in ${c} have a documented archive.org footprint going back at least 5 years. We surface them here because long-tenure is one of the few trust signals that can't be manufactured overnight — and most travel directories don't check.`,
      desc: (c, n) => `Long-running ${n} venues in ${c}, verified via archive.org footprint. Cross-checked across Google · Reddit · Naver · Pantip · YouTube. No paid placement.`,
      crumbLabel: "Established",
      heroBgLight: "from-amber-50/60",
      heroBgDark: "dark:from-amber-950/20",
    },
    ko: {
      h1: (c, n) => `${c}에서 5년+ 운영된 ${n}`,
      intro: (c, n, k) => `${c}의 ${n} ${k}곳이 archive.org에 5년+ 전부터 기록되어 있음. 오래된 운영 기록은 위조 불가능한 신뢰 신호 중 하나 — 대부분의 여행 디렉토리는 확인하지 않음.`,
      desc: (c, n) => `${c}의 오래된 ${n} — archive.org 기록으로 검증. 구글·Reddit·네이버·Pantip·유튜브 교차 검증.`,
      crumbLabel: "5년+ 운영",
      heroBgLight: "from-amber-50/60",
      heroBgDark: "dark:from-amber-950/20",
    },
    th: {
      h1: (c, n) => `${n} ใน${c} ที่ดำเนินกิจการมายาวนานที่สุด (5+ ปี)`,
      intro: (c, n, k) => `${n} ${k} แห่งใน${c}มีร่องรอยบน archive.org ย้อนหลังอย่างน้อย 5 ปี ระยะเวลาดำเนินกิจการที่ยาวนานเป็นสัญญาณความน่าเชื่อถือที่ปลอมแปลงได้ยาก`,
      desc: (c, n) => `${n} ใน${c}ที่ดำเนินกิจการมายาวนาน ตรวจสอบจาก archive.org`,
      crumbLabel: "ดำเนินกิจการ 5+ ปี",
      heroBgLight: "from-amber-50/60",
      heroBgDark: "dark:from-amber-950/20",
    },
    zh: {
      h1: (c, n) => `${c}经营 5 年以上的${n}`,
      intro: (c, n, k) => `${c}有 ${k} 家${n}场所在 archive.org 上有至少 5 年的记录。长期经营是少数无法伪造的信任信号之一`,
      desc: (c, n) => `${c}经营悠久的${n}，由 archive.org 印记佐证`,
      crumbLabel: "经营 5 年以上",
      heroBgLight: "from-amber-50/60",
      heroBgDark: "dark:from-amber-950/20",
    },
    ja: {
      h1: (c, n) => `${c}で5年以上営業する老舗${n}`,
      intro: (c, n, k) => `${c}の${n}${k}店舗がarchive.orgに5年以上前から記録されています。長期間の運営履歴は偽造が困難な信頼性の証です。`,
      desc: (c, n) => `${c}で長く営業している${n}。archive.orgの記録で検証。`,
      crumbLabel: "5年以上の老舗",
      heroBgLight: "from-amber-50/60",
      heroBgDark: "dark:from-amber-950/20",
    },
    ar: {
      h1: (c, n) => `الأكثر رسوخاً من ${n} في ${c} (5+ سنوات)`,
      intro: (c, n, k) => `${k} من أماكن ${n} في ${c} لها أثر على archive.org يعود لـ 5 سنوات على الأقل.`,
      desc: (c, n) => `${n} في ${c} موثّق على archive.org ومتحقق منه عبر مصادر متعددة`,
      crumbLabel: "5+ سنوات",
      heroBgLight: "from-amber-50/60",
      heroBgDark: "dark:from-amber-950/20",
    },
  },
  active: {
    en: {
      h1: (c, n) => `Currently active ${n} in ${c} (recent reviews)`,
      intro: (c, n, k) => `${k} ${n} venues in ${c} had at least one Google review in the last 90 days — proof they're actively serving customers, not just sitting on a directory. Most travel sites don't check, so they list places that closed years ago. We filter them out.`,
      desc: (c, n) => `${n} in ${c} with Google reviews in the last 90 days — verified actively operating, not just listed.`,
      crumbLabel: "Active",
      heroBgLight: "from-emerald-50/60",
      heroBgDark: "dark:from-emerald-950/20",
    },
    ko: {
      h1: (c, n) => `${c}에서 현재 활발한 ${n}`,
      intro: (c, n, k) => `${c}의 ${n} ${k}곳이 최근 90일 내 구글 리뷰 1건 이상 있음 — 단순 리스팅이 아닌 실제 운영 검증. 대부분 디렉토리는 확인 안 함 → 몇 년 전 닫은 가게도 그대로 노출. 우리는 걸러냄.`,
      desc: (c, n) => `${c}의 ${n} — 최근 90일 내 구글 리뷰 검증, 실제 운영 중.`,
      crumbLabel: "최근 활발",
      heroBgLight: "from-emerald-50/60",
      heroBgDark: "dark:from-emerald-950/20",
    },
    th: {
      h1: (c, n) => `${n} ใน${c}ที่ยังเปิดให้บริการอยู่`,
      intro: (c, n, k) => `${n} ${k} แห่งใน${c}มีรีวิว Google อย่างน้อย 1 รายการในช่วง 90 วันที่ผ่านมา ยืนยันว่ายังเปิดให้บริการจริง`,
      desc: (c, n) => `${n} ใน${c}ที่มีรีวิวล่าสุดใน 90 วัน`,
      crumbLabel: "เปิดให้บริการล่าสุด",
      heroBgLight: "from-emerald-50/60",
      heroBgDark: "dark:from-emerald-950/20",
    },
    zh: {
      h1: (c, n) => `${c}近期活跃的${n}（90 天内有评价）`,
      intro: (c, n, k) => `${c}有 ${k} 家${n}场所在过去 90 天内至少有一条 Google 评论 — 证明仍在营业。多数旅游目录从不检查`,
      desc: (c, n) => `${c}的${n}，过去 90 天内有 Google 评价 — 已验证仍在营业`,
      crumbLabel: "近期活跃",
      heroBgLight: "from-emerald-50/60",
      heroBgDark: "dark:from-emerald-950/20",
    },
    ja: {
      h1: (c, n) => `${c}で現在営業中の${n}（直近レビューあり）`,
      intro: (c, n, k) => `${c}の${n}${k}店舗が直近90日以内にGoogleレビューがあります。多くのディレクトリは閉店した店も載せたままです。`,
      desc: (c, n) => `${c}の${n}。直近90日のレビューで実際の営業を確認済み。`,
      crumbLabel: "直近で営業中",
      heroBgLight: "from-emerald-50/60",
      heroBgDark: "dark:from-emerald-950/20",
    },
    ar: {
      h1: (c, n) => `${n} نشط حالياً في ${c} (مراجعات حديثة)`,
      intro: (c, n, k) => `${k} من أماكن ${n} في ${c} لها مراجعات Google خلال 90 يوماً — دليل التشغيل الفعلي.`,
      desc: (c, n) => `${n} في ${c} مع مراجعات Google خلال 90 يوماً — مفعّل بالفعل`,
      crumbLabel: "نشط",
      heroBgLight: "from-emerald-50/60",
      heroBgDark: "dark:from-emerald-950/20",
    },
  },
};

function buildFAQs(city: string, niche: string, kind: Kind, extra: { oldestYear: number | null; veryActiveCount: number; total: number }): FAQItem[] {
  const out: FAQItem[] = [];
  if (kind === "established") {
    out.push({
      q: `What makes a ${niche} venue in ${city} "established"?`,
      a: `We define established as having an archive.org snapshot going back at least 5 years. That means a real website was live and being crawled long before today's traveler directories listed the place. It's one of the few signals that can't be backfilled — pop-ups and short-lived ventures won't appear in old archives.`,
    });
    if (extra.oldestYear) {
      out.push({
        q: `What's the oldest ${niche} venue in ${city} on this list?`,
        a: `The venue with the earliest archive.org capture goes back to ${extra.oldestYear} — over ${new Date().getFullYear() - extra.oldestYear} years of online presence. See the badges on each card for individual years.`,
      });
    }
    out.push({
      q: `Are these venues still operating today?`,
      a: `This list filters for established (5+ year history). For current activity, see our companion list: ${city} ${niche} active in the last 90 days. Combine both signals for the strongest picks.`,
    });
  } else {
    out.push({
      q: `What counts as "active" on this list?`,
      a: `At least one Google review in the last 90 days. It sounds basic, but most travel directories never check — they keep listing venues that closed years ago. Active = real customers walked in and left a review recently.`,
    });
    if (extra.veryActiveCount > 0) {
      out.push({
        q: `How many had reviews in the last 30 days?`,
        a: `${extra.veryActiveCount} of the ${extra.total} venues on this list had at least one Google review in the last 30 days — the strongest "still trading right now" signal we can detect from public data.`,
      });
    }
    out.push({
      q: `Are these venues established or new?`,
      a: `This list filters for recent activity only. For long-tenure venues (5+ year archive.org history), see our companion list: established ${niche} in ${city}. Many appear on both — those are the strongest combined picks.`,
    });
  }
  out.push({
    q: `How is this different from a regular "best of ${city}" list?`,
    a: `Most "best of" lists pull from a single source (Google reviews, paid promotions, one editor's opinion). We require evidence: a verifiable signal AND cross-source verification across Google, Reddit, Naver, Pantip, YouTube, and the venue's own website. No paid placement — order is based on our trust score.`,
  });
  return out;
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
  const content = CONTENT[parsed.kind][params.lang];
  const url = `${SITE.origin}/${params.lang}/best/${params.slug}/`;
  const title = `${content.h1(city.label, nName)} | ${SITE.name}`;
  return {
    title,
    description: content.desc(city.label, nName),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/best/${params.slug}/`]),
      ),
    },
    openGraph: { title, description: content.desc(city.label, nName), url, type: "article" },
  };
}

export default function BestPage({ params }: { params: { lang: Lang; slug: string } }) {
  const parsed = parseSlug(params.slug);
  if (!parsed) notFound();
  const city = getCityBySlug(parsed.citySlug);
  if (!city) notFound();

  const lang = params.lang;
  const { niche, kind } = parsed;
  const nName = nicheName(niche, lang);
  const meta = NICHE_META[niche];
  const content = CONTENT[kind][lang];

  const nichePlaces = getPlacesByNiche(niche);
  const places = placesInCity(nichePlaces, city)
    .filter(predicate(kind))
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 30);

  const oldestYear = places
    .map((p) => p.founding_year)
    .filter((y): y is number => typeof y === "number")
    .reduce<number | null>((acc, y) => (acc === null || y < acc ? y : acc), null);
  const veryActiveCount = places.filter((p) => p.is_very_active).length;

  const faqs = buildFAQs(city.label, nName, kind, { oldestYear, veryActiveCount, total: places.length });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: content.h1(city.label, nName),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: places.length,
    itemListElement: places.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE.origin}/${lang}/place/${p.slug}/`,
      name: p.name,
    })),
  };

  const companionKind: Kind = kind === "established" ? "active" : "established";
  const companionSlug = `${city.slug}-${niche}-${companionKind}`;
  const companionLabel = companionKind === "established"
    ? `See established ${nName} (5y+) →`
    : `See currently active ${nName} →`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <main className="pb-20">
        <section className={`border-b border-ink-100 bg-gradient-to-b ${content.heroBgLight} to-white py-10 dark:border-ink-800 ${content.heroBgDark} dark:to-ink-950`}>
          <div className="mx-auto max-w-5xl px-4">
            <nav className="text-xs muted">
              <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
              <span className="mx-2">/</span>
              <Link href={`/${lang}/city/${city.slug}/`} className="hover:underline">{city.label}</Link>
              <span className="mx-2">/</span>
              <Link href={`/${lang}/c/${niche}/`} className="hover:underline">{nName}</Link>
              <span className="mx-2">/</span>
              <span>{content.crumbLabel}</span>
            </nav>
            <div className="mt-4 flex items-center gap-2 text-3xl">
              <span>{city.emoji}</span>
              <span>{meta.emoji}</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {content.h1(city.label, nName)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed muted">
              {content.intro(city.label, nName, places.length)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {kind === "established" ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    🏛 {places.length} established
                  </span>
                  {oldestYear && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 font-semibold dark:bg-ink-800">
                      Earliest: {oldestYear}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    🟢 {places.length} active 90d
                  </span>
                  {veryActiveCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 font-semibold dark:bg-ink-800">
                      {veryActiveCount} active in last 30d
                    </span>
                  )}
                </>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                ✓ No paid placement
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4">
          {(() => {
            const mapped = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
            if (mapped.length < 3) return null;
            return (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide muted">
                  Map view · {mapped.length} mapped
                </h2>
                <PlaceMap places={mapped} lang={lang} height={400} />
              </section>
            );
          })()}

          <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/${lang}/place/${p.slug}/`}
                  className="group flex h-full gap-3 overflow-hidden rounded-xl border border-ink-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
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
                          🟢 30d
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
            <Link href={`/${lang}/best/${companionSlug}/`} className="text-emerald-700 hover:underline dark:text-emerald-400">
              {companionLabel}
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
