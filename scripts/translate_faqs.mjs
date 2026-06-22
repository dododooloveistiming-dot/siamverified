// scripts/translate_faqs.mjs
// Batch-translate the curated FAQ corpus (lib/faqs.ts) into target languages and
// write the result to public/data/faq_i18n.json — the sidecar that lib/faqs.ts
// merges in (curated inline translations win over this; this wins over English).
// Uses the OpenAI Chat Completions API. Reads OPENAI_API_KEY from .env.local
// (a secret — never committed).
//
//   npx tsx scripts/translate_faqs.mjs                       # th, all FAQs
//   npx tsx scripts/translate_faqs.mjs --langs th,vi,id      # multiple langs
//   npx tsx scripts/translate_faqs.mjs --langs vi --limit 5  # small test batch
//   npx tsx scripts/translate_faqs.mjs --model gpt-4.1-nano  # even cheaper
//
// Run via tsx so it can import the TypeScript corpus directly. Incremental and
// resumable: skips (faq, lang) pairs already translated inline OR already in the
// sidecar, so re-running only fills gaps. One API call translates all three
// fields of one FAQ into one language, using JSON mode for valid structured output.
//
// Default model gpt-4o-mini is OpenAI's cheap, reliable tier and handles JSON
// mode well. gpt-4.1-nano is cheaper still if your account has it (--model).

import fs from "node:fs";
import path from "node:path";
import { listFaqs } from "../lib/faqs.ts";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "data", "faq_i18n.json");
const CONCURRENCY = 4;

// ── args ──
function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : def;
}
const LANGS = argVal("--langs", "th").split(",").map((s) => s.trim()).filter(Boolean);
const LIMIT = parseInt(argVal("--limit", "0"), 10) || Infinity;
const MODEL = argVal("--model", "gpt-4o-mini");

const LANG_NAMES = {
  ko: "Korean", th: "Thai", zh: "Simplified Chinese", ja: "Japanese",
  ar: "Arabic", vi: "Vietnamese", id: "Indonesian", ms: "Malay",
};

// ── key from .env.local ──
function loadKey() {
  const f = path.join(ROOT, ".env.local");
  if (!fs.existsSync(f)) throw new Error(".env.local not found");
  const line = fs.readFileSync(f, "utf-8").split(/\r?\n/).find((l) => l.trim().startsWith("OPENAI_API_KEY="));
  if (!line) throw new Error("OPENAI_API_KEY not in .env.local");
  const v = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  if (!v.startsWith("sk-")) throw new Error("OPENAI_API_KEY looks invalid (should start with sk-)");
  return v;
}

// English source of a Localized field (bare string = English; object → .en).
function englishOf(v) {
  if (typeof v === "string") return v;
  return v.en ?? Object.values(v)[0] ?? "";
}
// Does the inline field already carry a curated translation for `lang`?
function inlineHas(v, lang) {
  return typeof v !== "string" && Boolean(v[lang]);
}

const SYSTEM =
  "You are a professional translator localizing a Thailand travel/wellness directory's FAQ content. " +
  "Translate the given English FAQ into the target language for native speakers. Rules: " +
  "(1) Preserve Markdown exactly — **bold** markers, blank-line paragraph breaks, and lists. " +
  "(2) Keep ฿ baht amounts, numbers, dates, URLs, and proper nouns (place/brand names like Tiger Muay Thai, Klook, PADI, Koh Tao) unchanged. " +
  "(3) Natural, fluent register — not literal/word-for-word. " +
  "(4) Output ONLY a JSON object with keys \"question\", \"shortAnswer\", \"longAnswer\".";

async function translate(key, faq, lang, tries = 3) {
  const payload = {
    question: englishOf(faq.question),
    shortAnswer: englishOf(faq.shortAnswer),
    longAnswer: englishOf(faq.longAnswer),
  };
  const user =
    `Target language: ${LANG_NAMES[lang] || lang}\n\n` +
    `Translate these three fields and return a JSON object with the same keys.\n\n` +
    JSON.stringify(payload);

  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: user },
          ],
        }),
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((s) => setTimeout(s, 2000 * attempt));
        continue;
      }
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
      const text = (j.choices?.[0]?.message?.content || "").trim();
      const obj = JSON.parse(text);
      if (!obj.question || !obj.shortAnswer || !obj.longAnswer) throw new Error("missing fields in response");
      return { obj: { question: obj.question, shortAnswer: obj.shortAnswer, longAnswer: obj.longAnswer }, usage: j.usage };
    } catch (e) {
      if (attempt === tries) throw e;
      await new Promise((s) => setTimeout(s, 2000 * attempt));
    }
  }
  throw new Error("exhausted retries");
}

// ── main ──
const key = loadKey();
const faqs = listFaqs();
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf-8")) : {};

// Build the work queue: (faq, lang) pairs not already translated inline or in the sidecar.
const queue = [];
for (const faq of faqs) {
  for (const lang of LANGS) {
    if (lang === "en") continue;
    const inlineDone = inlineHas(faq.question, lang) && inlineHas(faq.shortAnswer, lang) && inlineHas(faq.longAnswer, lang);
    const s = out[faq.slug]?.[lang];
    const sidecarDone = s && s.question && s.shortAnswer && s.longAnswer;
    if (inlineDone || sidecarDone) continue;
    queue.push({ faq, lang });
  }
}
const todo = queue.slice(0, LIMIT);

console.log(`[translate_faqs] model=${MODEL} langs=${LANGS.join(",")} | FAQs=${faqs.length} | to translate: ${todo.length}${LIMIT !== Infinity ? ` (limit ${LIMIT})` : ""}`);
if (todo.length === 0) { console.log("[translate_faqs] nothing to do."); process.exit(0); }

let inTok = 0, outTok = 0, ok = 0, fail = 0, done = 0;
function save() { fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf-8"); }

async function worker(q) {
  while (q.length) {
    const { faq, lang } = q.shift();
    try {
      const r = await translate(key, faq, lang);
      (out[faq.slug] ||= {})[lang] = r.obj;
      inTok += r.usage?.prompt_tokens || 0; outTok += r.usage?.completion_tokens || 0; ok++;
    } catch (e) {
      fail++;
      console.warn(`  fail ${faq.slug} [${lang}]: ${e.message}`);
    }
    done++;
    if (done % 10 === 0) { save(); console.log(`  ${done}/${todo.length} (ok ${ok}, fail ${fail})`); }
  }
}

const q = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(q)));
save();

// Rough cost — gpt-4o-mini ~$0.15/$0.60 per MTok; nano cheaper. Adjust per --model.
const rate = MODEL.includes("nano") ? [0.10, 0.40] : MODEL.includes("4o-mini") || MODEL.includes("mini") ? [0.15, 0.60] : [0.50, 1.50];
const cost = (inTok / 1e6) * rate[0] + (outTok / 1e6) * rate[1];
console.log(`[translate_faqs] DONE — ok ${ok}, fail ${fail}`);
console.log(`[translate_faqs] tokens in ${inTok.toLocaleString()} / out ${outTok.toLocaleString()} → ~$${cost.toFixed(3)} (${MODEL})`);
console.log(`[translate_faqs] wrote ${OUT}`);
