// Email notifications via Resend. Failures are logged but do not bubble —
// inquiry submission must succeed even if the notification fails.
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getOwnerUserId } from "@/lib/quota";

const RESEND_KEY = process.env.AUTH_RESEND_KEY;
const EMAIL_FROM = process.env.AUTH_EMAIL_FROM || "Verified Thai <no-reply@verifiedthai.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verifiedthai.com";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_KEY) {
    console.warn("[notify] AUTH_RESEND_KEY not set — skipping email");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error("[notify] Resend error", res.status, await res.text());
    }
  } catch (e) {
    console.error("[notify] sendEmail failed", e);
  }
}

export async function notifyNewInquiry(args: {
  placeId: string;
  placeName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  preferredDate?: string | null;
  partySize?: string | null;
  message: string;
}): Promise<void> {
  const ownerId = await getOwnerUserId(args.placeId);
  if (!ownerId) return; // unclaimed — no one to notify yet
  const owner = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
  if (owner.length === 0 || !owner[0].email) return;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#059669;margin:0 0 16px;">New inquiry for ${escapeHtml(args.placeName)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#666;width:120px;">From</td>
          <td style="padding:6px 0;"><strong>${escapeHtml(args.customerName)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666;">Email</td>
          <td style="padding:6px 0;"><a href="mailto:${escapeHtml(args.customerEmail)}">${escapeHtml(args.customerEmail)}</a></td></tr>
        ${args.customerPhone ? `<tr><td style="padding:6px 0;color:#666;">Phone</td><td style="padding:6px 0;">${escapeHtml(args.customerPhone)}</td></tr>` : ""}
        ${args.preferredDate ? `<tr><td style="padding:6px 0;color:#666;">Preferred date</td><td style="padding:6px 0;">${escapeHtml(args.preferredDate)}</td></tr>` : ""}
        ${args.partySize ? `<tr><td style="padding:6px 0;color:#666;">Party size</td><td style="padding:6px 0;">${escapeHtml(args.partySize)}</td></tr>` : ""}
      </table>
      <div style="margin-top:16px;padding:12px 16px;background:#f4f4f5;border-radius:8px;white-space:pre-wrap;">${escapeHtml(args.message)}</div>
      <p style="margin-top:24px;">
        <a href="${SITE_URL}/dashboard/inquiries" style="display:inline-block;background:#059669;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Reply via dashboard →</a>
      </p>
      <p style="color:#888;font-size:12px;margin-top:24px;">
        You're receiving this because you claimed <strong>${escapeHtml(args.placeName)}</strong> on Verified Thai.
      </p>
    </div>
  `.trim();

  await sendEmail(owner[0].email, `New inquiry: ${args.placeName}`, html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
