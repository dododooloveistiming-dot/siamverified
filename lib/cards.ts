import type { PlaceCard } from "./types";

// Pure helpers shared by the category/collection pages (server) and
// CategoryClient (client). No fs, no server-only imports — lib/data.ts is
// server-only, so anything both sides need lives here instead.

export const CATEGORY_PAGE_SIZE = 30;

// CategoryClient's default state: viral-suspect venues hidden, sorted by
// trust. The server renders exactly this slice so the first paint is
// byte-identical to what the client would compute, and the full list can stay
// out of the RSC payload until someone actually filters.
// See app/api/cards/[kind]/[slug]/route.ts.
export function defaultSortedCards(cards: PlaceCard[]): PlaceCard[] {
  return cards
    .filter((p) => !p.is_suspected_viral)
    .sort((a, b) => b.trust_score - a.trust_score);
}

export function initialCards(cards: PlaceCard[]): PlaceCard[] {
  return defaultSortedCards(cards).slice(0, CATEGORY_PAGE_SIZE);
}

// The city chips. Computed server-side now — it needs every card, and
// shipping every card to the browser is the thing we're avoiding.
export const CITY_FACET_LIMIT = 12;

export function cityFacets(cards: PlaceCard[]): string[] {
  const counts = new Map<string, number>();
  for (const p of cards) {
    if (p.city) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, CITY_FACET_LIMIT)
    .map(([c]) => c);
}
