"""
LINE OA verification for dental/hair clinic handles. Sister of verify_line_oa.py
but reads per_clinic_social.json and writes per-source line_data.json files into
the OWNING project folders so each sibling project can join by place_id.

Shares line_oa_cache.json with the places verifier so a handle that overlaps
is only fetched once.

VPN 불필요 — plain HTTP via stdlib + threads.
"""
import json, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent
SOCIAL_PATH = ROOT / "public" / "data" / "per_clinic_social.json"
INDEX_PATH  = ROOT / "public" / "data" / "clinics_index.json"
CACHE_PATH  = ROOT / "public" / "data" / "_raw" / "line_oa_cache.json"   # shared
LOG_PATH    = ROOT / "public" / "data" / "_raw" / "line_verify_clinics.log"
CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

SOURCE_TO_OUT = {
    "dental_export/clinics.csv":         "dental_export/line_data.json",
    "dental_output/bangkok/clinics.csv": "dental_output/bangkok/line_data.json",
    "dental_pattaya/output/clinics.csv": "dental_pattaya/output/line_data.json",
    "hair_bangkok/output/clinics.csv":   "hair_bangkok/output/line_data.json",
}

sys.path.insert(0, str(ROOT / "scripts"))
from verify_line_oa import handle_to_url, fetch, parse, THREADS

def log(msg: str):
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  [clinic-line] {msg}"
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
        h = (v.get("line") or "").strip()
        if h:
            handles_to_pids.setdefault(h, []).append(pid)
    unique = sorted(handles_to_pids.keys())
    log(f"unique clinic LINE handles: {len(unique)}")

    cache = {}
    if CACHE_PATH.exists():
        try: cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception: cache = {}
    log(f"shared line_oa_cache size: {len(cache)}")
    todo = [h for h in unique if h not in cache]
    log(f"to fetch: {len(todo)}")

    def work(handle):
        url = handle_to_url(handle)
        ok, body = fetch(url)
        if not ok:
            return handle, {"ok": False, "url": url, "error": body}
        info = parse(body) if isinstance(body, bytes) else {}
        info["ok"] = True
        info["url"] = url
        return handle, info

    if todo:
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
                    log(f"  [{done}/{len(todo)}]  {h}  ok={res.get('ok')} oa_id={res.get('oa_id','')}  rate={rate:.1f}/s eta={eta:.0f}s")
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    # Build per-clinic output, split by source folder
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8")) if INDEX_PATH.exists() else {}
    per_source = {src: {} for src in SOURCE_TO_OUT}
    stats_total = {"alive":0, "dead":0, "with_oa_id":0, "with_og_image":0, "places":0}
    for h, pids in handles_to_pids.items():
        rec = cache.get(h)
        if not rec: continue
        for pid in pids:
            entry = {
                "handle": h,
                "url": rec.get("url",""),
                "alive": bool(rec.get("ok")),
                "oa_id": rec.get("oa_id",""),
                "qr_url": rec.get("qr_url",""),
                "og_image": rec.get("og_image",""),
            }
            stats_total["places"] += 1
            if entry["alive"]: stats_total["alive"] += 1
            else: stats_total["dead"] += 1
            if entry["oa_id"]: stats_total["with_oa_id"] += 1
            if entry["og_image"]: stats_total["with_og_image"] += 1
            src = (index.get(pid) or {}).get("source")
            if src in per_source:
                per_source[src][pid] = entry

    for src, out_rel in SOURCE_TO_OUT.items():
        out_path = PARENT / out_rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scraper": "siamverified-portable/scripts/verify_line_oa_clinics.py",
            "fields": "handle, url, alive, oa_id, qr_url, og_image",
            "places": per_source[src],
        }
        out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
        log(f"  wrote {out_path}  ({len(per_source[src])} places)")
    log(f"DONE  totals={stats_total}")

if __name__ == "__main__":
    main()
