// Generate the Apify Google Maps Scraper input for a *discovery* pass —
// finding venues we don't have yet, as opposed to build-apify-input.mjs which
// re-scrapes the ones we do.
//
//   node scripts/build-apify-discovery-input.mjs
//   node scripts/build-apify-discovery-input.mjs ice-bath
//
// Writes apify/discovery_input.json (paste into the actor) and
// apify/discovery_terms.json (the search-term → collection map that
// scripts/import-apify-discovery.mjs needs to tag the results).
//
// Why the term map matters: a cold-plunge studio is often called "The Recovery
// Lab" with a Google category of "Wellness center". lib/collections.ts matches
// on name + category, so it would never land in the ice-bath collection on its
// own. Recording which search found it is the honest signal — we looked for
// ice baths and Google returned this — and it survives into the sidecar.

import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "apify");

// Wellness hubs, in rough order of how much of the market they hold.
const CITIES = [
  "Bangkok",
  "Chiang Mai",
  "Phuket",
  "Pattaya",
  "Koh Samui",
  "Hua Hin",
  "Krabi",
  "Koh Phangan",
];

// Terms per blocked collection. English first (these venues market to
// foreigners and usually carry English names), plus the Thai phrasing where
// it's the common one.
const TERMS = {
  "ice-bath": [
    "ice bath",
    "cold plunge",
    "cryotherapy",
    "contrast therapy",
    "recovery studio",
    "athlete recovery",
    "ห้องแช่น้ำแข็ง",
  ],
  meditation: [
    "meditation center",
    "meditation retreat",
    "vipassana",
    "mindfulness center",
    "ศูนย์ปฏิบัติธรรม",
  ],
};

// Every discovered venue enters the pipeline under this niche. `wellness` is
// the one lib/collections.ts scans for both blocked collections.
const NICHE = "wellness";

const only = process.argv.slice(2);
const collections = only.length ? only : Object.keys(TERMS);
for (const c of collections) {
  if (!TERMS[c]) {
    console.error(`unknown collection: ${c} (have: ${Object.keys(TERMS).join(", ")})`);
    process.exit(1);
  }
}

const searchStrings = [];
const termMap = {};   // search string -> collection slug

for (const collection of collections) {
  for (const term of TERMS[collection]) {
    for (const city of CITIES) {
      const q = `${term} ${city} Thailand`;
      searchStrings.push(q);
      termMap[q] = collection;
    }
  }
}

const input = {
  searchStringsArray: searchStrings,
  // 20 is past the point where Google's results stop being about the query.
  maxCrawledPlacesPerSearch: 20,
  language: "en",
  // Hours come along for free on the detail page, and these venues are new to
  // us, so we want them.
  scrapePlaceDetailPage: true,
  maxReviews: 0,
  maxImages: 0,
  maxQuestions: 0,
  scrapeReviewsPersonalData: false,
  skipClosedPlaces: true,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "discovery_input.json"), JSON.stringify(input, null, 2), "utf-8");
fs.writeFileSync(path.join(OUT_DIR, "discovery_terms.json"), JSON.stringify({ niche: NICHE, terms: termMap }, null, 2), "utf-8");

console.log(`apify/discovery_input.json   ${searchStrings.length} searches`);
for (const c of collections) {
  console.log(`  ${c}: ${TERMS[c].length} terms x ${CITIES.length} cities = ${TERMS[c].length * CITIES.length}`);
}
console.log(`  ceiling: ${searchStrings.length * input.maxCrawledPlacesPerSearch} results before dedupe`);
console.log("");
console.log("apify/discovery_terms.json   search -> collection map (used by the importer)");
console.log("");
console.log("Actor: compass/crawler-google-places  (Google Maps Scraper)");
console.log("Then: node scripts/import-apify-discovery.mjs <downloaded-export.json>");
