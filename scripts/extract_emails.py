"""
Extract contact emails from homepage HTML of places (verifiedthai.com).

For cold-outreach lead generation. Pulls mailto: links and plain-text email
addresses, filters out:
  - third-party service emails (wix/squarespace/godaddy)
  - common no-reply patterns
  - image filenames misread as emails (image@2x.png)
  - frequency-blacklisted emails (templates on >10 domains)

Tier-ranks: same_domain > personal_provider > other.

Output: public/data/per_place_emails.json.
VPN 불필요.
"""
import json, re, sys, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PLACES_PATH = ROOT / "public" / "data" / "places.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_emails.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "email_cache.json"
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "email_extract.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ROOT / "scripts"))
from extract_social_from_websites import fetch_html, SOCIAL_HOSTS, THREADS

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,24}')
MAILTO_RE = re.compile(r'mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,24})', re.IGNORECASE)

THIRD_PARTY_DOMAINS = {
    "wix.com","wixsite.com","squarespace.com","weebly.com",
    "godaddy.com","ionos.com","siteground.com","namecheap.com",
    "shopify.com","bigcommerce.com",
    "google.com","google-analytics.com","googleusercontent.com",
    "facebook.com","fb.com","instagram.com",
    "youtube.com","twitter.com","x.com","linktr.ee","linktree.com",
    "sentry.io","stripe.com","paypal.com",
    "tripadvisor.com","booking.com","agoda.com","expedia.com",
    "klook.com","getyourguide.com",
    "example.com","domain.com","yourdomain.com","yoursite.com",
    "test.com","email.com","company.com",
    "wordpress.com","wpengine.com","elementor.com",
    "sentry.com","datadog.com","cloudflare.com","aws.amazon.com",
}

PERSONAL_DOMAINS = {
    "gmail.com","googlemail.com","yahoo.com","yahoo.co.th","ymail.com",
    "hotmail.com","outlook.com","live.com","msn.com",
    "icloud.com","me.com","naver.com","kakao.com","qq.com","163.com",
    "aol.com","protonmail.com","proton.me",
}

BAD_LOCAL_PARTS = {
    "noreply","no-reply","donotreply","do-not-reply",
    "test","example","user","name","your-email","yourname","youremail","youraddress",
    "sentry","datadog","analytics","abuse","postmaster","webmaster","wordpress","sample",
}

IMAGE_EXT_RE = re.compile(r'\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|css|js|woff|ttf)$', re.IGNORECASE)


def normalize(e): return e.strip().rstrip(".,;:)").lower()


def is_bad(email):
    e = email.lower()
    if "@" not in e: return True
    local, _, dom = e.partition("@")
    if not local or not dom: return True
    if IMAGE_EXT_RE.search(e): return True
    if local in BAD_LOCAL_PARTS: return True
    if local.isdigit() and len(local) <= 3: return True
    if dom in THIRD_PARTY_DOMAINS: return True
    if dom in ("localhost","domain"): return True
    return False


def classify(email, host):
    e = email.lower()
    _, _, dom = e.partition("@")
    host = (host or "").lower()
    if host.startswith("www."): host = host[4:]
    h_base = ".".join(host.split(".")[-2:]) if host else ""
    d_base = ".".join(dom.split(".")[-2:])
    if h_base and (dom == host or dom.endswith("." + host) or host.endswith("." + dom) or h_base == d_base):
        return "same_domain"
    if dom in PERSONAL_DOMAINS: return "personal"
    return "other"


def extract_emails(html):
    if not html: return []
    found = set()
    for m in MAILTO_RE.finditer(html): found.add(normalize(m.group(1)))
    for m in EMAIL_RE.finditer(html): found.add(normalize(m.group(0)))
    return sorted(e for e in found if not is_bad(e))


def log(msg):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [emails] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def main():
    if not PLACES_PATH.exists():
        log(f"FATAL: {PLACES_PATH} missing"); sys.exit(1)
    targets = {}
    domain_to_pids = {}
    for p in json.loads(PLACES_PATH.read_text(encoding="utf-8")).get("places", []):
        w = (p.get("website") or "").strip()
        if not w: continue
        try:
            u = urlparse(w if "://" in w else "https://"+w)
            host = (u.hostname or "").lower()
        except Exception: continue
        if not host or host in SOCIAL_HOSTS: continue
        if host.startswith("www."): host = host[4:]
        targets[p["id"]] = host
        domain_to_pids.setdefault(host, []).append(p["id"])
    unique = sorted(domain_to_pids)
    log(f"places: {len(targets)}  unique domains: {len(unique)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cached: {len(cache)}")

    todo = [d for d in unique if d not in cache]
    log(f"to fetch: {len(todo)}")

    def work(domain):
        for url in (f"https://{domain}", f"https://www.{domain}"):
            ok, body = fetch_html(url)
            if ok and body:
                return domain, {"ok": True, "url": url, "emails": extract_emails(body)}
            last = body
        return domain, {"ok": False, "error": last}

    if todo:
        t0 = time.time(); done = 0
        with ThreadPoolExecutor(max_workers=THREADS) as ex:
            futs = {ex.submit(work, d): d for d in todo}
            for fut in as_completed(futs):
                d, res = fut.result(); cache[d] = res; done += 1
                if done % 25 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0; rate = done/el if el else 0; eta = (len(todo)-done)/rate if rate else 0
                    n = len(res.get("emails",[])) if res.get("ok") else 0
                    log(f"  [{done}/{len(todo)}]  {d}  ok={res.get('ok')} emails={n}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    email_freq = Counter()
    for d, rec in cache.items():
        if not rec.get("ok"): continue
        for e in rec.get("emails",[]): email_freq[e] += 1
    freq_blacklist = {e for e, n in email_freq.items() if n > 10}
    log(f"freq-blacklist (>10): {len(freq_blacklist)}")

    out = {}
    stats = {"places_with_email":0, "same_domain":0, "personal":0, "other":0}
    for pid, host in targets.items():
        rec = cache.get(host)
        if not rec or not rec.get("ok"): continue
        emails = [e for e in rec.get("emails",[]) if e not in freq_blacklist]
        if not emails: continue
        classified = []
        for e in emails:
            t = classify(e, host); classified.append((t, e)); stats[t] += 1
        tier_rank = {"same_domain":0, "personal":1, "other":2}
        classified.sort(key=lambda x: (tier_rank[x[0]], x[1]))
        out[pid] = {"domain": host, "url": rec.get("url",""),
                    "emails": [e for _, e in classified],
                    "classified": [{"email":e,"tier":t} for t, e in classified],
                    "primary_email": classified[0][1] if classified else "",
                    "primary_tier": classified[0][0] if classified else ""}
        stats["places_with_email"] += 1

    if out:
        OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_PATH}  ({len(out)} places)")
    log(f"DONE  {stats}")


if __name__ == "__main__":
    main()
