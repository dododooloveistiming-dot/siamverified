// scripts/build-data.mjs
// Reads 7 master CSVs (4 currently exist, 3 will appear as background pipeline finishes)
// Emits: public/data/places.json + public/data/by-niche/<niche>.json
//
// Idempotent: if a master CSV doesn't exist yet, that niche is silently skipped.
// Re-run `npm run data` after new pipelines finish to refresh.

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const SOURCES = [
  { niche: "muay-thai",    folder: "muaythai",  csv: "C:\\dbd-scraper\\muaythai\\thaimuaythai_master.csv",       relCols: ["is_muay_relevant", "muay_relevant", "muaythai_relevant"] },
  { niche: "yoga-pilates", folder: "pilates",   csv: "C:\\dbd-scraper\\pilates\\thaipilatesyoga_master.csv",    relCols: ["is_pilates_relevant", "pilates_relevant"] },
  { niche: "wellness",     folder: "wellness",  csv: "C:\\dbd-scraper\\wellness\\thaiwellness_master.csv",      relCols: ["is_wellness_relevant", "wellness_relevant"] },
  { niche: "cooking",      folder: "cooking",   csv: "C:\\dbd-scraper\\cooking\\thaicooking_master.csv",        relCols: ["is_cooking_relevant", "cooking_relevant"] },
  { niche: "diving",       folder: "diving",    csv: "C:\\dbd-scraper\\diving\\thaidiving_master.csv",          relCols: ["diving_relevant", "is_diving_relevant"] },
  { niche: "spa",          folder: "spa",       csv: "C:\\dbd-scraper\\spa\\thaispa_master.csv",                relCols: ["spa_relevant", "is_spa_relevant"] },
  { niche: "coworking",    folder: "coworking", csv: "C:\\dbd-scraper\\coworking\\thaicoworking_master.csv",    relCols: ["coworking_relevant", "is_coworking_relevant"] },
];

const OUT_DIR = path.join(process.cwd(), "public", "data");
const OUT_BY_NICHE_DIR = path.join(OUT_DIR, "by-niche");
const OUT_COMMUNITY_DIR = path.join(OUT_DIR, "community");
const OUT_FILE = path.join(OUT_DIR, "places.json");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(OUT_BY_NICHE_DIR, { recursive: true });
fs.mkdirSync(OUT_COMMUNITY_DIR, { recursive: true });

// ─── Per-place enrichment from overnight scrape ────────────────────────
// Loaded once and consulted per place: deep Google scrape (photos / reviews /
// hours / phone / website), Bookable verification (does Klook/Viator have
// real products?), and the image-cache map (Google CDN URL → local file).
function loadJsonSafe(p, fallback = {}) {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : fallback; }
  catch { return fallback; }
}
const PER_GOOGLE = loadJsonSafe(path.join(OUT_DIR, "per_place_google.json"));
const PER_BOOKABLE = loadJsonSafe(path.join(OUT_DIR, "per_place_bookable.json"));
const PER_PHOTO_MAP = loadJsonSafe(path.join(OUT_DIR, "per_place_photos.json"));
// Place Details (Places API v1) cache — filled in by enrich_place_details.py
// for venues discovered without website/phone. Drives the loadDiscoveredRows
// shaper so the discovered places are no longer wayback/DNS/email-blind.
const PER_DETAILS = loadJsonSafe(path.join(OUT_DIR, "_raw", "place_details_cache.json"));
console.log(`[enrich] google=${Object.keys(PER_GOOGLE).length}, ` +
            `bookable=${Object.keys(PER_BOOKABLE).length}, ` +
            `photo_cache=${Object.keys(PER_PHOTO_MAP).length}, ` +
            `place_details=${Object.keys(PER_DETAILS).length}`);

function localizePhoto(url) {
  // If we cached the photo locally, prefer that path (faster + immortal).
  return PER_PHOTO_MAP[url] || url;
}

