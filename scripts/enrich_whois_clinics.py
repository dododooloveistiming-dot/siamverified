"""
WHOIS/RDAP for clinic domains. Sister of enrich_whois.py but reads
clinics_index.json (which has website field) and writes per-source
whois_data.json into the OWNING project folders.

Shares whois_cache.json with the places version — overlapping domains
fetched only once.

VPN 불필요 — RDAP via rdap.org, stdlib HTTP.
"""
import json, sys, time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent
INDEX_PATH = ROOT / "public" / "data" / "clinics_index.json"
CACHE_PATH = ROOT / "public" / "data" / "_raw" / "whois_cache.json"
LOG_PATH   = ROOT / "public" / "data" / "_raw" / "whois_clinics.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

SOURCE_TO_OUT = {
    "dental_export/clinics.csv":         "dental_export/whois_data.json",
    "dental_output/bangkok/clinics.csv": "dental_output/bangkok/whois_data.json",
    "dental_pattaya/output/clinics.csv": "dental_pattaya/output/whois_data.json",
    "hair_bangkok/output/clinics.csv":   "hair_bangkok/output/whois_data.json",
}

sys.path.insert(0, str(ROOT / "scripts"))
from enrich_whois import extract_domain, fetch_rdap

def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [clinic-whois] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass

def main():
    if not INDEX_PATH.exists():
        log(f"FATAL: {INDEX_PATH} missing"); sys.exit(1)
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))

    pid_to_domain = {}
    domains = set()
    for pid, c in index.items():
        w = (c.get("website") or "").strip()
        d = extract_domain(w)
        if d and "." in d:
            # Filter out SNS hosts — those go through SNS verifiers
            if any(d.endswith(x) for x in ("facebook.com","instagram.com","line.me","lin.ee",
                                            "tiktok.com","youtube.com","twitter.com","x.com",
                                            "linktr.ee","wa.me","linksta.cc")):
                continue
            pid_to_domain[pid] = d
            domains.add(d)
    log(f"clinics with real domain: {len(pid_to_domain)} / {len(index)}")
    log(f"unique domains: {len(domains)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"shared whois_cache size: {len(cache)}")

    todo = sorted(d for d in domains if d not in cache)
    log(f"to fetch: {len(todo)}")

    if todo:
        t0 = time.time()
        for i, d in enumerate(todo, 1):
            info = fetch_rdap(d)
            cache[d] = info
            if i % 25 == 0 or i == len(todo):
                CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                el = time.time()-t0
                rate = i/el if el else 0
                eta = (len(todo)-i)/rate if rate else 0
                log(f"  [{i}/{len(todo)}] {d}  ok={info.get('ok')} reg={info.get('registered','')[:10]}  rate={rate:.1f}/s eta={eta:.0f}s")
            time.sleep(0.4)

    # Build per-clinic output, split by source
    per_source = {src: {} for src in SOURCE_TO_OUT}
    stats_total = {"ok":0,"with_age":0,"older_3y":0,"older_5y":0,"places":0}
    now = datetime.utcnow()
    for pid, d in pid_to_domain.items():
        info = cache.get(d, {})
        reg = info.get("registered","")
        age_days = None
        if reg:
            try:
                dt = datetime.fromisoformat(reg.replace("Z","+00:00"))
                age_days = (now.replace(tzinfo=dt.tzinfo) - dt).days if dt.tzinfo else (now - dt).days
            except Exception:
                age_days = None
        entry = {
            "domain": d,
            "ok": bool(info.get("ok")),
            "registered": reg,
            "expires": info.get("expires",""),
            "registrar": info.get("registrar",""),
            "status": info.get("status",[]),
            "age_days": age_days,
            "age_years": round(age_days/365.25, 1) if isinstance(age_days,int) else None,
        }
        stats_total["places"] += 1
        if entry["ok"]: stats_total["ok"] += 1
        if isinstance(age_days, int):
            stats_total["with_age"] += 1
            if age_days > 1095: stats_total["older_3y"] += 1
            if age_days > 1826: stats_total["older_5y"] += 1

        src = (index.get(pid) or {}).get("source")
        if src in per_source:
            per_source[src][pid] = entry

    for src, out_rel in SOURCE_TO_OUT.items():
        out_path = PARENT / out_rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scraper": "siamverified-portable/scripts/enrich_whois_clinics.py",
            "fields": "domain, ok, registered, expires, registrar, status, age_days, age_years",
            "places": per_source[src],
        }
        out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"  wrote {out_path}  ({len(per_source[src])} places)")
    log(f"DONE  totals={stats_total}")

if __name__ == "__main__":
    main()
