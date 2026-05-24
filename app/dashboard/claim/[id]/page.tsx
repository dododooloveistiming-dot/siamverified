import { redirect, notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db, listingClaims } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClaimListingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect(`/auth/signin?callbackUrl=/dashboard/claim/${params.id}`);

  const place = getPlaceBySlug(params.id);
  if (!place) notFound();

  // Already claimed?
  const existing = await db
    .select()
    .from(listingClaims)
    .where(
      and(eq(listingClaims.placeId, params.id), eq(listingClaims.userId, userId)),
    )
    .limit(1);
  if (existing.length > 0 && existing[0].status !== "rejected") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-bold">Already claimed</h1>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
          You already have a {existing[0].status} claim on <strong>{place.name}</strong>.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
        >
          → Dashboard
        </Link>
      </main>
    );
  }

  async function submitClaim(formData: FormData) {
    "use server";
    const session = await auth();
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid) return;
    const message = String(formData.get("message") ?? "").trim().slice(0, 1000);
    await db.insert(listingClaims).values({
      placeId: params.id,
      userId: uid,
      message: message || null,
    });
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav className="text-xs text-ink-500">
        <Link href={`/en/place/${place.slug}/`} className="hover:underline">
          ← Back to {place.name}
        </Link>
      </nav>
      <h1 className="mt-2 text-2xl font-black tracking-tight">Claim {place.name}</h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
        Tell us how you&apos;re associated with this business — we&apos;ll review and approve
        within 1-2 business days. Once approved, you can edit the listing.
      </p>

      <form action={submitClaim} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-700 dark:text-ink-300">
            Your role at {place.name}
          </span>
          <textarea
            name="message"
            required
            rows={4}
            placeholder="e.g. I'm the owner / manager / authorized agent of this business. You can reach me at the official phone listed on the website, or via the WhatsApp number..."
            className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-ink-700 dark:bg-ink-900"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Submit claim →
        </button>
      </form>
    </main>
  );
}
