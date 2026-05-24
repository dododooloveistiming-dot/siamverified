import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, listingClaims, listingEdits } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect(`/auth/signin?callbackUrl=/dashboard/listings/${params.id}/edit`);

  const place = getPlaceBySlug(params.id);
  if (!place) notFound();

  // Must hold approved claim
  const claim = await db
    .select()
    .from(listingClaims)
    .where(
      and(
        eq(listingClaims.placeId, params.id),
        eq(listingClaims.userId, userId),
        eq(listingClaims.status, "approved"),
      ),
    )
    .limit(1);
  if (claim.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-bold">Not yet approved</h1>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
          Your claim on <strong>{place.name}</strong> is still pending review.
          Once approved you&apos;ll be able to edit this listing here.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
        >
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  async function submitEdits(formData: FormData) {
    "use server";
    const session = await auth();
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid) return;
    const edits: Record<string, string> = {};
    for (const k of [
      "description",
      "website",
      "phone",
      "hours",
      "korean_caddy",
      "korean_staff",
    ]) {
      const v = String(formData.get(k) ?? "").trim();
      if (v) edits[k] = v;
    }
    if (Object.keys(edits).length === 0) return;
    await db.insert(listingEdits).values({
      placeId: params.id,
      userId: uid,
      edits,
    });
    redirect("/dashboard?edits=submitted");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav className="text-xs text-ink-500">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link> ›{" "}
        <span>Edit listing</span>
      </nav>
      <h1 className="mt-2 text-2xl font-black tracking-tight">{place.name}</h1>
      <p className="text-sm text-ink-600 dark:text-ink-400">
        Edits go to admin review before they go live.
      </p>

      <form action={submitEdits} className="mt-8 space-y-4">
        <Field name="description" label="Description (1-3 sentences)" textarea
          defaultValue="" placeholder="Brief 1-3 sentence summary for visitors" />
        <Field name="website" label="Website" type="url"
          defaultValue={place.website ?? ""} placeholder="https://" />
        <Field name="phone" label="Phone" defaultValue={place.phone ?? ""} />
        <Field name="hours" label="Hours" defaultValue=""
          placeholder="Mon-Sat 09:00-19:00" />
        <Field name="korean_staff" label="Korean-speaking staff (notes)"
          defaultValue="" placeholder="e.g. 2 Korean instructors on weekends" />

        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Submit edits for review →
        </button>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  textarea = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-700 dark:text-ink-300">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-ink-700 dark:bg-ink-900"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-ink-700 dark:bg-ink-900"
        />
      )}
    </label>
  );
}
