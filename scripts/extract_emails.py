"""
Extract contact emails from homepage HTML of places + clinics.

For cold-outreach lead generation. Pulls mailto: links and plain-text email
addresses, then filters:
  - third-party service emails (wix/squarespace/godaddy support)
  - common no-reply patterns
  - image/asset filenames misread as emails (image@2x.png)
  - frequency-blacklisted emails (templates appearing on >10 domains)

Tier-ranks emails:
  1. same-domain      : info@example.com when website == example.com  (best)
  2. personal_provider: gmail/yahoo/hotmail/outlook  (owner direct, but personal)
  3. other            : different domain (potentially partner/agency)

Outputs:
  - public/data/per_place_emails.json
  - public/data/per_clinic_emails.json
  - per-source files for sibling clinic projects

VPN 불필요. ~3 min for 1000+ domains in parallel.
"""
import json, re, sys, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent
PLACES_PATH    = ROOT / "public" / "data" / "places.json"
CLINICS_INDEX  = ROOT / "public" / "data" / "clinics_index.json"
OUT_PLACES     = ROOT / "public" / "data" / "per_place_emails.json"
OUT_CLINICS    = ROOT / "public" / "data" / "per_clinic_emails.json"
CACHE_PATH     = ROOT / "public" / "data" / "_raw" / "email_cache.json"
LOG_PATH       = ROOT / "public" / "data" / "_raw" / "email_extract.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

SOURCE_TO_OUT = {
    "dental_export/clinics.csv":         "dental_export/emails_data.json",
    "dental_output/bangkok/clinics.csv": "dental_output/bangkok/emails_data.json",
    "dental_pattaya/output/clinics.csv": "dental_pattaya/output/emails_data.json",
    "hair_bangkok/output/clinics.csv":   "hair_bangkok/output/emails_data.json",
}

sys.path.insert(0, str(ROOT / "scripts"))
from extract_social_from_websites import fetch_html, SOCIAL_HOSTS, THREADS

# Email regex
EMAIL_RE = re.compile(
    r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,24}',
)
MAILTO_RE = re.compile(
    r'mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,24})',
    re.IGNORECASE,
)

# Filter out emails ending with these domains — they're 3rd-party services
THIRD_PARTY_DOMAINS = {
    "wix.com", "wixsite.com", "squarespace.com", "weebly.com",
    "godaddy.com", "ionos.com", "siteground.com", "namecheap.com",
    "shopify.com", "bigcommerce.com",
    "google.com", "google-analytics.com", "googleusercontent.com",
    "facebook.com", "fb.com", "instagram.com",
    "youtube.com", "twitter.com", "x.com",
    "linktr.ee", "linktree.com",
    "sentry.io", "stripe.com", "paypal.com",
    "tripadvisor.com", "booking.com", "agoda.com", "expedia.com",
    "klook.com", "getyourguide.com",
    "example.com", "domain.com", "yourdomain.com", "yoursite.com",
    "test.com", "email.com", "company.com",
    "wordpress.com", "wpengine.com", "elementor.com",
    "sentry.com", "datadog.com",
    "cloudflare.com", "aws.amazon.com",
}

# Personal-provider domains — keep but tag as personal
PERSONAL_DOMAINS = {
    "gmail.com", "googlemail.com",
    "yahoo.com", "yahoo.co.th", "ymail.com",
    "hotmail.com", "outlook.com", "live.com", "msn.com",
    "icloud.com", "me.com",
    "naver.com", "kakao.com",
    "qq.com", "163.com",
    "aol.com", "protonmail.com", "proton.me",
}

# Bad local-parts that mean "non-human contact"
BAD_LOCAL_PARTS = {
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "test", "example", "user", "name", "your-email",
    "yourname", "youremail", "youraddress",
    "sentry", "datadog", "analytics",
    "abuse", "postmaster",   # standard but never useful for outreach
    "webmaster",             # often template, weakly useful
    "wordpress",
    "sample",
}

