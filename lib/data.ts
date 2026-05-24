import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { PlacesBundle, Place, Niche, CommunityBundle } from "./types";

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
  cache = JSON.parse(raw) as PlacesBundle;
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

type PerPlaceCache = {
  naver?: Record<string, unknown[]>;
  youtube?: Record<string, unknown[]>;
  pantip?: Record<string, unknown[]>;
};
const perPlaceCache: PerPlaceCache = {};

function loadPerPlace(kind: "naver" | "youtube" | "pantip"): Record<string, unknown[]> {
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

export function getPlaceMentions(placeId: string): {
  naver: PerPlaceNaverHit[];
  youtube: PerPlaceYoutubeHit[];
  pantip: PerPlacePantipHit[];
} {
  return {
    naver: (loadPerPlace("naver")[placeId] as PerPlaceNaverHit[]) ?? [],
    youtube: (loadPerPlace("youtube")[placeId] as PerPlaceYoutubeHit[]) ?? [],
    pantip: (loadPerPlace("pantip")[placeId] as PerPlacePantipHit[]) ?? [],
  };
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
