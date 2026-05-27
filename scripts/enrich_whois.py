"""
Fetch domain registration date via RDAP for each website in places.json.
Outputs public/data/per_place_whois.json keyed by place_id.

Uses rdap.org as a TLD-routing redirector (no API key required).
Rate-limited at 0.4 sec per domain. Caches per-domain results so re-runs are cheap.
"""
import json, os, re, sys, time, urllib.request, urllib.error
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
PLACES = ROOT / "public" / "data" / "places.json"
OUT    = ROOT / "public" / "data" / "per_place_whois.json"
CACHE  = ROOT / "public" / "data" / "_raw" / "whois_cache.json"
CACHE.parent.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (compatible; siamverified/1.0)"
RDAP_BASE = "https://rdap.org/domain/"

def extract_domain(url: str) -> str:
    if not url: return ""
    if not url.startswith("http"): url = "https://" + url
    try:
        h = (urlparse(url).hostname or "").lower()
    except Exception:
        return ""
    if h.startswith("www."): h = h[4:]
    return h

def parse_rdap(data: dict) -> dict:
    out = {"registered": "", "expires": "", "updated": "", "registrar": "", "status": [], "raw_handle": data.get("handle","")}
    for ev in (data.get("events") or []):
        action = (ev.get("eventAction") or "").lower()
        date = ev.get("eventDate","")
        if action == "registration":     out["registered"] = date
        elif action == "expiration":     out["expires"] = date
        elif action == "last changed":   out["updated"] = date
    # Registrar from entities
    for ent in (data.get("entities") or []):
        if "registrar" in (ent.get("roles") or []):
            v = ent.get("vcardArray")
            if v and len(v) > 1:
                for item in v[1]:
                    if item and item[0] == "fn" and len(item) >= 4:
                        out["registrar"] = item[3]
                        break
    out["status"] = data.get("status") or []
    return out

def fetch_rdap(domain: str, retries: int = 2) -> dict:
    url = RDAP_BASE + domain
    last_err = ""
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rdap+json"})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read().decode("utf-8"))
            return {"ok": True, **parse_rdap(data)}
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}"
            if e.code == 404: return {"ok": False, "error": "not_found"}
            if e.code == 429: time.sleep(3)
        except Exception as e:
            last_err = str(e)[:100]
        time.sleep(1)
    return {"ok": False, "error": last_err}

def main():
    with open(PLACES, "r", encoding="utf-8") as f:
        pj = json.load(f)
    places = pj["places"]

    # Build (place_id, domain) list
    pid_to_domain = {}
    domains = set()
    for p in places:
        d = extract_domain(p.get("website",""))
        if d and "." in d:
            pid_to_domain[p["id"]] = d
            domains.add(d)
    print(f"places with domain: {len(pid_to_domain)} / {len(places)}")
    print(f"unique domains: {len(domains)}")

    # Load cache
    cache = {}
    if CACHE.exists():
        try:
            cache = json.loads(CACHE.read_text(encoding="utf-8"))
        except Exception:
            cache = {}
    print(f"cached: {len(cache)}")

    # Fetch
    todo = sorted(d for d in domains if d not in cache)
    print(f"to fetch: {len(todo)}")
    t0 = time.time()
    for i, d in enumerate(todo, 1):
        info = fetch_rdap(d)
        cache[d] = info
        # Periodically save
        if i % 25 == 0 or i == len(todo):
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
            elapsed = time.time() - t0
            rate = i / elapsed if elapsed else 0
            eta = (len(todo)-i) / rate if rate else 0
            print(f"  [{i}/{len(todo)}] {d}  ok={info.get('ok')} reg={info.get('registered','')[:10]}  rate={rate:.1f}/s eta={eta:.0f}s")
        time.sleep(0.4)

    # Build per-place output
    out = {}
    now = datetime.utcnow()
    for pid, d in pid_to_domain.items():
        info = cache.get(d, {})
        reg = info.get("registered","")
        age_days = None
        if reg:
            try:
                # RDAP returns ISO 8601 with timezone
                dt = datetime.fromisoformat(reg.replace("Z","+00:00"))
                age_days = (now.replace(tzinfo=dt.tzinfo) - dt).days if dt.tzinfo else (now - dt).days
            except Exception:
                age_days = None
        out[pid] = {
            "domain": d,
            "ok": bool(info.get("ok")),
            "registered": reg,
            "expires": info.get("expires",""),
            "registrar": info.get("registrar",""),
            "status": info.get("status",[]),
            "age_days": age_days,
            "age_years": round(age_days/365.25, 1) if isinstance(age_days,int) else None,
        }

    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    print(f"\nWrote {OUT}")
    print(f"  places: {len(out)}")
    ok = sum(1 for v in out.values() if v["ok"])
    print(f"  successful WHOIS: {ok}")
    older_3y = sum(1 for v in out.values() if (v["age_days"] or 0) > 1095)
    older_5y = sum(1 for v in out.values() if (v["age_days"] or 0) > 1826)
    print(f"  domain age > 3 years: {older_3y}")
    print(f"  domain age > 5 years: {older_5y}")

if __name__ == "__main__":
    main()
