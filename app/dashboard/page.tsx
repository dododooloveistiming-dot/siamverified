import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc, and, inArray, sql, gte } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth";
import { db, listingClaims, inquiries, subscriptions, placeViews } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";
import { FREE_MONTHLY_INQUIRY_LIMIT } from "@/lib/quota";
import { isAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/auth/signin?callbackUrl=/dashboard");

  const claims = await db
    .select()
    .from(listingClaims)
    .where(eq(listingClaims.userId, userId))
    .orderBy(desc(listingClaims.claimedAt));

  // Aggregate stats across all approved listings
  const approvedPlaceIds = claims.filter((c) => c.status === "approved").map((c) => c.placeId);
  const inquiryByPlace = approvedPlaceIds.length > 0
    ? await db
        .select({
          placeId: inquiries.placeId,
          count: sql<number>`count(*)::int`,
        })
        .from(inquiries)
        .where(inArray(inquiries.placeId, approvedPlaceIds))
        .groupBy(inquiries.placeId)
    : [];
  const inquiryCountMap = new Map(inquiryByPlace.map((r) => [r.placeId, r.count]));
  const totalInquiries = Array.from(inquiryCountMap.values()).reduce((s, n) => s + n, 0);

  // Last-14-day page-view chart across all approved listings
  const viewSinceDay = new Date();
  viewSinceDay.setUTCDate(viewSinceDay.getUTCDate() - 13);
  const sinceISODay = viewSinceDay.toISOString().slice(0, 10);
  const viewRows = approvedPlaceIds.length > 0
    ? await db
        .select({ day: placeViews.day, count: sql<number>`sum(${placeViews.count})::int` })
        .from(placeViews)
        .where(
          and(
            inArray(placeViews.placeId, approvedPlaceIds),
            gte(placeViews.day, sinceISODay),
          ),
        )
        .groupBy(placeViews.day)
    : [];
  // Fill in zero-days so the bar chart has constant width
  const viewByDay = new Map(viewRows.map((r) => [r.day, r.count]));
  const chartDays: Array<{ day: string; count: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    chartDays.push({ day: dayKey, count: viewByDay.get(dayKey) ?? 0 });
  }
  const totalViews14d = chartDays.reduce((s, d) => s + d.count, 0);
  const maxView = Math.max(1, ...chartDays.map((d) => d.count));

  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  const sub = subRows[0];
  const d = new Date();
  const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const counts = ((sub?.monthlyInquiryCount ?? {}) as Record<string, number>) || {};
  const usedThisMonth = counts[monthKey] ?? 0;
  const tier: "free" | "pro" =
    sub?.tier === "pro" && sub.activeUntil && new Date(sub.activeUntil) > new Date() ? "pro" : "free";

  const isAdmin = await isAdminSession();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Business Dashboard</h1>
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Signed in as {session?.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border border-violet-500 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300"
            >
              🛡️ Admin
            </Link>
          )}
          <Link
            href="/dashboard/inquiries"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            📩 Inquiries
          </Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* STAT CARDS */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Listings claimed" value={claims.length} sub={`${approvedPlaceIds.length} approved`} />
        <Stat label="Views (14 days)" value={totalViews14d.toLocaleString()} />
        <Stat label="Inquiries (all-time)" value={totalInquiries} />
        <Stat
          label="Plan"
          value={tier === "pro" ? "Pro" : "Free"}
          sub={tier === "pro"
            ? "Unlimited inquiries"
            : `${usedThisMonth}/${FREE_MONTHLY_INQUIRY_LIMIT} this month`}
          tone={tier === "free" && usedThisMonth >= FREE_MONTHLY_INQUIRY_LIMIT ? "warn" : "default"}
        />
      </section>

      {/* VIEWS CHART — last 14 days */}
      {approvedPlaceIds.length > 0 && (
        <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-bold">Listing views — last 14 days</h2>
            <span className="text-xs muted">{totalViews14d.toLocaleString()} total</span>
          </div>
          <div className="flex h-24 items-end gap-1">
            {chartDays.map((d) => {
              const h = Math.max(2, Math.round((d.count / maxView) * 90));
              const isToday = d.day === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={d.day}
                  className="group relative flex-1"
                  title={`${d.day}: ${d.count} view${d.count === 1 ? "" : "s"}`}
                >
                  <div
                    className={`rounded-t ${isToday ? "bg-emerald-500" : "bg-emerald-300 dark:bg-emerald-700"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="invisible absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:visible dark:bg-ink-700">
                    {d.count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] muted">
            <span>{chartDays[0].day.slice(5)}</span>
            <span>{chartDays[chartDays.length - 1].day.slice(5)} (today)</span>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold">Your listing claims</h2>
        {claims.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
            <p className="text-sm font-medium">No claims yet.</p>
            <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">
              Find your business in the directory and click &quot;Claim this listing&quot;.
            </p>
            <Link
              href="/en/"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Browse directory →
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {claims.map((c) => {
              const place = getPlaceBySlug(c.placeId);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {place?.name ?? c.placeId}
                    </div>
                    <div className="text-xs text-ink-500">
                      Claimed {c.claimedAt.toLocaleDateString()}
                      {c.reviewedAt ? ` · Reviewed ${c.reviewedAt.toLocaleDateString()}` : ""}
                    </div>
                    {c.status === "approved" && (
                      <div className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        📩 {inquiryCountMap.get(c.placeId) ?? 0} inquiries total
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={c.status} />
                    {c.status === "approved" && (
                      <Link
                        href={`/dashboard/listings/${c.placeId}/edit`}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Edit →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "default" | "warn";
}) {
  const valueClass =
    tone === "warn"
      ? "text-amber-700 dark:text-amber-300"
      : "text-ink-900 dark:text-ink-50";
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="text-[10px] font-semibold uppercase tracking-wide muted">{label}</div>
      <div className={`mt-1 text-2xl font-black tabular-nums ${valueClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs muted">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        colors[status] ?? "bg-ink-100 text-ink-700"
      }`}
    >
      {status}
    </span>
  );
}
