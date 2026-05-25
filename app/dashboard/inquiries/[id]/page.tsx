import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, inquiries, listingClaims } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";
import InquiryReplyForm from "@/components/InquiryReplyForm";

export const dynamic = "force-dynamic";

export default async function InquiryThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect(`/auth/signin?callbackUrl=/dashboard/inquiries/${params.id}`);

  const rows = await db.select().from(inquiries).where(eq(inquiries.id, params.id)).limit(1);
  if (rows.length === 0) notFound();
  const q = rows[0];

  // Verify ownership
  const claim = await db
    .select()
    .from(listingClaims)
    .where(
      and(
        eq(listingClaims.placeId, q.placeId),
        eq(listingClaims.userId, userId),
        eq(listingClaims.status, "approved"),
      ),
    )
    .limit(1);
  if (claim.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-bold">Not your inquiry</h1>
        <p className="mt-2 text-sm muted">
          This inquiry belongs to a listing you haven&apos;t claimed.
        </p>
        <Link
          href="/dashboard/inquiries"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
        >
          ← Inquiries
        </Link>
      </main>
    );
  }

  const place = getPlaceBySlug(q.placeId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav className="text-xs muted">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link> ›{" "}
        <Link href="/dashboard/inquiries" className="hover:underline">Inquiries</Link> ›{" "}
        <span>{q.customerName}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-xl font-black tracking-tight">
          Inquiry from {q.customerName}
        </h1>
        <p className="mt-1 text-sm muted">
          For{" "}
          <Link href={`/en/place/${q.placeId}/`} target="_blank" className="hover:underline">
            {place?.name ?? q.placeId}
          </Link>
          {" "}· received {q.createdAt.toLocaleString()}
        </p>
      </header>

      {/* Customer message */}
      <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center justify-between text-xs muted">
          <div>
            <strong className="text-ink-700 dark:text-ink-300">{q.customerName}</strong>
            {" · "}
            <a
              href={`mailto:${q.customerEmail}`}
              className="text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {q.customerEmail}
            </a>
            {q.customerPhone && <span className="ml-1">· {q.customerPhone}</span>}
          </div>
          <span>{q.createdAt.toLocaleString()}</span>
        </div>
        {(q.preferredDate || q.partySize) && (
          <div className="mt-2 text-xs muted">
            {q.preferredDate && <span>📅 {q.preferredDate}</span>}
            {q.preferredDate && q.partySize && " · "}
            {q.partySize && <span>👥 {q.partySize}</span>}
          </div>
        )}
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-800">
          {q.message}
        </p>
      </section>

      {/* Existing reply, if any */}
      {q.replyMessage && (
        <section className="mt-4 rounded-2xl border-l-4 border-emerald-500 bg-emerald-50/60 p-4 dark:bg-emerald-950/30">
          <div className="text-xs muted">
            Your reply · {q.repliedAt?.toLocaleString()}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{q.replyMessage}</p>
        </section>
      )}

      {/* Reply form */}
      {!q.replyMessage && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold">Reply</h2>
          <p className="mb-3 text-xs muted">
            Your reply goes to {q.customerEmail} as a real email and is logged here.
          </p>
          <InquiryReplyForm inquiryId={q.id} />
        </section>
      )}

      <div className="mt-8 text-xs muted">
        <Link href="/dashboard/inquiries" className="hover:underline">← All inquiries</Link>
      </div>
    </main>
  );
}
