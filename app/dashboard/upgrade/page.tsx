import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, subscriptions } from "@/lib/db";
import { FREE_MONTHLY_INQUIRY_LIMIT } from "@/lib/quota";

export const dynamic = "force-dynamic";

const PRO_PRICE_USD = 19;
const PRO_PRICE_THB = 690;

export default async function UpgradePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/auth/signin?callbackUrl=/dashboard/upgrade");

  const subRows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const sub = subRows[0];
  const isPro =
    sub?.tier === "pro" && sub.activeUntil && new Date(sub.activeUntil) > new Date();

  const mailto = `mailto:hello@verifiedthai.com?subject=Upgrade%20to%20Pro&body=Hi%2C%20I'd%20like%20to%20upgrade%20my%20account%20(${encodeURIComponent(
    session?.user?.email ?? "",
  )})%20to%20Pro.%20Please%20send%20payment%20details.%20Thanks!`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ⚡ PRO PLAN
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          Unlimited inquiries.<br className="sm:hidden" /> Verified Thai badge.
        </h1>
        <p className="mt-3 text-sm muted">
          The free plan gets you tested. Pro gets you booked.
        </p>
      </div>

      {/* COMPARISON */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <div className="text-xs font-bold uppercase tracking-wide muted">Free</div>
          <div className="mt-1 text-3xl font-black">$0</div>
          <div className="mt-0.5 text-xs muted">forever</div>
          <ul className="mt-5 space-y-2 text-sm">
            <Row included>Profile with photos & services</Row>
            <Row included>Customer inquiry form</Row>
            <Row included>14-day view stats</Row>
            <Row included>{FREE_MONTHLY_INQUIRY_LIMIT} inquiries / month</Row>
            <Row>Verified Thai badge</Row>
            <Row>Priority listing rank</Row>
            <Row>Photo uploads beyond 3</Row>
            <Row>Multi-language replies</Row>
          </ul>
        </div>

        <div className="relative rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg dark:from-emerald-950/40 dark:to-ink-900">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
            Most popular
          </div>
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Pro</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-black">${PRO_PRICE_USD}</span>
            <span className="text-sm muted">/ month</span>
          </div>
          <div className="mt-0.5 text-xs muted">~฿{PRO_PRICE_THB.toLocaleString()} · cancel anytime</div>
          <ul className="mt-5 space-y-2 text-sm">
            <Row included>Everything in Free</Row>
            <Row included pro>
              <span className="font-bold">Unlimited inquiries</span>
            </Row>
            <Row included pro>
              <span className="font-bold">Verified Thai badge</span> on your listing
            </Row>
            <Row included pro>Priority listing rank in search</Row>
            <Row included pro>Unlimited photo uploads</Row>
            <Row included pro>Featured on category pages</Row>
            <Row included pro>Email + LINE support</Row>
          </ul>
          {isPro ? (
            <div className="mt-6 rounded-xl bg-emerald-100 px-4 py-3 text-center text-sm font-bold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              ✓ You're on Pro — thank you!
              {sub?.activeUntil && (
                <div className="mt-1 text-xs font-normal">
                  Renews {new Date(sub.activeUntil).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <>
              <a
                href={mailto}
                className="mt-6 block rounded-xl bg-emerald-600 px-5 py-3 text-center text-base font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                Upgrade to Pro →
              </a>
              <p className="mt-2 text-center text-[11px] muted">
                Email us — payment via PromptPay, Wise, or card. Activated within 24h.
              </p>
            </>
          )}
        </div>
      </div>

      {/* TRUST / PAYBACK math */}
      <div className="mt-8 rounded-2xl border border-ink-100 bg-emerald-50/40 p-5 text-sm dark:border-ink-800 dark:bg-emerald-950/10">
        <div className="text-xs font-bold uppercase tracking-wide muted">The math</div>
        <p className="mt-2 leading-relaxed">
          A typical muay-thai class booking is <strong>฿800–1,500</strong> per person. A spa or wellness booking is{" "}
          <strong>฿1,500–4,000</strong>. <strong>One Pro inquiry that converts pays back the entire month.</strong>{" "}
          The free tier blocks customers after the {FREE_MONTHLY_INQUIRY_LIMIT}th — every blocked inquiry is a customer{" "}
          who went to a competitor.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-xs muted hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}

function Row({
  children,
  included = false,
  pro = false,
}: {
  children: React.ReactNode;
  included?: boolean;
  pro?: boolean;
}) {
  return (
    <li className={`flex items-start gap-2 ${included ? "" : "opacity-40"}`}>
      <span
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black ${
          included
            ? pro
              ? "bg-emerald-500 text-white"
              : "bg-ink-300 text-white dark:bg-ink-600"
            : "border border-ink-300 dark:border-ink-600"
        }`}
      >
        {included ? "✓" : ""}
      </span>
      <span className={pro ? "text-emerald-900 dark:text-emerald-200" : ""}>{children}</span>
    </li>
  );
}
