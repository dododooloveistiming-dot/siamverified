"""
YouTube channel enrichment for places (verifiedthai.com).

Fetches /@handle/about (modern), /user/<name>/about (legacy), and
/channel/UC.../about (canonical) and parses out:
  - og:title (canonical channel name)
  - og:image (channel avatar URL)
  - subscriberCountText (e.g. "442 subscribers", "22.7K subscribers")
  - externalId (UCxxx canonical channel ID)
  - viewCountText (e.g. "6,166 views")
  - description (channel about-tab summary)

Output: public/data/per_place_youtube.json.
Shared youtube_cache.json under public/data/_raw so re-runs are cheap.
VPN 불필요.
"""
import json, re, sys, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOCIAL_PATH = ROOT / "public" / "data" / "per_place_social.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_youtube.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "youtube_cache.json"
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "youtube_enrich.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
TIMEOUT = 12
THREADS = 8

RE_SUBS    = re.compile(r'"subscriberCountText":"([^"]+)"')
RE_OG_TITLE = re.compile(r'<meta property="og:title" content="([^"]+)"')
RE_OG_IMG  = re.compile(r'<meta property="og:image" content="([^"]+)"')
RE_EXTID   = re.compile(r'"externalId":"(UC[\w-]{20,})"')
RE_VIEWS   = re.compile(r'"viewCountText":\{"simpleText":"([^"]+)"')
RE_DESC    = re.compile(r'<meta name="description" content="([^"]+)"')


def candidate_urls(handle):
    h = handle.strip().lstrip("@").strip()
    if not h: return []
    if re.fullmatch(r"uc[\w-]{22}", h, re.IGNORECASE):
        variants = [h, "UC" + h[2:]]
        return list({f"https://www.youtube.com/channel/{v}/about" for v in variants})
    return [
        f"https://www.youtube.com/@{h}/about",
        f"https://www.youtube.com/c/{h}/about",
        f"https://www.youtube.com/user/{h}/about",
    ]


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", "Accept": "text/html",
        })
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, r.read(3_000_000)
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception:
        return 0, b""


def parse_count(text):
    m = re.match(r"([\d.,]+)\s*([KMB]?)\s*(?:subscriber|view)", text or "", re.IGNORECASE)
    if not m: return None
    num = float(m.group(1).replace(",", ""))
    return int(num * {"":1,"K":1_000,"M":1_000_000,"B":1_000_000_000}[m.group(2).upper()])


def parse_page(body):
    s = body.decode("utf-8", errors="replace")
    out = {}
    if m := RE_OG_TITLE.search(s): out["title"] = m.group(1).replace("&amp;","&")
    if m := RE_OG_IMG.search(s):   out["avatar"] = m.group(1)
    if m := RE_DESC.search(s):     out["description"] = m.group(1).replace("&amp;","&")
    if m := RE_EXTID.search(s):    out["channel_id"] = m.group(1)
    if m := RE_SUBS.search(s):
        out["subscribers_text"] = m.group(1); out["subscribers"] = parse_count(m.group(1))
    if m := RE_VIEWS.search(s):
        out["views_text"] = m.group(1); out["views"] = parse_count(m.group(1))
    return out


def scrape_one(handle):
    for url in candidate_urls(handle):
        status, body = fetch(url)
        if status == 200 and body:
            info = parse_page(body)
            if info.get("title"):
                info["ok"] = True; info["url"] = url
                return info
        time.sleep(0.3)
    return {"ok": False, "error": "all_urls_failed"}


def log(msg):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [yt] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f: f.write(line + "\n")
    except Exception: pass


def main():
    if not SOCIAL_PATH.exists():
        log(f"FATAL: {SOCIAL_PATH} missing"); sys.exit(1)
    social = json.loads(SOCIAL_PATH.read_text(encoding="utf-8"))
    handles_to_pids = {}
    for pid, v in social.items():
        h = (v.get("youtube") or "").lstrip("@").strip().lower()
        if h: handles_to_pids.setdefault(h, []).append(pid)
    unique = sorted(handles_to_pids)
    log(f"unique YouTube handles: {len(unique)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cached: {len(cache)}")

    todo = [h for h in unique if h not in cache]
    log(f"to fetch: {len(todo)}")

    if todo:
        t0 = time.time(); done = 0
        with ThreadPoolExecutor(max_workers=THREADS) as ex:
            futs = {ex.submit(scrape_one, h): h for h in todo}
            for fut in as_completed(futs):
                h = futs[fut]
                try: res = fut.result()
                except Exception as e: res = {"ok": False, "error": str(e)[:100]}
                cache[h] = res; done += 1
                if done % 25 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                    el = time.time()-t0; rate = done/el if el else 0; eta = (len(todo)-done)/rate if rate else 0
                    log(f"  [{done}/{len(todo)}]  {h}  ok={res.get('ok')} subs={res.get('subscribers','')}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    out = {}
    for h, pids in handles_to_pids.items():
        rec = cache.get(h)
        if not rec: continue
        entry = {"handle":h, "ok":bool(rec.get("ok")), "url":rec.get("url",""),
                 "title":rec.get("title",""), "channel_id":rec.get("channel_id",""),
                 "avatar":rec.get("avatar",""), "description":rec.get("description",""),
                 "subscribers":rec.get("subscribers"), "subscribers_text":rec.get("subscribers_text",""),
                 "views":rec.get("views"), "views_text":rec.get("views_text","")}
        for pid in pids: out[pid] = entry

    if out:
        OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"wrote {OUT_PATH}  ({len(out)} places)")

    ok = sum(1 for h in unique if cache.get(h,{}).get("ok"))
    log(f"DONE  handles={len(unique)} ok={ok}")


if __name__ == "__main__":
    main()
