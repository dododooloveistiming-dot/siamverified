import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { PlacesBundle, Place, PlaceCard, MapMarker, Niche, CommunityBundle } from "./types";
import { getPlaceSignals, computeTrustBoost } from "./signals";
import { isThaiRelevantText } from "@/lib/mentions";
import { isTinyGooglePhoto } from "@/lib/googlePhoto";

// Project a full Place down to the fields card/grid UI actually renders —
// see PlaceCard in lib/types.ts for why.
export function toPlaceCard(p: Place): PlaceCard {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    niche: p.niche,
    city: p.city,
    category: p.category,
    rating: p.rating,
    review_count: p.review_count,
    top_photo_url: p.top_photo_url,
    top_review_text: p.top_review_text,
    trust_score: p.trust_score,
    is_beginner_friendly: p.is_beginner_friendly,
    is_established: p.is_established,
    is_open_24h: p.is_open_24h,
    is_partner: p.is_partner,
    is_suspected_viral: p.is_suspected_viral,
    is_very_active: p.is_very_active,
    is_veteran: p.is_veteran,
    is_active_recently: p.is_active_recently,
    founding_year: p.founding_year,
    kr_mentions: p.kr_mentions,
    languages: p.languages,
    price_band: p.price_band,
    price_min_thb: p.price_min_thb,
    price_max_thb: p.price_max_thb,
  };
}

export function toMapMarker(p: Place): MapMarker {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    city: p.city,
    lat: p.lat,
    lng: p.lng,
    rating: p.rating,
    trust_score: p.trust_score,
    price_min_thb: p.price_min_thb,
    price_max_thb: p.price_max_thb,
  };
}

let cache: PlacesBundle | null = null;
const byNicheCache = new Map<Niche, Place[]>();

function loadJsonOrEmpty<T>(p: string): T {
  if (!fs.existsSync(p)) return {} as T;
  try { return JSON.parse(fs.readFileSync(p, "utf-8")) as T; }
  catch { return {} as T; }
}

// Upstream scrape pipeline assigns `city` carelessly — many island/Phuket
// venues land as "Bangkok" because their administrative_area lookup
// defaulted there. Re-derive from the address (which is reliably set) so
// /best/{city}-{niche}-* pages and city hubs are not wrong. Priority order
// matters: sub-city tokens beat their containing province (Ko Tao > Surat
// Thani; Rawai/Patong > Phuket, etc).
const CITY_TOKENS: Array<[RegExp, string]> = [
  // Tourist islands & beach destinations — most aggressive override
  [/\bko(h)?\s*tao\b/i, "Koh Tao"],
  [/\bko(h)?\s*pha[\-\s]?ngan\b|\bkohphangan\b/i, "Koh Phangan"],
  [/\bko(h)?\s*samui\b/i, "Koh Samui"],
  [/\bko(h)?\s*lanta\b/i, "Koh Lanta"],
  [/\bphi\s*phi\b/i, "Koh Phi Phi"],
  [/\bko(h)?\s*chang\b/i, "Koh Chang"],
  [/\bko(h)?\s*lipe\b/i, "Koh Lipe"],
  [/\b(patong|karon|kata|rawai|kamala|chalong|naka)\b/i, "Phuket"],
  [/\bphuket\b/i, "Phuket"],
  [/\bkhao\s*lak\b/i, "Khao Lak"],
  [/\bphang[\-\s]?nga\b/i, "Phang Nga"],
  [/\bao\s*nang\b|\brailay\b|\bkrabi\b/i, "Krabi"],
  // Mainland tourist cities
  [/\bhua\s*hin\b|\bcha[\-\s]?am\b/i, "Hua Hin"],
  [/\bpattaya\b|\bjomtien\b|\bbang\s*saray\b/i, "Pattaya"],
  [/\bchiang\s*mai\b|\bmae\s*rim\b|\bsan\s*sai\b|\bhang\s*dong\b/i, "Chiang Mai"],
  [/\bchiang\s*rai\b/i, "Chiang Rai"],
  // Bangkok-area suburbs that should NOT collapse into Bangkok
  [/\bnonthaburi\b/i, "Nonthaburi"],
  [/\bsamut\s*prakan\b/i, "Samut Prakan"],
  [/\bpathum\s*thani\b/i, "Pathum Thani"],
  // Bangkok (broad fallback — must come last so sub-cities win)
  [/\bbangkok\b|\bkrung\s*thep\b/i, "Bangkok"],
];

