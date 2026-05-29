"""
DNS MX records for place domains. Reveals what email infrastructure
the business uses — proxy for professionalism.

Classification: google, microsoft365, zoho, proton, fastmail, amazon_workmail,
thai_hosting, cpanel_hosting, self_hosted, none, other.

Output: public/data/per_place_dns.json.
VPN 불필요 — system nslookup.
"""
import json, re, subprocess, sys, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PLACES_PATH = ROOT / "public" / "data" / "places.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_dns.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "dns_cache.json"
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "dns.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

THREADS = 16
TIMEOUT = 8

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


def nslookup_mx(domain):
    try:
        r = subprocess.run(["nslookup", "-type=MX", domain],
                           capture_output=True, text=True, timeout=TIMEOUT,
                           encoding="utf-8", errors="replace")
        out = r.stdout or ""
    except Exception: return []
    mxs = re.findall(r'mail exchanger\s*=\s*\d+\s+([\w\-.]+)', out, re.IGNORECASE)
    if not mxs:
        mxs = re.findall(r'MX preference\s*=\s*\d+,\s*mail exchanger\s*=\s*([\w\-.]+)', out)
    return [m.rstrip(".").lower() for m in mxs if m and m != "(root)"]


def classify(mxs, domain):
    if not mxs: return "none"
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


def lookup(domain):
    mxs = nslookup_mx(domain)
    return {"ok": True, "mx": mxs, "provider": classify(mxs, domain)}


def log(msg):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [dns] {msg}"
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
            futs = {ex.submit(lookup, d): d for d in todo}
            for fut in as_completed(futs):
                d = futs[fut]
                try: res = fut.result()
                except Exception as e: res = {"ok": False, "error": str(e)[:100], "mx": [], "provider": "error"}
                cache[d] = res; done += 1
                if done % 50 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0; rate = done/el if el else 0; eta = (len(todo)-done)/rate if rate else 0
                    log(f"  [{done}/{len(todo)}]  {d}  {res.get('provider')}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    out = {}
    provider_stats = Counter()
    for pid, host in pid_to_domain.items():
        rec = cache.get(host)
        if not rec: continue
        entry = {"domain": host, "mx": rec.get("mx",[]), "provider": rec.get("provider","unknown"),
                 "professional": rec.get("provider") in {"google","microsoft365","zoho","proton","fastmail","amazon_workmail"}}
        provider_stats[entry["provider"]] += 1
        out[pid] = entry

    if out:
        OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_PATH}  ({len(out)} places)")
    log(f"DONE  providers={dict(provider_stats.most_common())}")


if __name__ == "__main__":
    main()
