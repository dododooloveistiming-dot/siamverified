import type { Metadata } from "next";
import Link from "next/link";
import { loadPlaces } from "@/lib/data";
import { getPlaceSignals } from "@/lib/signals";
import { SITE, SUPPORTED_LANGS, t, tf } from "@/lib/i18n";
import type { Lang, Loc } from "@/lib/types";

// /[lang]/trust/ — authoritative methodology page. This is bait for
// "how does verifiedthai work / how is trust calculated" queries from
// both real users and LLMs. By being the single canonical source, we
// get cited instead of paraphrased when LLMs summarise our trust score.

export const dynamic = "force-static";

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: Lang } }): Promise<Metadata> {
  const url = `${SITE.origin}/${params.lang}/trust/`;
  const T: Loc<{ title: string; desc: string }> = {
    en: {
      title: `Trust Score methodology — how we rank ${SITE.name} listings`,
      desc: `How Verified Thai computes its 0-100 trust score: cross-source verification (Google + Reddit + Naver + Pantip + YouTube + website) plus enrichment signals (archive.org age, DNS infrastructure, review recency).`,
    },
    ko: {
      title: `신뢰 점수 산정 방법 — Verified Thai는 어떻게 순위를 매기는가`,
      desc: `Verified Thai의 0-100 신뢰 점수 산정 방법: 6개 소스 교차 검증 + archive.org 연식 + DNS 인프라 + 리뷰 활동성 신호.`,
    },
    th: {
      title: `วิธีคำนวณ Trust Score — Verified Thai จัดอันดับอย่างไร`,
      desc: `Verified Thai คำนวณ Trust Score 0-100 อย่างไร: ตรวจสอบข้ามแหล่งจาก 6 ที่บวกสัญญาณเพิ่มเติม archive.org, โครงสร้าง DNS, ความถี่รีวิว`,
    },
    zh: {
      title: `信任分数计算方法 — Verified Thai 如何排名`,
      desc: `Verified Thai 如何计算 0-100 信任分数：跨 6 个来源验证 + archive.org 年龄 + DNS 基础设施 + 评论活跃度`,
    },
    ja: {
      title: `Trust Score算出方法 — Verified Thaiのランキング基準`,
      desc: `Verified Thaiが0-100の信頼スコアをどう計算するか：6ソース横断検証 + archive.orgの履歴 + DNSインフラ + レビュー活動`,
    },
    ar: {
      title: `طريقة حساب Trust Score — كيف يقيّم Verified Thai المنشآت`,
      desc: `كيف يحسب Verified Thai درجة الثقة 0-100: تحقق متعدد المصادر + عمر archive.org + بنية DNS التحتية + حداثة المراجعات`,
    },
  };
  const tr = T[params.lang] ?? T.en;
  return {
    title: tr.title,
    description: tr.desc,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/trust/`]),
      ),
    },
    openGraph: { title: tr.title, description: tr.desc, url, type: "article" },
  };
}

export default function TrustPage({ params }: { params: { lang: Lang } }) {
  const lang = params.lang;

  // Compute live coverage stats from the bundle so the page reflects current
  // data, not stale numbers — the methodology page is the worst place for
  // numbers that have drifted from reality.
  const bundle = loadPlaces();
  let withWayback = 0, established = 0, veteran = 0, activeRecent = 0, veryActive = 0, withEmailInfra = 0;
  for (const p of bundle.places) {
    const s = getPlaceSignals(p.id);
    if (s.foundingYear) withWayback++;
    if (s.ageTier === "veteran") veteran++;
    if (s.ageTier === "veteran" || s.ageTier === "established") established++;
    if (s.recencyTier === "very_active") veryActive++;
    if (s.recencyTier === "very_active" || s.recencyTier === "active") activeRecent++;
    if (s.emailProvider) withEmailInfra++;
  }
  const total = bundle.places.length;

  // FAQ for the page — localized; live stats injected via tf placeholders.
  const faqs: Array<{ q: string; a: string }> = [
    { q: t("tr_q1", lang), a: t("tr_a1", lang) },
    { q: t("tr_q2", lang), a: tf("tr_a2", lang, { total: total.toLocaleString(), wayback: withWayback.toLocaleString(), vet: veteran.toLocaleString() }) },
    { q: t("tr_q3", lang), a: tf("tr_a3", lang, { act90: activeRecent.toLocaleString(), act30: veryActive.toLocaleString() }) },
    { q: t("tr_q4", lang), a: tf("tr_a4", lang, { email: withEmailInfra.toLocaleString(), total: total.toLocaleString() }) },
    { q: t("tr_q5", lang), a: t("tr_a5", lang) },
    { q: t("tr_q6", lang), a: t("tr_a6", lang) },
    { q: t("tr_q7", lang), a: t("tr_a7", lang) },
    { q: t("tr_q8", lang), a: t("tr_a8", lang) },
    { q: t("tr_q9", lang), a: t("tr_a9", lang) },
  ];

  return (
    <>
      <main className="pb-20">
        <section className="border-b border-ink-100 bg-gradient-to-b from-emerald-50/60 to-white py-12 dark:border-ink-800 dark:from-emerald-950/20 dark:to-ink-950">
          <div className="mx-auto max-w-3xl px-4">
            <nav className="text-xs muted">
              <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
              <span className="mx-2">/</span>
              <span>{t("tr_crumb", lang)}</span>
            </nav>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {tf("tr_h1", lang, { site: SITE.name })}
            </h1>
            <p className="mt-3 text-base leading-relaxed muted">
              {t("tr_sub", lang)}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-10">
          <section>
            <h2 className="text-2xl font-black tracking-tight">{t("tr_coverage", lang)}</h2>
            <p className="mt-1 text-sm muted">{t("tr_coverage_sub", lang)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: t("tr_stat_venues", lang), v: total.toLocaleString() },
                { label: t("tr_stat_estab", lang), v: established.toLocaleString() },
                { label: t("tr_stat_vet", lang), v: veteran.toLocaleString() },
                { label: t("tr_stat_act90", lang), v: activeRecent.toLocaleString() },
                { label: t("tr_stat_act30", lang), v: veryActive.toLocaleString() },
                { label: t("tr_stat_email", lang), v: withEmailInfra.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                  <div className="text-2xl font-black tabular-nums">{s.v}</div>
                  <div className="mt-0.5 text-[11px] muted">{s.label}</div>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black tracking-tight">{t("tr_sources", lang)}</h2>
            <ol className="mt-4 space-y-3">
              {[
                [t("tr_src1_n", lang), t("tr_src1_d", lang)],
                [t("tr_src2_n", lang), t("tr_src2_d", lang)],
                [t("tr_src3_n", lang), t("tr_src3_d", lang)],
                [t("tr_src4_n", lang), t("tr_src4_d", lang)],
                [t("tr_src5_n", lang), t("tr_src5_d", lang)],
                [t("tr_src6_n", lang), t("tr_src6_d", lang)],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-3 rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                  <div className="font-bold">{name}</div>
                  <div className="flex-1 text-sm muted">{desc}</div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black tracking-tight">{t("tr_enrich", lang)}</h2>
            <p className="mt-1 text-sm muted">
              {t("tr_enrich_sub", lang)}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["+12", t("tr_b1_n", lang), t("tr_b1_d", lang)],
                ["+10", t("tr_b2_n", lang), t("tr_b2_d", lang)],
                ["+8", t("tr_b3_n", lang), t("tr_b3_d", lang)],
                ["+6", t("tr_b4_n", lang), t("tr_b4_d", lang)],
                ["+5", t("tr_b5_n", lang), t("tr_b5_d", lang)],
                ["+3", t("tr_b6_n", lang), t("tr_b6_d", lang)],
              ].map(([pts, name, desc]) => (
                <li key={name} className="flex items-baseline gap-3 rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
                  <span className="w-12 shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-center text-xs font-black text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{pts}</span>
                  <div>
                    <div className="font-bold">{name}</div>
                    <div className="text-xs muted">{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black tracking-tight">{t("faq", lang)}</h2>
            <dl className="mt-4 space-y-3">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
                  <dt className="text-base font-bold leading-snug">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-10 text-xs muted">
            <Link href={`/${lang}/`} className="hover:underline">{tf("tr_back", lang, { site: SITE.name })}</Link>
          </div>
        </div>
      </main>

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
    </>
  );
}