function deriveCity(address: string | undefined | null, fallback: string): string {
  if (!address) return fallback;
  for (const [re, canonical] of CITY_TOKENS) {
    if (re.test(address)) return canonical;
  }
  return fallback;
}

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
  // Load Korean-mention counts (naver blog + cafe) so cards can surface a
  // KR-discovery badge. Read once before the per-place loop to amortize.
  const naverHits = loadJsonOrEmpty<Record<string, unknown[]>>(
    path.join(process.cwd(), "public", "data", "per_place_naver.json"),
  );
  const cafeHits = loadJsonOrEmpty<Record<string, unknown[]>>(
    path.join(process.cwd(), "public", "data", "per_place_naver_cafe.json"),
  );
  // Apply enrichment-signal boost so wayback/recency/email infra feed into
  // ranking everywhere — not just the badges on the detail page. Also project
  // the boolean flags onto each place so client-side filters (CategoryClient)
  // can use them without re-loading the server-only signal JSONs.
  let trustSum = 0;
  for (const place of bundle.places) {
    // Re-derive city from address before doing anything else — boost,
    // signal flags, city-scoped pages all depend on the corrected value.
    place.city = deriveCity(place.address, place.city);
    // 32×32 avatar/icon crops slip into photos_sample from the scrape —
    // never usable as a hero or card image. Drop them before any other
    // photo logic picks one.
    if (place.photos_sample?.length) {
      place.photos_sample = place.photos_sample.filter((u) => !isTinyGooglePhoto(u));
    }
    // Google's `/gps-cs-s/` photo CDN URLs are session tokens that expire
    // within weeks; the older `/p/` format is a stable, non-expiring URL.
    // Prefer a stable sample photo for the card thumbnail when one exists.
    if (place.top_photo_url && place.top_photo_url.includes("/gps-cs-s/")) {
      const stable = (place.photos_sample || []).find((u) => u.includes("/p/"));
      if (stable) place.top_photo_url = stable;
    }
    if (place.top_photo_url && isTinyGooglePhoto(place.top_photo_url)) {
      const better = (place.photos_sample || []).find((u) => !isTinyGooglePhoto(u));
      place.top_photo_url = better || "";
    }
    const signals = getPlaceSignals(place.id);
    const boost = computeTrustBoost(signals);
    if (boost > 0) place.trust_score = Math.min(100, place.trust_score + boost);
    if (signals.ageTier === "veteran") place.is_veteran = true;
    if (signals.ageTier === "veteran" || signals.ageTier === "established") place.is_established = true;
    if (signals.recencyTier === "very_active") place.is_very_active = true;
    if (signals.recencyTier === "very_active" || signals.recencyTier === "active") place.is_active_recently = true;
    if (signals.foundingYear) place.founding_year = signals.foundingYear;
    const krCount = (naverHits[place.id] || []).length + (cafeHits[place.id] || []).length;
    if (krCount > 0) place.kr_mentions = krCount;
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
  const places = loadPlaces().places
    .filter((p) => p.niche === niche)
    .sort((a, b) => b.trust_score - a.trust_score);
  byNicheCache.set(niche, places);
  return places;
}

