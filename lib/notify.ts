// Email notifications via Resend. Failures are logged but do not bubble —
// inquiry submission must succeed even if the notification fails.
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getOwnerUserId } from "@/lib/quota";

const RESEND_KEY = process.env.AUTH_RESEND_KEY;
const EMAIL_FROM = process.env.AUTH_EMAIL_FROM || "Verified Thai <no-reply@verifiedthai.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verifiedthai.com";

// Operator Telegram routing — every inquiry (claimed or not) pings this chat.
// Set TELEGRAM_BOT_TOKEN (from @BotFather) + TELEGRAM_CHAT_ID (your user/group
// chat id) in env. Best-effort: a failure never blocks the inquiry.
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

// Lightweight (no-LLM) triage so the operator can tell a real customer from
// SEO/marketing spam at a glance. Pure string heuristics — fast, free, runs
// in the request path without an external call.
const SPAM_RE = /\b(seo|backlink|back link|ranking|rank (?:your|higher)|marketing (?:service|agenc)|digital marketing|promote your|grow your (?:business|traffic)|guest post|web ?design|crypto|bitcoin|forex|invest(?:ment)?|loan|casino|gambling|viagra|cialis|escort|increase (?:your )?(?:sales|traffic|revenue)|we (?:offer|provide)|our (?:services|agency)|outreach|lead generation|推广|关键词|排名|代运营)\b/i;
const URL_RE = /(https?:\/\/|www\.|t\.me\/|wa\.me\/|@[a-z0-9_]{4,}|\b[a-z0-9-]+\.(?:com|net|org|io|ru|cn|xyz|top|biz|info)\b)/i;

function classifyInquiry(message: string, name: string, email: string): { tag: string; why: string } {
  const hay = `${message} ${name} ${email}`;
  const hasUrl = URL_RE.test(message) || URL_RE.test(name);
  const spammy = SPAM_RE.test(hay);
  const veryShort = message.trim().length < 12;
  if (spammy && hasUrl) return { tag: "🛑 LIKELY SPAM / AD", why: "promo keywords + a link/handle — probably a marketing pitch, not a customer" };
  if (spammy) return { tag: "⚠️ Possible promo/ad", why: "promotional wording — read before replying" };
  if (hasUrl) return { tag: "⚠️ Contains a link/handle", why: "has a URL or @handle — verify it's genuine" };
  if (veryShort) return { tag: "❓ Very short — low detail", why: "thin message; may be a test or low-intent" };
  return { tag: "🟢 Looks like a genuine customer inquiry", why: "" };
}

export async function notifyTelegram(args: {
  placeId: string;
  placeName: string;
  kind: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  preferredDate?: string | null;
  requestedService?: string | null;
  partySize?: string | null;
  language?: string | null;
  message: string;
}): Promise<void> {
  if (!TG_TOKEN || !TG_CHAT) {
    console.warn("[notify] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — skipping telegram");
    return;
  }
  const lang = args.language || "en";
  // Human-readable type + spam/ad triage.
  const kindLabel = args.kind === "booking" ? "📅 Booking request" : "💬 Customer inquiry";
  const triage = classifyInquiry(args.message, args.customerName, args.customerEmail);
  const text = [
    `🔔 <b>${kindLabel}</b> — ${escapeHtml(args.placeName)}`,
    `${triage.tag}${triage.why ? ` <i>(${escapeHtml(triage.why)})</i>` : ""}`,
    "",
    `👤 ${escapeHtml(args.customerName)}`,
    `✉️ ${escapeHtml(args.customerEmail)}`,
    args.customerPhone ? `📞 ${escapeHtml(args.customerPhone)}` : "",
    args.requestedService ? `🧾 ${escapeHtml(args.requestedService)}` : "",
    args.preferredDate ? `📅 ${escapeHtml(args.preferredDate)}` : "",
    args.partySize ? `👥 ${escapeHtml(args.partySize)}` : "",
    `🌐 ${escapeHtml(lang)}`,
    "",
    `💬 ${escapeHtml(args.message)}`,
    "",
    `${SITE_URL}/${lang}/place/${args.placeId}/`,
  ].filter(Boolean).join("\n");
  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!res.ok) console.error("[notify] telegram error", res.status, await res.text());
  } catch (e) {
    console.error("[notify] notifyTelegram failed", e);
  }
}

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
