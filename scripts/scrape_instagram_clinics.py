"""
IG harvester for dental/hair clinic handles. Sister of scrape_instagram.py
but reads per_clinic_social.json and writes per_clinic_instagram.json.

Shares the same ig_cache.json with the places scraper, so if a handle
happens to overlap it's only fetched once. Uses the same scrape_one /
make_context primitives from scrape_instagram.py.

Started with port_idx=4 so it picks different NordVPN ports than the
running places scraper (which started at idx 0), spreading load.
"""
import json, random, sys, time
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent              # ...\deliverable\deliverable
SOCIAL_PATH = ROOT / "public" / "data" / "per_clinic_social.json"
INDEX_PATH  = ROOT / "public" / "data" / "clinics_index.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "ig_cache.json"   # shared
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "ig_scrape_clinics.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

# Each clinic's IG data is written into the SAME source folder it came from,
# so the owning project can join by place_id without crossing project lines.
# Map: source CSV path -> output JSON path (relative to PARENT)
SOURCE_TO_OUT = {
    "dental_export/clinics.csv":         "dental_export/ig_data.json",
    "dental_output/bangkok/clinics.csv": "dental_output/bangkok/ig_data.json",
    "dental_pattaya/output/clinics.csv": "dental_pattaya/output/ig_data.json",
    "hair_bangkok/output/clinics.csv":   "hair_bangkok/output/ig_data.json",
}

sys.path.insert(0, str(ROOT / "scripts"))
from scrape_instagram import (
    scrape_one, make_context, pick_alive_port,
    PROXY_PORTS, BASE_DELAY, LONG_BREAK, LONG_BREAK_EVERY,
)
from playwright.sync_api import sync_playwright

def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [clinics] {msg}"
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
        h = (v.get("instagram") or "").lstrip("@").strip()
        if h and len(h) >= 2:
            handles_to_pids.setdefault(h, []).append(pid)
    unique = sorted(handles_to_pids.keys())
    log(f"unique clinic IG handles: {len(unique)}")

    # Shared cache with places scraper — both processes will read/write it.
    # Periodic re-reads catch any handles fetched by the other scraper.
    def load_cache():
        if CACHE_PATH.exists():
            try: return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
            except Exception: return {}
        return {}
    cache = load_cache()
    log(f"shared ig_cache.json size: {len(cache)}")
    todo = [h for h in unique if h not in cache]
    log(f"to fetch: {len(todo)}")

    if todo:
        random.shuffle(todo)
        with sync_playwright() as p:
            # Start at port_idx=4 (different stride than places scraper)
            port_idx, port = pick_alive_port(4)
            log(f"start port: {port}")
            browser, ctx = make_context(p, port)
            page = ctx.new_page()
            t0 = time.time()
            done = 0
            for h in todo:
                # If a sibling scraper fetched this handle while we were running, skip
                if done % 25 == 0:
                    cache = load_cache()
                    if h in cache:
                        log(f"  skip (cached by sibling): {h}")
                        done += 1
                        continue
                rec = scrape_one(page, h)
                if (not rec.get("ok")) and rec.get("error") == "timeout" or rec.get("login_wall") or rec.get("suspicious"):
                    log(f"  {h}: wall/timeout — rotate")
                    try: ctx.close()
                    except Exception: pass
                    try: browser.close()
                    except Exception: pass
                    time.sleep(random.uniform(8, 18))
                    port_idx, port = pick_alive_port(port_idx + 1)
                    browser, ctx = make_context(p, port)
                    page = ctx.new_page()
                    rec = scrape_one(page, h)
                # Read latest cache + merge our entry (avoid clobbering sibling writes)
                cache = load_cache()
                cache[h] = rec
                done += 1
                if done % 5 == 0 or done == len(todo):
                    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
                el = time.time()-t0
                rate = done/el if el else 0
                eta = (len(todo)-done)/rate if rate else 0
                log(f"  [{done}/{len(todo)}] {h}  ok={rec.get('ok')} flw={rec.get('followers')}  rate={rate:.2f}/s eta={eta/60:.1f}min")
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

    # Build per-clinic output, split by source folder
    cache = load_cache()
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8")) if INDEX_PATH.exists() else {}
    per_source = {src: {} for src in SOURCE_TO_OUT}
    stats_total = {"ok":0,"private":0,"not_found":0,"login_wall":0,"verified":0,"with_followers":0,"places":0}
    for h, pids in handles_to_pids.items():
        rec = cache.get(h)
        if not rec: continue
        for pid in pids:
            entry = {
                "handle": h, "url": rec.get("url",""),
                "ok": bool(rec.get("ok")),
                "name": rec.get("name",""), "bio": rec.get("bio",""),
                "followers": rec.get("followers"), "following": rec.get("following"),
                "posts": rec.get("posts"), "profile_pic": rec.get("profile_pic",""),
                "is_private": bool(rec.get("is_private")), "is_verified": bool(rec.get("is_verified")),
                "not_found": bool(rec.get("not_found")), "login_wall": bool(rec.get("login_wall")),
                "fetched_at": rec.get("fetched_at",""),
            }
            stats_total["places"] += 1
            if entry["ok"]: stats_total["ok"] += 1
            if entry["is_private"]: stats_total["private"] += 1
            if entry["not_found"]: stats_total["not_found"] += 1
            if entry["login_wall"]: stats_total["login_wall"] += 1
            if entry["is_verified"]: stats_total["verified"] += 1
            if entry["followers"] is not None: stats_total["with_followers"] += 1
            # Route to the source folder this clinic came from
            src = (index.get(pid) or {}).get("source")
            if src in per_source:
                per_source[src][pid] = entry
    for src, out_rel in SOURCE_TO_OUT.items():
        out_path = PARENT / out_rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scraper": "siamverified-portable/scripts/scrape_instagram_clinics.py",
            "fields": "handle, url, ok, name, bio, followers, following, posts, profile_pic, "
                      "is_private, is_verified, not_found, login_wall, fetched_at",
            "places": per_source[src],
        }
        out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"  wrote {out_path}  ({len(per_source[src])} places)")
    log(f"DONE  totals={stats_total}")

if __name__ == "__main__":
    main()
