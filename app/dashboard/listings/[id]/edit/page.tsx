import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, listingClaims, listingProfiles } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";
import PhotoUploader from "@/components/PhotoUploader";
import ProfileEditor from "@/components/ProfileEditor";

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

  // Load existing profile (or null)
  const profileRows = await db
    .select()
    .from(listingProfiles)
    .where(eq(listingProfiles.placeId, params.id))
    .limit(1);
  const profile = profileRows[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-xs text-ink-500">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link> ›{" "}
        <span>Edit listing</span>
      </nav>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{place.name}</h1>
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Edits go live immediately. Visitors see them next page load.
          </p>
        </div>
        <Link
          href={`/en/place/${place.slug}/`}
          target="_blank"
          className="shrink-0 rounded-lg border border-ink-200 px-3 py-1.5 text-xs hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800"
        >
          View public page ↗
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <PhotoUploader
          placeId={params.id}
          initialPhotos={(profile?.ownerPhotos as string[]) ?? []}
        />
      </section>

      <div className="mt-6">
        <ProfileEditor
          placeId={params.id}
          initial={{
            description: profile?.description,
            hours: profile?.hours,
            whatsapp: profile?.whatsapp,
            line_id: profile?.lineId,
            contact_email: profile?.contactEmail,
            korean_staff_note: profile?.koreanStaffNote,
            services: (profile?.services as Array<{
              name: string;
              price_thb?: number;
              duration_min?: number;
              description?: string;
            }>) ?? [],
          }}
        />
      </div>
    </main>
  );
}
