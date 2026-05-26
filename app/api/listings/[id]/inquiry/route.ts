import { NextResponse } from "next/server";
import { db, inquiries } from "@/lib/db";
import { checkInquiryQuota, bumpInquiryCount } from "@/lib/quota";
import { notifyNewInquiry } from "@/lib/notify";
import { getPlaceBySlug } from "@/lib/data";

type Body = {
  kind?: "inquiry" | "booking";
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  preferred_date?: string;
  requested_time?: string;
  requested_service?: string;
  party_size?: string;
  language?: string;
  message?: string;
};

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// In-memory IP rate limit — 3 inquiries per 5 minutes per IP. Resets when
// the function instance recycles (fine for our scale; abusers get
// inconsistent throttling which is actually a feature).
const RL_WINDOW_MS = 5 * 60 * 1000;
const RL_MAX = 3;
const rlMap = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = (rlMap.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  if (bucket.length >= RL_MAX) {
    rlMap.set(ip, bucket);
    return true;
  }
  bucket.push(now);
  rlMap.set(ip, bucket);
  return false;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many inquiries — please wait a few minutes." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const customerName = (body.customer_name ?? "").trim().slice(0, 120);
  const customerEmail = (body.customer_email ?? "").trim().slice(0, 200);
  const message = (body.message ?? "").trim().slice(0, 2000);

  if (!customerName || !customerEmail || !message) {
    return NextResponse.json(
      { error: "Missing required fields (name, email, message)" },
      { status: 400 },
    );
  }
  if (!isEmail(customerEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const place = getPlaceBySlug(params.id);
  if (!place) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Quota check. Limit-reached for the owner → block but record nothing.
  const quota = await checkInquiryQuota(params.id);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "This business is at capacity this month. Please try again next month.",
        quota: { used: quota.used, limit: quota.limit },
      },
      { status: 429 },
    );
  }

  const kind = body.kind === "booking" ? "booking" : "inquiry";
  const [row] = await db
    .insert(inquiries)
    .values({
      placeId: params.id,
      kind,
      customerName,
      customerEmail,
      customerPhone: (body.customer_phone ?? "").trim().slice(0, 50) || null,
      preferredDate: (body.preferred_date ?? "").trim().slice(0, 120) || null,
      requestedTime: (body.requested_time ?? "").trim().slice(0, 10) || null,
      requestedService: (body.requested_service ?? "").trim().slice(0, 200) || null,
      partySize: (body.party_size ?? "").trim().slice(0, 40) || null,
      language: (body.language ?? "en").slice(0, 4),
      message,
    })
    .returning();

  // Best-effort: count + notify. Failures here shouldn't fail the request.
  await Promise.allSettled([
    bumpInquiryCount(params.id),
    notifyNewInquiry({
      placeId: params.id,
      placeName: place.name,
      customerName,
      customerEmail,
      customerPhone: row.customerPhone,
      preferredDate: row.preferredDate,
      partySize: row.partySize,
      message,
    }),
  ]);

  return NextResponse.json({ ok: true, id: row.id });
}
