"""
Step 3: Instagram profile harvester. Background-friendly, long-running.

Strategy:
  - Logged-out Playwright Chromium, realistic UA + viewport + locale
  - SOCKS5 proxy rotation across NordVPN ports 2080-2087
  - Per-profile delay 6-14 sec + idle pause after every 30 requests
  - On 429 / login-wall / suspicious-activity page: rotate proxy + back off
  - Per-handle file cache → resumable (re-running picks up where it left off)

For each profile, extract from meta tags / Open Graph + DOM:
  - display name (og:title)
  - bio + follower count + post count (og:description; parsed)
  - profile picture URL (og:image)
  - is_private (text "This Account is Private")
  - is_verified (SVG title="Verified" near header)
  - alive (200 vs 404 / "Sorry, this page isn't available")

Output: public/data/per_place_instagram.json keyed by place_id.
"""
import json, os, random, re, sys, time
from pathlib import Path
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

ROOT = Path(__file__).resolve().parent.parent
SOCIAL_PATH = ROOT / "public" / "data" / "per_place_social.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_instagram.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "ig_cache.json"
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "ig_scrape.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
VIEWPORT = {"width": 1280, "height": 800}
LOCALE = "en-US"
PROXY_PORTS = list(range(2080, 2088))  # NordVPN SOCKS5 ports

import socket
def port_alive(port: int, timeout: float = 4.0) -> bool:
    """Check if a NordVPN SOCKS5 port is currently up (not mid-rotate)."""
    import subprocess
    try:
        r = subprocess.run(
            ["curl","-s","--max-time",str(int(timeout)),
             "--proxy",f"socks5h://127.0.0.1:{port}","https://api.ipify.org"],
            capture_output=True, text=True, timeout=timeout+2,
        )
        return bool(r.stdout.strip()) and "." in r.stdout
    except Exception:
        return False

def pick_alive_port(start_idx: int = 0) -> tuple[int, int]:
    """Return (idx, port) of first alive proxy, starting from start_idx (round-robin)."""
    n = len(PROXY_PORTS)
    for offset in range(n):
        idx = (start_idx + offset) % n
        port = PROXY_PORTS[idx]
        if port_alive(port):
            return idx, port
    raise RuntimeError("no alive SOCKS5 port — NordVPN runner down?")
BASE_DELAY = (6.0, 14.0)   # random sleep per request
LONG_BREAK_EVERY = 30      # take a long break after N requests
LONG_BREAK = (45.0, 90.0)
MAX_RETRIES = 2            # per profile

# Instagram error/wall signatures
PRIVATE_SIG     = re.compile(r"this account is private", re.I)
NOT_FOUND_SIG   = re.compile(r"(sorry, this page isn'?t available|page not found)", re.I)
LOGIN_WALL_SIG  = re.compile(r"log in to instagram|enter your username and password", re.I)
SUSPICIOUS_SIG  = re.compile(r"suspicious (login|activity)", re.I)

# Bio/counts pattern from og:description, e.g.:
#   "12.3K Followers, 456 Following, 1,234 Posts - @handle on Instagram. {bio}"
OG_DESC_RE = re.compile(
    r"^([\d.,]+\s*[KkMm]?)\s+Followers?,\s+([\d.,]+\s*[KkMm]?)\s+Following,\s+([\d.,]+\s*[KkMm]?)\s+Posts?"
    r"(?:.+?on Instagram[^.]*\.\s*)?(.*)$",
    re.IGNORECASE | re.DOTALL,
)

def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

def parse_count(s: str) -> int | None:
    s = (s or "").strip().replace(",", "")
    if not s: return None
    mult = 1
    if s[-1].lower() == "k": mult = 1_000; s = s[:-1]
    elif s[-1].lower() == "m": mult = 1_000_000; s = s[:-1]
    try:
        return int(float(s) * mult)
    except ValueError:
        return None