function enrichPlace(place) {
  const g = PER_GOOGLE[place.id];
  if (g) {
    // Merge Google photos in front of any existing sample, dedup, cap at 15
    const gPhotos = (g.photos || []).map(localizePhoto);
    const existing = (place.photos_sample || []).map(localizePhoto);
    const merged = [...new Set([...gPhotos, ...existing])].slice(0, 15);
    if (merged.length > 0) {
      place.photos_sample = merged;
      place.top_photo_url = merged[0];
      place.photos_count = Math.max(place.photos_count || 0, merged.length);
    }
    // Bring in Google reviews if we have none scraped yet
    if (g.reviews && g.reviews.length > 0 && (!place.reviews_sample || place.reviews_sample.length < 3)) {
      const ggReviews = g.reviews.map((text) => ({
        source: "google",
        reviewer: "",
        rating: null,
        date: "",
        text: String(text).slice(0, 800),
      }));
      place.reviews_sample = [...(place.reviews_sample || []), ...ggReviews].slice(0, 10);
      if (!place.top_review_text && ggReviews[0]) {
        place.top_review_text = ggReviews[0].text;
      }
    }
    // Address / phone / website refresh if missing
    if (!place.address && g.address) place.address = g.address;
    if (!place.phone && g.phone) place.phone = g.phone;
    if (!place.website && g.website) place.website = g.website;
    place.has_google_scrape = true;
  }
  // Bookable flag (Klook/Viator search returned actual products)
  const b = PER_BOOKABLE[place.id];
  if (b) {
    place.bookable = {
      klook: !!b?.klook?.has_products,
      viator: !!b?.viator?.has_products,
    };
  }
  return place;
}

// Read broad scraper CSV (Naver / Pantip / Reddit) for a niche folder.
// Source order (first hit wins):
//   1. local ./external_data/{folder}/...  (from tools/community_scrapers/siamverified_harvest)
//   2. legacy C:\dbd-scraper\{folder}\...  (kept for the old computer's pipeline)
const LOCAL_EXTERNAL_DATA = path.join(process.cwd(), "external_data");

// Read all outreach/discovered/{niche}__*.csv produced by
// scripts/discover_gaps.py. Each row gets mapped to the dbd-scraper master
// CSV shape so the existing normalize() pipeline can consume it unchanged.
// place_id-deduped against the master rows in the caller — master wins.
const DISCOVERED_DIR = path.join(process.cwd(), "outreach", "discovered");
function loadDiscoveredRows(niche, relCols) {
  if (!fs.existsSync(DISCOVERED_DIR)) return [];
  const files = fs.readdirSync(DISCOVERED_DIR).filter((f) =>
    f.startsWith(`${niche}__`) && f.endsWith(".csv"),
  );
  const out = [];
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(DISCOVERED_DIR, f), "utf-8");
      const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
      for (const r of rows) {
        if (!r.place_id || !r.name) continue;
        // Place Details overlay (paid for via scripts/enrich_place_details.py,
        // cached locally). When present, gives us website + phone +
        // businessStatus so the discovered place stops being wayback-blind.
        const det = PER_DETAILS[r.place_id] || {};
        if (det.businessStatus === "CLOSED_PERMANENTLY") continue;
        const website = det.websiteUri || "";
        const phone = det.nationalPhoneNumber || det.internationalPhoneNumber || "";
        // Shape to dbd-master columns so normalize() reads it cleanly.
        const shaped = {
          place_id: r.place_id,
          name: r.name,
          rating: r.rating || "",
          review_count: r.user_ratings_total || "",
          address: r.address || "",
          city: "",                  // re-derived in lib/data.ts from address
          category: (r.types || "").replace(/;/g, ", ").slice(0, 80),
          google_maps_url: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
          website: website,
          phone: phone,
          reviews_scraped_count: "",
          photos_count: "",
          videos_count: "",
          data_sources: "discovery",
        };
        // Set the niche's relevance flag so the existing filter accepts it.
        for (const col of relCols) shaped[col] = "1";
        out.push(shaped);
      }
    } catch (e) {
      console.warn(`  discovered CSV read fail (${f}): ${e.message}`);
    }
  }
  return out;
}

function loadBroadCsv(folder, kind) {
  const fname = kind === "naver"  ? `${folder}_naver_blogs_broad.csv`
              : kind === "pantip" ? `${folder}_pantip_threads.csv`
              : kind === "reddit" ? `${folder}_reddit_threads.csv`
              : null;
  if (!fname) return [];
  const candidates = [
    path.join(LOCAL_EXTERNAL_DATA, folder, fname),
    path.join(`C:\\dbd-scraper\\${folder}`, fname),
  ];
  const p = candidates.find((c) => fs.existsSync(c));
  if (!p) return [];
  try {
    const raw = fs.readFileSync(p, "utf-8").replace(/^﻿/, "");
    return parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
  } catch (e) {
    console.warn(`  broad CSV read fail (${kind}): ${e.message}`);
    return [];
  }
}

