import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlacesByNiche } from "@/lib/data";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang, Niche, Place } from "@/lib/types";
import { NICHE_META, nicheName } from "@/lib/types";
import PlacePlaceholder from "@/components/PlacePlaceholder";

// Filter-specific niche sub-pages. Path-based (not query params) so each
// gets its own static HTML — query-param filters can't be SEO assets on
// `force-static` pages because every URL serves the same HTML.
//
// Filters intentionally use enrichment signals (wayback age, review recency)
// that no competing directory has. Generic filters like Korean-friendly stay
// as in-page query params — they're not unique SEO ground for us.

export const dynamic = "force-static";

const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

type FilterSlug = "established" | "active";

type FilterDef = {
  slug: FilterSlug;
  predicate: (p: Place) => boolean;
  h1: Record<Lang, (niche: string) => string>;
  metaTitle: Record<Lang, (niche: string) => string>;
  metaDesc: Record<Lang, (niche: string) => string>;
  intro: Record<Lang, string>;
  emptyBack: Record<Lang, string>;
};

const FILTERS: Record<FilterSlug, FilterDef> = {
  established: {
    slug: "established",
    predicate: (p) => p.is_established === true,
    h1: {
      en: (n) => `Established ${n} (5+ years online)`,
      ko: (n) => `5년+ 운영 ${n}`,
      th: (n) => `${n} ที่ดำเนินกิจการมา 5 ปีขึ้นไป`,
      zh: (n) => `经营 5 年以上的${n}`,
      ja: (n) => `5年以上の老舗${n}`,
      ar: (n) => `${n} قائم منذ 5 سنوات أو أكثر`,
    },
    metaTitle: {
      en: (n) => `Established ${n} in Thailand — 5+ years operating | Verified Thai`,
      ko: (n) => `5년+ 운영 ${n} (태국) | Verified Thai`,
      th: (n) => `${n} ที่ดำเนินกิจการมานานกว่า 5 ปี ในไทย | Verified Thai`,
      zh: (n) => `泰国营业 5 年以上的${n} | Verified Thai`,
      ja: (n) => `5年以上の老舗${n}（タイ） | Verified Thai`,
      ar: (n) => `${n} في تايلاند قائم منذ أكثر من 5 سنوات | Verified Thai`,
    },
    metaDesc: {
      en: (n) =>
        `Long-standing ${n} venues in Thailand verified via archive.org footprint going back at least 5 years. Cross-checked Google + Reddit + Naver + Pantip.`,
      ko: (n) =>
        `archive.org 기록 5년+ 검증된 태국 ${n}. 구글·Reddit·네이버·Pantip 교차 검증.`,
      th: (n) => `${n} ในไทยที่ดำเนินกิจการมาแล้วอย่างน้อย 5 ปี ตรวจสอบจาก archive.org`,
      zh: (n) => `泰国营业 5 年以上的${n}，由 archive.org 印记佐证`,
      ja: (n) => `archive.org の記録で5年以上の運営が確認できるタイの${n}`,
      ar: (n) => `${n} في تايلاند موثّق وجوده على archive.org منذ 5 سنوات أو أكثر`,
    },
    intro: {
      en:
        "These venues have an archive.org footprint going back 5+ years — they were online long before most travel directories cared. Old-domain age is one of the few signals you can't fake.",
      ko:
        "archive.org에 5년+ 전부터 기록되어 있는 가게들. 대부분의 여행 디렉토리가 다루기 시작하기 전부터 운영 중이었다는 신호 — 위조하기 가장 어려운 신호 중 하나.",
      th:
        "สถานที่เหล่านี้มีร่องรอยบน archive.org ย้อนหลังไปอย่างน้อย 5 ปี ดำเนินกิจการมานานก่อนที่ไดเรกทอรีท่องเที่ยวส่วนใหญ่จะรู้จัก",
      zh:
        "这些场所在 archive.org 上有至少 5 年的记录 — 它们在大多数旅游目录关注之前就已上线，这是少数无法伪造的信号之一",
      ja:
        "archive.orgに5年以上前から記録が残っている店舗。多くの旅行ディレクトリが取り上げる前から運営されていた証拠です。",
      ar:
        "هذه الأماكن لها أثر على archive.org يعود لـ 5 سنوات على الأقل، إشارة قوية يصعب تزويرها.",
    },
    emptyBack: {
      en: "No established venues match this filter yet — see all", ko: "조건에 맞는 곳 없음 — 전체 보기",
      th: "ยังไม่มีรายการที่ตรงเงื่อนไข — ดูทั้งหมด", zh: "暂无符合条件的场所 — 查看全部",
      ja: "条件に合う店舗なし — すべて見る", ar: "لا توجد نتائج بعد — عرض الكل",
    },
  },
  active: {
    slug: "active",
    predicate: (p) => p.is_active_recently === true,
    h1: {
      en: (n) => `Currently active ${n} (recent reviews)`,
      ko: (n) => `최근 활발한 ${n}`,
      th: (n) => `${n} ที่เปิดให้บริการล่าสุด (มีรีวิวภายใน 90 วัน)`,
      zh: (n) => `近期活跃的${n}（90 天内有评价）`,
      ja: (n) => `直近で営業中の${n}（90日以内にレビューあり）`,
      ar: (n) => `${n} نشط مؤخراً (مراجعات خلال 90 يوماً)`,
    },
    metaTitle: {
      en: (n) => `Currently active ${n} in Thailand — recent reviews | Verified Thai`,
      ko: (n) => `최근 활발한 태국 ${n} | Verified Thai`,
      th: (n) => `${n} ที่ยังเปิดให้บริการในไทย — รีวิวล่าสุด | Verified Thai`,
      zh: (n) => `泰国近期活跃${n} — 最新评价 | Verified Thai`,
      ja: (n) => `現在営業中のタイの${n} — 最新レビュー | Verified Thai`,
      ar: (n) => `${n} نشط الآن في تايلاند — مراجعات حديثة | Verified Thai`,
    },
    metaDesc: {
      en: (n) =>
        `${n} venues in Thailand with at least one Google review in the last 90 days — proof they're operating, not just listed. Trust-score sorted.`,
      ko: (n) =>
        `최근 90일 내 구글 리뷰가 1건 이상 있는 태국 ${n} — 단순 리스팅이 아닌 실제 운영 중 검증. 신뢰점수 정렬.`,
      th: (n) => `${n} ในไทยที่มีรีวิว Google ภายใน 90 วันที่ผ่านมา ยืนยันว่ายังเปิดให้บริการจริง`,
      zh: (n) => `90 天内有 Google 评论的泰国${n}，证明在营业，不只是挂着名字`,
      ja: (n) => `直近90日以内にGoogleレビューがあるタイの${n}。実際に営業している証拠です。`,
      ar: (n) => `${n} في تايلاند مع مراجعات Google خلال 90 يوماً — دليل التشغيل الفعلي`,
    },
    intro: {
      en:
        "These venues had at least one Google review in the last 90 days. Most directories never check — they keep listing places that closed years ago. We filter them out.",
      ko:
        "최근 90일 내 구글 리뷰가 1건 이상 있는 가게들. 대부분 디렉토리는 확인 안 함 — 몇 년 전 닫은 가게도 그대로 노출. 우리는 걸러냄.",
      th:
        "สถานที่เหล่านี้มีรีวิว Google อย่างน้อย 1 รายการในช่วง 90 วันที่ผ่านมา ไดเรกทอรีส่วนใหญ่ไม่ตรวจสอบและยังคงแสดงร้านที่ปิดไปแล้ว",
      zh:
        "这些场所在过去 90 天内至少有一条 Google 评论。大多数目录从不检查，仍在列出多年前已关闭的店铺",
      ja:
        "直近90日以内にGoogleレビューが1件以上ある店舗。多くのディレクトリは閉店した店も載せたままです。",
      ar:
        "هذه الأماكن لها مراجعة Google واحدة على الأقل خلال 90 يوماً، بينما تستمر معظم الأدلة في إدراج أماكن مغلقة.",
    },
    emptyBack: {
      en: "No active venues match this filter yet — see all", ko: "조건에 맞는 곳 없음 — 전체 보기",
      th: "ยังไม่มีรายการที่ตรงเงื่อนไข — ดูทั้งหมด", zh: "暂无符合条件的场所 — 查看全部",
      ja: "条件に合う店舗なし — すべて見る", ar: "لا توجد نتائج بعد — عرض الكل",
    },
  },
};

