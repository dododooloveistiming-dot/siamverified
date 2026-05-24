import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/drizzle/schema";

// Vercel + Neon integration sets POSTGRES_URL (pooled) and
// POSTGRES_URL_NON_POOLING. The Neon HTTP driver doesn't pool, so prefer
// the non-pooling URL when available; fall back to others.
const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "No Postgres connection string set " +
      "(expected POSTGRES_URL_NON_POOLING / POSTGRES_URL / DATABASE_URL).",
  );
}

const sql = neon(url);
export const db = drizzle(sql, { schema });
export * from "@/drizzle/schema";
