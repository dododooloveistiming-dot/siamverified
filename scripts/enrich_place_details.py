"""
Fetch Place Details (Places API New) for venues missing website/phone.

After scripts/discover_gaps.py backfills 1,600+ venues from text search,
those rows only have name/address/rating — no website, no phone. Without
website, wayback/DNS/email/youtube enrichment can't reach them.

This script reads places.json, picks place_ids that are MISSING website
AND not in the cache yet, calls Places API v1 details endpoint with a
field mask limited to what we actually need (controls cost), and writes
the results back to per_place_details_cache.json.

A separate merge step (or rerun of build-data.mjs) feeds those fields
back into places.json.

Cost: Place Details with website+phone fields = Pro SKU ≈ $17/1000.
1,600 venues ≈ $28.

Usage:
  python scripts/enrich_place_details.py
  python scripts/enrich_place_details.py --limit 100        # test small
  python scripts/enrich_place_details.py --include-existing # re-fetch known
"""
from __future__ import annotations

import argparse, json, os, sys, time
import urllib.parse, urllib.request, urllib.error
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLACES_PATH = ROOT / "public" / "data" / "places.json"
CACHE_PATH = ROOT / "public" / "data" / "_raw" / "place_details_cache.json"
LOG_PATH = ROOT / "public" / "data" / "_raw" / "place_details.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

THREADS_DELAY = 0.15  # tight — Places API allows 600 RPM, this gives ~6 rps
TIMEOUT = 25

# Limit field mask to what we actually consume — controls SKU billing.
# websiteUri = Pro SKU; phone = Pro SKU. We add internationalPhoneNumber +
# businessStatus so we can filter out CLOSED_PERMANENTLY in build-data.
FIELD_MASK = ",".join([
    "id",
    "displayName",
    "formattedAddress",
    "websiteUri",
    "internationalPhoneNumber",
    "nationalPhoneNumber",
    "businessStatus",
    "regularOpeningHours.weekdayDescriptions",
])


def load_env():
    for candidate in [ROOT / ".env", ROOT.parent / ".env"]:
        if candidate.exists():
            for line in candidate.read_text(encoding="utf-8").splitlines():
                if "=" in line and not line.startswith("#"):
                    k, _, v = line.strip().partition("=")
                    os.environ.setdefault(k, v.strip().strip('"').strip("'"))
            return
load_env()
API_KEY = os.environ.get("GOOGLE_API_KEY", "").strip()


def log(msg):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [details] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def fetch_details(place_id: str) -> dict:
    url = f"https://places.googleapis.com/v1/places/{urllib.parse.quote(place_id, safe='')}"
    req = urllib.request.Request(url, headers={
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
        "User-Agent": "siamverified-details/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = ""
        try: body = e.read().decode("utf-8", errors="replace")[:160]
        except Exception: pass
        return {"__error": f"HTTP {e.code}: {body}"}
    except Exception as e:
        return {"__error": f"{type(e).__name__}: {str(e)[:120]}"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="cap fetches (test mode)")
    ap.add_argument("--include-existing", action="store_true",
                    help="re-fetch place_ids already cached")
    args = ap.parse_args()

    if not API_KEY:
        log("FATAL: GOOGLE_API_KEY not set"); sys.exit(1)
    if not PLACES_PATH.exists():
        log(f"FATAL: {PLACES_PATH} missing"); sys.exit(1)

    bundle = json.loads(PLACES_PATH.read_text(encoding="utf-8"))
    places = bundle.get("places", [])

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cache: {len(cache)} entries")

    # Targets: place_ids missing a website AND not already in cache.
    targets = []
    for p in places:
        pid = p.get("id")
        if not pid: continue
        if p.get("website"): continue  # already has site, skip
        if not args.include_existing and pid in cache: continue
        targets.append(pid)

    if args.limit and args.limit > 0:
        targets = targets[:args.limit]
    log(f"places total={len(places)}  missing_website={sum(1 for p in places if not p.get('website'))}")
    log(f"to fetch: {len(targets)}")

    t0 = time.time(); done = 0
    for pid in targets:
        res = fetch_details(pid)
        cache[pid] = res
        done += 1
        if done % 50 == 0 or done == len(targets):
            CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
            el = time.time() - t0; rate = done / el if el else 0
            eta = (len(targets) - done) / rate if rate else 0
            sample_site = (res.get("websiteUri") or "")[:40]
            err = res.get("__error", "")[:30]
            log(f"  [{done}/{len(targets)}]  ok={'__error' not in res}  site={sample_site!r}  err={err!r}  rate={rate:.1f}/s eta={eta:.0f}s")
        time.sleep(THREADS_DELAY)

    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Summary
    have_site = sum(1 for v in cache.values() if v.get("websiteUri"))
    have_phone = sum(1 for v in cache.values() if v.get("nationalPhoneNumber") or v.get("internationalPhoneNumber"))
    closed = sum(1 for v in cache.values() if v.get("businessStatus") == "CLOSED_PERMANENTLY")
    log(f"DONE  cache_total={len(cache)}  with_website={have_site}  with_phone={have_phone}  closed_permanently={closed}")


if __name__ == "__main__":
    main()
