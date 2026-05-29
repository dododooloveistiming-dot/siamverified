"""
Wayback Machine first-capture date for each domain (places + clinics).

Uses Archive.org CDX API which is free + no auth:
  http://web.archive.org/cdx/search/cdx?url=DOMAIN&limit=1&output=json&from=19960101

Returns the earliest capture timestamp. This is a stronger "site has been live"
signal than RDAP (RDAP gives when domain was registered; Wayback gives when
content actually went live and was archived).

Outputs:
  - public/data/per_place_wayback.json
  - public/data/per_clinic_wayback.json
  - per-source sibling files for clinics

VPN 불필요.
"""
import json, sys, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent
PLACES_PATH    = ROOT / "public" / "data" / "places.json"
CLINICS_INDEX  = ROOT / "public" / "data" / "clinics_index.json"
OUT_PLACES     = ROOT / "public" / "data" / "per_place_wayback.json"
OUT_CLINICS    = ROOT / "public" / "data" / "per_clinic_wayback.json"
CACHE_PATH     = ROOT / "public" / "data" / "_raw" / "wayback_cache.json"
LOG_PATH       = ROOT / "public" / "data" / "_raw" / "wayback.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

SOURCE_TO_OUT = {
    "dental_export/clinics.csv":         "dental_export/wayback_data.json",
    "dental_output/bangkok/clinics.csv": "dental_output/bangkok/wayback_data.json",
    "dental_pattaya/output/clinics.csv": "dental_pattaya/output/wayback_data.json",
    "hair_bangkok/output/clinics.csv":   "hair_bangkok/output/wayback_data.json",
}

UA = "Mozilla/5.0 (compatible; siamverified/1.0)"
THREADS = 4
TIMEOUT = 15

SOCIAL_HOSTS = {
    "facebook.com","instagram.com","line.me","lin.ee","tiktok.com",
    "youtube.com","twitter.com","x.com","linktr.ee","wa.me",
    "m.facebook.com","www.facebook.com","fb.com","fb.me",
    "www.instagram.com","instagr.am","page.line.me",
}


def extract_domain(url: str) -> str:
    if not url: return ""
    if not url.startswith("http"): url = "https://" + url
    try:
        h = (urlparse(url).hostname or "").lower()
    except Exception:
        return ""
    if h.startswith("www."): h = h[4:]
    if h in SOCIAL_HOSTS: return ""
    return h


def fetch_cdx(domain: str, retries: int = 2) -> dict:
    """Return {'ok': bool, 'first_capture': 'YYYYMMDDhhmmss', 'first_url': str, ...}

    Uses the lighter /wayback/available endpoint with timestamp=19960101 so the
    'closest' snapshot returned is essentially the earliest capture. The heavier
    /cdx/search endpoint rate-limits aggressively.
    """
    url = f"https://archive.org/wayback/available?url={domain}&timestamp=19960101"
    last_err = ""
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                data = json.loads(r.read())
            snap = (data.get("archived_snapshots") or {}).get("closest")
            if not snap:
                return {"ok": True, "first_capture": "", "first_url": "", "no_captures": True}
            return {"ok": True,
                    "first_capture": snap.get("timestamp",""),
                    "first_url":     snap.get("url",""),
                    "no_captures": False}
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}"
            if e.code in (429, 503): time.sleep(2 + attempt*2)
            elif e.code == 404: return {"ok": True, "no_captures": True}
        except Exception as e:
            last_err = str(e)[:100]
            time.sleep(1 + attempt)
    return {"ok": False, "error": last_err}


def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [wayback] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def collect_targets():
    """Return {pid: (host, kind)}, {host: [pids]}"""
    targets, by_host = {}, {}
    if PLACES_PATH.exists():
        for p in json.loads(PLACES_PATH.read_text(encoding="utf-8")).get("places", []):
            d = extract_domain(p.get("website",""))
            if d:
                targets[p["id"]] = (d, "place")
                by_host.setdefault(d, []).append(p["id"])
    if CLINICS_INDEX.exists():
        for pid, c in json.loads(CLINICS_INDEX.read_text(encoding="utf-8")).items():
            d = extract_domain(c.get("website",""))
            if d:
                targets[pid] = (d, "clinic")
                by_host.setdefault(d, []).append(pid)
    return targets, by_host