// Normalize a broad-scraper row into common Thread shape
function normalizeThread(t, kind) {
  if (kind === "reddit") {
    return {
      kind: "reddit",
      title: String(t.title || "").slice(0, 220),
      url: String(t.url || t.permalink || ""),
      snippet: String(t.selftext || "").slice(0, 350),
      score: parseInt(t.score) || 0,
      comments: parseInt(t.num_comments) || 0,
      author: String(t.author || "").slice(0, 40),
      subreddit: String(t.subreddit || ""),
      date: String(t.created_utc || "").slice(0, 10),
    };
  }
  if (kind === "pantip") {
    return {
      kind: "pantip",
      title: String(t.title || "").slice(0, 220),
      url: String(t.topic_url || ""),
      snippet: String(t.summary || "").slice(0, 350),
      score: parseInt(t.like_count) || 0,
      comments: parseInt(t.comments_count) || 0,
      author: String(t.author || "").slice(0, 40),
      subreddit: "",
      date: String(t.posted_date || "").slice(0, 10),
    };
  }
  // naver
  return {
    kind: "naver",
    title: String(t.blog_title || "").slice(0, 220),
    url: String(t.blog_url || ""),
    snippet: String(t.blog_snippet || "").slice(0, 350),
    score: 0,
    comments: 0,
    author: String(t.blogger_name || "").slice(0, 40),
    subreddit: "",
    date: String(t.blog_date || "").slice(0, 10),
  };
}

// Top N threads sorted by engagement (reddit score > comments > recency)
function topThreads(threads, n) {
  return [...threads]
    .sort((a, b) => (b.score + b.comments / 5) - (a.score + a.comments / 5))
    .slice(0, n);
}

// Fuzzy-match place name against thread titles/snippets.
// Returns top 3 threads with >=1 distinctive token match.
const STOPWORDS = new Set([
  "thai", "thailand", "bangkok", "phuket", "chiang", "mai", "samui", "koh",
  "diving", "yoga", "pilates", "muay", "spa", "massage", "cooking", "studio",
  "school", "center", "centre", "club", "academy", "gym", "studio", "the", "and",
  "training", "class", "course", "tour", "thai-style", "thaistyle",
]);