// Next.js delivers route params percent-encoded when the segment contains
// non-ASCII characters (many slugs embed the Thai business name), so a raw
// `===` comparison against the stored (decoded) slug silently misses ~20%
// of places. Decode defensively — already-decoded ASCII slugs round-trip
// unchanged, and a malformed sequence just falls back to the raw string.
export function decodeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function getPlaceBySlug(slug: string): Place | undefined {
  const decoded = decodeSlugParam(slug);
  return loadPlaces().places.find((p) => p.slug === decoded);
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

export type ReplyTimeStats = {
  avgHours: number;
  sampleSize: number;
};

/**
 * Owner reply-time stats for a claimed listing. Closes the speed-gap
 * narrative vs Klook's instant booking — when shown, demonstrates the
 * owner actually responds. Requires ≥3 replied inquiries to surface.
 */
export async function getReplyTimeStats(placeId: string): Promise<ReplyTimeStats | null> {
  // Skip the DB during static generation (`next build`) — these owner overlays
  // are filled in at runtime via ISR revalidation instead. Avoids a DB
  // roundtrip per prebuilt place page, which was slowing the build to a crawl.
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  try {
    const { db, inquiries } = await import("./db");
    const { sql, eq, and, isNotNull } = await import("drizzle-orm");
    const rows = await db
      .select({
        avg: sql<number>`AVG(EXTRACT(EPOCH FROM (${inquiries.repliedAt} - ${inquiries.createdAt})))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(inquiries)
      .where(and(eq(inquiries.placeId, placeId), isNotNull(inquiries.repliedAt)));
    const r = rows[0];
    const cnt = Number(r?.count ?? 0);
    if (!r || cnt < 3) return null;
    const avgSec = Number(r.avg ?? 0);
    return { avgHours: Math.round((avgSec / 3600) * 10) / 10, sampleSize: cnt };
  } catch (e) {
    console.warn("[data] getReplyTimeStats failed:", e);
    return null;
  }
}

/**
 * Fetch the live owner-controlled profile from listing_profiles.
 * Called from server-rendered place pages. Returns null if no claimed
 * owner has filled in custom content yet.
 */
export async function getOwnerProfile(placeId: string): Promise<OwnerProfile | null> {
  // Skip the DB during static generation (`next build`) — the owner overlay is
  // fetched at runtime via ISR revalidation (revalidate=600 on the place page).
  // Avoids a DB roundtrip per prebuilt place page (the build-time bottleneck).
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
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
  return [...loadPlaces().places]
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, limit);
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

export function getPlaceMentions(placeId: string): {
  naver: PerPlaceNaverHit[];
  youtube: PerPlaceYoutubeHit[];
  pantip: PerPlacePantipHit[];
  cafe: PerPlaceCafeHit[];
} {
  const naverRaw = (loadPerPlace("naver")[placeId] as PerPlaceNaverHit[]) ?? [];
  const cafeRaw = (loadPerPlace("naver_cafe")[placeId] as PerPlaceCafeHit[]) ?? [];
  return {
    // Korean matches are fuzzy — keep only ones whose title/snippet actually
    // reference Thailand, so same-named Korean businesses are filtered out.
    naver: naverRaw.filter((h) => isThaiRelevantText(`${h.blog_title ?? ""} ${h.blog_snippet ?? ""}`)),
    youtube: (loadPerPlace("youtube")[placeId] as PerPlaceYoutubeHit[]) ?? [],
    pantip: (loadPerPlace("pantip")[placeId] as PerPlacePantipHit[]) ?? [],
    cafe: cafeRaw.filter((h) => isThaiRelevantText(`${h.post_title ?? ""} ${h.post_snippet ?? ""}`)),
  };
}

// Korean one-line summary of a place's Thai Google reviews (generated offline
// by scripts/translate_reviews_ko.mjs). Shown on /ko so Korean readers get the
// gist without reading the collapsed Thai reviews. Null if not generated.
let reviewKoCache: Record<string, string> | null = null;
export function getReviewKo(placeId: string): string | null {
  if (reviewKoCache === null) {
    reviewKoCache = loadJsonOrEmpty<Record<string, string>>(
      path.join(process.cwd(), "public", "data", "per_place_review_ko.json"),
    );
  }
  return reviewKoCache[placeId] ?? null;
}

export type YtSearchVideo = {
  video_id: string;
  url: string;
  title: string;
  channel: string;
  views_text: string;
  duration: string;
  published: string;
};
let ytSearchCache: Record<string, YtSearchVideo[]> | null = null;
export function getYoutubeSearch(placeId: string): YtSearchVideo[] {
  if (ytSearchCache === null) {
    ytSearchCache = loadJsonOrEmpty<Record<string, YtSearchVideo[]>>(
      path.join(process.cwd(), "public", "data", "per_place_youtube_search.json"),
    );
  }
  return ytSearchCache[placeId] ?? [];
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
