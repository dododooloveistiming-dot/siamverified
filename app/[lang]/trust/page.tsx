import type { Metadata } from "next";
import Link from "next/link";
import { loadPlaces } from "@/lib/data";
import { getPlaceSignals } from "@/lib/signals";
import { SITE, SUPPORTED_LANGS } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

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
  const T: Record<Lang, { title: string; desc: string }> = {
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
  return {
    title: T[params.lang].title,
    description: T[params.lang].desc,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${SITE.origin}/${l}/trust/`]),
      ),
    },
    openGraph: { title: T[params.lang].title, description: T[params.lang].desc, url, type: "article" },
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

  // FAQ for the page — these are the exact queries we want to own.
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `How is the Verified Thai trust score calculated?`,
      a: `Each venue's 0-100 score combines two layers. Base layer: counts of unique mentions across 6 public sources (Google reviews, Reddit threads, Naver blogs, Pantip discussions, YouTube videos, the venue's own website). Each source contributes points up to a cap so no single platform can dominate. Boost layer: enrichment signals — archive.org age, DNS email infrastructure, recent Google review activity, owned YouTube channel — add up to 25 extra points, capped at 100.`,
    },
    {
      q: `Why use archive.org age as a trust signal?`,
      a: `A 10-year archive.org footprint requires having had a real, indexable website 10 years ago. That can't be backfilled by buying reviews or running an ad campaign. Pop-up venues, gap businesses, and short-lived ventures don't appear in old snapshots. Of ${total.toLocaleString()} listings, ${withWayback.toLocaleString()} have a documented capture date; ${veteran.toLocaleString()} go back 10+ years.`,
    },
    {
      q: `What does "active in last 90 days" actually mean?`,
      a: `It means we found at least one Google review for the venue dated within the last 90 days, using the timestamp Google attaches to each review. ${activeRecent.toLocaleString()} venues qualify; ${veryActive.toLocaleString()} had a review in the last 30 days. Most directories never check — they keep listing places that closed years ago, which is a bigger trust killer than people realize.`,
    },
    {
      q: `Why does email infrastructure (Google Workspace, M365) matter?`,
      a: `Looking at MX DNS records reveals what email host the business actually uses. A small spa running contact@theirdomain.com through Google Workspace or Microsoft 365 has demonstrably invested in a real business setup — it's a tiny but non-zero "this is a real operation" signal. ${withEmailInfra.toLocaleString()} of ${total.toLocaleString()} venues run on professional infrastructure.`,
    },
    {
      q: `Does Verified Thai accept paid placement or sponsored rankings?`,
      a: `No. Listings are ranked purely by trust score. Klook is shown on some venue pages as an affiliate booking option (with commission disclosed), and an "Editor's Pick" featured slot exists on niche pages but is also selected by trust score, not payment. No venue can pay us to outrank another venue.`,
    },
    {
      q: `How does Verified Thai differ from Google Maps, Klook, or Tripadvisor?`,
      a: `Google Maps shows ratings without de-duping fake reviews or checking whether a place still operates. Klook lists places that paid to be on Klook (with ~20-25% commission). Tripadvisor mixes user reviews with sponsored content. We don't take placement money, we cross-check across 6 sources before listing, and we surface "established 5y+" and "active 90d" filters so dead listings don't waste your time. The trade-off: smaller dataset, harder verification floor.`,
    },
    {
      q: `What signals can a venue NOT manipulate?`,
      a: `Archive.org snapshots from years ago (can't retroactively make a site exist in 2014). Cross-source consistency (Reddit users don't get paid to mention a spa). DNS MX records on a domain registered in 2011 (no shortcut to a decade of email-host continuity). What CAN be manipulated: review counts, ratings, recency to some extent. That's why our score blends manipulable + non-manipulable signals.`,
    },
    {
      q: `Can a venue claim or fix their listing?`,
      a: `Yes — owners can claim a listing for free and edit hours, photos, services, and Korean/English/Thai language notes. The trust score is computed from external signals; claiming doesn't change ranking. Direct inquiries through a claimed listing go to the venue at 0% commission.`,
    },
    {
      q: `How often does the trust score update?`,
      a: `Source signals (reviews, mentions) refresh weekly. Wayback age refreshes monthly. DNS infrastructure refreshes quarterly. Owner-edited content propagates within 10 minutes (ISR). If a venue closes, the next scrape catches the silence in Google reviews and the "active 90d" badge falls off — but you should also be able to report it to us via the contact form.`,
    },
  ];

  return (
    <>
      <main className="pb-20">
        <section className="border-b border-ink-100 bg-gradient-to-b from-emerald-50/60 to-white py-12 dark:border-ink-800 dark:from-emerald-950/20 dark:to-ink-950">
          <div className="mx-auto max-w-3xl px-4">
            <nav className="text-xs muted">
              <Link href={`/${lang}/`} className="hover:underline">{SITE.name}</Link>
              <span className="mx-2">/</span>
              <span>Trust methodology</span>
            </nav>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              How the {SITE.name} trust score works
            </h1>
            <p className="mt-3 text-base leading-relaxed muted">
              We cross-check every venue across six public sources, then layer enrichment signals
              that you can't fake — archive.org age, DNS infrastructure, real-time review activity —
              to produce a single 0-100 score. No paid placement. Full methodology below.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-10">
          <section>
            <h2 className="text-2xl font-black tracking-tight">Coverage right now</h2>
            <p className="mt-1 text-sm muted">Live numbers from our latest build.</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Verified venues", v: total.toLocaleString() },
                { label: "Established (5y+ wayback)", v: established.toLocaleString() },
                { label: "Veteran (10y+ wayback)", v: veteran.toLocaleString() },
                { label: "Active in last 90 days", v: activeRecent.toLocaleString() },
                { label: "Active in last 30 days", v: veryActive.toLocaleString() },
                { label: "Pro email infrastructure", v: withEmailInfra.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                  <div className="text-2xl font-black tabular-nums">{s.v}</div>
                  <div className="mt-0.5 text-[11px] muted">{s.label}</div>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black tracking-tight">The six base sources</h2>
            <ol className="mt-4 space-y-3">
              {[
                ["Google Maps reviews", "Review count, average rating, photo count. Most signal density but the easiest to inflate, so capped per-venue."],
                ["Reddit threads", "Mentions across r/Thailand, r/ThailandTourism, and niche subs like r/MuayThai. Hard to fake without obvious manipulation."],
                ["Naver Blog posts", "Korean blogger reviews — high signal for KR-friendly venues. We surface specific posts on the venue page."],
                ["Pantip discussions", "Thai-language forum mentions. Local opinion, harder for non-Thai businesses to manipulate."],
                ["YouTube videos", "Reviews, vlogs, and gym/spa walkthroughs. Bonus weight if the venue runs an owned channel (proven via /about page metadata)."],
                ["The venue's own website", "We require a working homepage. Sites must respond, be indexable, and not be a parked domain — checked at scrape time."],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-3 rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                  <div className="font-bold">{name}</div>
                  <div className="flex-1 text-sm muted">{desc}</div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black tracking-tight">Enrichment signals (boost layer)</h2>
            <p className="mt-1 text-sm muted">
              Up to +25 added to the base score for signals that resist manipulation.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["+12", "Veteran (10y+)", "archive.org first capture ≥10 years ago — venue had a real website a decade back"],
                ["+10", "Active 30d", "≥1 Google review in the last 30 days — venue is clearly still trading"],
                ["+6", "Established (5y+)", "archive.org first capture ≥5 years ago"],
                ["+5", "Pro email infra", "DNS MX records pointing to Google Workspace / Microsoft 365 / Zoho / Proton / Fastmail"],
                ["+3", "YouTube channel ≥5k subs", "Venue runs an owned, audience-validated channel (verified via /about page)"],
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
            <h2 className="text-2xl font-black tracking-tight">Frequently asked</h2>
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
            <Link href={`/${lang}/`} className="hover:underline">← Back to {SITE.name}</Link>
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
