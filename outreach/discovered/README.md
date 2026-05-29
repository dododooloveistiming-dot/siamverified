# Gap discovery — geographic backfill via Places API (New)

The upstream `C:\dbd-scraper` pipeline pulled venues for Bangkok and Chiang
Mai but missed most of Thailand's tourist-dense south and islands. Famous
Phuket muay-thai (Tiger, AKA, Suwit), Koh Tao dive shops, Koh Phangan
wellness retreats — all absent or mislabeled as Bangkok.

`scripts/discover_gaps.py` runs Google Places **Text Search (New)** per
(niche, city) seed pair and writes one CSV here for review.

## One-time setup

Enable Places API (New) in the GCP project that owns `GOOGLE_API_KEY`:

  https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=435479922075

Wait ~1 minute after enabling, then run the script.

## Usage

```
# Test one combo (fast, ~3 API calls)
python scripts/discover_gaps.py --niche muay-thai --city phuket

# Full run (~64 queries × paginated = up to ~190 calls, ~$6)
python scripts/discover_gaps.py --niche all --city all

# Just see what would run, no API calls
python scripts/discover_gaps.py --dry-run
```

Output: `outreach/discovered/{niche}__{city}.csv` per seed combo.

## Seed coverage

| Niche | Cities targeted |
|---|---|
| muay-thai | phuket, krabi, koh-samui, koh-phangan, pattaya, hua-hin, chiang-rai |
| yoga-pilates | phuket, koh-samui, koh-phangan, krabi, pattaya, hua-hin, chiang-rai |
| wellness | phuket, koh-samui, koh-phangan, chiang-mai, krabi, hua-hin |
| cooking | koh-samui, koh-phangan, krabi, hua-hin |
| diving | phuket, koh-tao, koh-phangan, koh-samui, krabi, koh-lanta, khao-lak, pattaya |
| spa | phuket, chiang-mai, koh-samui, krabi, pattaya, hua-hin, koh-phangan |
| coworking | chiang-mai, phuket, koh-phangan, koh-samui, pattaya, hua-hin |

Bangkok and existing-CM combos are intentionally NOT in seeds — those
have adequate coverage already.

## Output schema

Each CSV row:
- `place_id` — Google Place ID (canonical key)
- `name`, `address`, `lat`, `lng`
- `rating`, `user_ratings_total`
- `types` — Google's category tags (gym, spa, etc)
- `discovery_niche`, `discovery_city`, `discovery_query`
- `already_in_master` — `1` if this place_id is already in `places.json`,
  blank if new

Sorted by `user_ratings_total` descending (most-reviewed at top).

## Merge workflow (after discovery)

The CSVs do NOT auto-merge into `public/data/places.json`. Manual steps:

1. **Review CSVs**: spot-check the top 5-10 rows per niche × city. If the
   famous venues (Tiger, AKA, Suwit for Phuket muay-thai) appear, the
   seed query is working. If not, refine the query in `SEEDS` dict.

2. **Append to dbd-scraper master**: For now the canonical source is
   `C:\dbd-scraper\{niche}\thai{niche}_master.csv`. New rows need:
   - `place_id` (have it)
   - The dbd-scraper columns (rating, review_count, address, city, etc — most we have)
   - Re-run `npm run data` in siamverified-portable to rebuild
     `public/data/places.json` from the updated CSV

   **OR** add a `--write-to-master` flag to this script that appends
   directly with the right column shape. Not done yet.

3. **Re-enrich**: the new place_ids won't have wayback/dns/email/youtube
   signals yet. Run the enrichment scripts so they get badge coverage:
   ```
   python scripts/enrich_wayback.py
   python scripts/enrich_dns_mx.py
   python scripts/enrich_youtube.py
   python scripts/extract_emails.py
   ```

4. **Verify**: rebuild + check the new /best/phuket-muay-thai-*/ pages.

## Cost estimate

Places Text Search (New): ~$32 per 1,000 calls. Full run is 64 queries,
each paginated up to 3 pages = ~190 calls = ~$6 worst case. Lower in
practice since many seeds return < 20 results and don't paginate.

## Why not just re-run the original pipeline?

The original `C:\Users\yunmin\Desktop\wongnai_scraper\` doesn't exist on
this machine (was on a different user/host). Rebuilding it would take
days. Going direct to Places API is faster and venue-accurate, at the
cost of losing Wongnai-specific signals (some Thai-only metadata).