def parse_meta(meta: dict) -> dict:
    """Convert og: meta into structured fields."""
    out = {
        "name": "", "bio": "",
        "followers": None, "following": None, "posts": None,
        "profile_pic": "",
    }
    title = meta.get("og:title", "")
    # "Display Name (@handle) • Instagram photos and videos"
    m = re.match(r"^(.*?)\s*\(@[^)]+\)", title)
    if m: out["name"] = m.group(1).strip()
    elif title and "instagram" not in title.lower():
        out["name"] = title.strip()
    desc = meta.get("og:description", "")
    m = OG_DESC_RE.match(desc.strip())
    if m:
        out["followers"] = parse_count(m.group(1))
        out["following"] = parse_count(m.group(2))
        out["posts"]     = parse_count(m.group(3))
        tail = (m.group(4) or "").strip(" -:.")
        # IG's logged-out og:description doesn't expose bio. It returns a
        # placeholder like "See Instagram photos and videos from X (@handle)".
        # Treat that as empty bio.
        if not re.match(r"^see instagram (photos|videos)", tail, re.I):
            out["bio"] = tail
    elif desc:
        out["bio"] = desc.strip()
    out["profile_pic"] = meta.get("og:image", "")
    return out

def scrape_one(page, handle: str) -> dict:
    url = f"https://www.instagram.com/{handle}/"
    rec = {"handle": handle, "url": url, "fetched_at": datetime.now(timezone.utc).isoformat()}
    try:
        resp = page.goto(url, wait_until="domcontentloaded", timeout=20000)
        status = resp.status if resp else None
        rec["http_status"] = status
        # Wait briefly for meta tags + body content
        try:
            page.wait_for_selector("meta[property='og:title']", timeout=8000)
        except PWTimeout:
            pass
        # Pull meta tags
        meta = page.evaluate("""() => {
            const m = {};
            document.querySelectorAll('meta').forEach(el => {
                const k = el.getAttribute('property') || el.getAttribute('name');
                const v = el.getAttribute('content');
                if (k && v) m[k] = v;
            });
            return m;
        }""")
        body_text = page.evaluate("() => document.body ? document.body.innerText.slice(0,4000) : ''")
        # Body-text-based flags
        rec["is_private"]   = bool(PRIVATE_SIG.search(body_text))
        rec["not_found"]    = bool(NOT_FOUND_SIG.search(body_text))
        rec["login_wall"]   = bool(LOGIN_WALL_SIG.search(body_text))
        rec["suspicious"]   = bool(SUSPICIOUS_SIG.search(body_text))
        # Verified badge presence (best-effort selector)
        try:
            verified = page.evaluate("""() => {
                return !!document.querySelector('[aria-label=\"Verified\"], svg[aria-label=\"Verified\"], title:where([text=\"Verified\"])');
            }""")
        except Exception:
            verified = False
        rec["is_verified"] = bool(verified)
        rec["meta"] = meta
        rec.update(parse_meta(meta))
        rec["ok"] = status == 200 and not rec["not_found"]
    except PWTimeout as e:
        rec["ok"] = False
        rec["error"] = "timeout"
    except Exception as e:
        rec["ok"] = False
        rec["error"] = str(e)[:120]
    return rec

def make_context(p, port: int):
    proxy = {"server": f"socks5://127.0.0.1:{port}"}
    browser = p.chromium.launch(
        headless=True,
        args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        proxy=proxy,
    )
    ctx = browser.new_context(
        user_agent=UA,
        viewport=VIEWPORT,
        locale=LOCALE,
        timezone_id="Asia/Bangkok",
        java_script_enabled=True,
        ignore_https_errors=True,
        extra_http_headers={"Accept-Language": "en-US,en;q=0.9,th;q=0.6"},
    )
    # Stealth: hide webdriver flag
    ctx.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return browser, ctx

