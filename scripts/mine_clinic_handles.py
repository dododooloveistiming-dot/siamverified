"""
Discover SNS handles for dental/hair/aesthetic clinics scraped by other
projects in this repo. Same 2-stage pipeline as for places.json:

  Stage 1:  website field already points at FB/IG/LINE -> extract directly
  Stage 2:  for real-domain websites, fetch homepage, grep embedded SNS links

Sources (4 CSVs in sibling project folders):
  - dental_export/clinics.csv         (1437 — Thailand-wide dental)
  - dental_output/bangkok/clinics.csv (1011 — Bangkok dental)
  - dental_pattaya/output/clinics.csv ( 213 — Pattaya dental)
  - hair_bangkok/output/clinics.csv   ( 115 — Bangkok hair clinics)

Dedupes by place_id across sources.

Output: public/data/per_clinic_social.json keyed by place_id, plus a
companion public/data/clinics_index.json holding canonical clinic metadata
(name, niche, city, website) so the IG output can be joined back to
clinic identities without re-reading the source CSVs.
"""
import csv, json, re, sys, time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent              # ...\deliverable\deliverable
OUT_SOCIAL = ROOT / "public" / "data" / "per_clinic_social.json"
OUT_INDEX  = ROOT / "public" / "data" / "clinics_index.json"
HTML_CACHE = ROOT / "public" / "data" / "_raw" / "clinic_homepage_cache.json"
HTML_CACHE.parent.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ROOT / "scripts"))
from mine_social_handles import (
    extract_fb, extract_ig, extract_line, extract_tt, extract_yt,
    extract_any, norm_name, HANDLE_BLACKLIST, FB_RESERVED, clean_handle,
)
from extract_social_from_websites import (
    SOCIAL_HOSTS, fetch_html, extract_handles_from_html, UA, TIMEOUT, THREADS,
)

# (csv_relative_path, niche_label, default_city)
SOURCES = [
    ("dental_export/clinics.csv",         "dental", None),
    ("dental_output/bangkok/clinics.csv", "dental", "Bangkok"),
    ("dental_pattaya/output/clinics.csv", "dental", "Pattaya"),
    ("hair_bangkok/output/clinics.csv",   "hair",   "Bangkok"),
]

def main():
    clinics = {}   # place_id -> {name, niche, city, website, phone}
    for rel, niche, default_city in SOURCES:
        path = PARENT / rel
        if not path.exists():
            print(f"SKIP missing: {path}")
            continue
        with open(path, "r", encoding="utf-8-sig", newline="") as fh:
            rdr = csv.DictReader(fh)
            # Normalize fieldnames — some sources have BOM + quoted '"place_id"' as col 0
            rdr.fieldnames = [(f or "").lstrip("﻿").strip('"').strip() for f in (rdr.fieldnames or [])]
            n = 0
            for row in rdr:
                # Re-key the row with cleaned names
                row = { (k or "").lstrip("﻿").strip('"').strip(): v for k, v in row.items() }
                pid = (row.get("place_id") or "").strip().strip('"')
                if not pid: continue
                # Stop at duplicates — first source wins
                if pid in clinics:
                    continue
                clinics[pid] = {
                    "name": (row.get("name") or "").strip(),
                    "niche": niche,
                    "city": (row.get("city") or "").strip() or default_city or "",
                    "website": (row.get("website") or "").strip(),
                    "phone": (row.get("phone") or "").strip(),
                    "address": (row.get("formatted_address") or "").strip(),
                    "rating": (row.get("rating") or "").strip(),
                    "reviews": (row.get("total_reviews") or "").strip(),
                    "source": rel,
                }
                n += 1
            print(f"  {rel}: +{n}")
    print(f"total unique clinics: {len(clinics)}")

    # STAGE 1 — Extract from website field directly
    per_clinic = {}
    real_domains = set()
    pid_to_host = {}
    stats = Counter()
    for pid, c in clinics.items():
        w = c.get("website","")
        if not w: continue
        platform, handle = extract_any(w)
        if platform and handle:
            stats["from_website_direct"] += 1
            entry = {"facebook":"","instagram":"","line":"","tiktok":"","youtube":"","sources":[]}
            entry[platform] = handle
            entry["sources"].append({"platform": platform, "via": "website"})
            per_clinic[pid] = entry
        else:
            # real domain -> queue for homepage scrape
            try:
                u = urlparse(w if "://" in w else "https://"+w)
                host = (u.hostname or "").lower()
                if host.startswith("www."): host = host[4:]
                if host and host not in SOCIAL_HOSTS:
                    real_domains.add(host)
                    pid_to_host[pid] = host
            except Exception:
                pass
    print(f"STAGE 1 done: {stats['from_website_direct']} direct handles, {len(real_domains)} real domains to fetch")

    # STAGE 2 — Homepage scrape
    cache = {}
    if HTML_CACHE.exists():
        try: cache = json.loads(HTML_CACHE.read_text(encoding="utf-8"))
        except Exception: cache = {}
    todo = [d for d in real_domains if d not in cache]
    print(f"cached: {len(cache)}, to fetch: {len(todo)}")

    def work(domain):
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

    # Cross-domain frequency cap
    handle_freq = Counter()
    for d, rec in cache.items():
        if not rec.get("ok"): continue
        for plat, handle in (rec.get("handles") or {}).items():
            handle_freq[(plat, handle)] += 1
    freq_blacklist = {key for key, n in handle_freq.items() if n > 25}
    blacklist = set(HANDLE_BLACKLIST) | freq_blacklist
    print(f"blacklist size: {len(blacklist)}  (freq>25 → {len(freq_blacklist)})")

    # Merge homepage handles into per_clinic
    placed = 0
    added = Counter()
    for pid, host in pid_to_host.items():
        rec = cache.get(host)
        if not rec or not rec.get("ok"): continue
        handles = rec.get("handles") or {}
        if not handles: continue
        entry = per_clinic.get(pid) or {"facebook":"","instagram":"","line":"","tiktok":"","youtube":"","sources":[]}
        changed = False
        for plat, handle in handles.items():
            handle = clean_handle(handle or "")
            if not handle: continue
            if plat == "facebook" and handle.lower() in FB_RESERVED: continue
            if (plat, handle.lower()) in blacklist: continue
            if entry.get(plat): continue
            entry[plat] = handle
            entry.setdefault("sources",[]).append({"platform": plat, "via": "homepage_scrape", "domain": host})
            added[plat] += 1
            changed = True
        if changed:
            per_clinic[pid] = entry
            placed += 1

    # Write index + social
    OUT_INDEX.write_text(json.dumps(clinics, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    OUT_SOCIAL.write_text(json.dumps(per_clinic, ensure_ascii=False, separators=(",",":")), encoding="utf-8")

    print(f"\nWrote {OUT_INDEX}")
    print(f"Wrote {OUT_SOCIAL}")
    print(f"  total clinics: {len(clinics)}")
    print(f"  clinics with any SNS handle: {len(per_clinic)}  ({100*len(per_clinic)/len(clinics):.1f}%)")
    print(f"  + via homepage (this run): {placed}")
    for plat, n in added.most_common():
        print(f"      +{plat}: {n}")
    # Final per-platform totals
    totals = Counter()
    for v in per_clinic.values():
        for plat in ("facebook","instagram","line","tiktok","youtube"):
            if v.get(plat): totals[plat] += 1
    print("\nFinal per-platform totals:")
    for plat, n in totals.most_common():
        print(f"  {plat}: {n}")

if __name__ == "__main__":
    main()
