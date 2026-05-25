// scripts/enrich-places.mjs
// Reads the existing public/data/places.json and overlays per-place enrichment
// produced by the overnight scrapers:
//   - per_place_google.json   (deep Google scrape: 10+ photos, 5+ reviews,
//                              address, phone, website)
//   - per_place_bookable.json (Klook/Viator search has products?)
//   - per_place_photos.json   (Google CDN URL → local cached path)
//
// Writes the enriched places.json back in place. Idempotent — re-running
// uses fresh source JSONs.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "public", "data");
const PLACES_FILE = path.join(DATA_DIR, "places.json");

function loadJsonSafe(p, fallback) {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : fallback; }
  catch (e) { console.warn(`load fail: ${p}: ${e.message}`); return fallback; }
}

const placesBundle = loadJsonSafe(PLACES_FILE, null);
if (!placesBundle || !Array.isArray(placesBundle.places)) {
  console.error(`[enrich] places.json missing or invalid at ${PLACES_FILE}`);
  process.exit(1);
}

const perGoogle = loadJsonSafe(path.join(DATA_DIR, "per_place_google.json"), {});
const perBookable = loadJsonSafe(path.join(DATA_DIR, "per_place_bookable.json"), {});
const perPhotos = loadJsonSafe(path.join(DATA_DIR, "per_place_photos.json"), {});

console.log(`[enrich] sources: google=${Object.keys(perGoogle).length}, ` +
            `bookable=${Object.keys(perBookable).length}, ` +
            `photo_cache=${Object.keys(perPhotos).length}`);

// NOTE: We intentionally do NOT swap to local /place-photos/* paths in
// production places.json — the 385MB of cached image files aren't committed
// to git (would bloat the repo and Vercel deploy size). The local cache
// stays on disk for backup / future migration to a CDN like Vercel Blob.
function localizePhoto(url) {
  return url;
}

let touched = 0;
let photoAdded = 0;
let reviewAdded = 0;
let bookableAdded = 0;

for (const place of placesBundle.places) {
  if (!place.id) continue;

  const g = perGoogle[place.id];
  if (g) {
    const before = (place.photos_sample || []).length;
    const gPhotos = (g.photos || []).map(localizePhoto);
    const existing = (place.photos_sample || []).map(localizePhoto);
    // Cap at 6 photos per place — kept lean for fast page loads. Place
    // detail page also reads per_place_google.json for the full gallery.
    const merged = [...new Set([...gPhotos, ...existing])].slice(0, 6);
    if (merged.length > 0) {
      place.photos_sample = merged;
      place.top_photo_url = merged[0];
      place.photos_count = Math.max(place.photos_count || 0, merged.length);
      photoAdded += merged.length - before;
    }

    if (Array.isArray(g.reviews) && g.reviews.length > 0) {
      // Cap text at 300 chars + max 5 reviews to keep file small.
      const fresh = g.reviews.slice(0, 5).map((text) => ({
        source: "google",
        reviewer: "",
        rating: null,
        date: "",
        text: String(text).slice(0, 300),
      }));
      const beforeRevs = (place.reviews_sample || []).length;
      place.reviews_sample = [...fresh, ...(place.reviews_sample || [])].slice(0, 5);
      reviewAdded += place.reviews_sample.length - beforeRevs;
      if (!place.top_review_text && fresh[0]) place.top_review_text = fresh[0].text;
    }

    if (!place.address && g.address) place.address = g.address;
    if (!place.phone && g.phone) place.phone = g.phone;
    if (!place.website && g.website) place.website = g.website;
    place.has_google_scrape = true;
    touched += 1;
  }

  const b = perBookable[place.id];
  if (b) {
    const klook = !!b?.klook?.has_products;
    const viator = !!b?.viator?.has_products;
    place.bookable = { klook, viator };
    if (klook || viator) bookableAdded += 1;
  }
}

placesBundle.generated_at = new Date().toISOString();
placesBundle.enriched_at = new Date().toISOString();

fs.writeFileSync(PLACES_FILE, JSON.stringify(placesBundle, null, 0), "utf-8");

console.log("[enrich] DONE");
console.log(`  places touched (google):  ${touched}`);
console.log(`  net new photos:           ${photoAdded}`);
console.log(`  net new reviews:          ${reviewAdded}`);
console.log(`  places with bookable:     ${bookableAdded}`);
console.log(`  wrote → ${PLACES_FILE}`);