def main():
    targets, by_host = collect_targets()
    domains = sorted(by_host.keys())
    log(f"targets: {len(targets)}  unique domains: {len(domains)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cached: {len(cache)}")

    todo = [d for d in domains if d not in cache]
    log(f"to fetch: {len(todo)}")

    if todo:
        t0 = time.time()
        done = 0
        with ThreadPoolExecutor(max_workers=THREADS) as ex:
            futs = {ex.submit(fetch_cdx, d): d for d in todo}
            for fut in as_completed(futs):
                d = futs[fut]
                try:
                    res = fut.result()
                except Exception as e:
                    res = {"ok": False, "error": str(e)[:100]}
                cache[d] = res
                done += 1
                if done % 25 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0
                    rate = done/el if el else 0
                    eta = (len(todo)-done)/rate if rate else 0
                    fc = res.get("first_capture","")[:8]
                    log(f"  [{done}/{len(todo)}]  {d}  ok={res.get('ok')} first={fc}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Build outputs
    now = datetime.utcnow()
    def build_entry(domain, rec):
        ts = rec.get("first_capture","")
        first_date = ""
        age_days = None
        if ts and len(ts) >= 8:
            try:
                dt = datetime(int(ts[:4]), int(ts[4:6]), int(ts[6:8]))
                first_date = dt.strftime("%Y-%m-%d")
                age_days = (now - dt).days
            except Exception: pass
        return {
            "domain": domain,
            "ok": bool(rec.get("ok")),
            "first_capture": first_date,
            "first_capture_ts": ts,
            "first_url": rec.get("first_url",""),
            "age_days": age_days,
            "age_years": round(age_days/365.25, 1) if isinstance(age_days,int) else None,
            "no_captures": bool(rec.get("no_captures")),
            "error": rec.get("error",""),
        }

    places_out, clinics_out = {}, {}
    stats = {"places":0, "clinics":0, "with_capture":0, "older_5y":0, "older_10y":0, "older_15y":0, "no_captures":0}
    for pid, (host, kind) in targets.items():
        rec = cache.get(host)
        if not rec: continue
        entry = build_entry(host, rec)
        if kind == "place": places_out[pid] = entry; stats["places"] += 1
        else: clinics_out[pid] = entry; stats["clinics"] += 1
        if entry["first_capture"]: stats["with_capture"] += 1
        if entry.get("no_captures"): stats["no_captures"] += 1
        if isinstance(entry["age_days"], int):
            if entry["age_days"] > 365*5: stats["older_5y"] += 1
            if entry["age_days"] > 365*10: stats["older_10y"] += 1
            if entry["age_days"] > 365*15: stats["older_15y"] += 1

    if places_out:
        OUT_PLACES.write_text(json.dumps(places_out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_PLACES}  ({len(places_out)} places)")
    if clinics_out:
        OUT_CLINICS.write_text(json.dumps(clinics_out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_CLINICS}  ({len(clinics_out)} clinics)")

    if clinics_out and CLINICS_INDEX.exists():
        index = json.loads(CLINICS_INDEX.read_text(encoding="utf-8"))
        per_source = {src: {} for src in SOURCE_TO_OUT}
        for pid, entry in clinics_out.items():
            src = (index.get(pid) or {}).get("source")
            if src in per_source: per_source[src][pid] = entry
        for src, out_rel in SOURCE_TO_OUT.items():
            out_path = PARENT / out_rel
            out_path.parent.mkdir(parents=True, exist_ok=True)
            payload = {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "scraper": "siamverified-portable/scripts/enrich_wayback.py",
                "fields": "domain, ok, first_capture (YYYY-MM-DD), first_capture_ts, first_url, age_days, age_years, no_captures",
                "places": per_source[src],
            }
            out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
            log(f"  wrote {out_path}  ({len(per_source[src])} clinics)")

    log(f"DONE  {stats}")


if __name__ == "__main__":
    main()
