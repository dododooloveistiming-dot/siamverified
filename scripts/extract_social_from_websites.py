"""
Step 1a: Fetch real-domain homepages (non-FB/IG/LINE) and extract embedded
SNS handles from <a href="..."> links. Merges results into per_place_social.json.

Filtering:
  - Skip reserved paths (FB sharer/plugin URLs, IG explore/p, etc — see
    mine_social_handles.py).
  - Skip handles that appear on >5 distinct domains (likely template defaults
    or platform marketing pages).
  - Skip handles shorter than 3 chars after path strip.
  - For each (domain, platform) pair, keep only the FIRST plausible handle.
"""
import csv, json, re, sys, time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse
import urllib.request, urllib.error, gzip, io

ROOT = Path(__file__).resolve().parent.parent
PLACES_PATH = ROOT / "public" / "data" / "places.json"
SOCIAL_PATH = ROOT / "public" / "data" / "per_place_social.json"
HTML_CACHE  = ROOT / "public" / "data" / "_raw" / "homepage_cache.json"
HTML_CACHE.parent.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ROOT / "scripts"))
from mine_social_handles import (
    extract_fb, extract_ig, extract_line, extract_tt, extract_yt,
    norm_name, norm_phone, HANDLE_BLACKLIST, clean_handle, FB_RESERVED,
)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
TIMEOUT = 10
THREADS = 10

# Hosts handled directly (already mined in Step 1); skip fetching their homepage
SOCIAL_HOSTS = {
    "facebook.com","m.facebook.com","www.facebook.com","fb.com","fb.me","www.fb.com",
    "instagram.com","www.instagram.com","instagr.am",
    "line.me","lin.ee","page.line.me","liff.line.me","timeline.line.me",
    "tiktok.com","www.tiktok.com","vm.tiktok.com",
    "youtube.com","www.youtube.com","youtu.be","m.youtube.com",
}

LINK_RE = re.compile(rb'(?:href|src|content)\s*=\s*[\"\']([^\"\']{6,400})[\"\']', re.IGNORECASE)
PLAIN_URL_RE = re.compile(rb'https?://[^\s\"\'<>()]+')

def fetch_html(url: str) -> tuple[bool, str]:
    """Return (ok, html_text_or_error)."""
    if not url.startswith("http"): url = "https://" + url
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,th;q=0.8,ko;q=0.7",
            "Accept-Encoding": "gzip, deflate",
        })
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            data = r.read(2_000_000)  # cap at 2MB
            if r.headers.get("Content-Encoding") == "gzip":
                try: data = gzip.decompress(data)
                except Exception: pass
            # Detect charset; default utf-8
            ct = r.headers.get("Content-Type","")
            enc = "utf-8"
            m = re.search(r"charset=([\w-]+)", ct, re.I)
            if m: enc = m.group(1)
            try:
                return True, data.decode(enc, errors="replace")
            except Exception:
                return True, data.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, str(e)[:120]

def extract_handles_from_html(html: str) -> dict:
    """Return {platform: handle} from any embedded social URL in the HTML."""
    if not html: return {}
    hits = {"facebook": "", "instagram": "", "line": "", "tiktok": "", "youtube": ""}
    text = html.encode("utf-8", errors="replace") if isinstance(html, str) else html
    # gather both href= and bare URLs
    urls = set()
    for m in LINK_RE.finditer(text):
        urls.add(m.group(1).decode("utf-8", errors="replace"))
    for m in PLAIN_URL_RE.finditer(text):
        urls.add(m.group(0).decode("utf-8", errors="replace"))
    for url in urls:
        if len(url) > 500: continue
        for plat, fn in (("facebook",extract_fb),("instagram",extract_ig),
                         ("line",extract_line),("tiktok",extract_tt),("youtube",extract_yt)):
            if hits[plat]: continue
            h = fn(url)
            if h: hits[plat] = h
        if all(hits.values()): break
    return {k:v for k,v in hits.items() if v}

