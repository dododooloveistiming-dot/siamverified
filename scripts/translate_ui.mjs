// scripts/translate_ui.mjs
// Translate the UI string dictionary (T in lib/i18n.ts) into target languages
// and write public/data/ui_i18n.json — the sidecar that lib/i18n.ts t() merges
// in (curated T[key][lang] wins; this fills locales not hand-authored in T).
// Uses OpenAI Chat Completions (JSON mode). Reads OPENAI_API_KEY from .env.local.
//
//   npx tsx scripts/translate_ui.mjs --langs id            # all T keys → id
//   npx tsx scripts/translate_ui.mjs --langs id,vi --limit 20
//   npx tsx scripts/translate_ui.mjs --langs id --model gpt-4.1-nano
//
// Incremental/resumable: skips keys already present in T for that lang OR
// already in the sidecar. Batches keys per request to keep cost/round-trips low.

import fs from "node:fs";
import path from "node:path";
import { T } from "../lib/i18n.ts";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "data", "ui_i18n.json");
const BATCH = 30;

function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : def;
}
const LANGS = argVal("--langs", "id").split(",").map((s) => s.trim()).filter(Boolean);
const LIMIT = parseInt(argVal("--limit", "0"), 10) || Infinity;
const MODEL = argVal("--model", "gpt-4o-mini");

// Sorted set of {placeholder} tokens in a string — for translation validation.
const ph = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(",");

const LANG_NAMES = {
  ko: "Korean", th: "Thai", zh: "Simplified Chinese", ja: "Japanese",
  ar: "Arabic", vi: "Vietnamese", id: "Indonesian", ms: "Malay",
};

function loadKey() {
  const f = path.join(ROOT, ".env.local");
  if (!fs.existsSync(f)) throw new Error(".env.local not found");
  const line = fs.readFileSync(f, "utf-8").split(/\r?\n/).find((l) => l.trim().startsWith("OPENAI_API_KEY="));
  if (!line) throw new Error("OPENAI_API_KEY not in .env.local");
  const v = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  if (!v.startsWith("sk-")) throw new Error("OPENAI_API_KEY looks invalid");
  return v;
}

const SYSTEM =
  "You localize short UI strings for a Thailand travel/wellness directory. Rules: " +
  "(1) Preserve placeholder tokens EXACTLY — anything in curly braces like {n}, {name}, {price}, {city}, {niche}, {y} must appear unchanged in the translation. " +
  "(2) Keep ฿ symbols, brand names (Klook, Viator, Agoda, Google, Naver, Pantip, YouTube, Bookimed, LINE, WhatsApp), and emoji unchanged. " +
  "(3) These are buttons/labels/headings — keep them concise and idiomatic for native speakers. " +
  "(4) Input is a JSON object mapping keys to English strings. Output ONLY a JSON object mapping the SAME keys to the translated strings.";

async function translateBatch(key, lang, batch, tries = 3) {
  const user = `Target language: ${LANG_NAMES[lang] || lang}\n\nTranslate the values; keep the keys identical.\n\n${JSON.stringify(batch)}`;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
        }),
      });
      if (res.status === 429 || res.status >= 500) { await new Promise((s) => setTimeout(s, 2000 * attempt)); continue; }
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
      const obj = JSON.parse((j.choices?.[0]?.message?.content || "").trim());
      return { obj, usage: j.usage };
    } catch (e) {
      if (attempt === tries) throw e;
      await new Promise((s) => setTimeout(s, 2000 * attempt));
    }
  }
  throw new Error("exhausted retries");
}

const key = loadKey();
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf-8")) : {};
const keys = Object.keys(T);

let inTok = 0, outTok = 0, okKeys = 0, fail = 0;
function save() { fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf-8"); }

for (const lang of LANGS) {
  if (lang === "en") continue;
  // Keys missing this lang both in curated T and in the sidecar.
  const todo = keys.filter((k) => !T[k]?.[lang] && !out[k]?.[lang]).slice(0, LIMIT);
  console.log(`[translate_ui] ${lang}: ${todo.length} keys to translate (model=${MODEL})`);
  for (let i = 0; i < todo.length; i += BATCH) {
    const slice = todo.slice(i, i + BATCH);
    const batch = Object.fromEntries(slice.map((k) => [k, T[k].en]));
    try {
      const r = await translateBatch(key, lang, batch);
      for (const k of slice) {
        const v = r.obj[k];
        // Reject translations that dropped/renamed/duplicated a {placeholder} —
        // those render broken (literal {x} or missing data). Skip → en fallback.
        const want = ph(T[k].en);
        if (typeof v === "string" && v && ph(v) === want) { (out[k] ||= {})[lang] = v; okKeys++; }
        else { fail++; if (typeof v === "string" && ph(v) !== want) console.warn(`  drop ${k} [${lang}] — placeholder mismatch (en:[${want}] got:[${ph(v)}])`); }
      }
      inTok += r.usage?.prompt_tokens || 0; outTok += r.usage?.completion_tokens || 0;
    } catch (e) {
      fail += slice.length;
      console.warn(`  batch fail [${lang}] ${i}-${i + slice.length}: ${e.message}`);
    }
    save();
    console.log(`  ${Math.min(i + BATCH, todo.length)}/${todo.length} (ok ${okKeys}, fail ${fail})`);
  }
}
save();
const rate = MODEL.includes("nano") ? [0.10, 0.40] : [0.15, 0.60];
const cost = (inTok / 1e6) * rate[0] + (outTok / 1e6) * rate[1];
console.log(`[translate_ui] DONE — ok ${okKeys}, fail ${fail} | tokens in ${inTok.toLocaleString()}/out ${outTok.toLocaleString()} → ~$${cost.toFixed(3)}`);
console.log(`[translate_ui] wrote ${OUT}`);
