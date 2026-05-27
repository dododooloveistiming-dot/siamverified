"""
Step 2 (stdlib version): Verify LINE OA handles are alive + extract canonical
OA ID and profile picture URL from the QR-code image embedded in the response.

LINE OA pages render name/description/follower-count via JS, which stdlib HTTP
cannot execute. So we capture only the JS-free signals:

  - HTTP reachable (alive)
  - canonical OA ID parsed out of the QR PNG filename
    (https://qr-official.line.me/gs/M_<oa_id>_GW.png)
  - profile photo URL if exposed in og:image

Output: public/data/per_place_line.json keyed by place_id.
For full OA name + follower count, a follow-up Playwright pass is needed.
"""
import json, re, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import urllib.request, urllib.error, gzip

ROOT = Path(__file__).resolve().parent.parent
SOCIAL_PATH = ROOT / "public" / "data" / "per_place_social.json"
PLACES_PATH = ROOT / "public" / "data" / "places.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_line.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "line_oa_cache.json"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
TIMEOUT = 10
THREADS = 8

QR_RE   = re.compile(rb'https?://qr-official\.line\.me/gs/M_([\w-]+)_(?:GW|GE|GO|GS)\.png')
OG_IMG_RE = re.compile(rb'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', re.IGNORECASE)
PAGE_SHARE_RE = re.compile(rb'page-share\.line\.me/@([\w-]+)/')

def handle_to_url(handle: str) -> str:
    """Convert our normalized LINE handle into a fetchable LINE URL."""
    h = handle.strip()
    if h.startswith("lin.ee/"):
        return "https://" + h
    if h.startswith("@"):
        return f"https://line.me/R/ti/p/{h}"
    if h.startswith("~"):
        return f"https://line.me/R/ti/p/{h}"
    # bare token — try @ first; lin.ee shortcodes look random alphanumeric
    if re.fullmatch(r"[a-z0-9]{6,12}", h, re.IGNORECASE):
        return f"https://lin.ee/{h}"
    return f"https://line.me/R/ti/p/@{h.lstrip('@')}"

def fetch(url: str) -> tuple[bool, bytes | str]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip, deflate"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            data = r.read(500_000)
            if r.headers.get("Content-Encoding") == "gzip":
                try: data = gzip.decompress(data)
                except Exception: pass
            return True, data
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, str(e)[:100]

def parse(body: bytes) -> dict:
    out = {"oa_id": "", "qr_url": "", "og_image": ""}
    m = QR_RE.search(body)
    if m:
        out["oa_id"] = m.group(1).decode()
        out["qr_url"] = m.group(0).decode()
    m = OG_IMG_RE.search(body)
    if m:
        v = m.group(1).decode("utf-8", errors="replace")
        if v and not v.lower().startswith("add line"):
            out["og_image"] = v
            # Fallback OA ID from page-share URL when QR was absent
            if not out["oa_id"]:
                mm = PAGE_SHARE_RE.search(m.group(1))
                if mm: out["oa_id"] = mm.group(1).decode()
    return out

def main():
    if not SOCIAL_PATH.exists():
        print("missing per_place_social.json"); sys.exit(1)
    social = json.loads(SOCIAL_PATH.read_text(encoding="utf-8"))
    # collect unique handles
    handles = sorted({v["line"] for v in social.values() if v.get("line")})
    print(f"unique LINE handles: {len(handles)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    print(f"cached: {len(cache)}")

    todo = [h for h in handles if h not in cache]
    print(f"to fetch: {len(todo)}")

    def work(handle):
        url = handle_to_url(handle)
        ok, body = fetch(url)
        if not ok:
            return handle, {"ok": False, "url": url, "error": body}
        info = parse(body) if isinstance(body, bytes) else {}
        info["ok"] = True
        info["url"] = url
        return handle, info

    t0 = time.time()
    done = 0
    with ThreadPoolExecutor(max_workers=THREADS) as ex:
        futs = {ex.submit(work, h): h for h in todo}
        for fut in as_completed(futs):
            h, res = fut.result()
            cache[h] = res
            done += 1
            if done % 25 == 0 or done == len(todo):
                CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                el = time.time()-t0
                rate = done/el if el else 0
                eta = (len(todo)-done)/rate if rate else 0
                print(f"  [{done}/{len(todo)}]  {h}  ok={res.get('ok')} oa_id={res.get('oa_id','')}  rate={rate:.1f}/s eta={eta:.0f}s", flush=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Per-place output
    out = {}
    stats = {"alive": 0, "dead": 0, "with_oa_id": 0, "with_og_image": 0}
    for pid, v in social.items():
        h = v.get("line")
        if not h: continue
        rec = cache.get(h, {})
        entry = {
            "handle": h,
            "url": rec.get("url",""),
            "alive": bool(rec.get("ok")),
            "oa_id": rec.get("oa_id",""),
            "qr_url": rec.get("qr_url",""),
            "og_image": rec.get("og_image",""),
        }
        if entry["alive"]: stats["alive"] += 1
        else: stats["dead"] += 1
        if entry["oa_id"]: stats["with_oa_id"] += 1
        if entry["og_image"]: stats["with_og_image"] += 1
        out[pid] = entry

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    print(f"\nWrote {OUT_PATH}")
    print(f"  places with LINE handle: {len(out)}")
    for k,v in stats.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
