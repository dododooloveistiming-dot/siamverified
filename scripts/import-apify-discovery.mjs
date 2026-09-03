// Fold an Apify discovery export into the data pipeline.
//
//   node scripts/import-apify-discovery.mjs <export.json> [more.json ...]
//
// Writes two things:
//   outreach/discovered/wellness__apify.csv     new venues, in the shape
//                                               build-data.mjs already reads
//   public/data/per_place_collection_tags.json  place_id -> collection slugs
//   public/data/per_place_hours.json            hours, if the export has them
//
// Then run `npm run data:build` to fold the CSV into places.json.
//
// The tag sidecar exists because a cold-plunge studio is usually called
// something like "The Recovery Lab" with a Google category of "Wellness
// center". lib/collections.ts matches on name + category and would miss it.
// Recording which search term surfaced a venue keeps the claim honest and
// checkable: we searched for ice baths in Bangkok, Google returned this.

import fs from "node:fs";
import path from "node:path";
import { allDaysTwentyFour } from "../lib/hours.ts";

const ROOT = process.cwd();
const TERMS_PATH = path.join(ROOT, "apify", "discovery_terms.json");
const DISCOVERED_DIR = path.join(ROOT, "outreach", "discovered");
const TAGS_PATH = path.join(ROOT, "public", "data", "per_place_collection_tags.json");
const HOURS_PATH = path.join(ROOT, "public", "data", "per_place_hours.json");
const PLACES_PATH = path.join(ROOT, "public", "data", "places.json");

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node scripts/import-apify-discovery.mjs <export.json> [...]");
  process.exit(1);
}
if (!fs.existsSync(TERMS_PATH)) {
  console.error("apify/discovery_terms.json missing - run build-apify-discovery-input.mjs first");
  process.exit(1);
}

const { niche: NICHE, terms: TERM_MAP } = JSON.parse(fs.readFileSync(TERMS_PATH, "utf-8"));

function readItems(file) {
  const raw = fs.readFileSync(file, "utf-8").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;
    if (Array.isArray(parsed.results)) return parsed.results;
    return [parsed];
  } catch {
    return raw.split("\n").map((l) => l.trim()).filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  }
}

function pick(o, keys) {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function normalizeDays(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  const out = [];
  for (const e of arr) {
    if (typeof e === "string") {
      const m = e.match(/^\s*([^:：]+)[:：]\s*(.+)$/);
      out.push(m ? { day: m[1].trim(), hours: m[2].trim() } : { day: "", hours: e.trim() });
    } else if (e && typeof e === "object") {
      const day = String(e.day ?? e.name ?? e.weekday ?? "").trim();
      const hours = String(e.hours ?? e.value ?? e.time ?? "").trim();
      if (day || hours) out.push({ day, hours });
    }
  }
  return out;
}

// Which collection a result belongs to, from the search that produced it.
// Apify echoes the query back as searchString; fall back to substring-matching
// the map's keys for actors that name the field differently.
function collectionFor(item) {
  const q = String(pick(item, ["searchString", "searchQuery", "search_string", "query"]) || "");
  if (TERM_MAP[q]) return TERM_MAP[q];
  for (const [term, coll] of Object.entries(TERM_MAP)) {
    if (q && q.toLowerCase().includes(term.toLowerCase())) return coll;
  }
  return null;
}

// place_ids we already carry — build-data dedupes too (master wins), but
// reporting the overlap here is what tells you whether the run was worth it.
const known = new Set();
try {
  const b = JSON.parse(fs.readFileSync(PLACES_PATH, "utf-8"));
  for (const p of b.places || b) known.add(p.id);
} catch { /* first run, or places.json not built yet */ }

const rows = new Map();       // place_id -> csv row
const tags = fs.existsSync(TAGS_PATH) ? JSON.parse(fs.readFileSync(TAGS_PATH, "utf-8")) : {};
const hours = fs.existsSync(HOURS_PATH) ? JSON.parse(fs.readFileSync(HOURS_PATH, "utf-8")) : {};

let seen = 0, noId = 0, noCollection = 0, already = 0, withHours = 0;
const perCollection = {};

for (const file of files) {
  const items = readItems(file);
  console.log(`${path.basename(file)}: ${items.length} items`);
  for (const item of items) {
    seen++;
    const id = pick(item, ["placeId", "place_id", "placeID", "id"]);
    if (!id) { noId++; continue; }

    const collection = collectionFor(item);
    if (!collection) { noCollection++; continue; }

    // Tag regardless of whether the venue is new — an existing venue that a
    // cold-plunge search returns should join that collection too.
    const set = new Set(tags[id] || []);
    set.add(collection);
    tags[id] = [...set];
    perCollection[collection] = (perCollection[collection] || 0) + 1;

    const days = normalizeDays(pick(item, ["openingHours", "opening_hours", "hours"]));
    if (days.length) {
      hours[id] = { days, open_24h: allDaysTwentyFour(days), source: "apify", fetched_at: new Date().toISOString() };
      withHours++;
    }

    if (known.has(id)) { already++; continue; }

    const cats = pick(item, ["categories", "categoryName", "types"]);
    rows.set(id, {
      place_id: id,
      name: String(pick(item, ["title", "name"]) || "").replace(/\s+/g, " ").trim(),
      rating: pick(item, ["totalScore", "rating"]) ?? "",
      user_ratings_total: pick(item, ["reviewsCount", "user_ratings_total", "review_count"]) ?? "",
      address: String(pick(item, ["address", "formattedAddress"]) || "").replace(/\s+/g, " ").trim(),
      types: Array.isArray(cats) ? cats.join("; ") : String(cats || ""),
      lat: item?.location?.lat ?? item?.lat ?? "",
      lng: item?.location?.lng ?? item?.lng ?? "",
    });
  }
}

// CSV with minimal quoting rules — build-data parses with relax_quotes.
const HEADERS = ["place_id", "name", "rating", "user_ratings_total", "address", "types", "lat", "lng"];
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

fs.mkdirSync(DISCOVERED_DIR, { recursive: true });
const csvPath = path.join(DISCOVERED_DIR, `${NICHE}__apify.csv`);
const csv = [HEADERS.join(",")]
  .concat([...rows.values()].map((r) => HEADERS.map((h) => esc(r[h])).join(",")))
  .join("\n");
fs.writeFileSync(csvPath, csv + "\n", "utf-8");

fs.writeFileSync(TAGS_PATH, JSON.stringify(tags), "utf-8");
if (withHours) fs.writeFileSync(HOURS_PATH, JSON.stringify(hours), "utf-8");

console.log("");
console.log(`items read             ${seen}`);
console.log(`  no place id          ${noId}`);
console.log(`  no matching search   ${noCollection}`);
console.log(`  already in places    ${already}`);
console.log(`  new venues written   ${rows.size}`);
console.log(`  hours captured       ${withHours}`);
console.log("");
console.log("tagged per collection:", JSON.stringify(perCollection));
console.log(`-> ${path.relative(ROOT, csvPath)}`);
console.log(`-> ${path.relative(ROOT, TAGS_PATH)} (${Object.keys(tags).length} places)`);
console.log("");
console.log("next: npm run data:build   (folds the CSV into places.json)");
