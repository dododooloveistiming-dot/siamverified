"""
YouTube channel enrichment for places + clinics.

Fetches /@handle/about (modern), /user/<name>/about (legacy), and
/channel/UC.../about (canonical) and parses out:
  - og:title (canonical channel name)
  - og:image (channel avatar URL)
  - subscriberCountText (e.g. "442 subscribers", "22.7K subscribers")
  - externalId (UCxxx canonical channel ID)
  - viewCountText (e.g. "6,166 views")
  - description (channel about-tab summary)

Outputs:
  - public/data/per_place_youtube.json  (siamverified places)
  - public/data/per_clinic_youtube.json (clinics, single shared file in this repo)
  - PER-SOURCE per-clinic outputs into sibling project folders
      (dental_export/youtube_data.json, etc.)

Shared youtube_cache.json under public/data/_raw so re-runs are cheap.
VPN 불필요.
"""
import json, re, sys, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent
PLACES_SOCIAL  = ROOT / "public" / "data" / "per_place_social.json"
CLINICS_SOCIAL = ROOT / "public" / "data" / "per_clinic_social.json"
CLINICS_INDEX  = ROOT / "public" / "data" / "clinics_index.json"
OUT_PLACES     = ROOT / "public" / "data" / "per_place_youtube.json"
OUT_CLINICS    = ROOT / "public" / "data" / "per_clinic_youtube.json"
CACHE_PATH     = ROOT / "public" / "data" / "_raw" / "youtube_cache.json"
LOG_PATH       = ROOT / "public" / "data" / "_raw" / "youtube_enrich.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

SOURCE_TO_OUT = {
    "dental_export/clinics.csv":         "dental_export/youtube_data.json",
    "dental_output/bangkok/clinics.csv": "dental_output/bangkok/youtube_data.json",
    "dental_pattaya/output/clinics.csv": "dental_pattaya/output/youtube_data.json",
    "hair_bangkok/output/clinics.csv":   "hair_bangkok/output/youtube_data.json",
}

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
TIMEOUT = 12
THREADS = 8

# Regex patterns reused across pages
RE_SUBS    = re.compile(r'"subscriberCountText":"([^"]+)"')
RE_OG_TITLE = re.compile(r'<meta property="og:title" content="([^"]+)"')
RE_OG_IMG  = re.compile(r'<meta property="og:image" content="([^"]+)"')
RE_EXTID   = re.compile(r'"externalId":"(UC[\w-]{20,})"')
RE_VIEWS   = re.compile(r'"viewCountText":\{"simpleText":"([^"]+)"')
RE_DESC    = re.compile(r'<meta name="description" content="([^"]+)"')


def candidate_urls(handle: str) -> list[str]:
    """Return ordered list of /about URLs to try for a given raw handle."""
    h = handle.strip().lstrip("@").strip()
    if not h: return []
    # UC-prefix channel ID (24 chars, may be miscased in our data)
    if re.fullmatch(r"uc[\w-]{22}", h, re.IGNORECASE):
        # YouTube requires correct case. Try stored case first, then UC-uppercase variant
        variants = [h, "UC" + h[2:]]
        return list({f"https://www.youtube.com/channel/{v}/about" for v in variants})
    # Modern @handle (also covers bare usernames since YouTube migrated many /c/ to @)
    urls = [
        f"https://www.youtube.com/@{h}/about",
        f"https://www.youtube.com/c/{h}/about",
        f"https://www.youtube.com/user/{h}/about",
    ]
    return urls


def fetch(url: str) -> tuple[int, bytes]:
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html",
        })
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, r.read(3_000_000)
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception:
        return 0, b""


def html_unescape_minimal(s: str) -> str:
    return (s.replace("&amp;","&").replace("&lt;","<").replace("&gt;",">")
              .replace("&quot;",'"').replace("&#39;","'"))


def parse_subs(text: str) -> int | None:
    """'442 subscribers' / '22.7K subscribers' / '1.2M subscribers' -> int"""
    if not text: return None
    m = re.match(r"([\d.,]+)\s*([KMB]?)\s*subscriber", text, re.IGNORECASE)
    if not m: return None
    num = float(m.group(1).replace(",", ""))
    mult = {"":1, "K":1_000, "M":1_000_000, "B":1_000_000_000}[m.group(2).upper()]
    return int(num * mult)


def parse_views(text: str) -> int | None:
    """'6,166 views' / '1.2M views' -> int"""
    if not text: return None
    m = re.match(r"([\d.,]+)\s*([KMB]?)\s*view", text, re.IGNORECASE)
    if not m: return None
    num = float(m.group(1).replace(",", ""))
    mult = {"":1, "K":1_000, "M":1_000_000, "B":1_000_000_000}[m.group(2).upper()]
    return int(num * mult)


