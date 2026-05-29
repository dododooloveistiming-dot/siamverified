import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { PlacesBundle, Place, Niche, CommunityBundle } from "./types";
import { getPlaceSignals, computeTrustBoost } from "./signals";

let cache: PlacesBundle | null = null;
const byNicheCache = new Map<Niche, Place[]>();

export function loadPlaces(): PlacesBundle {
  if (cache) return cache;
  const p = path.join(process.cwd(), "public", "data", "places.json");
  if (!fs.existsSync(p)) {
    cache = {
      generated_at: new Date().toISOString(),
      total: 0,
      by_niche: {} as PlacesBundle["by_niche"],
      avg_trust: 0,
      places: [],
    };
    return cache;
  }
  const raw = fs.readFileSync(p, "utf-8");
  const bundle = JSON.parse(raw) as PlacesBundle;
  // Apply enrichment-signal boost so wayback/recency/email infra feed into
  // ranking everywhere — not just the badges on the detail page.
  let trustSum = 0;
  for (const place of bundle.places) {
    const boost = computeTrustBoost(getPlaceSignals(place.id));
    if (boost > 0) place.trust_score = Math.min(100, place.trust_score + boost);
    trustSum += place.trust_score;
  }
  bundle.avg_trust = bundle.places.length
    ? Math.round((trustSum / bundle.places.length) * 10) / 10
    : 0;
  cache = bundle;
  return cache;
}

export function getPlacesByNiche(niche: Niche): Place[] {
  if (byNicheCache.has(niche)) return byNicheCache.get(niche)!;
  const places = loadPlaces().places.filter((p) => p.niche === niche);
  byNicheCache.set(niche, places);
  return places;
}

export function getPlaceBySlug(slug: string): Place | undefined {
  return loadPlaces().places.find((p) => p.slug === slug);
}

export type OwnerProfile = {
  ownerPhotos: string[];
  services: Array<{
    name: string;
    price_thb?: number;
    duration_min?: number;
    description?: string;
  }>;
  description?: string | null;
  hours?: string | null;
  whatsapp?: string | null;
  lineId?: string | null;
  contactEmail?: string | null;
  koreanStaffNote?: string | null;
  updatedAt?: Date;
};

/**
 * Fetch the live owner-controlled profile from listing_profiles.
 * Called from server-rendered place pages. Returns null if no claimed
 * owner has filled in custom content yet.
 */
export async function getOwnerProfile(placeId: string): Promise<OwnerProfile | null> {
  try {
    const { db, listingProfiles } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(listingProfiles)
      .where(eq(listingProfiles.placeId, placeId))
      .limit(1);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ownerPhotos: (r.ownerPhotos as string[]) ?? [],
      services: (r.services as OwnerProfile["services"]) ?? [],
      description: r.description,
      hours: r.hours,
      whatsapp: r.whatsapp,
      lineId: r.lineId,
      contactEmail: r.contactEmail,
      koreanStaffNote: r.koreanStaffNote,
      updatedAt: r.updatedAt,
    };
  } catch (e) {
    console.warn("[data] getOwnerProfile failed:", e);
    return null;
  }
}

export function getTopPlaces(limit = 12): Place[] {
  return loadPlaces().places.slice(0, limit);
}

/**
 * Find similar places: same niche, prefer same city, exclude self.
 * Used for the "Similar places" section on the place detail page.
 */
export function getSimilarPlaces(place: Place, limit = 4): Place[] {
  const peers = getPlacesByNiche(place.niche).filter((p) => p.id !== place.id);
  const sameCity = peers.filter((p) => p.city === place.city);
  const otherCity = peers.filter((p) => p.city !== place.city);
  // Rank by trust score within each bucket
  sameCity.sort((a, b) => b.trust_score - a.trust_score);
  otherCity.sort((a, b) => b.trust_score - a.trust_score);
  return [...sameCity, ...otherCity].slice(0, limit);
}

export function getTopPlacesPerNiche(perNiche = 3): Record<Niche, Place[]> {
  const bundle = loadPlaces();
  const result: Record<string, Place[]> = {};
  for (const niche of Object.keys(bundle.by_niche)) {
    result[niche] = getPlacesByNiche(niche as Niche).slice(0, perNiche);
  }
  return result as Record<Niche, Place[]>;
}

