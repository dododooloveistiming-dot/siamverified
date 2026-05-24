import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, sql, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db, listingClaims, listingEdits, inquiries, users } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { session, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/auth/signin?callbackUrl=/admin");

  const [pendingClaims] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listingClaims)
    .where(eq(listingClaims.status, "pending"));
  const [pendingEdits] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listingEdits)
    .where(eq(listingEdits.status, "pending"));
  const [totalUsers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const [totalInquiries] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inquiries);

  const recentClaims = await db
    .select()
    .from(listingClaims)
    .orderBy(desc(listingClaims.claimedAt))
    .limit(5);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Admin</h1>
          <p className="text-sm text-ink-600 dark:text-ink-400">
            {session?.user?.email}
          </p>
        </div>
        <Link href="/dashboard" className="text-xs muted hover:underline">
          ← Back to business dashboard
        </Link>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pending claims" value={pendingClaims?.count ?? 0} tone={(pendingClaims?.count ?? 0) > 0 ? "warn" : "default"} href="/admin/claims" />
        <Stat label="Pending edits" value={pendingEdits?.count ?? 0} tone={(pendingEdits?.count ?? 0) > 0 ? "warn" : "default"} href="/admin/edits" />
        <Stat label="Total users" value={totalUsers?.count ?? 0} />
        <Stat label="Total inquiries" value={totalInquiries?.count ?? 0} />
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Recent claims</h2>
          <Link href="/admin/claims" className="text-xs text-emerald-700 hover:underline dark:text-emerald-400">
            View all →
          </Link>
        </div>
        {recentClaims.length === 0 ? (
          <p className="mt-3 text-sm muted">No claims yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {recentClaims.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-3 text-sm dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold">{c.placeId}</div>
                  <div className="text-xs muted">
                    {c.claimedAt.toLocaleString()}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    c.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : c.status === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string;
  value: number;
  tone?: "default" | "warn";
  href?: string;
}) {
  const valueClass =
    tone === "warn" ? "text-amber-700 dark:text-amber-300" : "text-ink-900 dark:text-ink-50";
  const Card = (
    <div className="rounded-xl border border-ink-100 bg-white p-4 transition hover:border-emerald-400 dark:border-ink-800 dark:bg-ink-900">
      <div className="text-[10px] font-semibold uppercase tracking-wide muted">{label}</div>
      <div className={`mt-1 text-2xl font-black tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{Card}</Link> : Card;
}
