import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";

// ─── NextAuth (Drizzle adapter) tables ──────────────────────────────────
// Reference: https://authjs.dev/getting-started/adapters/drizzle
// We use Email magic-link, so accounts/sessions are required by the adapter
// even though OAuth isn't active.

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: text("role").notNull().default("user"), // "user" | "admin"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
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

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
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
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  message: text("message"), // user's proof-of-ownership message
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerId: text("reviewer_id").references(() => users.id, { onDelete: "set null" }),
});

// Customer inquiries sent through verifiedthai.com. Routed to whichever
// approved claim owns the listing; "unclaimed" inquiries still get stored
// (the business can see them after they claim).
export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: text("place_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  preferredDate: text("preferred_date"),       // free-text date / "anytime"
  partySize: text("party_size"),               // "1 person", "couple", "4 people"
  language: text("language").default("en"),
  message: text("message").notNull(),
  // Lifecycle
  status: text("status").notNull().default("new"), // new | responded | closed
  respondedAt: timestamp("responded_at"),
  // For freemium gating
  countedAt: timestamp("counted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Per-business subscription state. Monthly free tier = 10 inquiries.
// Paid tier ($29/mo) lifts the cap. Tracked separately from listing_claims
// so a business with multiple listings shares the cap.
export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("free"), // free | pro
  activeUntil: timestamp("active_until"),       // pro plan expiry
  monthlyInquiryCount: jsonb("monthly_inquiry_count").default({}).notNull(), // {"2026-05": 7}
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Edits submitted by claimed owners. Until applied, the static JSON
// reflects the public/original value.
export const listingEdits = pgTable("listing_edits", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: text("place_id").notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  edits: jsonb("edits").notNull(), // { description, hours, ko_friendly, etc. }
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  appliedAt: timestamp("applied_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ListingClaim = typeof listingClaims.$inferSelect;
export type ListingEdit = typeof listingEdits.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
