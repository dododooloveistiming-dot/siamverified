import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, listingClaims, listingEdits } from "@/lib/db";

// Only these place fields can be proposed as an edit — matches what the
// owner-facing edit form actually exposes. Without this, an approved owner
// could stuff arbitrary JSON (any key, any size) into listing_edits.
const EDITABLE_FIELDS = new Set([
  "name", "phone", "address", "hours", "description", "website", "email",
]);
const MAX_VALUE_LENGTH = 2000;

function sanitizeEdits(edits: Record<string, unknown>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(edits)) {
    if (!EDITABLE_FIELDS.has(key)) continue;
    if (typeof value !== "string") continue;
    const trimmed = value.slice(0, MAX_VALUE_LENGTH).trim();
    if (trimmed) clean[key] = trimmed;
  }
  return clean;
}

// POST {edits: {field: value, ...}} — submit edits for a listing the user
// has an APPROVED claim on. Edits go to listing_edits.pending; admin applies.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { edits?: Record<string, unknown> };
  if (!body.edits || typeof body.edits !== "object") {
    return NextResponse.json({ error: "Missing edits payload" }, { status: 400 });
  }
  const cleanEdits = sanitizeEdits(body.edits);
  if (Object.keys(cleanEdits).length === 0) {
    return NextResponse.json({ error: "No valid editable fields in payload" }, { status: 400 });
  }

  // Must hold an approved claim on this listing.
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
    return NextResponse.json(
      { error: "No approved claim — request claim first" },
      { status: 403 },
    );
  }

  const [edit] = await db
    .insert(listingEdits)
    .values({
      placeId: params.id,
      userId,
      edits: cleanEdits,
    })
    .returning();

  return NextResponse.json({ edit });
}
