import type { Niche, Place } from "./types";
import { getPlacesByNiche } from "./data";

// ─── Shared by app/[lang]/guide/[slug]/page.tsx and app/sitemap.ts ─────────
// /[lang]/guide/[city]-[niche]/ — auto-generated city × niche guide.
// e.g. /en/guide/bangkok-yoga-pilates/
//
// Lives here (not in the page file) because Next.js's route-export
// validation rejects page.tsx files that export anything beyond the
// reserved route symbols (default/metadata/generateStaticParams/etc.) —
// sitemap.ts needs these too, so a shared module is the only option.

export type GuideCitySlug = { slug: string; label: string; matches: string[] };

export const CITY_SLUGS: GuideCitySlug[] = [
  { slug: "bangkok", label: "Bangkok", matches: ["bangkok"] },
  { slug: "chiang-mai", label: "Chiang Mai", matches: ["chiang mai", "chiangmai"] },
  { slug: "phuket", label: "Phuket", matches: ["phuket"] },
  { slug: "pattaya", label: "Pattaya", matches: ["pattaya"] },
  { slug: "hua-hin", label: "Hua Hin", matches: ["hua hin", "huahin"] },
  { slug: "koh-samui", label: "Koh Samui", matches: ["koh samui", "samui"] },
];

export const NICHE_SLUGS: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

export function parseGuideSlug(slug: string): { city: GuideCitySlug; niche: Niche } | null {
  for (const c of CITY_SLUGS) {
    for (const n of NICHE_SLUGS) {
      if (slug === `${c.slug}-${n}`) {
        return { city: c, niche: n };
      }
    }
  }
  return null;
}

export function placesInGuideCity(places: Place[], city: GuideCitySlug): Place[] {
  return places.filter((p) => {
    const c = (p.city || "").toLowerCase();
    return city.matches.some((m) => c === m || c.includes(m));
  });
}

// A "Top N" guide with fewer than this many businesses isn't a real ranked
// list — several city×niche combos have zero matches (e.g. Hua Hin diving)
// yet were still built, sitemapped, and linked from nav as "Top 0 …" pages.
export const MIN_GUIDE_PLACES = 3;

export function hasEnoughGuidePlaces(city: GuideCitySlug, niche: Niche): boolean {
  return placesInGuideCity(getPlacesByNiche(niche), city).length >= MIN_GUIDE_PLACES;
}
