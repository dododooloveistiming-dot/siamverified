"""
Discover venues in geographic gaps using Google Places Text Search API.

The upstream scrape pipeline (C:\\dbd-scraper) is Bangkok/Chiang Mai-centric.
Famous Phuket / island / coast venues (Tiger Muay Thai Phuket, AKA Thailand,
Koh Tao dive shops, Khao Lak resorts) never made it into the master CSVs.

This script runs Text Search per (niche, city) seed pair, dedupes by
place_id, and writes one CSV per seed to outreach/discovered/. User
reviews each CSV before merging into the master.

Cost (Places Text Search, 2026 pricing): ~$32 per 1000 calls. A full run
(8 cities × ~5 relevant niches × 3 queries each ≈ 120 calls) is ~$4.
Cheap relative to the missing-venue blind spot.

Usage:
  python scripts/discover_gaps.py --niche muay-thai --city phuket
  python scripts/discover_gaps.py --niche all --city all
  python scripts/discover_gaps.py --niche muay-thai --city all
  python scripts/discover_gaps.py --dry-run        # print seed plan, no API calls

Env: GOOGLE_API_KEY in <project>/.env  (loaded automatically).
"""
from __future__ import annotations

import argparse, csv, json, os, sys, time
import urllib.parse, urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "outreach" / "discovered"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Load .env from siblings up to deliverable/
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

# Seed map — only ship combos that geographically make sense.
# "Bangkok diving" doesn't (no sea); "Khao Lak coworking" doesn't (no
# digital-nomad scene). Each seed entry is a search query string handed
# straight to Places Text Search.
SEEDS: dict[str, dict[str, list[str]]] = {
    "muay-thai": {
        "phuket":      ["muay thai gym Phuket", "fight gym Phuket", "boxing camp Phuket"],
        "krabi":       ["muay thai Krabi", "boxing gym Ao Nang"],
        "koh-samui":   ["muay thai Koh Samui", "boxing gym Koh Samui"],
        "koh-phangan": ["muay thai Koh Phangan"],
        "pattaya":     ["muay thai Pattaya", "boxing gym Pattaya"],
        "hua-hin":     ["muay thai Hua Hin"],
        "chiang-rai":  ["muay thai Chiang Rai"],
    },
    "yoga-pilates": {
        "phuket":      ["yoga studio Phuket", "pilates Phuket"],
        "koh-samui":   ["yoga Koh Samui", "pilates Koh Samui"],
        "koh-phangan": ["yoga Koh Phangan"],
        "krabi":       ["yoga Krabi", "yoga Ao Nang"],
        "pattaya":     ["yoga studio Pattaya"],
        "hua-hin":     ["yoga Hua Hin"],
        "chiang-rai":  ["yoga Chiang Rai"],
    },
    "wellness": {
        "phuket":      ["wellness retreat Phuket", "detox retreat Phuket"],
        "koh-samui":   ["wellness retreat Koh Samui"],
        "koh-phangan": ["wellness retreat Koh Phangan", "yoga retreat Koh Phangan"],
        "chiang-mai":  ["wellness retreat Chiang Mai"],
        "krabi":       ["wellness retreat Krabi"],
        "hua-hin":     ["wellness retreat Hua Hin"],
    },
    "cooking": {
        "koh-samui":   ["thai cooking class Koh Samui"],
        "koh-phangan": ["thai cooking class Koh Phangan"],
        "krabi":       ["thai cooking class Krabi", "cooking school Ao Nang"],
        "hua-hin":     ["thai cooking class Hua Hin"],
    },
    "diving": {
        "phuket":      ["dive shop Phuket", "scuba diving Phuket", "PADI dive center Phuket"],
        "koh-tao":     ["dive shop Koh Tao", "PADI Koh Tao", "scuba diving Koh Tao"],
        "koh-phangan": ["dive shop Koh Phangan"],
        "koh-samui":   ["dive shop Koh Samui"],
        "krabi":       ["dive shop Krabi", "dive shop Ao Nang"],
        "koh-lanta":   ["dive shop Koh Lanta"],
        "khao-lak":    ["dive shop Khao Lak", "PADI Khao Lak"],
        "pattaya":     ["dive shop Pattaya"],
    },
    "spa": {
        "phuket":      ["spa Phuket", "massage Phuket"],
        "chiang-mai":  ["spa Chiang Mai"],
        "koh-samui":   ["spa Koh Samui"],
        "krabi":       ["spa Krabi", "spa Ao Nang"],
        "pattaya":     ["spa Pattaya"],
        "hua-hin":     ["spa Hua Hin"],
        "koh-phangan": ["spa Koh Phangan"],
    },
    "coworking": {
        "chiang-mai":  ["coworking space Chiang Mai"],
        "phuket":      ["coworking space Phuket"],
        "koh-phangan": ["coworking space Koh Phangan"],
        "koh-samui":   ["coworking space Koh Samui"],
        "pattaya":     ["coworking space Pattaya"],
        "hua-hin":     ["coworking space Hua Hin"],
    },
}