// ─── Per-place mentions (Naver / YouTube / Pantip about a specific business)

type PerPlaceKind = "naver" | "youtube" | "pantip" | "naver_cafe";
type PerPlaceCache = Partial<Record<PerPlaceKind, Record<string, unknown[]>>>;
const perPlaceCache: PerPlaceCache = {};

function loadPerPlace(kind: PerPlaceKind): Record<string, unknown[]> {
  if (perPlaceCache[kind]) return perPlaceCache[kind]!;
  const p = path.join(process.cwd(), "public", "data", `per_place_${kind}.json`);
  if (!fs.existsSync(p)) {
    perPlaceCache[kind] = {};
    return perPlaceCache[kind]!;
  }
  try {
    perPlaceCache[kind] = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    perPlaceCache[kind] = {};
  }
  return perPlaceCache[kind]!;
}

export type PerPlaceNaverHit = {
  blog_url: string;
  blog_title: string;
  blog_snippet: string;
  blog_date?: string;
  blogger_name?: string;
};
export type PerPlaceYoutubeHit = {
  video_id: string;
  video_url: string;
  title: string;
  channel_title: string;
  published_at?: string;
};
export type PerPlacePantipHit = {
  topic_id: string;
  topic_url: string;
  title: string;
  summary: string;
  reply_count?: string;
  posted_date?: string;
};
export type PerPlaceCafeHit = {
  cafe_url: string;
  cafe_name: string;
  post_title: string;
  post_snippet?: string;
  post_date?: string;
};
export type KlookProduct = {
  title: string;
  price_thb: number | null;
  currency: string;
  photo_url: string;
  rating: number | null;
  review_count: number | null;
  product_url: string;
  position: number;
};
export type KlookPlace = {
  search_url: string;
  products: KlookProduct[];
  scraped_at: string;
};

export function getPlaceMentions(placeId: string): {
  naver: PerPlaceNaverHit[];
  youtube: PerPlaceYoutubeHit[];
  pantip: PerPlacePantipHit[];
  cafe: PerPlaceCafeHit[];
} {
  return {
    naver: (loadPerPlace("naver")[placeId] as PerPlaceNaverHit[]) ?? [],
    youtube: (loadPerPlace("youtube")[placeId] as PerPlaceYoutubeHit[]) ?? [],
    pantip: (loadPerPlace("pantip")[placeId] as PerPlacePantipHit[]) ?? [],
    cafe: (loadPerPlace("naver_cafe")[placeId] as PerPlaceCafeHit[]) ?? [],
  };
}

export type BlogPost = {
  slug: string;
  lang: string;
  title: string;
  city: string;
  city_ko: string;
  niche: string;
  niche_ko: string;
  audience: string;
  place_ids: string[];
  place_slugs: string[];
  body_md: string;
  generated_at: string;
};

let postsCache: BlogPost[] | null = null;
export function loadBlogPosts(): BlogPost[] {
  if (postsCache !== null) return postsCache;
  const p = path.join(process.cwd(), "public", "data", "posts_ko.json");
  if (!fs.existsSync(p)) {
    postsCache = [];
    return postsCache;
  }
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf-8")) as { posts?: BlogPost[] };
    postsCache = data.posts ?? [];
  } catch {
    postsCache = [];
  }
  return postsCache;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return loadBlogPosts().find((p) => p.slug === slug);
}

let klookCache: Record<string, KlookPlace> | null = null;
export function getPlaceKlook(placeId: string): KlookPlace | null {
  if (klookCache === null) {
    const p = path.join(process.cwd(), "public", "data", "per_place_klook.json");
    if (!fs.existsSync(p)) {
      klookCache = {};
    } else {
      try {
        klookCache = JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch {
        klookCache = {};
      }
    }
  }
  return klookCache![placeId] ?? null;
}

const communityCache = new Map<Niche, CommunityBundle | null>();
export function loadCommunity(niche: Niche): CommunityBundle | null {
  if (communityCache.has(niche)) return communityCache.get(niche)!;
  const p = path.join(process.cwd(), "public", "data", "community", `${niche}.json`);
  if (!fs.existsSync(p)) { communityCache.set(niche, null); return null; }
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf-8")) as CommunityBundle;
    communityCache.set(niche, data);
    return data;
  } catch {
    communityCache.set(niche, null);
    return null;
  }
}
