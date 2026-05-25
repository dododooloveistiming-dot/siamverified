import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Auth.js (Drizzle adapter) tables ───────────────────────────────────
// Names MUST match Auth.js defaults: singular tables, camelCase columns.
// Reference: https://authjs.dev/getting-started/adapters/drizzle

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").notNull().default("user"), // "user" | "admin"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// ─── App tables ─────────────────────────────────────────────────────────

// Business claims on a listing. place_id references the static
// public/data/places.json id (slug-like).
export const listingClaims = pgTable("listing_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: text("place_id").notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerId: text("reviewer_id").references(() => users.id, { onDelete: "set null" }),
});

// Edits submitted by claimed owners.
export const listingEdits = pgTable("listing_edits", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: text("place_id").notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  edits: jsonb("edits").notNull(),
  status: text("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  appliedAt: timestamp("applied_at"),
});

// Customer inquiries sent through verifiedthai.com.
export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: text("place_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  preferredDate: text("preferred_date"),
  partySize: text("party_size"),
  language: text("language").default("en"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  // In-app reply from the business owner
  replyMessage: text("reply_message"),
  repliedAt: timestamp("replied_at"),
  respondedAt: timestamp("responded_at"),
  countedAt: timestamp("counted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Live business profile maintained by the claimed owner. Overlays the
// static places.json data on the public place page.
// Owner edits go straight here (claim already verifies the owner). Admin
// retains spot-check authority by being able to delete/edit the row.
export const listingProfiles = pgTable("listing_profiles", {
  placeId: text("place_id").primaryKey(),
  ownerUserId: text("owner_user_id")
    .references(() => users.id, { onDelete: "set null" }),
  // Photos uploaded by the owner (Vercel Blob URLs). Replace scraped photos.
  ownerPhotos: jsonb("owner_photos").$type<string[]>().default([]).notNull(),
  // Services menu — [{name, price_thb, duration_min, description}]
  services: jsonb("services").$type<Array<{
    name: string;
    price_thb?: number;
    duration_min?: number;
    description?: string;
  }>>().default([]).notNull(),
  // Owner-controlled basic info (overlays scraped data)
  description: text("description"),
  hours: text("hours"),
  whatsapp: text("whatsapp"),
  lineId: text("line_id"),
  contactEmail: text("contact_email"),
  koreanStaffNote: text("korean_staff_note"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Simple page view counter per (place_id, day) so owners can see traffic.
// Lazily incremented from the place page via a fire-and-forget API call.
export const placeViews = pgTable(
  "place_views",
  {
    placeId: text("place_id").notNull(),
    day: text("day").notNull(), // YYYY-MM-DD UTC
    count: integer("count").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.placeId, t.day] }),
  }),
);

// Per-business subscription state. Monthly free tier = 10 inquiries.
export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("free"),
  activeUntil: timestamp("active_until"),
  monthlyInquiryCount: jsonb("monthly_inquiry_count").default({}).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ListingClaim = typeof listingClaims.$inferSelect;
export type ListingEdit = typeof listingEdits.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ListingProfile = typeof listingProfiles.$inferSelect;
export type PlaceView = typeof placeViews.$inferSelect;
