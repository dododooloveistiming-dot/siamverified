import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db, listingClaims, users } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { session, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/auth/signin?callbackUrl=/admin/claims");

  const status = searchParams.status ?? "pending";

  const rows = await db
    .select({
      claim: listingClaims,
      userEmail: users.email,
      userName: users.name,
    })
    .from(listingClaims)
    .leftJoin(users, eq(listingClaims.userId, users.id))
    .where(status === "all" ? undefined : eq(listingClaims.status, status))
    .orderBy(desc(listingClaims.claimedAt))
    .limit(100);

  async function setStatus(formData: FormData) {
    "use server";
    const { isAdmin: ok, session } = await requireAdmin();
    if (!ok) return;
    const reviewerId = (session?.user as { id?: string } | undefined)?.id;
    const claimId = String(formData.get("claimId") ?? "");
    const next = String(formData.get("status") ?? "");
    if (!claimId || !["approved", "rejected", "pending"].includes(next)) return;
    await db
      .update(listingClaims)
      .set({
        status: next,
        reviewedAt: next === "pending" ? null : new Date(),
        reviewerId: next === "pending" ? null : reviewerId ?? null,
      })
      .where(eq(listingClaims.id, claimId));
    revalidatePath("/admin/claims");
    revalidatePath("/admin");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Claims</h1>
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Review business claim requests
          </p>
        </div>
        <Link href="/admin" className="text-xs muted hover:underline">
          ← Admin
        </Link>
      </header>

      <nav className="mt-4 flex gap-2 text-xs">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/claims?status=all" : `/admin/claims?status=${s}`}
            className={`rounded-full border px-3 py-1.5 font-medium transition ${
              status === s
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-ink-200 bg-white text-ink-700 hover:border-emerald-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
            }`}
          >
            {s}
          </Link>
        ))}
      </nav>

      <section className="mt-6">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
            <p className="text-sm muted">No {status} claims.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {rows.map(({ claim: c, userEmail, userName }) => {
              const place = getPlaceBySlug(c.placeId);
              return (
                <li
                  key={c.id}
                  className="rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/en/place/${c.placeId}/`}
                          target="_blank"
                          className="truncate font-bold hover:underline"
                        >
                          {place?.name ?? c.placeId}
                        </Link>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-0.5 text-xs muted">
                        {place && (
                          <>
                            <span>{place.city}</span> · <span>{place.niche}</span> ·{" "}
                          </>
                        )}
                        <span>Claimed {c.claimedAt.toLocaleString()}</span>
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="font-semibold">By:</span> {userName || userEmail || c.userId}
                        {userEmail && (
                          <>
                            {" "}
                            (
                            <a
                              href={`mailto:${userEmail}`}
                              className="text-emerald-700 hover:underline dark:text-emerald-400"
                            >
                              {userEmail}
                            </a>
                            )
                          </>
                        )}
                      </div>
                      {c.message && (
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-xs dark:bg-ink-800">
                          {c.message}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-1.5">
                      {c.status !== "approved" && (
                        <form action={setStatus}>
                          <input type="hidden" name="claimId" value={c.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                            ✓ Approve
                          </button>
                        </form>
                      )}
                      {c.status !== "rejected" && (
                        <form action={setStatus}>
                          <input type="hidden" name="claimId" value={c.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button className="w-full rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40">
                            ✕ Reject
                          </button>
                        </form>
                      )}
                      {c.status !== "pending" && (
                        <form action={setStatus}>
                          <input type="hidden" name="claimId" value={c.id} />
                          <input type="hidden" name="status" value="pending" />
                          <button className="w-full rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 dark:border-ink-700">
                            ↻ Reset
                          </button>
                        </form>
                      )}
                    </div>
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
