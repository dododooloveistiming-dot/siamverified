import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadPlaces } from "@/lib/data";
import { SITE } from "@/lib/i18n";
import { FREE_MONTHLY_INQUIRY_LIMIT } from "@/lib/quota";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `For Business — Claim your listing | ${SITE.name}`,
  description:
    "Free dashboard for Thai business owners: real-time inquiries, 14-day view analytics, photo gallery, Verified Thai badge. No commission, no card upfront.",
  alternates: { canonical: `${SITE.origin}/for-business/` },
  openGraph: {
    title: `For Business — Claim your listing | ${SITE.name}`,
    description:
      "Real-time inquiries, view analytics, photo gallery — free dashboard for Thai businesses. Pro tier $19/mo when you outgrow it.",
    url: `${SITE.origin}/for-business/`,
    type: "website",
  },
};

export default async function ForBusinessLanding() {
  const session = await auth();
  const signedIn = !!(session?.user as { id?: string } | undefined)?.id;

  const bundle = loadPlaces();
  const placeCount = bundle.places.length;

  return (
    <main className="pb-20">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:border-ink-800 dark:from-emerald-950/30 dark:via-ink-950 dark:to-amber-950/20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              🏢 FOR BUSINESS OWNERS
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Get customers in 6 languages.<br />
              <span className="text-emerald-600 dark:text-emerald-400">Zero commission.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-ink-700 dark:text-ink-300">
              Your business is already listed on Verified Thai — alongside {placeCount.toLocaleString()} others. Claim it free to unlock the owner dashboard: inquiries, analytics, photos, and direct contact with travelers.
            </p>
            <p className="mt-3 max-w-lg text-sm muted">
              방콕·치앙마이·푸켓 등 7개 도시 한국·일본·중국 여행객이 한국어/일본어로 문의 → 영어로 자동 번역돼서 받습니다. 광고비 없음, 수수료 0%.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={signedIn ? "/dashboard" : "/auth/signin?callbackUrl=/dashboard"}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-md transition hover:bg-emerald-700"
              >
                {signedIn ? "Go to dashboard →" : "Get started — free →"}
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-ink-300 bg-white px-6 py-3 text-sm font-bold transition hover:border-emerald-400 dark:border-ink-700 dark:bg-ink-900"
              >
                See what you get
              </a>
            </div>

            {/* Trust microcopy */}
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] muted">
              <li>✓ No card required</li>
              <li>✓ Free tier forever</li>
              <li>✓ Setup in 5 minutes</li>
              <li>✓ Cancel anytime</li>
            </ul>
          </div>

          {/* DASHBOARD MOCKUP */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200 to-amber-200 opacity-50 blur-2xl dark:from-emerald-900 dark:to-amber-900" />
            <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-3 py-2 dark:border-ink-800 dark:bg-ink-950">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 truncate text-[10px] muted">verifiedthai.com/dashboard</span>
              </div>
              <div className="space-y-3 p-4">
                {/* Hero metric */}
                <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-950/30">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    📩 Inquiries this month
                  </div>
                  <div className="mt-1 text-3xl font-black tabular-nums">23</div>
                  <div className="text-[10px] muted">+8 vs last month</div>
                </div>

                {/* Bar chart mockup */}
                <div className="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-950">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wide muted">Views · 14d</div>
                    <div className="text-[10px] font-mono muted">1,247</div>
                  </div>
                  <div className="flex h-12 items-end gap-0.5">
                    {[34, 56, 28, 71, 45, 88, 62, 79, 95, 67, 82, 91, 73, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-emerald-500 to-emerald-300 dark:from-emerald-600 dark:to-emerald-400"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Inquiry preview */}
                <div className="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-950">
                  <div className="mb-2 flex items-center justify-between text-[10px]">
                    <span className="font-bold muted uppercase tracking-wide">Latest inquiry</span>
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      🇰🇷 KO → EN
                    </span>
                  </div>
                  <div className="text-xs font-semibold">Min-jun K. · ฿1,200/group</div>
                  <p className="mt-1 text-[11px] text-ink-600 line-clamp-2 dark:text-ink-400">
                    Hi — we&apos;re 4 travelers from Seoul arriving June 8. Can we book a beginner muay-thai class with English instruction?
                  </p>
                </div>

                {/* Setup checklist */}
                <div className="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-950">
                  <div className="mb-1.5 flex items-center justify-between text-[10px]">
                    <span className="font-bold muted uppercase tracking-wide">Setup</span>
                    <span className="font-mono font-bold text-emerald-600">4 / 5</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                    <div className="h-full w-4/5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 text-[11px] font-bold text-ink-800 dark:bg-ink-800 dark:text-ink-200">
            WHAT YOU GET
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Everything to turn views into bookings
          </h2>
          <p className="mt-2 text-sm muted">
            Free tier covers the essentials. Upgrade only when you outgrow it.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            emoji="📩"
            title="Real-time inquiries"
            korean="실시간 문의함"
            body="Direct messages from travelers land in your dashboard inbox. Reply by WhatsApp, LINE, or email — you own the relationship, no commission cut."
          />
          <FeatureCard
            emoji="🌐"
            title="6-language inbox"
            korean="자동 6개 언어 번역"
            body="A Korean traveler writes in Korean, you receive a clean English translation. Same for Japanese, Chinese, Thai, Arabic. Your business reaches everyone."
          />
          <FeatureCard
            emoji="📊"
            title="14-day view analytics"
            korean="14일 트래픽 분석"
            body="See exactly how many people viewed your listing each day. Spot which weeks bring traffic so you can plan staff, classes, or promotions accordingly."
          />
          <FeatureCard
            emoji="🖼️"
            title="Owner photo gallery"
            korean="자체 사진 업로드"
            body="Upload your own photos to replace the auto-scraped Google ones. Show your real space, your real staff, your real food — control your brand."
          />
          <FeatureCard
            emoji="📋"
            title="Edit your profile"
            korean="프로필 직접 편집"
            body="Description, services & pricing, opening hours, WhatsApp / LINE contact. Everything visible to travelers comes from you, not from outdated Google scrapes."
          />
          <FeatureCard
            emoji="🛡️"
            title="Verified Thai badge"
            korean="Verified Thai 뱃지"
            body="Pro listings get a visible verified badge + priority rank in category & search. Travelers trust the badge — it&apos;s independent, not paid placement."
            pro
          />
          <FeatureCard
            emoji="🎯"
            title="Priority listing rank"
            korean="검색 우선 노출"
            body="Pro listings appear above free listings on category pages and city guides. More views → more inquiries → more bookings."
            pro
          />
          <FeatureCard
            emoji="✅"
            title="Setup checklist"
            korean="셋업 체크리스트"
            body="A Stripe-style progress bar walks you through the 5 steps to a complete listing — photos, description, services, hours, contact. Track completion at a glance."
          />
          <FeatureCard
            emoji="🇰🇷"
            title="Korean blog backlinks"
            korean="한국어 블로그 노출"
            body="171 Korean travel guides on this site link directly to your listing. Naver / Daum / Google.co.kr SEO funnel that no other Thai directory has."
          />
        </div>
      </section>

      {/* PRICING TEASE */}
      <section className="border-y border-ink-100 bg-ink-50 py-14 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Simple pricing</h2>
            <p className="mt-2 text-sm muted">No setup fee. No commission. Just one optional monthly plan.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
              <div className="text-xs font-bold uppercase tracking-wide muted">Free</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-black">$0</span>
                <span className="text-sm muted">/ forever</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Full owner dashboard</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> {FREE_MONTHLY_INQUIRY_LIMIT} inquiries / month</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> 14-day view analytics</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Up to 3 photos</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Profile edit & services</li>
              </ul>
            </div>
            <div className="relative rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg dark:from-emerald-950/30 dark:to-ink-900">
              <div className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                Recommended
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Pro</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-black">$19</span>
                <span className="text-sm muted">/ month · ~฿690</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> <strong>Unlimited inquiries</strong></li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> <strong>Verified Thai badge</strong></li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Priority listing rank</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Unlimited photos</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Featured on category pages</li>
              </ul>
            </div>
          </div>

          {/* Payback math */}
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center text-sm dark:border-emerald-800 dark:bg-emerald-950/20">
            One inquiry that converts to a ฿800–4,000 booking pays back the whole Pro month. <strong>The math is in your favor.</strong>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">How it works</h2>
        </div>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          <Step n={1} title="Find your listing" body="Search for your business name on Verified Thai. It&apos;s probably already there." />
          <Step n={2} title="Claim it" body='Click "Claim this listing" and verify ownership with a quick email — 1 minute.' />
          <Step n={3} title="Get inquiries" body="Customers contact you directly via the listing. Replies happen on your channels (WhatsApp / LINE / email)." />
        </ol>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-14">
        <h2 className="text-2xl font-black tracking-tight">FAQ</h2>
        <div className="mt-6 space-y-3">
          <Faq q="Do you take commission?" a="No. Zero commission on bookings. You pay $0 (free tier) or a flat $19/mo (Pro). Travelers contact you directly — we never touch payments." />
          <Faq q="How do I prove I own the business?" a="When you claim, we ask for an email that matches your business domain, or a photo/document showing your name on the business. Most claims are approved within 24 hours." />
          <Faq q="What if my business isn't listed yet?" a={`Email hello@verifiedthai.com with your business name, city, and category. We add it free — we&apos;re actively expanding past ${placeCount.toLocaleString()} listings.`} />
          <Faq q="Can I get listings removed?" a="Yes. Email us with proof of ownership and we&apos;ll delist within 48 hours. We respect business owner control over their data." />
          <Faq q="Why should I use this over Google Business Profile?" a="You should use both — Verified Thai isn't a replacement, it&apos;s an additional traffic funnel. Most of our visitors are international travelers (Korean, Japanese, Chinese) actively planning a Thailand trip — that&apos;s high-intent traffic Google often doesn&apos;t send you." />
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-center text-white shadow-xl">
          <h2 className="text-2xl font-black sm:text-3xl">Ready to claim your listing?</h2>
          <p className="mt-2 text-sm text-emerald-50">Free forever. No card. 5-minute setup.</p>
          <Link
            href={signedIn ? "/dashboard" : "/auth/signin?callbackUrl=/dashboard"}
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-black text-emerald-700 shadow-lg transition hover:bg-emerald-50"
          >
            {signedIn ? "Go to dashboard →" : "Get started — free →"}
          </Link>
          <p className="mt-3 text-[11px] text-emerald-100">
            Already have an account? <Link href="/auth/signin?callbackUrl=/dashboard" className="underline font-bold">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  emoji,
  title,
  korean,
  body,
  pro = false,
}: {
  emoji: string;
  title: string;
  korean: string;
  body: string;
  pro?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-ink-800 dark:bg-ink-900 dark:hover:border-emerald-700">
      <div className="flex items-start justify-between">
        <div className="text-2xl">{emoji}</div>
        {pro && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Pro
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-black">{title}</h3>
      <div className="mt-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{korean}</div>
      <p className="mt-2 text-xs leading-relaxed text-ink-600 dark:text-ink-400">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="relative rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
      <div className="absolute -top-3 left-5 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-xs font-black text-white shadow-md">
        {n}
      </div>
      <h3 className="mt-2 text-sm font-black">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-600 dark:text-ink-400">{body}</p>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-bold list-none">
        <span>{q}</span>
        <span className="text-ink-400 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-xs leading-relaxed text-ink-600 dark:text-ink-400">{a}</p>
    </details>
  );
}