function fuzzyMatchThreads(placeName, threads) {
  const lower = String(placeName || "").toLowerCase();
  const tokens = lower
    .split(/[^a-z0-9가-힯ก-๏]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
  if (tokens.length === 0) return [];
  // First 2 distinctive tokens (most likely brand name)
  const distinctive = tokens.slice(0, 2);
  const matches = [];
  for (const t of threads) {
    const haystack = ((t.title || "") + " " + (t.snippet || "")).toLowerCase();
    let hits = 0;
    for (const tok of distinctive) {
      if (haystack.includes(tok)) hits++;
    }
    if (hits >= distinctive.length) {  // require ALL distinctive tokens
      matches.push({ ...t, _hits: hits });
    }
  }
  matches.sort((a, b) => (b._hits - a._hits) || (b.score + b.comments / 5) - (a.score + a.comments / 5));
  return matches.slice(0, 3).map(({ _hits, ...rest }) => rest);
}

function safeJson(v, fallback) {
  if (typeof v !== "string" || !v.trim().startsWith("[")) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}

function num(v, fallback = 0) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function bool(v) {
  if (v === true || v === "True" || v === "true" || v === 1 || v === "1") return true;
  return false;
}

function slugify(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿가-힯]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function priceBand(v) {
  const s = String(v || "").toLowerCase();
  if (["budget", "mid", "premium", "luxury"].includes(s)) return s;
  return "unknown";
}

// Multi-source Trust Score (0-100). Weighted for "real users vs viral marketing".
// Heavily favors SOURCE DIVERSITY (Google + Reddit + Naver + Pantip + YouTube + Website + Bookimed).
function trustScore(r) {
  const reviews = num(r.reviews_scraped_count);
  const photos = num(r.photos_count);
  const videos = num(r.videos_count);
  const rating = num(r.rating);
  const reviewCount = num(r.review_count);
  const hasWebsite = bool(r.website_data_present) || String(r.website_main_content || "").length > 100;
  const hasBookimed = !!r.bookimed_slug;
  const dataSources = String(r.data_sources || "").split(",").map((s) => s.trim()).filter(Boolean);
  // Diversity bonus (≤25 pts)
  const sourceCount = Math.min(
    [reviews > 0, photos > 0, videos > 0, hasWebsite, hasBookimed, dataSources.includes("naver"), dataSources.includes("pantip"), dataSources.includes("reddit")].filter(Boolean).length,
    8,
  );
  const diversity = (sourceCount / 8) * 25;
  // Volume + quality (≤45 pts)
  const ratingScore = rating > 0 ? Math.min(rating / 5, 1) * 15 : 0;
  const reviewVolume = Math.min(Math.log10(reviewCount + 1) / Math.log10(500), 1) * 15;
  const photoVolume = Math.min(photos / 8, 1) * 10;
  const videoVolume = Math.min(videos / 5, 1) * 5;
  // Beginner-friendly bonus (≤5 pts) — useful for travelers
  const beginnerBonus = bool(r.is_beginner_friendly) ? 5 : 0;
  // Booking-affiliate availability bonus (≤5 pts)
  const affiliateBonus = (r.klook_search_url ? 2 : 0) + (r.agoda_search_url ? 2 : 0) + (r.bookimed_slug ? 1 : 0);
  return Math.round(diversity + ratingScore + reviewVolume + photoVolume + videoVolume + beginnerBonus + affiliateBonus);
}

function isSuspectedViral(r) {
  const rating = num(r.rating);
  const reviewCount = num(r.review_count);
  const sources = [
    num(r.reviews_scraped_count) > 0,
    num(r.photos_count) > 0,
    num(r.videos_count) > 0,
    !!r.website_main_content,
  ].filter(Boolean).length;
  return rating >= 4.9 && reviewCount < 8 && sources <= 1;
}

function relevant(r, relCols) {
  for (const c of relCols) {
    if (r[c] !== undefined) return bool(r[c]);
  }
  return true; // if no relevance column, assume relevant (new niches default)
}

function normalize(r, niche) {
  const reviews = safeJson(r.reviews_json, []);
  const photos = safeJson(r.photo_urls_json, []);
  const videos = safeJson(r.videos_json, []);
  return {
    id: r.place_id,
    slug: slugify(`${niche}-${r.name}-${String(r.place_id || "").slice(-6)}`),
    niche,
    name: r.name || "",
    address: r.address || "",
    city: r.city || "",
    rating: num(r.rating) || null,
    review_count: num(r.review_count) || null,
    phone: r.phone || "",
    website: r.website || "",
    category: r.category || "",
    google_maps_url: r.google_maps_url || "",
    reviews_scraped_count: num(r.reviews_scraped_count),
    avg_scraped_rating: num(r.avg_scraped_rating) || null,
    top_review_text: (r.top_review_text || "").slice(0, 600),
    reviews_sample: (reviews || []).slice(0, 5).map((rv) => ({
      source: rv.source || "google",
      reviewer: (rv.reviewer || "").slice(0, 60),
      rating: rv.rating ?? null,
      date: (rv.date || "").slice(0, 20),
      text: (rv.text || "").slice(0, 400),
    })),
    photos_count: num(r.photos_count) || photos.length,
    top_photo_url: r.top_photo_url || photos[0] || "",
    photos_sample: photos.slice(0, 8),
    videos_count: num(r.videos_count) || videos.length,
    top_video_id: r.top_video_id || (videos[0] && videos[0].video_id) || "",
    videos_sample: videos.slice(0, 3).map((v) => ({
      video_id: v.video_id || "",
      title: (v.title || "").slice(0, 200),
      channel: v.channel || "",
    })),
    price_min_thb: num(r.price_min_thb),
    price_max_thb: num(r.price_max_thb),
    price_unit: r.price_unit || "unknown",
    price_band: priceBand(r.price_band),
    opening_hours_json: r.opening_hours_json || "",
    is_open_24h: bool(r.is_open_24h),
    is_beginner_friendly: bool(r.is_beginner_friendly),
    is_advanced_oriented: bool(r.is_advanced_oriented),
    beginner_score: num(r.beginner_score),
    languages: {
      en: bool(r.is_english_friendly),
      ko: bool(r.is_korean_friendly),
      th: true,
      zh: bool(r.is_chinese_friendly),
      ja: bool(r.is_japanese_friendly),
      ar: bool(r.is_arabic_friendly),
    },
    source_badges: {
      google_reviews: num(r.reviews_scraped_count),
      photos: num(r.photos_count),
      videos: num(r.videos_count),
      reddit: String(r.data_sources || "").includes("reddit") ? 1 : 0,
      naver: String(r.data_sources || "").includes("naver") ? 1 : 0,
      pantip: String(r.data_sources || "").includes("pantip") ? 1 : 0,
      website: r.website_main_content ? 1 : 0,
      booking: 0,
      bookimed: r.bookimed_slug ? 1 : 0,
    },
    trust_score: trustScore(r),
    is_suspected_viral: isSuspectedViral(r),
    affiliate: {
      klook: r.klook_search_url || "",
      viator: r.viator_search_url || "",
      getyourguide: r.getyourguide_search_url || "",
      agoda: r.agoda_search_url || "",
      tripcom: r.tripcom_search_url || "",
      bookimed: r.bookimed_url || "",
    },
    is_partner: false,
  };
}

// Safety: if no master CSVs AND no local external_data exists, abort and
// leave the existing places.json intact (e.g., on Vercel).
const anyMasterExists = SOURCES.some((s) => fs.existsSync(s.csv));
const anyExternalExists = fs.existsSync(LOCAL_EXTERNAL_DATA);
if (!anyMasterExists && !anyExternalExists) {
  console.log("[build-data] No source CSVs and no external_data/ found.");
  console.log("[build-data] Keeping existing places.json + community/ untouched. Exit 0.");
  process.exit(0);
}
if (!anyMasterExists) {
  console.log("[build-data] No master CSVs — will rebuild only community/*.json from external_data/.");
}

const allPlaces = [];
const byNiche = {};

for (const src of SOURCES) {
  if (!fs.existsSync(src.csv)) {
    // Master CSV missing — still try to build community/*.json from external_data/
    const redditRaw = loadBroadCsv(src.folder, "reddit").map((t) => normalizeThread(t, "reddit"));
    const pantipRaw = loadBroadCsv(src.folder, "pantip").map((t) => normalizeThread(t, "pantip"));
    const naverRaw  = loadBroadCsv(src.folder, "naver").map((t) => normalizeThread(t, "naver"));
    if (redditRaw.length || pantipRaw.length || naverRaw.length) {
      console.log(`[${src.niche}] no master CSV, but external community data found: `
                  + `reddit=${redditRaw.length}, pantip=${pantipRaw.length}, naver=${naverRaw.length}`);
      const community = {
        generated_at: new Date().toISOString(),
        niche: src.niche,
        counts: { reddit: redditRaw.length, pantip: pantipRaw.length, naver: naverRaw.length },
        top_reddit: topThreads(redditRaw, 30),
        top_pantip: topThreads(pantipRaw, 40),
        top_naver: naverRaw.slice(0, 40),
      };
      const communityFile = path.join(OUT_COMMUNITY_DIR, `${src.niche}.json`);
      fs.writeFileSync(communityFile, JSON.stringify(community, null, 0), "utf-8");
    } else {
      console.log(`[skip] ${src.niche}: master CSV not yet created — pipeline still running?`);
    }
    byNiche[src.niche] = 0;
    continue;
  }
  let raw;
  try {
    raw = fs.readFileSync(src.csv, "utf-8").replace(/^﻿/, "");
  } catch (e) {
    console.warn(`[warn] ${src.niche}: read failed: ${e.message}`);
    byNiche[src.niche] = 0;
    continue;
  }
  let rows;
  try {
    rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
  } catch (e) {
    console.warn(`[warn] ${src.niche}: parse failed: ${e.message}`);
    byNiche[src.niche] = 0;
    continue;
  }
  // Merge in discovery CSVs (geographic backfill from Places API). Dedupe
  // by place_id — anything already in the master keeps its richer columns.
  const discovered = loadDiscoveredRows(src.niche, src.relCols);
  if (discovered.length > 0) {
    const existingIds = new Set(rows.map((r) => r.place_id).filter(Boolean));
    const newOnes = discovered.filter((d) => !existingIds.has(d.place_id));
    rows = rows.concat(newOnes);
    console.log(`[${src.niche}] +${newOnes.length} from discovery (skipped ${discovered.length - newOnes.length} dupes)`);
  }
  console.log(`[${src.niche}] loaded ${rows.length} rows`);
  const NICHE_CAPS = { "muay-thai": 1500, "yoga-pilates": 1500, "wellness": 1000, "cooking": 1000, "diving": 800, "spa": 2000, "coworking": 500 };
  const cap = NICHE_CAPS[src.niche] ?? 500;

  let candidates = rows
    .filter((r) => r.name && r.place_id && relevant(r, src.relCols))
    .map((r) => normalize(r, src.niche))
    .filter((p) => p.id);

  // Quality gate: must have at least one scraped signal OR a real rating with 5+ reviews.
  candidates = candidates.filter((p) => {
    const hasScrape = (p.reviews_scraped_count > 0) || (p.photos_count > 0) || (p.videos_count > 0);
    const hasReputation = (p.rating ?? 0) >= 4 && (p.review_count ?? 0) >= 5;
    return hasScrape || hasReputation;
  });

  const places = candidates
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, cap);
  console.log(`[${src.niche}] kept ${places.length} relevant places (filtered+capped at ${cap})`);
  // Mark top 3 per niche as partners (demo)
  places.slice(0, 3).forEach((p) => (p.is_partner = true));

  // ── Community: load broad scraper CSVs, build niche-level community.json ──
  const redditRaw = loadBroadCsv(src.folder, "reddit").map((t) => normalizeThread(t, "reddit"));
  const pantipRaw = loadBroadCsv(src.folder, "pantip").map((t) => normalizeThread(t, "pantip"));
  const naverRaw  = loadBroadCsv(src.folder, "naver").map((t) => normalizeThread(t, "naver"));
  const allThreads = [...redditRaw, ...pantipRaw, ...naverRaw];
  console.log(`[${src.niche}] community threads: reddit=${redditRaw.length}, pantip=${pantipRaw.length}, naver=${naverRaw.length}`);

  const community = {
    generated_at: new Date().toISOString(),
    niche: src.niche,
    counts: { reddit: redditRaw.length, pantip: pantipRaw.length, naver: naverRaw.length },
    top_reddit: topThreads(redditRaw, 30),
    top_pantip: topThreads(pantipRaw, 40),
    top_naver: naverRaw.slice(0, 40), // naver: most recent first
  };
  const communityFile = path.join(OUT_COMMUNITY_DIR, `${src.niche}.json`);
  fs.writeFileSync(communityFile, JSON.stringify(community, null, 0), "utf-8");

  // ── Place-level fuzzy matches (Option C) ──
  let fuzzyHits = 0;
  for (const place of places) {
    const matches = fuzzyMatchThreads(place.name, allThreads);
    if (matches.length > 0) {
      place.community_mentions = matches;
      fuzzyHits++;
      // Update source_badges so landing-page counts reflect actual coverage.
      for (const m of matches) {
        if (m.kind === "reddit") place.source_badges.reddit = (place.source_badges.reddit || 0) + 1;
        if (m.kind === "naver") place.source_badges.naver = (place.source_badges.naver || 0) + 1;
        if (m.kind === "pantip") place.source_badges.pantip = (place.source_badges.pantip || 0) + 1;
      }
    }
  }
  console.log(`[${src.niche}] places with community mentions: ${fuzzyHits}/${places.length}`);

  allPlaces.push(...places);
  byNiche[src.niche] = places.length;
  // Per-niche slice file
  const sliceFile = path.join(OUT_BY_NICHE_DIR, `${src.niche}.json`);
  fs.writeFileSync(
    sliceFile,
    JSON.stringify({ generated_at: new Date().toISOString(), niche: src.niche, total: places.length, places }, null, 0),
    "utf-8",
  );
}

const avgTrust =
  allPlaces.length > 0
    ? Math.round(allPlaces.reduce((s, p) => s + p.trust_score, 0) / allPlaces.length)
    : 0;

if (allPlaces.length > 0) {
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total: allPlaces.length,
        by_niche: byNiche,
        avg_trust: avgTrust,
        places: allPlaces,
      },
      null,
      0,
    ),
    "utf-8",
  );
} else {
  console.log("[build-data] No places assembled (masters missing) — places.json untouched.");
}

console.log("");
console.log(`[build-data] TOTAL: ${allPlaces.length} places`);
console.log(`[build-data] by_niche:`, byNiche);
console.log(`[build-data] avg_trust: ${avgTrust}`);
console.log(`[build-data] → ${OUT_FILE}`);