# Image-filename patterns where someone wrote "image@2x.png" etc.
IMAGE_EXT_RE = re.compile(r'\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|css|js|woff|ttf)$', re.IGNORECASE)


def normalize(e: str) -> str:
    return e.strip().rstrip(".,;:)").lower()


def is_bad(email: str) -> bool:
    """Filter out non-contact emails."""
    e = email.lower()
    if "@" not in e: return True
    local, _, dom = e.partition("@")
    if not local or not dom: return True
    if IMAGE_EXT_RE.search(e): return True
    if local in BAD_LOCAL_PARTS: return True
    # Many emails embedded in code look like x@2x.png after partial-match — drop pure-digits localparts
    if local.isdigit() and len(local) <= 3: return True
    # Drop third-party service domains
    if dom in THIRD_PARTY_DOMAINS: return True
    # Drop obvious template TLDs
    if dom in ("localhost", "domain"): return True
    return False


def classify(email: str, host: str) -> str:
    """Return 'same_domain' / 'personal' / 'other'."""
    e = email.lower()
    _, _, dom = e.partition("@")
    host = (host or "").lower()
    if host.startswith("www."): host = host[4:]
    # Match same-domain (allow subdomain in either direction)
    h_base = ".".join(host.split(".")[-2:]) if host else ""
    d_base = ".".join(dom.split(".")[-2:])
    if h_base and (dom == host or dom.endswith("." + host) or host.endswith("." + dom) or h_base == d_base):
        return "same_domain"
    if dom in PERSONAL_DOMAINS:
        return "personal"
    return "other"


def extract_emails_from_html(html: str) -> list[str]:
    if not html: return []
    found = set()
    # mailto links first (highest signal)
    for m in MAILTO_RE.finditer(html):
        found.add(normalize(m.group(1)))
    # plain text emails (lower priority but broader catch)
    for m in EMAIL_RE.finditer(html):
        found.add(normalize(m.group(0)))
    return sorted(e for e in found if not is_bad(e))


def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [emails] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def collect_targets():
    """Return {pid -> (host, source_kind, source_path?, niche?)} for places + clinics."""
    targets = {}  # pid -> {"host": str, "kind": "place"|"clinic", "source": str (clinic-only)}
    domain_to_pids = {}  # host -> [pid]

    # places
    if PLACES_PATH.exists():
        places_json = json.loads(PLACES_PATH.read_text(encoding="utf-8"))
        for p in places_json.get("places", []):
            w = (p.get("website") or "").strip()
            if not w: continue
            try:
                u = urlparse(w if "://" in w else "https://"+w)
                host = (u.hostname or "").lower()
            except Exception: continue
            if not host or host in SOCIAL_HOSTS: continue
            if host.startswith("www."): host = host[4:]
            targets[p["id"]] = {"host": host, "kind": "place"}
            domain_to_pids.setdefault(host, []).append(p["id"])

    # clinics
    if CLINICS_INDEX.exists():
        clinics = json.loads(CLINICS_INDEX.read_text(encoding="utf-8"))
        for pid, c in clinics.items():
            w = (c.get("website") or "").strip()
            if not w: continue
            try:
                u = urlparse(w if "://" in w else "https://"+w)
                host = (u.hostname or "").lower()
            except Exception: continue
            if not host or host in SOCIAL_HOSTS: continue
            if host.startswith("www."): host = host[4:]
            targets[pid] = {"host": host, "kind": "clinic", "source": c.get("source","")}
            domain_to_pids.setdefault(host, []).append(pid)

    return targets, domain_to_pids


