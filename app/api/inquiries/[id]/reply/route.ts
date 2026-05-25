import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, inquiries, listingClaims } from "@/lib/db";
import { getPlaceBySlug } from "@/lib/data";

const RESEND_KEY = process.env.AUTH_RESEND_KEY;
const EMAIL_FROM = process.env.AUTH_EMAIL_FROM || "Verified Thai <no-reply@verifiedthai.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verifiedthai.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendCustomerEmail(args: {
  to: string;
  placeName: string;
  body: string;
  customerName: string;
}): Promise<boolean> {
  if (!RESEND_KEY) return false;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <p style="font-size:14px;color:#666;">From <strong>${escapeHtml(args.placeName)}</strong> via Verified Thai</p>
      <p style="font-size:16px;line-height:1.6;margin-top:8px;">Hi ${escapeHtml(args.customerName)},</p>
      <div style="margin-top:16px;padding:16px;background:#f4f4f5;border-left:4px solid #059669;border-radius:8px;white-space:pre-wrap;font-size:15px;line-height:1.7;">${escapeHtml(args.body)}</div>
      <p style="margin-top:24px;color:#888;font-size:12px;">Reply to this email to continue the conversation — your reply goes back to ${escapeHtml(args.placeName)}.</p>
    </div>
  `.trim();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.to,
        subject: `Re: Your inquiry to ${args.placeName}`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { message?: string };
  const message = (body.message ?? "").trim().slice(0, 4000);
  if (!message) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  // Fetch the inquiry
  const rows = await db.select().from(inquiries).where(eq(inquiries.id, params.id)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  const q = rows[0];

  // Verify user owns the listing
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
    return NextResponse.json({ error: "Not an approved owner of this listing" }, { status: 403 });
  }

  // Persist + status
  const now = new Date();
  await db
    .update(inquiries)
    .set({ replyMessage: message, repliedAt: now, status: "responded" })
    .where(eq(inquiries.id, params.id));

  // Email the customer (best-effort)
  const place = getPlaceBySlug(q.placeId);
  await sendCustomerEmail({
    to: q.customerEmail,
    placeName: place?.name ?? q.placeId,
    body: message,
    customerName: q.customerName,
  });

  return NextResponse.json({ ok: true });
}
