import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadPlaces } from "@/lib/data";
import { SITE } from "@/lib/i18n";
import { FREE_MONTHLY_INQUIRY_LIMIT } from "@/lib/quota";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `For Business — Direct bookings, 0% commission | ${SITE.name}`,
  description:
    "Take direct bookings from international travelers — zero commission, zero booking platform markup. Korean/Japanese/Chinese inquiries auto-translated. Free dashboard, Pro at $19/mo.",
  alternates: { canonical: `${SITE.origin}/for-business/` },
  openGraph: {
    title: `For Business — Direct bookings, 0% commission | ${SITE.name}`,
    description:
      "Direct bookings · 6-language inquiries · view analytics · photo gallery. Free dashboard for Thai businesses.",
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
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              🏢 FOR BUSINESS OWNERS
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Take direct bookings.<br />
              <span className="text-emerald-600 dark:text-emerald-400">Keep 100% of revenue.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-ink-700 dark:text-ink-300">
              Klook takes 15–25%. Viator takes 20–30%. We take <strong>0%</strong>. Travelers find your business on Verified Thai, request a date directly, and pay you at the venue — no booking platform markup, no commission cut.
            </p>
            <p className="mt-3 max-w-lg text-sm muted">
              한국·일본·중국 여행객이 직접 예약 신청 → 영어로 자동 번역 → 당신이 24시간 내 확정. 클룩/비아터에 수수료 안 주고 풀가격으로 받습니다.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={signedIn ? "/dashboard" : "/auth/signin?callbackUrl=/dashboard"}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-md transition hover:bg-emerald-700"
              >
                {signedIn ? "Go to dashboard →" : "Get started — free →"}
              </Link>
              <a
                href="#dashboard-preview"
                className="rounded-xl border border-ink-300 bg-white px-6 py-3 text-sm font-bold transition hover:border-emerald-400 dark:border-ink-700 dark:bg-ink-900"
              >
                See the dashboard
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] muted">
              <li>✓ No card required</li>
              <li>✓ Free forever</li>
              <li>✓ Setup in 5 minutes</li>
              <li>✓ Cancel anytime</li>
            </ul>
          </div>

          {/* MINI MOCKUP */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200 to-amber-200 opacity-50 blur-2xl dark:from-emerald-900 dark:to-amber-900" />
            <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900">
              <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-3 py-2 dark:border-ink-800 dark:bg-ink-950">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 truncate text-[10px] muted">verifiedthai.com/dashboard</span>
              </div>
              <div className="space-y-3 p-4">
                <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-950/30">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    💎 Direct bookings · 0% commission
                  </div>
                  <div className="mt-1 text-3xl font-black tabular-nums">฿18,400</div>
                  <div className="text-[10px] muted">revenue this month · would&apos;ve paid ~฿3,680 in commission elsewhere</div>
                </div>
                <div className="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-950">
                  <div className="mb-2 flex items-center justify-between text-[10px]">
                    <span className="font-bold uppercase tracking-wide muted">📅 Pending bookings</span>
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      3 new
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span>Min-jun K. · Beginner class · Jun 8</span>
                      <span className="font-bold text-emerald-600">Confirm</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Yuki T. · Private lesson · Jun 10</span>
                      <span className="font-bold text-emerald-600">Confirm</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Anna W. · Drop-in · Jun 11</span>
                      <span className="font-bold text-emerald-600">Confirm</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-950">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide muted">Views · 14d</div>
                  <div className="flex h-10 items-end gap-0.5">
                    {[34, 56, 28, 71, 45, 88, 62, 79, 95, 67, 82, 91, 73, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-emerald-500 to-emerald-300 dark:from-emerald-600 dark:to-emerald-400"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY US — comparison table */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            WHY VERIFIED THAI
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Stop paying commission on every booking
          </h2>
          <p className="mt-2 text-sm muted">
            The math on a typical 6-person Muay Thai class (฿1,200/person = ฿7,200):
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <ComparisonCard
            name="Klook"
            commission="~20%"
            youGet={5760}
            full={7200}
            tone="rose"
          />
          <ComparisonCard
            name="Viator"
            commission="~25%"
            youGet={5400}
            full={7200}
            tone="amber"
          />
          <ComparisonCard
            name="Verified Thai"
            commission="0%"
            youGet={7200}
            full={7200}
            tone="emerald"
            highlight
          />
        </div>

        <div className="mt-6 rounded-2xl bg-emerald-50/60 p-5 text-center text-sm dark:bg-emerald-950/20">
          <p>
            On just <strong>10 direct bookings/month</strong>, you keep an extra
            <strong className="mx-1 text-emerald-700 dark:text-emerald-400">฿14,400–฿18,000</strong>
            that would&apos;ve gone to a booking platform. Pro is $19 (~฿690). The math is in your favor.
          </p>
        </div>
      </section>

      {/* DASHBOARD PREVIEW — full feature tour */}
      <section id="dashboard-preview" className="border-y border-ink-100 bg-ink-50 py-14 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 text-[11px] font-bold text-ink-800 dark:bg-ink-800 dark:text-ink-200">
              YOUR DASHBOARD
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Everything you need in one place
            </h2>
            <p className="mt-2 text-sm muted">
              여기서 볼 수 있는 것 — 직접 예약 / 문의함 / 트래픽 / 사진 / 가격 설정 모두 한곳에서.
            </p>
          </div>

          {/* Big mock screen showing the actual layout */}
          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-3 py-2 dark:border-ink-800 dark:bg-ink-950">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[10px] muted">verifiedthai.com/dashboard</span>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-3">
              <MockCard
                title="📅 Bookings"
                value="3 pending"
                detail="Confirm or decline directly in your inbox. Customer auto-emailed."
                accent="emerald"
              />
              <MockCard
                title="📩 Inquiries"
                value="23 this month"
                detail="Translated from KR/JA/ZH to English. Reply in your own language."
                accent="sky"
              />
              <MockCard
                title="📊 Views"
                value="1,247 / 14d"
                detail="Daily bar chart. Spot peak weeks to plan staff."
                accent="amber"
              />
              <MockCard
                title="🖼️ Photos"
                value="Upload your own"
                detail="Replace auto-scraped Google photos. Show your real space."
                accent="violet"
              />
              <MockCard
                title="🛡️ Verified badge"
                value="Pro only"
                detail="Visible trust signal + priority rank in category & search."
                accent="rose"
              />
              <MockCard
                title="✅ Setup checklist"
                value="4 / 5 complete"
                detail="Stripe-style progress bar walks you to a 100% profile."
                accent="ink"
              />
            </div>
          </div>
        </div>
      </section>

      {/* DIRECT BOOKING FLOW — explainer */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            💎 DIRECT BOOKING FLOW
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            How a direct booking happens
          </h2>
        </div>
        <ol className="mt-8 grid gap-6 sm:grid-cols-4">
          <Step n={1} title="Traveler finds you" body="Your listing appears in city/category guides + Korean blog posts." />
          <Step n={2} title='Clicks "Book directly"' body="Picks a date, time, service. Submits in their language." />
          <Step n={3} title="You confirm in dashboard" body="One-click confirm. Customer gets auto-email in English." />
          <Step n={4} title="Pay at venue" body="Customer arrives, pays you full retail price. No commission, no platform markup." />
        </ol>
        <div className="mt-8 rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-transparent p-5 text-sm dark:border-emerald-700 dark:from-emerald-950/30">
          <strong className="text-emerald-900 dark:text-emerald-200">Why customers prefer it:</strong>{" "}
          they pay 15-25% less than they would on Klook (since the venue keeps it as a "no platform fee" discount when asked), and they get a real human reply within 24 hours instead of a chatbot.
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="border-t border-ink-100 bg-ink-50 py-14 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Free tier covers the essentials
            </h2>
            <p className="mt-2 text-sm muted">All 9 features below — zero dollars, zero card on file.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              emoji="💎"
              title="Direct bookings"
              korean="직접 예약 · 수수료 0%"
              body="Customers request a date, you confirm or decline. No commission, no booking platform between you and the traveler."
            />
            <FeatureCard
              emoji="📩"
              title="Real-time inquiries"
              korean="실시간 문의함"
              body="Direct messages from travelers. Reply via WhatsApp, LINE, or email — you own the customer relationship."
            />
            <FeatureCard
              emoji="🌐"
              title="6-language inbox"
              korean="자동 6개 언어 번역"
              body="Korean / Japanese / Chinese / Thai / Arabic — all auto-translated to English. Reply in your own language."
            />
            <FeatureCard
              emoji="📊"
              title="14-day analytics"
              korean="14일 트래픽 분석"
              body="See exactly how many people viewed your listing each day. Plan staff and promos around peak weeks."
            />
            <FeatureCard
              emoji="🖼️"
              title="Owner photo gallery"
              korean="자체 사진 업로드"
              body="Replace auto-scraped Google photos with your own. Show your real space, staff, and food."
            />
            <FeatureCard
              emoji="📋"
              title="Profile editor"
              korean="프로필 직접 편집"
              body="Description, services, prices, hours, contact methods — all owner-controlled, not from outdated Google scrapes."
            />
            <FeatureCard
              emoji="🛡️"
              title="Verified Thai badge"
              korean="Verified Thai 뱃지"
              body="Pro listings get a visible verified badge + priority rank. Travelers trust the badge — not paid placement."
              pro
            />
            <FeatureCard
              emoji="🎯"
              title="Priority rank"
              korean="검색 우선 노출"
              body="Pro listings appear above free listings on category pages and city guides."
              pro
            />
            <FeatureCard
              emoji="🇰🇷"
              title="Korean blog backlinks"
              korean="한국어 블로그 노출"
              body="171 Korean travel guides on this site link directly to your listing. Naver / Daum / Google.co.kr SEO funnel."
            />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Simple pricing</h2>
          <p className="mt-2 text-sm muted">No setup fee. <strong>No commission.</strong> Just one optional monthly plan.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
            <div className="text-xs font-bold uppercase tracking-wide muted">Free</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-black">$0</span>
              <span className="text-sm muted">/ forever</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Direct bookings, 0% commission</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Full owner dashboard</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> {FREE_MONTHLY_INQUIRY_LIMIT} inquiries / month</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> 14-day view analytics</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Up to 3 owner photos</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Services & pricing menu</li>
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
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> <strong>Unlimited bookings + inquiries</strong></li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> <strong>Verified Thai badge</strong></li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Priority listing rank</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Unlimited photos</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Featured on category pages</li>
              <li className="flex gap-2"><span className="text-emerald-600">✓</span> Email + LINE support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-14">
        <h2 className="text-2xl font-black tracking-tight">FAQ</h2>
        <div className="mt-6 space-y-3">
          <Faq q="Do you really take 0% commission?" a="Yes. We make money from optional Pro subscriptions ($19/mo) and affiliate links to Klook for places that opt in. Direct bookings via our platform pay nothing — the customer pays you at the venue at your full retail price." />
          <Faq q="How do I prove I own the business?" a="When you claim a listing, we ask for an email matching your business domain or a photo/document showing your name on the business. Most claims approved within 24 hours." />
          <Faq q="What if my business isn't listed yet?" a={`Email hello@verifiedthai.com with your business name, city, and category. We add it free — we&apos;re actively expanding past ${placeCount.toLocaleString()} listings.`} />
          <Faq q="Can I get listings removed?" a="Yes. Email us with proof of ownership and we&apos;ll delist within 48 hours. We respect business owner control over their data." />
          <Faq q="Why should I use this instead of Google Business?" a="Use both — Verified Thai is an additional funnel, not a replacement. Most of our visitors are international travelers (Korean, Japanese, Chinese) actively planning a Thailand trip — high-intent traffic Google often doesn&apos;t send you." />
          <Faq q="What if a customer no-shows on a direct booking?" a="You're not on the hook for any platform fee. They just don't show up. Most owners ask for a small deposit (฿200-500) via PromptPay/LINE Pay when confirming the booking — we recommend it for high-demand slots." />
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-center text-white shadow-xl">
          <h2 className="text-2xl font-black sm:text-3xl">Start taking direct bookings today</h2>
          <p className="mt-2 text-sm text-emerald-50">Free forever. No card. 5-minute setup.</p>
          <Link
            href={signedIn ? "/dashboard" : "/auth/signin?callbackUrl=/dashboard"}
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-black text-emerald-700 shadow-lg transition hover:bg-emerald-50"
          >
            {signedIn ? "Go to dashboard →" : "Get started — free →"}
          </Link>
          <p className="mt-3 text-[11px] text-emerald-100">
            Already have an account? <Link href="/auth/signin?callbackUrl=/dashboard" className="font-bold underline">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function ComparisonCard({
  name,
  commission,
  youGet,
  full,
  tone,
  highlight = false,
}: {
  name: string;
  commission: string;
  youGet: number;
  full: number;
  tone: "rose" | "amber" | "emerald";
  highlight?: boolean;
}) {
  const colorMap = {
    rose: "border-rose-200 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/10",
    amber: "border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/10",
    emerald: "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30",
  };
  const accentMap = {
    rose: "text-rose-700 dark:text-rose-300",
    amber: "text-amber-700 dark:text-amber-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
  };
  return (
    <div
      className={`relative rounded-2xl border-2 p-5 ${colorMap[tone]} ${
        highlight ? "shadow-lg ring-2 ring-emerald-500/40" : ""
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-5 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
          ✓ You should pick this
        </span>
      )}
      <div className="text-xs font-bold uppercase tracking-wide muted">{name}</div>
      <div className={`mt-2 text-lg font-black ${accentMap[tone]}`}>
        Commission: {commission}
      </div>
      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="muted">Customer pays</span>
          <span className="font-mono">฿{full.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="muted">You receive</span>
          <span className={`font-black tabular-nums ${accentMap[tone]}`}>฿{youGet.toLocaleString()}</span>
        </div>
        {full > youGet && (
          <div className="flex justify-between border-t border-current/10 pt-1">
            <span className="muted">You lose</span>
            <span className="font-mono text-rose-600 dark:text-rose-400">
              −฿{(full - youGet).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MockCard({
  title,
  value,
  detail,
  accent,
}: {
  title: string;
  value: string;
  detail: string;
  accent: "emerald" | "sky" | "amber" | "violet" | "rose" | "ink";
}) {
  const accentBg = {
    emerald: "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30",
    sky: "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/30",
    amber: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30",
    violet: "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30",
    rose: "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/30",
    ink: "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-950",
  }[accent];
  return (
    <div className={`rounded-xl border ${accentBg} p-3`}>
      <div className="text-[10px] font-bold uppercase tracking-wide muted">{title}</div>
      <div className="mt-1 text-base font-black">{value}</div>
      <div className="mt-1 text-[10px] leading-relaxed text-ink-700 dark:text-ink-300">
        {detail}
      </div>
    </div>
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
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
        <span>{q}</span>
        <span className="text-ink-400 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-xs leading-relaxed text-ink-600 dark:text-ink-400">{a}</p>
    </details>
  );
}
