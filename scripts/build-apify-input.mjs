// Generate the Apify Google Maps Scraper input for an opening-hours pass.
//
//   node scripts/build-apify-input.mjs             # all places
//   node scripts/build-apify-input.mjs spa diving  # only those niches
//   node scripts/build-apify-input.mjs --missing   # only ones we lack hours for
//
// Writes apify/hours_input.json — paste it into the actor's JSON input tab.
//
// Targets each venue by place_id rather than by search string: a search for
// "Let's Relax Spa Bangkok" returns forty different branches and we would have
// no reliable way to match the result back. `?q=place_id:` resolves to exactly
// one venue, and the actor echoes placeId back in the output, which is what
// scripts/import-apify-hours.mjs joins on.

import fs from "node:fs";
import path from "node:path";

const PLACES = path.join(process.cwd(), "public", "data", "places.json");
const OUT_DIR = path.join(process.cwd(), "apify");
const OUT = path.join(OUT_DIR, "hours_input.json");

const args = process.argv.slice(2);
const missingOnly = args.includes("--missing");
const niches = args.filter((a) => !a.startsWith("--"));
const bundle = JSON.parse(fs.readFileSync(PLACES, "utf-8"));
const all = bundle.places || bundle;

let wanted = niches.length ? all.filter((p) => niches.includes(p.niche)) : all;

// A run can be cut short (rate limits, credits, a stopped actor). --missing
// diffs against the sidecar so a follow-up pass only pays for what's absent.
let alreadyHave = 0;
if (missingOnly) {
  let have = {};
  try {
    have = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "per_place_hours.json"), "utf-8"));
  } catch { /* no sidecar yet - everything is missing */ }
  const before = wanted.length;
  wanted = wanted.filter((p) => !have[p.id]);
  alreadyHave = before - wanted.length;
}

// Only Google place ids resolve through ?q=place_id:. A few rows carry ids
// from other sources; they are skipped rather than sent as broken URLs.
const usable = wanted.filter((p) => /^ChIJ|^GhIJ|^Ei/.test(String(p.id || "")));
const skipped = wanted.length - usable.length;

const input = {
  startUrls: usable.map((p) => ({
    url: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
  })),
  // Opening hours only exist on the place detail page.
  scrapePlaceDetailPage: true,
  language: "en",
  // Everything below is cost control: we already have reviews, photos and
  // contact data. This pass is for hours.
  maxReviews: 0,
  maxImages: 0,
  maxQuestions: 0,
  scrapeReviewsPersonalData: false,
  skipClosedPlaces: false,
  maxCrawledPlacesPerSearch: 1,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(input, null, 2), "utf-8");

const mb = (fs.statSync(OUT).size / 1e6).toFixed(2);
console.log(`apify/hours_input.json  ${usable.length} places, ${mb} MB`);
if (skipped) console.log(`  skipped ${skipped} rows with a non-Google place id`);
if (missingOnly) console.log(`  already have hours for ${alreadyHave} - excluded`);
if (niches.length) console.log(`  niches: ${niches.join(", ")}`);
console.log("");
console.log("Actor: compass/crawler-google-places  (Google Maps Scraper)");
console.log("Paste this file into the actor's JSON input tab, run it, then:");
console.log("  node scripts/import-apify-hours.mjs <downloaded-export.json>");