def main():
    with open(PLACES_PATH, "r", encoding="utf-8") as f:
        places = json.load(f)["places"]

    # Map place_id → domain (only real domains, not social)
    pid_to_url = {}
    real_domains = set()
    for p in places:
        w = (p.get("website") or "").strip()
        if not w: continue
        try:
            u = urlparse(w if "://" in w else "https://"+w)
            host = (u.hostname or "").lower()
        except Exception:
            continue
        if not host: continue
        if host in SOCIAL_HOSTS: continue
        # Strip leading www.
        host = host[4:] if host.startswith("www.") else host
        pid_to_url[p["id"]] = (host, w if w.startswith("http") else "https://"+w)
        real_domains.add(host)

    print(f"places to scan: {len(pid_to_url)}  (unique real domains: {len(real_domains)})")

    # Load cache
    cache = {}
    if HTML_CACHE.exists():
        try: cache = json.loads(HTML_CACHE.read_text(encoding="utf-8"))
        except Exception: cache = {}
    print(f"cached: {len(cache)}")

    # Fetch
    todo = [d for d in real_domains if d not in cache]
    print(f"to fetch: {len(todo)}")

    def work(domain):
        # Try https://<domain> first; if it fails try https://www.<domain>
        for url in (f"https://{domain}", f"https://www.{domain}"):
            ok, body = fetch_html(url)
            if ok and body:
                handles = extract_handles_from_html(body)
                return domain, {"ok": True, "url": url, "handles": handles}
            last = body
        return domain, {"ok": False, "error": last}

    t0 = time.time()
    done = 0
    with ThreadPoolExecutor(max_workers=THREADS) as ex:
        futs = {ex.submit(work, d): d for d in todo}
        for fut in as_completed(futs):
            d, res = fut.result()
            cache[d] = res
            done += 1
            if done % 25 == 0 or done == len(todo):
                HTML_CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                el = time.time()-t0
                rate = done/el if el else 0
                eta = (len(todo)-done)/rate if rate else 0
                hit = len(res.get("handles",{})) if res.get("ok") else 0
                print(f"  [{done}/{len(todo)}]  {d}  ok={res.get('ok')} hits={hit}  rate={rate:.1f}/s eta={eta:.0f}s", flush=True)

    HTML_CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Filter: drop handles that appear across many distinct domains (template defaults).
    # Threshold raised to >10 so that legitimate chains (Let's Relax = 38 branches) survive,
    # while obvious template/marketing defaults are still caught. Plus an explicit
    # platform/marketing blacklist for known 3rd-party services.
    handle_freq = Counter()
    for d, rec in cache.items():
        if not rec.get("ok"): continue
        for plat, handle in (rec.get("handles") or {}).items():
            handle_freq[(plat, handle)] += 1
    freq_blacklist = {key for key, n in handle_freq.items() if n > 25}
    blacklist = set(HANDLE_BLACKLIST) | freq_blacklist
    print(f"\nblacklisted: {len(blacklist)}  (freq>25 → {len(freq_blacklist)}, manual → {len(HANDLE_BLACKLIST)})")
    for k in list(freq_blacklist)[:10]:
        print(f"  freq: {k} ({handle_freq[k]} domains)")

    # Merge into per_place_social.json
    if SOCIAL_PATH.exists():
        per_place = json.loads(SOCIAL_PATH.read_text(encoding="utf-8"))
    else:
        per_place = {}

    added = Counter()
    placed = 0
    for pid, (host, _url) in pid_to_url.items():
        rec = cache.get(host)
        if not rec or not rec.get("ok"): continue
        handles = rec.get("handles") or {}
        if not handles: continue
        entry = per_place.get(pid) or {"facebook":"","instagram":"","line":"","tiktok":"","youtube":"","sources":[]}
        changed = False
        for plat, handle in handles.items():
            handle = clean_handle(handle or "")
            if not handle: continue
            # Re-apply reserved-path filter (cache may pre-date current FB_RESERVED)
            if plat == "facebook" and handle.lower() in FB_RESERVED: continue
            if (plat, handle.lower()) in blacklist: continue
            if entry.get(plat): continue
            entry[plat] = handle
            entry.setdefault("sources",[]).append({"platform": plat, "via": "homepage_scrape", "domain": host})
            added[plat] += 1
            changed = True
        if changed:
            per_place[pid] = entry
            placed += 1

    SOCIAL_PATH.write_text(json.dumps(per_place, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    print(f"\nUpdated {SOCIAL_PATH}")
    print(f"  places that gained at least one handle: {placed}")
    for plat, n in added.most_common():
        print(f"  +{plat}: {n}")
    # final totals
    totals = Counter()
    for v in per_place.values():
        for plat in ("facebook","instagram","line","tiktok","youtube"):
            if v.get(plat): totals[plat] += 1
    print(f"\nFinal totals across {len(per_place)} places:")
    for plat, n in totals.most_common():
        print(f"  {plat}: {n}")

if __name__ == "__main__":
    main()
