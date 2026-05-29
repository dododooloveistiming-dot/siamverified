"""
DNS MX records lookup for each domain. Reveals what email infrastructure
the business actually uses — proxy for professionalism.

Classification:
  google         : *.google.com or *.googlemail.com
  microsoft365   : *.outlook.com or *.mail.protection.outlook.com
  zoho           : *.zoho.com
  proton         : *.protonmail.ch / proton.me
  yandex         : *.yandex.net
  amazon_workmail: *.awsapps.com
  fastmail       : *.messagingengine.com
  thai_hosting   : *.csloxinfo.com / *.totisp.net / *.thaiserver.* / etc.
  cpanel         : *.cpanel.* or *.namecheap.*
  self_hosted    : MX points to own domain
  none           : no MX records (uses A-only fallback, often weak)
  other          : everything else

Outputs:
  - public/data/per_place_dns.json
  - public/data/per_clinic_dns.json
  - per-source sibling files

VPN 불필요 — system nslookup.
"""
import json, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent
PLACES_PATH    = ROOT / "public" / "data" / "places.json"
CLINICS_INDEX  = ROOT / "public" / "data" / "clinics_index.json"
OUT_PLACES     = ROOT / "public" / "data" / "per_place_dns.json"
OUT_CLINICS    = ROOT / "public" / "data" / "per_clinic_dns.json"
CACHE_PATH     = ROOT / "public" / "data" / "_raw" / "dns_cache.json"
LOG_PATH       = ROOT / "public" / "data" / "_raw" / "dns.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

SOURCE_TO_OUT = {
    "dental_export/clinics.csv":         "dental_export/dns_data.json",
    "dental_output/bangkok/clinics.csv": "dental_output/bangkok/dns_data.json",
    "dental_pattaya/output/clinics.csv": "dental_pattaya/output/dns_data.json",
    "hair_bangkok/output/clinics.csv":   "hair_bangkok/output/dns_data.json",
}

THREADS = 16
TIMEOUT = 8

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
    except Exception: return ""
    if h.startswith("www."): h = h[4:]
    if h in SOCIAL_HOSTS: return ""
    return h


def nslookup_mx(domain: str) -> list[str]:
    try:
        r = subprocess.run(
            ["nslookup", "-type=MX", domain],
            capture_output=True, text=True, timeout=TIMEOUT,
            encoding="utf-8", errors="replace",
        )
        out = r.stdout or ""
    except Exception:
        return []
    # nslookup formats vary by OS — handle common ones
    mxs = re.findall(r'mail exchanger\s*=\s*\d+\s+([\w\-.]+)', out, re.IGNORECASE)
    if not mxs:
        mxs = re.findall(r'MX preference\s*=\s*\d+,\s*mail exchanger\s*=\s*([\w\-.]+)', out)
    # Clean: strip trailing dot, lowercase
    return [m.rstrip(".").lower() for m in mxs if m and m != "(root)"]


def classify(mxs: list[str], domain: str) -> str:
    if not mxs: return "none"
    s = " ".join(mxs).lower()
    base = domain.lower()
    if any(("google.com" in m or "googlemail.com" in m) for m in mxs): return "google"
    if any(("outlook.com" in m or "protection.outlook.com" in m) for m in mxs): return "microsoft365"
    if any("zoho.com" in m for m in mxs): return "zoho"
    if any(("protonmail.ch" in m or "proton.me" in m) for m in mxs): return "proton"
    if any("yandex" in m for m in mxs): return "yandex"
    if any("awsapps.com" in m for m in mxs): return "amazon_workmail"
    if any("messagingengine.com" in m for m in mxs): return "fastmail"
    if any(("csloxinfo" in m or "thaiserver" in m or "totisp" in m or ".co.th" in m) for m in mxs): return "thai_hosting"
    if any(("cpanel." in m or "namecheap" in m or "hostgator" in m) for m in mxs): return "cpanel_hosting"
    if any(m.endswith("." + base) or m == base for m in mxs): return "self_hosted"
    return "other"


def lookup(domain: str) -> dict:
    mxs = nslookup_mx(domain)
    provider = classify(mxs, domain)
    return {
        "ok": bool(mxs) or provider == "none",
        "mx": mxs,
        "provider": provider,
    }


def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [dns] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def collect_targets():
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
            futs = {ex.submit(lookup, d): d for d in todo}
            for fut in as_completed(futs):
                d = futs[fut]
                try: res = fut.result()
                except Exception as e: res = {"ok": False, "error": str(e)[:100], "mx": [], "provider": "error"}
                cache[d] = res
                done += 1
                if done % 50 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0
                    rate = done/el if el else 0
                    eta = (len(todo)-done)/rate if rate else 0
                    log(f"  [{done}/{len(todo)}]  {d}  {res.get('provider')}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Outputs
    places_out, clinics_out = {}, {}
    from collections import Counter
    provider_stats = Counter()
    for pid, (host, kind) in targets.items():
        rec = cache.get(host)
        if not rec: continue
        entry = {
            "domain": host,
            "mx": rec.get("mx",[]),
            "provider": rec.get("provider","unknown"),
            "professional": rec.get("provider") in {"google","microsoft365","zoho","proton","fastmail","amazon_workmail"},
        }
        provider_stats[entry["provider"]] += 1
        if kind == "place": places_out[pid] = entry
        else: clinics_out[pid] = entry

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
                "scraper": "siamverified-portable/scripts/enrich_dns_mx.py",
                "fields": "domain, mx, provider, professional",
                "providers": "google | microsoft365 | zoho | proton | fastmail | amazon_workmail | thai_hosting | cpanel_hosting | self_hosted | none | other",
                "places": per_source[src],
            }
            out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
            log(f"  wrote {out_path}  ({len(per_source[src])} clinics)")

    log(f"DONE  providers={dict(provider_stats.most_common())}")


if __name__ == "__main__":
    main()
