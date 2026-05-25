import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, listingClaims, listingProfiles } from "@/lib/db";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB per photo
const MAX_PHOTOS = 10;

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
    return { ok: false as const, status: 403, err: "Not an approved owner of this listing" };
  }
  return { ok: true as const, userId };
}

async function getProfile(placeId: string) {
  const rows = await db.select().from(listingProfiles).where(eq(listingProfiles.placeId, placeId)).limit(1);
  return rows[0] ?? null;
}

async function upsertProfile(placeId: string, userId: string, photos: string[]) {
  const existing = await getProfile(placeId);
  if (existing) {
    await db
      .update(listingProfiles)
      .set({ ownerPhotos: photos, updatedAt: new Date() })
      .where(eq(listingProfiles.placeId, placeId));
  } else {
    await db.insert(listingProfiles).values({
      placeId,
      ownerUserId: userId,
      ownerPhotos: photos,
    });
  }
}

// POST — upload one photo. Multipart form with field `photo`.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const check = await requireOwner(params.id);
  if (!check.ok) return NextResponse.json({ error: check.err }, { status: check.status });

  const form = await req.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing photo file" }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: `Max ${MAX_PHOTO_BYTES / 1024 / 1024}MB per photo` }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Must be an image" }, { status: 400 });
  }

  const existing = await getProfile(params.id);
  const photos = (existing?.ownerPhotos ?? []) as string[];
  if (photos.length >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Max ${MAX_PHOTOS} photos per listing` }, { status: 400 });
  }

  // Upload to Vercel Blob — public access (the URL is unguessable hash)
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 4);
  const key = `places/${params.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { url } = await put(key, file, { access: "public", addRandomSuffix: false });

  const updated = [...photos, url];
  await upsertProfile(params.id, check.userId, updated);

  return NextResponse.json({ ok: true, url, photos: updated });
}

// DELETE — remove a photo by URL. Body: {url: string}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const check = await requireOwner(params.id);
  if (!check.ok) return NextResponse.json({ error: check.err }, { status: check.status });

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  if (!body.url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const existing = await getProfile(params.id);
  const photos = (existing?.ownerPhotos ?? []) as string[];
  const next = photos.filter((u) => u !== body.url);

  // Best-effort blob delete
  if (photos.includes(body.url)) {
    try { await del(body.url); } catch {}
  }
  await upsertProfile(params.id, check.userId, next);
  return NextResponse.json({ ok: true, photos: next });
}
