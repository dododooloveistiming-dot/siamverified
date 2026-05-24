import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db, listingEdits, users } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminEditsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { session, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/auth/signin?callbackUrl=/admin/edits");

  const status = searchParams.status ?? "pending";

  const rows = await db
    .select({
      edit: listingEdits,
      userEmail: users.email,
      userName: users.name,
    })
    .from(listingEdits)
    .leftJoin(users, eq(listingEdits.userId, users.id))
    .where(status === "all" ? undefined : eq(listingEdits.status, status))
    .orderBy(desc(listingEdits.submittedAt))
    .limit(100);

  async function setStatus(formData: FormData) {
    "use server";
    const { isAdmin: ok } = await requireAdmin();
    if (!ok) return;
    const editId = String(formData.get("editId") ?? "");
    const next = String(formData.get("status") ?? "");
    if (!editId || !["approved", "rejected", "pending"].includes(next)) return;
    await db
      .update(listingEdits)
      .set({
        status: next,
        appliedAt: next === "approved" ? new Date() : null,
      })
      .where(eq(listingEdits.id, editId));
    revalidatePath("/admin/edits");
    revalidatePath("/admin");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Listing edits</h1>
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Review owner-submitted edits
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
            href={s === "all" ? "/admin/edits?status=all" : `/admin/edits?status=${s}`}
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
            <p className="text-sm muted">No {status} edits.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {rows.map(({ edit: e, userEmail, userName }) => {
              const place = getPlaceBySlug(e.placeId);
              const edits = (e.edits ?? {}) as Record<string, string>;
              return (
                <li
                  key={e.id}
                  className="rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/en/place/${e.placeId}/`}
                          target="_blank"
                          className="truncate font-bold hover:underline"
                        >
                          {place?.name ?? e.placeId}
                        </Link>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            e.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : e.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {e.status}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs muted">
                        Submitted {e.submittedAt.toLocaleString()}
                        {e.appliedAt && ` · Applied ${e.appliedAt.toLocaleString()}`}
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="font-semibold">By:</span> {userName || userEmail || e.userId}
                      </div>

                      <dl className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-ink-50 p-3 text-xs dark:bg-ink-800">
                        {Object.entries(edits).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-[120px_1fr] gap-2">
                            <dt className="font-semibold capitalize muted">{k.replace(/_/g, " ")}:</dt>
                            <dd className="whitespace-pre-wrap">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1.5">
                      {e.status !== "approved" && (
                        <form action={setStatus}>
                          <input type="hidden" name="editId" value={e.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                            ✓ Approve
                          </button>
                        </form>
                      )}
                      {e.status !== "rejected" && (
                        <form action={setStatus}>
                          <input type="hidden" name="editId" value={e.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button className="w-full rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40">
                            ✕ Reject
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

      <p className="mt-6 text-xs muted">
        Approved edits are flagged but not yet applied to the public listing.
        Runtime overlay coming — for now, manual update of <code>places.json</code> needed.
      </p>
    </main>
  );
}
