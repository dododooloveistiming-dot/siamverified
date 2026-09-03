// Turn an Apify Google Maps export into public/data/per_place_hours.json.
//
//   node scripts/import-apify-hours.mjs <export.json> [more.json ...]
//
// Accepts whatever the Apify console hands you: a JSON array of items, an
// NDJSON dump (one item per line), or { items: [...] }. Matching is by
// place_id, so exports for different niches can be imported separately and
// accumulate — an existing sidecar is merged into, not replaced.
//
// See lib/hours.ts for why hours arrive this way rather than through the
// master CSVs.

import fs from "node:fs";
import path from "node:path";
import { allDaysTwentyFour, isTwentyFourHours } from "../lib/hours.ts";

const OUT = path.join(process.cwd(), "public", "data", "per_place_hours.json");
const PLACES = path.join(process.cwd(), "public", "data", "places.json");

// Apify's Google Maps actors have used several names for the same two things.
const ID_KEYS = ["placeId", "place_id", "placeID", "cid", "id"];
const HOURS_KEYS = ["openingHours", "opening_hours", "openingHoursList", "hours"];

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

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
    // NDJSON
    return raw.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  }
}

// Apify gives [{ day: "Monday", hours: "Open 24 hours" }]; some actors give
// plain strings ("Monday: 9 AM–10 PM"). Normalize both to {day, hours}.
function normalizeDays(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  const out = [];
  for (const entry of arr) {
    if (typeof entry === "string") {
      const m = entry.match(/^\s*([^:：]+)[:：]\s*(.+)$/);
      if (m) out.push({ day: m[1].trim(), hours: m[2].trim() });
      else out.push({ day: "", hours: entry.trim() });
    } else if (entry && typeof entry === "object") {
      const day = String(entry.day ?? entry.name ?? entry.weekday ?? "").trim();
      const hours = String(entry.hours ?? entry.value ?? entry.time ?? "").trim();
      if (day || hours) out.push({ day, hours });
    }
  }
  return out;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node scripts/import-apify-hours.mjs <export.json> [...]");
  process.exit(1);
}

const known = new Set();
try {
  const bundle = JSON.parse(fs.readFileSync(PLACES, "utf-8"));
  for (const p of bundle.places || bundle) known.add(p.id);
} catch {
  console.warn("! places.json unreadable - skipping the place_id match check");
}

let out = {};
if (fs.existsSync(OUT)) {
  try { out = JSON.parse(fs.readFileSync(OUT, "utf-8")); } catch { out = {}; }
}
const before = Object.keys(out).length;

let seen = 0, noId = 0, noHours = 0, unmatched = 0, added = 0, open24 = 0;

for (const file of files) {
  const items = readItems(file);
  console.log(`${path.basename(file)}: ${items.length} items`);
  for (const item of items) {
    seen++;
    const id = pick(item, ID_KEYS);
    if (!id) { noId++; continue; }
    const days = normalizeDays(pick(item, HOURS_KEYS));
    if (days.length === 0) { noHours++; continue; }
    // A place_id we don't carry is not an error - the export may be wider
    // than our index - but it is worth counting, because a high number
    // usually means the export used cid instead of placeId.
    if (known.size && !known.has(id)) { unmatched++; continue; }

    const rec = {
      days,
      open_24h: allDaysTwentyFour(days),
      source: "apify",
      fetched_at: new Date().toISOString(),
    };
    if (rec.open_24h) open24++;
    if (!(id in out)) added++;
    out[id] = rec;
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out), "utf-8");

const total = Object.keys(out).length;
console.log("");
console.log(`items read           ${seen}`);
console.log(`  no place id        ${noId}`);
console.log(`  no opening hours   ${noHours}`);
console.log(`  id not in our data ${unmatched}${unmatched > seen * 0.5 ? "   <-- check the id field (cid vs placeId)" : ""}`);
console.log(`  new records        ${added}`);
console.log("");
console.log(`per_place_hours.json ${before} -> ${total} places, ${open24} open 24h in this run`);
if (total && !Object.values(out).some((r) => r.open_24h)) {
  console.log("note: no venue in the sidecar is open 24h, so the 24h filter stays hidden.");
}
