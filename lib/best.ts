import type { Niche, Place } from "./types";
import { getPlacesByNiche } from "./data";

// Accepts either lib/cities.ts's CitySlug or lib/guides.ts's GuideCitySlug —
// both carry slug + matches, which is all the filtering below needs.
type MinimalCity = { slug: string; matches: string[] };

function placesInMinimalCity(places: Place[], city: MinimalCity): Place[] {
  return places.filter((p) => {
    const c = (p.city || "").toLowerCase();
    return city.matches.some((m) => c === m || c.includes(m));
  });
}

// ─── Shared by app/[lang]/best/[slug]/page.tsx and any page that wants to
// cross-link into a /best/{city}-{niche}-{kind}/ page (guide, city hub).
// /[lang]/best/[city]-[niche]-[kind]/ — handcrafted long-tail SEO landing,
// e.g. /en/best/bangkok-muay-thai-established/.

export const BEST_NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

export type BestKind = "established" | "active";
export const BEST_KINDS: BestKind[] = ["established", "active"];

// A "best of" landing with fewer than this many matching places reads as
// thin content — several city×niche×kind combos have too few matches.
export const MIN_BEST_PLACES = 5;

export function bestKindPredicate(kind: BestKind): (p: Place) => boolean {
  return kind === "established"
    ? (p) => p.is_established === true
    : (p) => p.is_active_recently === true;
}

export function bestSlug(city: MinimalCity, niche: Niche, kind: BestKind): string {
  return `${city.slug}-${niche}-${kind}`;
}

export function hasEnoughBestPlaces(city: MinimalCity, niche: Niche, kind: BestKind): boolean {
  return placesInMinimalCity(getPlacesByNiche(niche), city).filter(bestKindPredicate(kind)).length >= MIN_BEST_PLACES;
}
