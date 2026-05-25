import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, listingClaims, listingProfiles } from "@/lib/db";

type ServiceItem = {
  name: string;
  price_thb?: number;
  duration_min?: number;
  description?: string;
};

type ProfileBody = {
  description?: string;
  hours?: string;
  whatsapp?: string;
  line_id?: string;
  contact_email?: string;
  korean_staff_note?: string;
  services?: ServiceItem[];
};

async function requireOwner(placeId: string) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { ok: false as const, status: 401, err: "Unauthorized" };

  const claim = await db
    .select()
    .from(listingClaims)
    .where(
      and(
        eq(listingClaims.placeId, placeId),
        eq(listingClaims.userId, userId),
        eq(listingClaims.status, "approved"),
      ),
    )
    .limit(1);
  if (claim.length === 0) {
    return { ok: false as const, status: 403, err: "Not an approved owner" };
  }
  return { ok: true as const, userId };
}

function sanitizeServices(svc: unknown): ServiceItem[] {
  if (!Array.isArray(svc)) return [];
  return svc
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => ({
      name: String(s.name ?? "").slice(0, 120).trim(),
      price_thb: typeof s.price_thb === "number" && s.price_thb >= 0 ? Math.round(s.price_thb) : undefined,
      duration_min: typeof s.duration_min === "number" && s.duration_min >= 0 ? Math.round(s.duration_min) : undefined,
      description: typeof s.description === "string" ? s.description.slice(0, 500) : undefined,
    }))
    .filter((s) => s.name)
    .slice(0, 30);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireOwner(params.id);
  if (!check.ok) return NextResponse.json({ error: check.err }, { status: check.status });

  const body = (await req.json().catch(() => ({}))) as ProfileBody;

  const patch = {
    description: typeof body.description === "string" ? body.description.slice(0, 2000) : undefined,
    hours: typeof body.hours === "string" ? body.hours.slice(0, 500) : undefined,
    whatsapp: typeof body.whatsapp === "string" ? body.whatsapp.slice(0, 40).trim() : undefined,
    lineId: typeof body.line_id === "string" ? body.line_id.slice(0, 60).trim() : undefined,
    contactEmail: typeof body.contact_email === "string" ? body.contact_email.slice(0, 200).trim() : undefined,
    koreanStaffNote: typeof body.korean_staff_note === "string" ? body.korean_staff_note.slice(0, 500) : undefined,
    services: body.services !== undefined ? sanitizeServices(body.services) : undefined,
    updatedAt: new Date(),
  };

  // Strip undefined so we don't blow away unchanged fields
  const cleanPatch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) cleanPatch[k] = v;
  }

  const existing = await db
    .select()
    .from(listingProfiles)
    .where(eq(listingProfiles.placeId, params.id))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(listingProfiles).values({
      placeId: params.id,
      ownerUserId: check.userId,
      ownerPhotos: [],
      services: (cleanPatch.services as ServiceItem[]) ?? [],
      ...cleanPatch,
    });
  } else {
    await db
      .update(listingProfiles)
      .set(cleanPatch)
      .where(eq(listingProfiles.placeId, params.id));
  }

  return NextResponse.json({ ok: true });
}
