// Build public/data/handles.json — the lookup index behind /[lang]/verify/.
//
// The verify page answers one question: "I saw this place on Instagram or
// TikTok — is it real?" So the index is keyed by the things a person can
// actually paste: a social handle, a profile URL, a website domain, or the
// venue name. Everything resolves to a compact per-place record so the page
// can render a verdict inline without shipping places.json (11 MB) to the
// browser, then deep-link to the full place page.
//
// Run: node scripts/build-handles.mjs   (wired into `npm run data`)

import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "public", "data");
const readJson = (f, fallback = {}) => {
  const p = path.join(DATA, f);
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : fallback; }
  catch (e) { console.warn(`  ! ${f}: ${e.message}`); return fallback; }
};

const bundle = readJson("places.json", { places: [] });
const places = Array.isArray(bundle) ? bundle : bundle.places || [];
const social = readJson("per_place_social.json");
const instagram = readJson("per_place_instagram.json");
const recency = readJson("per_place_recency.json");
const wayback = readJson("per_place_wayback.json");
const verifications = readJson("per_place_verifications.json");

// ── normalizers ──────────────────────────────────────────────────────────
// Kept in sync with lib/verify.ts, which runs the same normalization on
// whatever the visitor pastes. If you change one, change both.
export const normHandle = (s) =>
  String(s || "").trim().toLowerCase()
    .replace(/^@+/, "")
    .replace(/\/+$/, "")
    .replace(/[^a-z0-9._-]/g, "");

export const normDomain = (s) =>
  String(s || "").trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0];

// Venue names collide constantly in this dataset ("Let's Relax Spa" x40), so
// name lookup returns every match and the page disambiguates by city. The
// name index itself is NOT shipped -- the browser rebuilds it from the `p`
// records on load, which kept ~250 KB off the wire.
export const normName = (s) =>
  String(s || "").toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9฀-๿]+/g, " ")
    .trim();

// ── derived flags (mirrors lib/signals.ts tiers) ──────────────────────────
// SUSPECT mirrors isSuspectedViral() in build-data.mjs: rating >= 4.9 with
// fewer than 8 reviews and at most one corroborating source. It is a
// warning, not a badge -- the /verify card renders it as one.
const F = { VETERAN: 1, ESTABLISHED: 2, VERY_ACTIVE: 4, ACTIVE: 8, SUSPECT: 16, WEBSITE: 32, GOV_CERT: 64 };

function flagsFor(p) {
  let f = 0;
  const dom = normDomain(p.website);
  const wb = dom ? wayback[dom] || wayback[p.id] : wayback[p.id];
  const ageYears = wb && wb.ok && !wb.no_captures ? wb.age_years : null;
  if (ageYears != null) {
    if (ageYears >= 10) f |= F.VETERAN | F.ESTABLISHED;
    else if (ageYears >= 5) f |= F.ESTABLISHED;
  }
  const rc = recency[p.id];
  if (rc) {
    if (rc.reviews_last_30d > 0) f |= F.VERY_ACTIVE | F.ACTIVE;
    else if (rc.active_90d) f |= F.ACTIVE;
  }
  if (p.is_suspected_viral) f |= F.SUSPECT;
  if (p.website) f |= F.WEBSITE;
  const v = verifications[p.id];
  if (v && (v.sha || v.tat_attraction || v.tat_restaurant)) f |= F.GOV_CERT;
  return f;
}

const sourceCount = (p) =>
  Object.values(p.source_badges || {}).filter((n) => Number(n) > 0).length;

// ── build ────────────────────────────────────────────────────────────────
const P = [];
const ig = {}, tt = {}, fb = {}, yt = {}, ln = {}, w = {};
const put = (map, key, idx) => { if (key && !(key in map)) map[key] = idx; };

for (const p of places) {
  const idx = P.length;
  P.push([
    p.slug,
    p.name,
    p.city || "",
    p.niche,
    Math.round(p.trust_score ?? 0),
    p.rating ? Number(p.rating.toFixed(1)) : 0,
    p.review_count ?? 0,
    sourceCount(p),
    flagsFor(p),
  ]);

  const s = social[p.id] || {};
  const igRec = instagram[p.id] || {};
  put(ig, normHandle(igRec.handle || s.instagram), idx);
  put(tt, normHandle(s.tiktok), idx);
  put(fb, normHandle(s.facebook), idx);
  put(yt, normHandle(s.youtube), idx);
  put(ln, normHandle(s.line), idx);
  put(w, normDomain(p.website), idx);
}

const out = {
  v: 1,
  generated_at: new Date().toISOString(),
  p: P,
  ig, tt, fb, yt, ln, w,
};

const outPath = path.join(DATA, "handles.json");
fs.writeFileSync(outPath, JSON.stringify(out), "utf-8");

const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(`handles.json — ${P.length} places, ${kb} KB`);
console.log(
  `  instagram ${Object.keys(ig).length} · tiktok ${Object.keys(tt).length} · ` +
  `facebook ${Object.keys(fb).length} · youtube ${Object.keys(yt).length} · ` +
  `line ${Object.keys(ln).length} · domains ${Object.keys(w).length}`,
);
const flagged = (bit) => P.filter((r) => r[8] & bit).length;
console.log(
  `  flags — veteran ${flagged(F.VETERAN)} · established ${flagged(F.ESTABLISHED)} · ` +
  `very_active ${flagged(F.VERY_ACTIVE)} · active ${flagged(F.ACTIVE)} · ` +
  `suspect ${flagged(F.SUSPECT)} · gov_cert ${flagged(F.GOV_CERT)}`,
);
