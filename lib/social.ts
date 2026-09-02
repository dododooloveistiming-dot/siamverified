import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Place } from "./types";
import { loadPlaces } from "./data";

// The page this backs (/[lang]/social/) started life as a "viral right now"
// hub and the data refused it: only 79 of 3,347 venues have a Google review
// from the last 30 days, and review-recency records exist for just 1,851 of
// them — that gap is scrape freshness, not real-world momentum. Ranking a
// "trending" list on it would have been an invented signal.
//
// What the data does support is the question social referrals actually
// arrive with. 652 venues have an Instagram or TikTok account, so those are
// the ones a visitor is plausibly looking at. Splitting them by how much
// independent evidence backs them up is the whole product in one page.

export type SocialTier = "corroborated" | "thin";

export type SocialEntry = {
  place: Place;
  sources: number;
  tier: SocialTier;
  instagram: string;
  tiktok: string;
};

type SocialRec = { instagram?: string; tiktok?: string };
type InstagramRec = { handle?: string };

function readJson<T>(file: string): Record<string, T> {
  const p = path.join(process.cwd(), "public", "data", file);
  try {
    return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf-8")) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

function sourceCount(p: Place): number {
  return Object.values(p.source_badges ?? {}).filter((n) => Number(n) > 0).length;
}

// "Thin" means we found a social account but little else: at most three of
// the nine source badges, and fewer than 30 Google reviews. It is not an
// accusation — the page says so — it is the honest state of our evidence.
const THIN_MAX_SOURCES = 3;
const THIN_MAX_REVIEWS = 30;

let cache: SocialEntry[] | null = null;

export function socialEntries(): SocialEntry[] {
  if (cache) return cache;
  const social = readJson<SocialRec>("per_place_social.json");
  const instagram = readJson<InstagramRec>("per_place_instagram.json");

  const out: SocialEntry[] = [];
  for (const place of loadPlaces().places) {
    const s = social[place.id] ?? {};
    const ig = s.instagram || instagram[place.id]?.handle || "";
    const tt = s.tiktok || "";
    if (!ig && !tt) continue;

    const sources = sourceCount(place);
    const thin = sources <= THIN_MAX_SOURCES && (place.review_count ?? 0) < THIN_MAX_REVIEWS;
    out.push({ place, sources, tier: thin ? "thin" : "corroborated", instagram: ig, tiktok: tt });
  }
  cache = out;
  return out;
}

export function corroborated(): SocialEntry[] {
  return socialEntries()
    .filter((e) => e.tier === "corroborated")
    .sort((a, b) => b.place.trust_score - a.place.trust_score);
}

/** Weakest evidence first — the ones worth a second look before booking. */
export function thinEvidence(): SocialEntry[] {
  return socialEntries()
    .filter((e) => e.tier === "thin")
    .sort((a, b) => a.place.trust_score - b.place.trust_score);
}
