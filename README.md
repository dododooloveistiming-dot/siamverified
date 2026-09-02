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
npm run data    # CSV → public/data/places.json (+ handles.json)
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Routes

```
/                          → redirects to /en/
/[lang]/                   → landing (8 langs: en/ko/th/zh/ja/ar/id/vi)
/[lang]/verify/            → paste an IG/TikTok handle → trust verdict
/[lang]/social/            → venues with a social account, evidence-ranked
/[lang]/w/                 → wellness collections hub
/[lang]/w/[collection]/    → sauna, pilates, yoga, thai-massage, …
/[lang]/c/[niche]/         → category landing — search/filter/sort
/[lang]/place/[slug]/      → place detail + sticky CTA + JSON-LD
/b2b/dashboard/            → B2B demo (noindex)
```

## Verify (`/[lang]/verify/`)

The entry point for social referrals: someone sees a sauna or pilates studio
on Instagram/TikTok and wants to know whether it's real before booking.

`scripts/build-handles.mjs` → `public/data/handles.json` (452 KB) maps every
Instagram / TikTok / Facebook / YouTube / LINE handle and website domain we
know to a compact per-place record. The lookup runs entirely in the browser
(`lib/verify.ts`), so a check costs no server compute. A miss falls back to
name matching and then reads "not verified yet" — never "fake".

Coverage is partial and the page says so: 1,096 of 3,347 venues carry a
social handle.

## Collections (`/[lang]/w/[collection]/`)

Searches the seven `Niche` buckets hide — sauna and hot springs inside `spa`,
pilates and yoga inside `yoga-pilates`. Derived from venue name + Google
category in `lib/collections.ts`, *not* stored: a new niche would mean
re-running the whole scrape → CSV → build-data pipeline. Collections below
`MIN_COLLECTION_PLACES` (12) don't build — `ice-bath` sits at 3 and opens by
itself once those venues are scraped.

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

## Hosting & deploys

Vercel (project `siamverified`, team `dynamite1`) behind Cloudflare DNS.

**There is no GitHub → Vercel connection.** A push does not deploy. Ship with:

```bash
powershell -File scripts/deploy.ps1     # build + deploy + purge edge cache
```

`weekly_update.ps1` and `monthly_rescrape.ps1` call it after their commit.
It reads `VERCEL_TOKEN`, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` from
`.env.local` (gitignored).

### Why the edge cache matters

The previous Vercel account was disabled mid-2026-09 with
`402 DEPLOYMENT_DISABLED` — free-tier exhaustion at roughly zero human
traffic. Cause: only the canonical `en` place route is pre-rendered (3,347
places × 8 langs overran the 45-min build limit), so every other language
renders on demand and writes an ISR entry. Commercial crawlers walked ~23,000
of those cold URLs.

Two defences, both load-bearing:

1. **Cloudflare cache rules** hold HTML at the edge — 7 days for `/place/`,
   1 day elsewhere, bypass for `/api` (except `/api/og/`), `/dashboard`,
   `/auth`, `/admin`. Repeat crawls never reach the origin. This is why
   `deploy.ps1` must purge: without it a data refresh stays invisible.
2. **`lib/crawlers.ts`** — SEO backlink tools and scrapers get a 403 in
   `middleware.ts` (declared in `robots.txt` too, but several ignore it).
   Search engines, AI assistants that cite sources, and social preview
   fetchers all pass through, so the multilingual pages stay crawlable.

### Known gap

`DATABASE_URL` / `AUTH_SECRET` on the new project are placeholders, so
`/dashboard`, `/auth` and the DB-backed `/api` routes are non-functional.
The directory itself — every page that matters for traffic — is unaffected.
Restore the real Neon + Resend values in the Vercel project to bring them
back.