CITIES = sorted({c for niche_map in SEEDS.values() for c in niche_map})
NICHES = sorted(SEEDS.keys())


FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.types",
    "nextPageToken",
])


def text_search(query: str, page_token: str | None = None) -> dict:
    """Places API v1 (new) — POST with field mask. Legacy endpoint is dead."""
    url = "https://places.googleapis.com/v1/places:searchText"
    body = {"textQuery": query, "regionCode": "TH", "pageSize": 20}
    if page_token: body["pageToken"] = page_token
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
        "User-Agent": "siamverified-discover/1.0",
    }, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: body_err = e.read().decode("utf-8", errors="replace")[:200]
        except Exception: body_err = ""
        return {"__error": f"HTTP {e.code}: {body_err}"}


def discover_one(niche: str, city_slug: str, queries: list[str]) -> list[dict]:
    seen: dict[str, dict] = {}
    for q in queries:
        token = None
        for page in range(3):  # paginate up to ~60 results per query
            resp = text_search(q, token)
            if resp.get("__error"):
                print(f"  ERROR {q!r}: {resp['__error']}", flush=True)
                break
            places = resp.get("places", [])
            for r in places:
                pid = r.get("id", "")
                if not pid or pid in seen: continue
                seen[pid] = {
                    "place_id": pid,
                    "name": (r.get("displayName") or {}).get("text", ""),
                    "address": r.get("formattedAddress", ""),
                    "lat": (r.get("location") or {}).get("latitude", ""),
                    "lng": (r.get("location") or {}).get("longitude", ""),
                    "rating": r.get("rating", ""),
                    "user_ratings_total": r.get("userRatingCount", ""),
                    "types": ";".join(r.get("types", [])),
                    "discovery_niche": niche,
                    "discovery_city": city_slug,
                    "discovery_query": q,
                    "scraped_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                }
            token = resp.get("nextPageToken")
            if not token: break
            time.sleep(2.0)
        time.sleep(0.5)
    return list(seen.values())


def existing_place_ids() -> set[str]:
    p = ROOT / "public" / "data" / "places.json"
    if not p.exists(): return set()
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        return {x["id"] for x in data.get("places", []) if x.get("id")}
    except Exception:
        return set()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--niche", default="all", help="niche slug or 'all'")
    ap.add_argument("--city",  default="all", help="city slug or 'all'")
    ap.add_argument("--dry-run", action="store_true", help="print seed plan, no API calls")
    args = ap.parse_args()

    niches = NICHES if args.niche == "all" else [args.niche]
    cities = CITIES if args.city  == "all" else [args.city]

    plan = []
    for n in niches:
        for c in cities:
            qs = SEEDS.get(n, {}).get(c)
            if qs: plan.append((n, c, qs))

    if not plan:
        print(f"No seeds for niche={args.niche} city={args.city}", flush=True)
        sys.exit(1)

    total_queries = sum(len(qs) for _, _, qs in plan)
    print(f"plan: {len(plan)} (niche,city) seeds  |  {total_queries} queries", flush=True)
    for n, c, qs in plan:
        print(f"  [{n} × {c}]  {len(qs)} queries", flush=True)

    if args.dry_run: return
    if not API_KEY:
        print("FATAL: GOOGLE_API_KEY not set in env", flush=True)
        sys.exit(1)

    existing = existing_place_ids()
    print(f"existing place_ids in master: {len(existing)}", flush=True)

    grand_total = 0
    grand_new = 0
    for n, c, qs in plan:
        print(f"\n=== {n} × {c} ===", flush=True)
        rows = discover_one(n, c, qs)
        new_rows = [r for r in rows if r["place_id"] not in existing]
        grand_total += len(rows); grand_new += len(new_rows)
        out = OUT_DIR / f"{n}__{c}.csv"
        cols = ["place_id","name","address","lat","lng","rating","user_ratings_total","types",
                "discovery_niche","discovery_city","discovery_query","scraped_at","already_in_master"]
        with out.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            for r in sorted(rows, key=lambda x: -(int(x.get("user_ratings_total") or 0))):
                r["already_in_master"] = "1" if r["place_id"] in existing else ""
                w.writerow(r)
        print(f"  total={len(rows)}  new={len(new_rows)}  -> {out}", flush=True)

    print(f"\nDONE  total_found={grand_total}  not_yet_in_master={grand_new}", flush=True)


if __name__ == "__main__":
    main()
