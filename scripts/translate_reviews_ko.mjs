// scripts/translate_reviews_ko.mjs
// Offline batch: summarize each place's Thai Google reviews into ONE Korean
// sentence (Claude Haiku) for the /ko place page. Reads ANTHROPIC_API_KEY from
// .env.local (a secret — never committed). Incremental: skips places already in
// public/data/per_place_review_ko.json, so it's safe to re-run / resume.
//
//   node scripts/translate_reviews_ko.mjs            # top 1000 by trust
//   node scripts/translate_reviews_ko.mjs --limit 50 # smaller batch / test
//
// Targets the highest-trust places with substantive Thai reviews — the pages a
// Korean traveler is most likely to land on. Cost ~$0.0007/place (Haiku).

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "public", "data");
const OUT = path.join(DATA, "per_place_review_ko.json");
const MODEL = "claude-haiku-4-5-20251001";
const CONCURRENCY = 6;

// ── args ──
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg >= 0 ? parseInt(process.argv[limitArg + 1], 10) : 1000;

// ── key from .env.local ──
function loadKey() {
  const f = path.join(ROOT, ".env.local");
  if (!fs.existsSync(f)) throw new Error(".env.local not found");
  const line = fs.readFileSync(f, "utf-8").split(/\r?\n/).find((l) => l.trim().startsWith("ANTHROPIC_API_KEY="));
  if (!line) throw new Error("ANTHROPIC_API_KEY not in .env.local");
  const v = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  if (!v.startsWith("sk-ant-")) throw new Error("ANTHROPIC_API_KEY looks invalid");
  return v;
}

// ── clean Thai review text (mirror of lib/reviews.ts cleanReviewText) ──
function clean(raw) {
  if (!raw) return "";
  let t = raw;
  const reply = t.search(/\nคำตอบจากเจ้าของ|\nResponse from the owner|\nคำติชมจาก/);
  if (reply > 0) t = t.slice(0, reply);
  return t
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (/^(Local Guide|ชอบ|แชร์|Like|Share)$/.test(l)) return false;
      if (/^[0-9]*\s*(ปีที่แล้ว|เดือนที่แล้ว|สัปดาห์ที่แล้ว|วันที่แล้ว)$/.test(l)) return false;
      if (/(รีวิว · .*รูปภาพ)|(· \d+ (รีวิว|รูปภาพ|reviews|photos))/.test(l)) return false;
      return true;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYSTEM =
  "You summarize Thai Google reviews into ONE natural Korean sentence (about 40-60 characters) for Korean travelers deciding where to go in Thailand. Base it only on the reviews. Output ONLY the Korean summary — no preamble, no quotes, no English.";

async function summarize(key, reviews, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 200,
          system: SYSTEM,
          messages: [{ role: "user", content: "리뷰:\n" + reviews.map((r, i) => `${i + 1}. ${r}`).join("\n") }],
        }),
      });
      if (res.status === 429 || res.status === 529 || res.status >= 500) {
        await new Promise((s) => setTimeout(s, 1500 * attempt));
        continue;
      }
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
      return { text: j.content[0].text.trim(), usage: j.usage };
    } catch (e) {
      if (attempt === tries) throw e;
      await new Promise((s) => setTimeout(s, 1500 * attempt));
    }
  }
  throw new Error("exhausted retries");
}

// ── main ──
const key = loadKey();
const bundle = JSON.parse(fs.readFileSync(path.join(DATA, "places.json"), "utf-8"));
const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf-8")) : {};

// candidates: substantive Thai reviews, not already done, sorted by trust desc
const candidates = bundle.places
  .map((p) => ({ p, reviews: (p.reviews_sample || []).map((r) => clean(r.text || "")).filter((t) => t.length >= 30).slice(0, 3) }))
  .filter((c) => c.reviews.length > 0 && !done[c.p.id])
  .sort((a, b) => (b.p.trust_score || 0) - (a.p.trust_score || 0))
  .slice(0, LIMIT);

console.log(`[translate_ko] already done: ${Object.keys(done).length} | to do: ${candidates.length} (limit ${LIMIT})`);
if (candidates.length === 0) { console.log("[translate_ko] nothing to do."); process.exit(0); }

let inTok = 0, outTok = 0, ok = 0, fail = 0, processed = 0;
function save() { fs.writeFileSync(OUT, JSON.stringify(done), "utf-8"); }

async function worker(queue) {
  while (queue.length) {
    const c = queue.shift();
    try {
      const r = await summarize(key, c.reviews);
      done[c.p.id] = r.text;
      inTok += r.usage.input_tokens; outTok += r.usage.output_tokens; ok++;
    } catch (e) {
      fail++;
      console.warn(`  fail ${c.p.slug}: ${e.message}`);
    }
    processed++;
    if (processed % 50 === 0) { save(); console.log(`  ${processed}/${candidates.length} (ok ${ok}, fail ${fail})`); }
  }
}

const queue = [...candidates];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
save();

const cost = inTok / 1e6 * 1 + outTok / 1e6 * 5;
console.log(`[translate_ko] DONE — ok ${ok}, fail ${fail}`);
console.log(`[translate_ko] tokens in ${inTok.toLocaleString()} / out ${outTok.toLocaleString()} → ~$${cost.toFixed(3)}`);
console.log(`[translate_ko] total summaries now: ${Object.keys(done).length} → ${OUT}`);
