"""
Derive review recency stats from per_place_google.json review-text blobs.

Each review is a single multi-line string concatenating reviewer name + rating +
relative timestamp + body + owner reply. The relative timestamp is in Thai or
English ("ปีที่แล้ว", "3 เดือนที่แล้ว", "a year ago", "2 weeks ago", etc).

Parses those phrases into approximate dates relative to per_place_google.json
scraped_at timestamp.

Output: per_place_recency.json with:
  - last_review_date_iso
  - days_since_last_review
  - reviews_last_30d, 90d, 365d
  - reviews_total_parsed
  - parse_rate (fraction of reviews where date was extractable)
  - active: bool (any review in last 90 days)

VPN 불필요, no HTTP — pure local analysis.
"""
import json, re, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
GOOGLE_PATH = ROOT / "public" / "data" / "per_place_google.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_recency.json"
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "review_recency.log"
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


# Match relative timestamps. Captures: number (or "a"/"an"), unit, marker
# Unit can be: English or Thai ปี/เดือน/สัปดาห์/วัน/ชั่วโมง/นาที
REL_RE = re.compile(
    r"(?:(\d+|a|an)\s*)?"
    r"(year|month|week|day|hour|minute|ปี|เดือน|สัปดาห์|วัน|ชั่วโมง|นาที)s?"
    r"\s*(?:ago|ที่แล้ว|ก่อน)",
    re.IGNORECASE,
)

UNIT_DAYS = {
    "year": 365, "ปี": 365,
    "month": 30, "เดือน": 30,
    "week": 7,  "สัปดาห์": 7,
    "day": 1,   "วัน": 1,
    "hour": 1/24, "ชั่วโมง": 1/24,
    "minute": 1/1440, "นาที": 1/1440,
}


def parse_relative(text: str, ref_dt: datetime) -> datetime | None:
    """Return absolute datetime by subtracting parsed offset from ref_dt."""
    # Only consider the FIRST relative-time match per review (others may be inside body)
    m = REL_RE.search(text)
    if not m: return None
    n_raw, unit = m.group(1), m.group(2).lower()
    if n_raw is None:
        n = 1  # bare "ปีที่แล้ว" = "a year ago"
    elif n_raw.lower() in ("a", "an"):
        n = 1
    else:
        try: n = int(n_raw)
        except Exception: return None
    days = n * UNIT_DAYS.get(unit, 0)
    if days <= 0: return None
    try:
        return ref_dt - timedelta(days=days)
    except Exception:
        return None


def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [recency] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def main():
    if not GOOGLE_PATH.exists():
        log(f"FATAL: {GOOGLE_PATH} missing"); sys.exit(1)
    g = json.loads(GOOGLE_PATH.read_text(encoding="utf-8"))
    log(f"places in per_place_google.json: {len(g)}")

    now = datetime.now()
    out = {}
    stats = {"places":0, "with_any_review":0, "with_parsable":0, "active_90d":0,
             "active_365d":0, "total_reviews":0, "parsed_reviews":0}
    parse_rate_hist = Counter()

    for pid, v in g.items():
        stats["places"] += 1
        reviews = v.get("reviews") or []
        if not isinstance(reviews, list) or not reviews:
            continue
        stats["with_any_review"] += 1
        stats["total_reviews"] += len(reviews)

        # Use scraped_at as reference; fall back to now
        scraped_at = v.get("scraped_at","")
        ref_dt = now
        if scraped_at:
            try:
                ref_dt = datetime.fromisoformat(scraped_at.replace("Z","+00:00")).replace(tzinfo=None)
            except Exception:
                ref_dt = now

        dates = []
        for r in reviews:
            if not isinstance(r, str): continue
            d = parse_relative(r, ref_dt)
            if d: dates.append(d)

        if not dates:
            out[pid] = {
                "last_review_date": "", "days_since_last_review": None,
                "reviews_last_30d": 0, "reviews_last_90d": 0, "reviews_last_365d": 0,
                "reviews_total": len(reviews), "reviews_parsed": 0,
                "active_90d": False, "active_365d": False,
                "ref_dt": ref_dt.strftime("%Y-%m-%d"),
            }
            continue

        stats["with_parsable"] += 1
        stats["parsed_reviews"] += len(dates)
        dates.sort(reverse=True)
        last = dates[0]
        days_since = (now - last).days

        # Count reviews in windows (using ref_dt as anchor; recent = closer to scrape time)
        c30 = sum(1 for d in dates if (ref_dt - d).days <= 30)
        c90 = sum(1 for d in dates if (ref_dt - d).days <= 90)
        c365 = sum(1 for d in dates if (ref_dt - d).days <= 365)

        is_active_90 = c90 > 0
        is_active_365 = c365 > 0
        if is_active_90: stats["active_90d"] += 1
        if is_active_365: stats["active_365d"] += 1

        rate_bucket = round(len(dates)/len(reviews) * 10) / 10
        parse_rate_hist[rate_bucket] += 1

        out[pid] = {
            "last_review_date": last.strftime("%Y-%m-%d"),
            "days_since_last_review": days_since,
            "reviews_last_30d": c30,
            "reviews_last_90d": c90,
            "reviews_last_365d": c365,
            "reviews_total": len(reviews),
            "reviews_parsed": len(dates),
            "active_90d": is_active_90,
            "active_365d": is_active_365,
            "ref_dt": ref_dt.strftime("%Y-%m-%d"),
        }

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    log(f"wrote {OUT_PATH}  ({len(out)} places)")
    overall_parse_rate = stats["parsed_reviews"]/stats["total_reviews"] if stats["total_reviews"] else 0
    log(f"  parse rate (reviews): {overall_parse_rate:.1%}")
    log(f"DONE  {stats}")


if __name__ == "__main__":
    main()