def parse_page(body: bytes) -> dict:
    s = body.decode("utf-8", errors="replace")
    out = {}
    m = RE_OG_TITLE.search(s)
    if m: out["title"] = html_unescape_minimal(m.group(1))
    m = RE_OG_IMG.search(s)
    if m: out["avatar"] = m.group(1)
    m = RE_DESC.search(s)
    if m: out["description"] = html_unescape_minimal(m.group(1))
    m = RE_EXTID.search(s)
    if m: out["channel_id"] = m.group(1)
    m = RE_SUBS.search(s)
    if m:
        out["subscribers_text"] = m.group(1)
        out["subscribers"] = parse_subs(m.group(1))
    m = RE_VIEWS.search(s)
    if m:
        out["views_text"] = m.group(1)
        out["views"] = parse_views(m.group(1))
    return out


def scrape_one(handle: str) -> dict:
    """Try each candidate URL; return first parse with at least a title."""
    for url in candidate_urls(handle):
        status, body = fetch(url)
        if status == 200 and body:
            info = parse_page(body)
            if info.get("title"):
                info["ok"] = True
                info["url"] = url
                info["http_status"] = 200
                return info
        time.sleep(0.3)
    return {"ok": False, "error": "all_urls_failed"}


def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [yt] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def collect_handles():
    handles_to_pids = {}  # handle -> {"places": [pid...], "clinics": [pid...]}
    if PLACES_SOCIAL.exists():
        social = json.loads(PLACES_SOCIAL.read_text(encoding="utf-8"))
        for pid, v in social.items():
            h = (v.get("youtube") or "").lstrip("@").strip().lower()
            if h:
                handles_to_pids.setdefault(h, {"places":[], "clinics":[]})["places"].append(pid)
    if CLINICS_SOCIAL.exists():
        social = json.loads(CLINICS_SOCIAL.read_text(encoding="utf-8"))
        for pid, v in social.items():
            h = (v.get("youtube") or "").lstrip("@").strip().lower()
            if h:
                handles_to_pids.setdefault(h, {"places":[], "clinics":[]})["clinics"].append(pid)
    return handles_to_pids


def main():
    handles_to_pids = collect_handles()
    unique = sorted(handles_to_pids.keys())
    log(f"unique YouTube handles: {len(unique)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cached: {len(cache)}")

    todo = [h for h in unique if h not in cache]
    log(f"to fetch: {len(todo)}")

    if todo:
        t0 = time.time()
        done = 0
        with ThreadPoolExecutor(max_workers=THREADS) as ex:
            futs = {ex.submit(scrape_one, h): h for h in todo}
            for fut in as_completed(futs):
                h = futs[fut]
                try:
                    res = fut.result()
                except Exception as e:
                    res = {"ok": False, "error": str(e)[:100]}
                cache[h] = res
                done += 1
                if done % 25 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0
                    rate = done/el if el else 0
                    eta = (len(todo)-done)/rate if rate else 0
                    log(f"  [{done}/{len(todo)}]  {h}  ok={res.get('ok')} title={(res.get('title','') or '')[:30]!r}  subs={res.get('subscribers','')}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Build outputs
    def make_entry(handle, rec):
        return {
            "handle": handle,
            "ok": bool(rec.get("ok")),
            "url": rec.get("url",""),
            "title": rec.get("title",""),
            "channel_id": rec.get("channel_id",""),
            "avatar": rec.get("avatar",""),
            "description": rec.get("description",""),
            "subscribers": rec.get("subscribers"),
            "subscribers_text": rec.get("subscribers_text",""),
            "views": rec.get("views"),
            "views_text": rec.get("views_text",""),
        }

    # Places output
    places_out = {}
    clinics_out = {}
    for h, lookup in handles_to_pids.items():
        rec = cache.get(h)
        if not rec: continue
        e = make_entry(h, rec)
        for pid in lookup["places"]:
            places_out[pid] = e
        for pid in lookup["clinics"]:
            clinics_out[pid] = e

    if places_out:
        OUT_PLACES.write_text(json.dumps(places_out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_PLACES}  ({len(places_out)} places)")
    if clinics_out:
        OUT_CLINICS.write_text(json.dumps(clinics_out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_CLINICS}  ({len(clinics_out)} clinics)")

    # Per-source split for clinics (mirror IG/LINE/WHOIS pattern)
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
                "scraper": "siamverified-portable/scripts/enrich_youtube.py",
                "fields": "handle, ok, url, title, channel_id, avatar, description, subscribers, subscribers_text, views, views_text",
                "places": per_source[src],
            }
            out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
            log(f"  wrote {out_path}  ({len(per_source[src])} clinics)")

    # Final stats
    stats = {"total_handles": len(unique), "ok": 0, "with_subs": 0, "with_views": 0,
             "with_title": 0, "with_channel_id": 0}
    for h in unique:
        rec = cache.get(h, {})
        if rec.get("ok"): stats["ok"] += 1
        if rec.get("title"): stats["with_title"] += 1
        if rec.get("channel_id"): stats["with_channel_id"] += 1
        if rec.get("subscribers") is not None: stats["with_subs"] += 1
        if rec.get("views") is not None: stats["with_views"] += 1
    log(f"DONE  {stats}")


if __name__ == "__main__":
    main()
