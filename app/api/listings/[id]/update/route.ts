import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, listingClaims, listingEdits } from "@/lib/db";

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
      edits: body.edits,
    })
    .returning();

  return NextResponse.json({ edit });
}
