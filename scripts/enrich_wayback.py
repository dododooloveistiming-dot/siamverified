"""
Wayback Machine first-capture date for place domains.

Uses archive.org /wayback/available endpoint (lighter than CDX). Passing
timestamp=19960101 returns the earliest snapshot. Stronger "site went live"
signal than RDAP (which only shows when domain was registered).

Output: public/data/per_place_wayback.json.
VPN 불필요.
"""
import json, sys, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PLACES_PATH = ROOT / "public" / "data" / "places.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_wayback.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "wayback_cache.json"
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "wayback.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (compatible; siamverified/1.0)"
THREADS = 4
TIMEOUT = 15

SOCIAL_HOSTS = {
    "facebook.com","instagram.com","line.me","lin.ee","tiktok.com",
    "youtube.com","twitter.com","x.com","linktr.ee","wa.me",
    "m.facebook.com","www.facebook.com","fb.com","fb.me",
    "www.instagram.com","instagr.am","page.line.me",
}


def extract_domain(url):
    if not url: return ""
    if not url.startswith("http"): url = "https://" + url
    try: h = (urlparse(url).hostname or "").lower()
    except Exception: return ""
    if h.startswith("www."): h = h[4:]
    if h in SOCIAL_HOSTS: return ""
    return h


def fetch_cdx(domain, retries=2):
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
            return {"ok": True, "first_capture": snap.get("timestamp",""),
                    "first_url": snap.get("url",""), "no_captures": False}
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}"
            if e.code in (429, 503): time.sleep(2 + attempt*2)
            elif e.code == 404: return {"ok": True, "no_captures": True}
        except Exception as e:
            last_err = str(e)[:100]
            time.sleep(1 + attempt)
    return {"ok": False, "error": last_err}


def log(msg):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [wayback] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def main():
    if not PLACES_PATH.exists():
        log(f"FATAL: {PLACES_PATH} missing"); sys.exit(1)
    pid_to_domain = {}
    domains = set()
    for p in json.loads(PLACES_PATH.read_text(encoding="utf-8")).get("places", []):
        d = extract_domain(p.get("website",""))
        if d:
            pid_to_domain[p["id"]] = d; domains.add(d)
    log(f"places with domain: {len(pid_to_domain)}  unique: {len(domains)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cached: {len(cache)}")

    todo = sorted(d for d in domains if d not in cache)
    log(f"to fetch: {len(todo)}")

    if todo:
        t0 = time.time(); done = 0
        with ThreadPoolExecutor(max_workers=THREADS) as ex:
            futs = {ex.submit(fetch_cdx, d): d for d in todo}
            for fut in as_completed(futs):
                d = futs[fut]
                try: res = fut.result()
                except Exception as e: res = {"ok": False, "error": str(e)[:100]}
                cache[d] = res; done += 1
                if done % 25 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0; rate = done/el if el else 0; eta = (len(todo)-done)/rate if rate else 0
                    log(f"  [{done}/{len(todo)}]  {d}  first={res.get('first_capture','')[:8]}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    now = datetime.utcnow()
    out = {}
    stats = {"places":0, "with_capture":0, "older_5y":0, "older_10y":0, "older_15y":0, "no_captures":0}
    for pid, host in pid_to_domain.items():
        rec = cache.get(host)
        if not rec: continue
        ts = rec.get("first_capture",""); first_date = ""; age_days = None
        if ts and len(ts) >= 8:
            try:
                dt = datetime(int(ts[:4]), int(ts[4:6]), int(ts[6:8]))
                first_date = dt.strftime("%Y-%m-%d"); age_days = (now - dt).days
            except Exception: pass
        entry = {"domain": host, "ok": bool(rec.get("ok")),
                 "first_capture": first_date, "first_capture_ts": ts,
                 "first_url": rec.get("first_url",""),
                 "age_days": age_days,
                 "age_years": round(age_days/365.25, 1) if isinstance(age_days,int) else None,
                 "no_captures": bool(rec.get("no_captures")),
                 "error": rec.get("error","")}
        out[pid] = entry
        stats["places"] += 1
        if entry["first_capture"]: stats["with_capture"] += 1
        if entry.get("no_captures"): stats["no_captures"] += 1
        if isinstance(entry["age_days"], int):
            if entry["age_days"] > 365*5:  stats["older_5y"] += 1
            if entry["age_days"] > 365*10: stats["older_10y"] += 1
            if entry["age_days"] > 365*15: stats["older_15y"] += 1

    if out:
        OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_PATH}  ({len(out)} places)")
    log(f"DONE  {stats}")


if __name__ == "__main__":
    main()
