// scripts/slim-places.mjs
// One-shot trim of places.json — drops fields that bloat the file without
// being read by any page anymore (we moved that data to per_place_*.json
// or to listing_profiles in the DB).
//
// Run via `node scripts/slim-places.mjs`. Safe to re-run.

import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "public", "data", "places.json");
const before = fs.statSync(FILE).size;
const bundle = JSON.parse(fs.readFileSync(FILE, "utf-8"));

const DROP_FIELDS = [
  "community_mentions",  // moved to per_place_naver/pantip/youtube.json
  "videos_sample",       // not rendered in current UI
  "reviews_sample",      // sample renders top_review_text — keep first only
];

let removedReviews = 0;
for (const p of bundle.places) {
  for (const f of DROP_FIELDS) {
    if (f in p) {
      if (f === "reviews_sample" && Array.isArray(p[f])) {
        // Keep first review only; top_review_text already covers the headline
        p[f] = p[f].slice(0, 1);
        removedReviews += 1;
      } else {
        delete p[f];
      }
    }
  }
}

bundle.slimmed_at = new Date().toISOString();
fs.writeFileSync(FILE, JSON.stringify(bundle, null, 0), "utf-8");

const after = fs.statSync(FILE).size;
console.log(`[slim] before: ${(before / 1024 / 1024).toFixed(2)} MB`);
console.log(`[slim] after:  ${(after / 1024 / 1024).toFixed(2)} MB`);
console.log(`[slim] saved:  ${((before - after) / 1024 / 1024).toFixed(2)} MB`);
console.log(`[slim] reviews trimmed: ${removedReviews}`);
