import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, placeViews } from "@/lib/db";

// Fire-and-forget view counter — incremented once per page render.
// No auth required (public counter). Bot traffic will inflate this but
// it's good enough for "is this listing getting any attention?" signal.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!params.id || params.id.length > 200) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Upsert pattern: insert if missing, else increment count
  try {
    await db
      .insert(placeViews)
      .values({ placeId: params.id, day, count: 1 })
      .onConflictDoUpdate({
        target: [placeViews.placeId, placeViews.day],
        set: { count: sql`${placeViews.count} + 1` },
      });
  } catch (e) {
    console.warn("[view] increment failed", e);
  }
  return NextResponse.json({ ok: true });
}
