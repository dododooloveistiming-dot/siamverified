import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, listingClaims } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { message?: string };

  // Reject duplicate active claims (pending or approved).
  const existing = await db
    .select()
    .from(listingClaims)
    .where(
      and(eq(listingClaims.placeId, params.id), eq(listingClaims.userId, userId)),
    )
    .limit(1);
  if (existing.length > 0 && existing[0].status !== "rejected") {
    return NextResponse.json(
      { error: "Already claimed", claim: existing[0] },
      { status: 409 },
    );
  }

  const [claim] = await db
    .insert(listingClaims)
    .values({
      placeId: params.id,
      userId,
      message: body.message?.slice(0, 1000) ?? null,
    })
    .returning();

  return NextResponse.json({ claim });
}