def main():
    if not SOCIAL_PATH.exists():
        log("FATAL: per_place_social.json missing"); sys.exit(1)
    social = json.loads(SOCIAL_PATH.read_text(encoding="utf-8"))

    # Build (handle → [pids]) and unique list
    handles_to_pids = {}
    for pid, v in social.items():
        h = (v.get("instagram") or "").lstrip("@").strip()
        if h and len(h) >= 2:
            handles_to_pids.setdefault(h, []).append(pid)
    unique = sorted(handles_to_pids.keys())
    log(f"unique IG handles: {len(unique)}")

    # Resumable cache
    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"cached: {len(cache)}")
    todo = [h for h in unique if h not in cache]
    log(f"to fetch: {len(todo)}")

    if not todo:
        log("nothing to do; building output from cache")
    else:
        random.shuffle(todo)
        with sync_playwright() as p:
            done = 0
            port_idx, port = pick_alive_port(0)
            log(f"start port: {port}")
            browser, ctx = make_context(p, port)
            page = ctx.new_page()
            t0 = time.time()
            for h in todo:
                rec = scrape_one(page, h)
                # If we hit a wall/timeout, rotate proxy & retry once
                if (not rec.get("ok")) and rec.get("error") in ("timeout",) or rec.get("login_wall") or rec.get("suspicious"):
                    log(f"  {h}: wall/timeout — rotate proxy")
                    try: ctx.close()
                    except Exception: pass
                    try: browser.close()
                    except Exception: pass
                    time.sleep(random.uniform(8, 18))
                    port_idx, port = pick_alive_port(port_idx + 1)
                    browser, ctx = make_context(p, port)
                    page = ctx.new_page()
                    rec = scrape_one(page, h)
                cache[h] = rec
                done += 1
                if done % 5 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                el = time.time() - t0
                rate = done / el if el else 0
                eta = (len(todo) - done) / rate if rate else 0
                ok = rec.get("ok"); flw = rec.get("followers")
                log(f"  [{done}/{len(todo)}] {h}  ok={ok} flw={flw}  rate={rate:.2f}/s eta={eta/60:.1f}min")
                # natural rate-limit
                if done % LONG_BREAK_EVERY == 0:
                    pause = random.uniform(*LONG_BREAK)
                    log(f"  long break: {pause:.1f}s + proxy rotate")
                    try: ctx.close()
                    except Exception: pass
                    try: browser.close()
                    except Exception: pass
                    time.sleep(pause)
                    port_idx, port = pick_alive_port(port_idx + 1)
                    browser, ctx = make_context(p, port)
                    page = ctx.new_page()
                else:
                    time.sleep(random.uniform(*BASE_DELAY))
            try: ctx.close()
            except Exception: pass
            try: browser.close()
            except Exception: pass

    # Build per-place output
    out = {}
    stats = {"ok":0,"private":0,"not_found":0,"login_wall":0,"verified":0,"with_followers":0}
    for h, pids in handles_to_pids.items():
        rec = cache.get(h)
        if not rec: continue
        for pid in pids:
            entry = {
                "handle": h,
                "url": rec.get("url",""),
                "ok": bool(rec.get("ok")),
                "name": rec.get("name",""),
                "bio": rec.get("bio",""),
                "followers": rec.get("followers"),
                "following": rec.get("following"),
                "posts": rec.get("posts"),
                "profile_pic": rec.get("profile_pic",""),
                "is_private": bool(rec.get("is_private")),
                "is_verified": bool(rec.get("is_verified")),
                "not_found": bool(rec.get("not_found")),
                "login_wall": bool(rec.get("login_wall")),
                "fetched_at": rec.get("fetched_at",""),
            }
            out[pid] = entry
            if entry["ok"]: stats["ok"] += 1
            if entry["is_private"]: stats["private"] += 1
            if entry["not_found"]: stats["not_found"] += 1
            if entry["login_wall"]: stats["login_wall"] += 1
            if entry["is_verified"]: stats["verified"] += 1
            if entry["followers"] is not None: stats["with_followers"] += 1
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    log(f"WROTE {OUT_PATH}")
    log(f"  places: {len(out)}  stats={stats}")

if __name__ == "__main__":
    main()
