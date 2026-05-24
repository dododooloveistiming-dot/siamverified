import { eq, and } from "drizzle-orm";
import { db, listingClaims, subscriptions } from "@/lib/db";

export const FREE_MONTHLY_INQUIRY_LIMIT = 10;

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Returns the user id of the approved claim on a listing, or null. */
export async function getOwnerUserId(placeId: string): Promise<string | null> {
  const rows = await db
    .select({ userId: listingClaims.userId })
    .from(listingClaims)
    .where(
      and(eq(listingClaims.placeId, placeId), eq(listingClaims.status, "approved")),
    )
    .limit(1);
  return rows[0]?.userId ?? null;
}

export type QuotaCheck = {
  allowed: boolean;
  reason: "ok" | "limit_reached" | "no_owner";
  used: number;
  limit: number;
  tier: "free" | "pro";
};

/**
 * Check if a new inquiry would exceed the owner's monthly quota.
 * If no owner is claimed yet, we still allow (the inquiry sits in DB
 * until claimed) and count against the future owner.
 */
export async function checkInquiryQuota(placeId: string): Promise<QuotaCheck> {
  const ownerId = await getOwnerUserId(placeId);
  if (!ownerId) {
    return { allowed: true, reason: "no_owner", used: 0, limit: FREE_MONTHLY_INQUIRY_LIMIT, tier: "free" };
  }
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, ownerId))
    .limit(1);
  const sub = rows[0];
  const tier: "free" | "pro" =
    sub?.tier === "pro" && sub.activeUntil && sub.activeUntil > new Date() ? "pro" : "free";
  if (tier === "pro") {
    return { allowed: true, reason: "ok", used: 0, limit: Infinity, tier };
  }
  const counts = (sub?.monthlyInquiryCount ?? {}) as Record<string, number>;
  const used = counts[monthKey()] ?? 0;
  return {
    allowed: used < FREE_MONTHLY_INQUIRY_LIMIT,
    reason: used < FREE_MONTHLY_INQUIRY_LIMIT ? "ok" : "limit_reached",
    used,
    limit: FREE_MONTHLY_INQUIRY_LIMIT,
    tier,
  };
}

/** Increment the owner's monthly counter. Called after a successful inquiry. */
export async function bumpInquiryCount(placeId: string): Promise<void> {
  const ownerId = await getOwnerUserId(placeId);
  if (!ownerId) return;
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, ownerId))
    .limit(1);
  const month = monthKey();
  const current = (rows[0]?.monthlyInquiryCount ?? {}) as Record<string, number>;
  const next = { ...current, [month]: (current[month] ?? 0) + 1 };
  if (rows.length === 0) {
    await db.insert(subscriptions).values({
      userId: ownerId,
      monthlyInquiryCount: next,
    });
  } else {
    await db
      .update(subscriptions)
      .set({ monthlyInquiryCount: next, updatedAt: new Date() })
      .where(eq(subscriptions.userId, ownerId));
  }
}
