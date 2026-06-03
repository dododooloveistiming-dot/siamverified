// scripts/apply-affiliate-ids.mjs
// Replaces PLACEHOLDER_<X>_AID tokens in the committed data with real
// affiliate IDs from scripts/affiliate-ids.json (env vars of the same name
// override the file). Run as the LAST step of `npm run data` so the IDs
// survive data rebuilds. Tokens with no real ID yet are left untouched — the
// link still works (lands on the partner), it just isn't attributed to you.
//
// Affiliate IDs are NOT secret (they appear in the public outbound URLs), so
// keeping them in a committed JSON file is fine and keeps rebuilds reproducible.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const KEYS = ["KLOOK_AID", "VIATOR_AID", "GYG_AID", "AGODA_AID", "TRIP_AID", "BOOKIMED_AID"];

const CONFIG = path.join(ROOT, "scripts", "affiliate-ids.json");
const ids = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, "utf-8")) : {};
for (const k of KEYS) if (process.env[k]) ids[k] = process.env[k]; // env override

const DATA = path.join(ROOT, "public", "data");
const byNicheDir = path.join(DATA, "by-niche");
const byNiche = fs.existsSync(byNicheDir)
  ? fs.readdirSync(byNicheDir).map((f) => path.join(byNicheDir, f))
  : [];
const files = [
  path.join(DATA, "places.json"),
  path.join(DATA, "per_place_klook.json"),
  ...byNiche,
].filter((f) => fs.existsSync(f));

const active = Object.entries(ids).filter(([, v]) => v && String(v).trim() !== "");
if (active.length === 0) {
  console.log("[affiliate-ids] no IDs set — leaving placeholders untouched.");
  process.exit(0);
}

let replaced = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf-8");
  let changed = false;
  for (const [key, val] of active) {
    const token = `PLACEHOLDER_${key}`;
    if (s.includes(token)) {
      const before = s.length;
      s = s.split(token).join(String(val).trim());
      replaced += (before - s.length) / (token.length - String(val).trim().length || 1);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(f, s, "utf-8");
}

// Report remaining placeholders (those without a real ID yet).
const remaining = {};
for (const f of files) {
  const s = fs.readFileSync(f, "utf-8");
  for (const m of s.match(/PLACEHOLDER_[A-Z_]+/g) || []) remaining[m] = (remaining[m] || 0) + 1;
}
console.log(`[affiliate-ids] applied: ${active.map(([k, v]) => `${k}=${v}`).join(", ")}`);
console.log(`[affiliate-ids] remaining (untracked) placeholders:`, JSON.stringify(remaining));
