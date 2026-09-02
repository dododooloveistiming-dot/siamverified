import { NextResponse } from "next/server";
import { getPlacesByNiche, toPlaceCard } from "@/lib/data";
import type { Niche } from "@/lib/types";
import { getCollection, getCollectionPlaces, liveCollections } from "@/lib/collections";

// The full PlaceCard list for one category or collection, as a static JSON
// file baked at build time.
//
// Why it exists: CategoryClient filters and sorts in the browser, so it used
// to take the entire PlaceCard[] as a prop — which Next serializes into the
// RSC flight payload. /en/c/spa/ came to 1,723 KB of HTML, 1,561 KB of it
// that payload, to render 30 cards. The page now ships only those 30 and
// fetches this endpoint when the reader actually filters (or on idle, to be
// warm before they do).
//
// It's a route handler rather than a build script because the derived signals
// CategoryClient filters on — is_established, is_veteran, is_active_recently,
// founding_year, kr_mentions — are computed in loadPlaces() from the
// per_place_* enrichment sidecars. A standalone .mjs generator would have to
// duplicate that and would drift. Same pattern as app/api/og/place/[slug].
//
// `kind` mirrors the page routes it serves: c -> /[lang]/c/[niche]/,
// w -> /[lang]/w/[collection]/.

export const runtime = "nodejs";        // loadPlaces uses fs
export const dynamic = "force-static";
export const dynamicParams = false;

const NICHES: Niche[] = [
  "muay-thai", "yoga-pilates", "wellness", "cooking", "diving", "spa", "coworking",
];

export function generateStaticParams() {
  return [
    ...NICHES.map((slug) => ({ kind: "c", slug })),
    ...liveCollections().map((c) => ({ kind: "w", slug: c.slug })),
  ];
}

export function GET(_req: Request, { params }: { params: { kind: string; slug: string } }) {
  const { kind, slug } = params;

  if (kind === "c") {
    if (!NICHES.includes(slug as Niche)) {
      return NextResponse.json({ error: "unknown niche" }, { status: 404 });
    }
    return NextResponse.json(getPlacesByNiche(slug as Niche).map(toPlaceCard));
  }

  if (kind === "w") {
    const collection = getCollection(slug);
    if (!collection) {
      return NextResponse.json({ error: "unknown collection" }, { status: 404 });
    }
    return NextResponse.json(getCollectionPlaces(collection).map(toPlaceCard));
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 404 });
}
