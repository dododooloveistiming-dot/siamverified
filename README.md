# thaifacialclinic.com — MVP

100% static Next.js 14 (App Router) directory + AEO-optimized clinic detail pages + B2B premium dashboard.
Hosted free on Vercel free-tier. **Zero runtime compute** — all 230 clinic × 5 languages = ~1,150 HTML pages built at deploy time.

## Architecture (cost-optimized)

```
CSV master data → scripts/build-data.mjs → public/data/clinics.json
                                                ↓
                                      next build (SSG only)
                                                ↓
                                      static HTML × N langs × N clinics
                                                ↓
                                      Vercel free tier (no server compute)
```

All filtering / sorting / search happens in the browser against the single pre-fetched JSON.

## Install

```bash
cd thaifacialclinic
npm install
npm run data   # CSV → public/data/clinics.json (reads C:\dbd-scraper\hair\thaihairguide_master.csv)
npm run dev    # http://localhost:3000
```

## Build & Deploy

```bash
npm run build  # runs prebuild (data) + next build
# Output: ./out/  (static HTML files)
# Deploy to Vercel: `vercel --prod` or git push to connected repo.
```

`next.config.mjs` sets `output: "export"`. Vercel auto-detects and serves `out/`.

## Route map

```
/                                  → redirects to /en/
/[lang]/                           → directory (5 lang variants — en, ko, th, zh, ar)
/[lang]/clinic/[slug]/             → clinic detail (230 × 5 = 1,150 pages)
/b2b/dashboard/                    → premium dashboard demo
```

## AEO (PART 1)

`components/AeoSchema.tsx` injects 3 JSON-LD blocks on every clinic page:
- `MedicalBusiness` with `aggregateRating`, `review[]`, `priceRange`, `knowsAbout`, `availableService[]`
- `FAQPage` with auto-generated Q&A from real Reddit/Naver review excerpts
- `BreadcrumbList`

Plus a plain-HTML FAQ section beneath so LLM crawlers (Perplexity, Gemini, ChatGPT, etc.) can read Q&A in the DOM.

`@id` for every clinic schema: `https://thaifacialclinic.com/[lang]/clinic/[slug]/#medicalbusiness`

## B2C directory (PART 2)

`components/DirectoryClient.tsx` — client-side filter / sort / search.
- "Filter out suspected ad/viral clinics" toggle (default ON)
- "Verified Partnership Clinics" sticky strip — top 3 by trust score are marked `is_partner` in `build-data.mjs` (flip to your paying customers)
- Each clinic card: Trust Score badge · LINE CTA · Bookimed affiliate CTA · source badges

## B2B dashboard (PART 3)

`app/b2b/dashboard/page.tsx` — static demo dashboard.
- "Market Share & Competitor Intelligence" table: clinic's stats + 3 anonymized competitors
- "Lead Traffic Analytics" with "Missed Leads" upsell CTA
- Marked `noindex,nofollow` — internal-facing

For production: add Supabase Auth + per-clinic snapshot generation in `build-data.mjs`.

## Bookimed affiliate

`build-data.mjs` carries `bookimed_url` from the master CSV. To activate affiliate revenue:
1. Sign up at https://bookimed.com/partners/
2. Append your `?aff=YOUR_ID` to all `bookimed_url` values in `clinics.json` (or do it client-side at link render in `ClinicCard.tsx`)

## What to customize

- `lib/i18n.ts` — translations + tagline. Set per-language messaging.
- `scripts/build-data.mjs` — `trustScore()` formula, `isSuspectedViral()` heuristic, partner selection logic.
- `tailwind.config.ts` — brand colors. Default is fintech-blue/clinical-green.

## Domain

Hardcoded `SITE.origin = "https://thaifacialclinic.com"` in `lib/i18n.ts`.
All canonical URLs, OG tags, and JSON-LD `@id` reference this.

## Costs

- Vercel free tier: 100 GB bandwidth / mo (plenty for early launch)
- Static export = no compute billing
- No Supabase calls at runtime (dashboard is static mock)
- **$0/month** until you outgrow Vercel free tier (~50K-100K monthly visitors)