const FILTER_SLUGS = Object.keys(FILTERS) as FilterSlug[];

export function generateStaticParams() {
  const params: Array<{ lang: Lang; niche: Niche; filter: FilterSlug }> = [];
  for (const lang of SUPPORTED_LANGS) {
    for (const niche of NICHES) {
      for (const filter of FILTER_SLUGS) {
        params.push({ lang, niche, filter });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Lang; niche: Niche; filter: FilterSlug };
}): Promise<Metadata> {
  const { lang, niche, filter } = params;
  const def = FILTERS[filter];
  if (!def || !NICHES.includes(niche)) return {};
  const nName = nicheName(niche, lang);
  const url = `${SITE.origin}/${lang}/c/${niche}/${filter}/`;
  return {
    title: def.metaTitle[lang](nName),
    description: def.metaDesc[lang](nName),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/c/${niche}/${filter}/`]),
      ),
    },
    openGraph: {
      title: def.metaTitle[lang](nName),
      description: def.metaDesc[lang](nName),
      url,
    },
  };
}

export default function FilteredNichePage({
  params,
}: {
  params: { lang: Lang; niche: Niche; filter: FilterSlug };
}) {
  const { lang, niche, filter } = params;
  const def = FILTERS[filter];
  if (!def || !NICHES.includes(niche)) notFound();

  const all = getPlacesByNiche(niche);
  const places = all
    .filter(def.predicate)
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 60);

  const meta = NICHE_META[niche];
  const nName = nicheName(niche, lang);

  return (
    <main className="pb-20">
      <section className="border-b border-ink-100 bg-gradient-to-b from-emerald-50/60 to-white py-10 dark:border-ink-800 dark:from-emerald-950/20 dark:to-ink-950">
        <div className="mx-auto max-w-5xl px-4">
          <nav className="text-xs muted">
            <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${lang}/c/${niche}/`} className="hover:underline">{nName}</Link>
            <span className="mx-2">/</span>
            <span>{filter === "established" ? "Established 5y+" : "Active recently"}</span>
          </nav>
          <div className="mt-4 text-3xl">{meta.emoji}</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {def.h1[lang](nName)}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed muted">{def.intro[lang]}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            {places.length} / {all.length} matched
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {places.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
            <p className="text-base font-bold">{def.emptyBack[lang]}</p>
            <Link href={`/${lang}/c/${niche}/`} className="mt-3 inline-block text-emerald-700 hover:underline dark:text-emerald-400">
              → {nName}
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {places.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/${lang}/place/${p.slug}/`}
                  className="group block overflow-hidden rounded-xl border border-ink-100 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="relative aspect-square overflow-hidden bg-ink-50 dark:bg-ink-800">
                    {p.top_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.top_photo_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <PlacePlaceholder niche={p.niche} size="md" />
                    )}
                    <div className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                      {p.trust_score}
                    </div>
                    {filter === "established" && p.founding_year && (
                      <div className="absolute left-1.5 top-1.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                        🏛 {p.founding_year}
                      </div>
                    )}
                    {filter === "active" && p.is_very_active && (
                      <div className="absolute left-1.5 top-1.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
                        🟢 30d
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="line-clamp-2 text-xs font-bold leading-tight">{p.name}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] muted">
                      <span className="truncate">{p.city}</span>
                      {p.rating != null && (
                        <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">
                          ★ {p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-6 text-sm dark:border-ink-800">
          <Link href={`/${lang}/c/${niche}/`} className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">
            ← All {nName}
          </Link>
          {filter === "established" ? (
            <Link href={`/${lang}/c/${niche}/active/`} className="text-emerald-700 hover:underline dark:text-emerald-400">
              See currently active {nName} →
            </Link>
          ) : (
            <Link href={`/${lang}/c/${niche}/established/`} className="text-emerald-700 hover:underline dark:text-emerald-400">
              See established {nName} (5y+) →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
