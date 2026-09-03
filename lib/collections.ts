import fs from "node:fs";
import path from "node:path";
import type { Place } from "./types";
import { loadPlaces } from "./data";
import { COLLECTIONS, getCollection } from "./collection-defs";
import type { CollectionDef, CollectionSlug } from "./collection-defs";

// Definitions live in lib/collection-defs.ts — a pure module with no
// server-only imports — so scripts/import-apify-discovery.mjs can apply the
// same patterns when it decides what a discovery result actually is.
export * from "./collection-defs";

// A landing page below this reads as thin content and competes with nothing.
// `ice-bath` (0 venues) and `meditation` (6) are deliberately kept in
// COLLECTIONS anyway: the definition is what lets each page open by itself
// once the venues are scraped, with no code change.
export const MIN_COLLECTION_PLACES = 12;

// place_id -> collection slugs, written by scripts/import-apify-discovery.mjs
// from the search term that surfaced each venue.
//
// Name/category matching alone misses most of what a discovery run finds: a
// cold-plunge studio is usually called something like "The Recovery Lab" with
// a Google category of "Wellness center". "We searched Google Maps for ice
// baths in Bangkok and it returned this venue" is a real signal, and keeping
// it explicit means the membership stays checkable rather than becoming a
// looser keyword rule that quietly drags in unrelated spas.
let tagCache: Record<string, string[]> | null = null;
function collectionTags(): Record<string, string[]> {
  if (tagCache) return tagCache;
  const p = path.join(process.cwd(), "public", "data", "per_place_collection_tags.json");
  try {
    tagCache = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : {};
  } catch {
    tagCache = {};
  }
  return tagCache!;
}

function matches(c: CollectionDef, p: Place): boolean {
  if ((collectionTags()[p.id] || []).includes(c.slug)) return true;
  const hay = `${p.name} ${p.category}`;
  return c.patterns.some((re) => re.test(hay));
}

const cache = new Map<CollectionSlug, Place[]>();

export function getCollectionPlaces(c: CollectionDef): Place[] {
  const cached = cache.get(c.slug);
  if (cached) return cached;
  const niches = new Set(c.niches);
  const tags = collectionTags();
  const out = loadPlaces()
    .places
    // The niche list narrows a 3,347-place sweep for keyword matching. An
    // explicitly tagged venue skips it: a discovery run can legitimately turn
    // up an ice bath inside a niche the keyword scan never looks at.
    .filter((p) => ((tags[p.id] || []).includes(c.slug) || niches.has(p.niche)) && matches(c, p))
    .sort((a, b) => b.trust_score - a.trust_score);
  cache.set(c.slug, out);
  return out;
}

export function hasEnoughCollectionPlaces(c: CollectionDef): boolean {
  return getCollectionPlaces(c).length >= MIN_COLLECTION_PLACES;
}

/** Collections with enough venues to deserve a page — drives routing and links. */
export function liveCollections(): CollectionDef[] {
  return COLLECTIONS.filter(hasEnoughCollectionPlaces);
}
