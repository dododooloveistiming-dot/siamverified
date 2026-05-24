# Verified Thai (verifiedthai.com)

Independent Thailand business directory. **Verified by 6 sources. No paid promotion.**

Hybrid Next.js 14 (App Router):
- Directory pages — pre-rendered (SSG) per language for `(places × 6 langs)`
- /dashboard + /api — Vercel serverless for business claim, edits, magic-link auth (Resend), Neon Postgres

## Stack

```
CSV master data ─┐
                 ├→ scripts/build-data.mjs ─→ public/data/places.json + by-niche/*.json + community/*.json
JSON sidecars ───┘                                ↓
                                          next build (output: export)
                                                ↓
                                          static HTML × 6 langs × N places
                                                ↓
                                          GitHub push → Vercel auto-deploy
```

All filter / sort / search happens in the browser against pre-fetched JSON.

## Run locally

```bash
npm install
npm run data    # CSV → public/data/places.json
npm run dev     # http://localhost:3000
npm run build   # static export to ./out/
```

## Routes

```
/                          → redirects to /en/
/[lang]/                   → landing (6 langs: en/ko/th/zh/ja/ar)
/[lang]/c/[niche]/         → category landing — search/filter/sort
/[lang]/place/[slug]/      → place detail + sticky CTA + JSON-LD
/b2b/dashboard/            → B2B demo (noindex)
```

## Niches (7)

`muay-thai` · `yoga-pilates` · `wellness` · `cooking` · `diving` · `spa` · `coworking`

Defined in `lib/types.ts` (`NICHE_META`) with 6-language names + taglines.

## Multi-source Trust Score

Every place is cross-checked against:

```
Google · Reddit · Naver · Pantip · YouTube · Bookimed · Photos · Official websites
```

Formula lives in `scripts/build-data.mjs` (`trustScore()`). Public, auditable.
Higher source diversity = higher score. Paid promotion cannot move the score.

## i18n

`lib/i18n.ts` — translations + `t(key, lang)` lookup.
`lib/types.ts` — `nicheName(niche, lang)` + `nicheTagline(niche, lang)`.
Arabic auto-applies `dir="rtl"` via `components/SetHtmlLang.tsx`.

## Customize

- `lib/i18n.ts` → site name, tagline, translations
- `lib/types.ts` → `NICHE_META` (niche labels + taglines)
- `scripts/build-data.mjs` → `trustScore()` formula, partner selection
- `tailwind.config.ts` → brand colors (ink + emerald default)

## Affiliate

`build-data.mjs` carries `klook_url`, `viator_url`, `getyourguide_url`, `agoda_url`, `bookimed_url` from the master CSV.
Append `?aff=YOUR_ID` to activate revenue. Sticky mobile CTA picks the strongest available link per place.

## Costs

Vercel free tier (100 GB bandwidth/mo). No server compute. **$0/month** until ~50K–100K monthly visitors.
