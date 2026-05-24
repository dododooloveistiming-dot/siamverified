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
  respondedAt: timestamp("responded_at"),
  countedAt: timestamp("counted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
