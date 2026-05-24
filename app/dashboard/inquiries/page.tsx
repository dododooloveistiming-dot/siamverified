import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, inquiries, listingClaims, subscriptions } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";
import { FREE_MONTHLY_INQUIRY_LIMIT } from "@/lib/quota";

export const dynamic = "force-dynamic";

function monthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function InquiriesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/auth/signin?callbackUrl=/dashboard/inquiries");

  // Listings this user has an approved claim on.
  const approvedClaims = await db
    .select({ placeId: listingClaims.placeId })
    .from(listingClaims)
    .where(
      and(eq(listingClaims.userId, userId), eq(listingClaims.status, "approved")),
    );
  const placeIds = approvedClaims.map((c) => c.placeId);

  // Subscription & usage.
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  const sub = subRows[0];
  const counts = ((sub?.monthlyInquiryCount ?? {}) as Record<string, number>) || {};
  const used = counts[monthKey()] ?? 0;
  const tier: "free" | "pro" =
    sub?.tier === "pro" && sub.activeUntil && new Date(sub.activeUntil) > new Date()
      ? "pro"
      : "free";
  const limit = tier === "pro" ? Infinity : FREE_MONTHLY_INQUIRY_LIMIT;

  const list = placeIds.length === 0
    ? []
    : await db
        .select()
        .from(inquiries)
        .where(inArray(inquiries.placeId, placeIds))
        .orderBy(desc(inquiries.createdAt))
        .limit(100);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-xs text-ink-500">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link> › Inquiries
      </nav>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Inquiries</h1>
        <UsagePill used={used} limit={limit} tier={tier} />
      </div>

      {tier === "free" && used >= FREE_MONTHLY_INQUIRY_LIMIT && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/20">
          <div className="font-bold text-amber-900 dark:text-amber-200">
            Free tier limit reached for {monthKey()}
          </div>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            New inquiries will be blocked until next month or upgrade to Pro for unlimited.
          </p>
          <Link
            href="/dashboard/upgrade"
            className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
          >
            Upgrade to Pro →
          </Link>
        </div>
      )}

      {placeIds.length === 0 ? (
        <EmptyClaims />
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <p className="text-sm font-medium">No inquiries yet.</p>
          <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">
            Customers can send inquiries from your listing page. We&apos;ll email you and show them here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {list.map((q) => {
            const place = getPlaceBySlug(q.placeId);
            return (
              <li
                key={q.id}
                className="rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-ink-500">
                      {place?.name ?? q.placeId} · {q.createdAt.toLocaleDateString()}
                    </div>
                    <div className="mt-1 text-sm font-bold">{q.customerName}</div>
                    <div className="mt-0.5 text-xs">
                      <a
                        href={`mailto:${q.customerEmail}?subject=${encodeURIComponent("Re: Verified Thai inquiry")}`}
                        className="text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        {q.customerEmail}
                      </a>
                      {q.customerPhone && <span className="ml-2 text-ink-500">· {q.customerPhone}</span>}
                    </div>
                    {(q.preferredDate || q.partySize) && (
                      <div className="mt-1 text-[11px] text-ink-500">
                        {q.preferredDate && <span>📅 {q.preferredDate} </span>}
                        {q.partySize && <span>👥 {q.partySize}</span>}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={q.status} />
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-800">
                  {q.message}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function UsagePill({
  used,
  limit,
  tier,
}: {
  used: number;
  limit: number;
  tier: "free" | "pro";
}) {
  if (tier === "pro") {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
        ⭐ Pro · Unlimited
      </span>
    );
  }
  const over = used >= limit;
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        over
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300"
      }`}
    >
      {used} / {limit} this month
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-emerald-100 text-emerald-800",
    responded: "bg-sky-100 text-sky-800",
    closed: "bg-ink-100 text-ink-600",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        colors[status] ?? "bg-ink-100 text-ink-700"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyClaims() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
      <p className="text-sm font-medium">No approved listings yet.</p>
      <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">
        Inquiries route to listings you&apos;ve claimed. Claim a listing first.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
      >
        → Dashboard
      </Link>
    </div>
  );
}