def main():
    targets, domain_to_pids = collect_targets()
    unique_domains = sorted(domain_to_pids.keys())
    log(f"targets: {len(targets)}  unique domains: {len(unique_domains)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cached: {len(cache)}")

    todo = [d for d in unique_domains if d not in cache]
    log(f"to fetch: {len(todo)}")

    def work(domain):
        for url in (f"https://{domain}", f"https://www.{domain}"):
            ok, body = fetch_html(url)
            if ok and body:
                emails = extract_emails_from_html(body)
                return domain, {"ok": True, "url": url, "emails": emails}
            last = body
        return domain, {"ok": False, "error": last}

    if todo:
        t0 = time.time()
        done = 0
        with ThreadPoolExecutor(max_workers=THREADS) as ex:
            futs = {ex.submit(work, d): d for d in todo}
            for fut in as_completed(futs):
                d, res = fut.result()
                cache[d] = res
                done += 1
                if done % 25 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0
                    rate = done/el if el else 0
                    eta = (len(todo)-done)/rate if rate else 0
                    n = len(res.get("emails",[])) if res.get("ok") else 0
                    log(f"  [{done}/{len(todo)}]  {d}  ok={res.get('ok')} emails={n}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Cross-domain frequency cap — emails appearing on many domains are template noise
    email_freq = Counter()
    for d, rec in cache.items():
        if not rec.get("ok"): continue
        for e in rec.get("emails",[]):
            email_freq[e] += 1
    freq_blacklist = {e for e, n in email_freq.items() if n > 10}
    log(f"freq-blacklist (>10 domains): {len(freq_blacklist)}")
    for e in sorted(freq_blacklist)[:10]:
        log(f"  spam: {e}  ({email_freq[e]} domains)")

    # Build outputs
    places_out = {}
    clinics_out = {}
    stats = {"places_with_email":0, "clinics_with_email":0, "same_domain":0, "personal":0, "other":0}

    for pid, t in targets.items():
        host = t["host"]
        rec = cache.get(host)
        if not rec or not rec.get("ok"): continue
        raw_emails = [e for e in rec.get("emails",[]) if e not in freq_blacklist]
        if not raw_emails: continue

        # Classify and rank
        classified = []
        for e in raw_emails:
            tier = classify(e, host)
            classified.append((tier, e))
            stats[tier] += 1
        # Sort: same_domain > personal > other; within tier alphabetical
        tier_rank = {"same_domain":0, "personal":1, "other":2}
        classified.sort(key=lambda x: (tier_rank[x[0]], x[1]))

        entry = {
            "domain": host,
            "url": rec.get("url",""),
            "emails": [e for _, e in classified],
            "classified": [{"email": e, "tier": tier} for tier, e in classified],
            "primary_email": classified[0][1] if classified else "",
            "primary_tier":  classified[0][0] if classified else "",
        }
        if t["kind"] == "place":
            places_out[pid] = entry
            stats["places_with_email"] += 1
        else:
            clinics_out[pid] = entry
            stats["clinics_with_email"] += 1

    if places_out:
        OUT_PLACES.write_text(json.dumps(places_out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_PLACES}  ({len(places_out)} places)")
    if clinics_out:
        OUT_CLINICS.write_text(json.dumps(clinics_out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_CLINICS}  ({len(clinics_out)} clinics)")

    # Per-source split for clinics
    if clinics_out and CLINICS_INDEX.exists():
        index = json.loads(CLINICS_INDEX.read_text(encoding="utf-8"))
        per_source = {src: {} for src in SOURCE_TO_OUT}
        for pid, entry in clinics_out.items():
            src = (index.get(pid) or {}).get("source")
            if src in per_source:
                per_source[src][pid] = entry
        for src, out_rel in SOURCE_TO_OUT.items():
            out_path = PARENT / out_rel
            out_path.parent.mkdir(parents=True, exist_ok=True)
            payload = {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "scraper": "siamverified-portable/scripts/extract_emails.py",
                "fields": "domain, url, emails (ranked), classified [{email, tier}], primary_email, primary_tier",
                "tiers": "same_domain > personal > other",
                "places": per_source[src],
            }
            out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
            log(f"  wrote {out_path}  ({len(per_source[src])} clinics)")

    log(f"DONE  {stats}")


if __name__ == "__main__":
    main()
