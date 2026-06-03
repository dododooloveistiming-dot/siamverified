"""
YouTube search scraper — finds videos ABOUT each place (travel vlogs, reviews).
Different from enrich_youtube.py which fetches the place's OWN channel.

For each place, searches YouTube with 1-2 queries and stores the top matching
video results. Used to show "Featured on YouTube" on place detail pages.

Output: public/data/per_place_youtube_search.json
  { place_id: [ { video_id, title, channel, views, published, query, lang }, ... ] }

Usage:
  py scripts/scrape_youtube_search.py
  py scripts/scrape_youtube_search.py --max 20      # test run
  py scripts/scrape_youtube_search.py --force       # re-scrape all
"""

import argparse, json, re, sys, time, random
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote_plus

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import urllib.request, urllib.error

ROOT       = Path(__file__).resolve().parent.parent
PLACES_PATH = ROOT / "public" / "data" / "places.json"
SOCIAL_PATH = ROOT / "public" / "data" / "per_place_social.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_youtube_search.json"
STATE_PATH  = ROOT / "public" / "data" / "_raw" / "youtube_search_state.json"
STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
THREADS   = 6
DELAY_MIN = 0.8
DELAY_MAX = 1.8
MAX_RESULTS = 5  # videos per place

# Niche → search keywords (EN + KO)
NICHE_QUERIES = {
    "muay-thai":    ["{name} muay thai",          "{name} 무에타이"],
    "yoga-pilates": ["{name} yoga",               "{name} 요가"],
    "wellness":     ["{name} wellness retreat",   "{name} 웰니스"],
    "cooking":      ["{name} thai cooking class", "{name} 태국요리"],
    "diving":       ["{name} diving",             "{name} 다이빙"],
    "spa":          ["{name} spa",                "{name} 스파"],
    "coworking":    ["{name} coworking",          "{name} 코워킹"],
}
DEFAULT_QUERIES = ["{name} Thailand", "{name} 태국"]


def log(msg, lvl="INFO"):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    print(f"{ts} [{lvl}] {msg}", flush=True)


def load_state():
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"done": {}}  # done: { place_id: iso_timestamp }


def save_state(state):
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")


def fetch_html(url):
    headers = {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
        "Accept": "text/html,application/xhtml+xml",
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read(4_000_000)
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception:
        return 0, b""


def parse_youtube_results(html_bytes, place_name, query):
    """Extract video info from YouTube search results page HTML."""
    text = html_bytes.decode("utf-8", errors="replace")

    # YouTube embeds results in var ytInitialData JSON
    m = re.search(r"var ytInitialData\s*=\s*(\{.+?\});\s*</script>", text, re.DOTALL)
    if not m:
        # fallback: try script tag without closing
        m = re.search(r"var ytInitialData\s*=\s*(\{.+)", text, re.DOTALL)
    if not m:
        return []

    raw = m.group(1)
    # trim to first balanced brace (avoid greedy over-read)
    depth = 0
    end = 0
    for i, ch in enumerate(raw):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    raw = raw[:end] if end else raw[:200_000]

    try:
        data = json.loads(raw)
    except Exception:
        return []

    videos = []
    # walk the JSON structure for videoRenderer nodes
    stack = [data]
    seen_ids = set()
    while stack and len(videos) < MAX_RESULTS:
        node = stack.pop()
        if isinstance(node, dict):
            if "videoRenderer" in node:
                vr = node["videoRenderer"]
                vid = vr.get("videoId", "")
                if not vid or vid in seen_ids:
                    pass
                else:
                    seen_ids.add(vid)
                    title = ""
                    runs = vr.get("title", {}).get("runs", [])
                    if runs:
                        title = "".join(r.get("text", "") for r in runs)

                    channel = ""
                    owner = vr.get("ownerText", {}).get("runs", [])
                    if owner:
                        channel = owner[0].get("text", "")

                    views_text = ""
                    vst = vr.get("viewCountText", {})
                    views_text = vst.get("simpleText", "") or "".join(
                        r.get("text", "") for r in vst.get("runs", [])
                    )

                    published = ""
                    ptt = vr.get("publishedTimeText", {})
                    published = ptt.get("simpleText", "")

                    duration = ""
                    dl = vr.get("lengthText", {})
                    duration = dl.get("simpleText", "")

                    # basic relevance: title must loosely match place name token
                    name_tokens = set(place_name.lower().split())
                    title_lower = title.lower()
                    # accept if ≥1 name token in title OR if it's a short name (≤2 words)
                    relevant = any(tok in title_lower for tok in name_tokens if len(tok) > 3) \
                        or len(name_tokens) <= 2

                    if title and relevant:
                        videos.append({
                            "video_id": vid,
                            "url": f"https://www.youtube.com/watch?v={vid}",
                            "title": title,
                            "channel": channel,
                            "views_text": views_text,
                            "duration": duration,
                            "published": published,
                            "query": query,
                        })
            for v in node.values():
                if isinstance(v, (dict, list)):
                    stack.append(v)
        elif isinstance(node, list):
            stack.extend(node)

    return videos[:MAX_RESULTS]


def search_place(place_id, place_name, niche):
    """Run 1-2 queries for a place and return merged video list."""
    templates = NICHE_QUERIES.get(niche, DEFAULT_QUERIES)
    # use first EN query, and first KO query if name is short enough
    queries = [templates[0].format(name=place_name)]
    if len(templates) > 1 and len(place_name) <= 40:
        queries.append(templates[1].format(name=place_name))

    all_videos = []
    seen_ids = set()

    for q in queries:
        url = f"https://www.youtube.com/results?search_query={quote_plus(q)}&hl=en"
        status, body = fetch_html(url)
        if status == 200 and body:
            videos = parse_youtube_results(body, place_name, q)
            for v in videos:
                if v["video_id"] not in seen_ids:
                    seen_ids.add(v["video_id"])
                    all_videos.append(v)
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    return all_videos[:MAX_RESULTS]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max", type=int, default=0, help="limit places for testing")
    parser.add_argument("--force", action="store_true", help="re-scrape already done places")
    args = parser.parse_args()

    places_data = json.loads(PLACES_PATH.read_text(encoding="utf-8"))
    places = places_data["places"]
    log(f"total places: {len(places)}")

    state = load_state()
    existing = {}
    if OUT_PATH.exists():
        try:
            existing = json.loads(OUT_PATH.read_text(encoding="utf-8"))
        except Exception:
            existing = {}

    todo = []
    for p in places:
        if not args.force and p["id"] in state["done"]:
            continue
        todo.append(p)

    if args.max:
        todo = todo[: args.max]

    log(f"to scrape: {len(todo)}")
    if not todo:
        log("nothing to do")
        return

    results = dict(existing)
    done_count = 0
    t0 = time.time()

    def worker(p):
        vids = search_place(p["id"], p["name"], p["niche"])
        return p["id"], vids

    with ThreadPoolExecutor(max_workers=THREADS) as ex:
        futs = {ex.submit(worker, p): p for p in todo}
        for fut in as_completed(futs):
            p = futs[fut]
            try:
                pid, vids = fut.result()
            except Exception as e:
                pid = p["id"]
                vids = []
                log(f"ERROR {p['name']}: {e}", "ERR")

            results[pid] = vids
            state["done"][pid] = datetime.now(timezone.utc).isoformat()
            done_count += 1

            elapsed = time.time() - t0
            rate = done_count / elapsed if elapsed else 0
            eta = (len(todo) - done_count) / rate if rate else 0
            log(
                f"[{done_count}/{len(todo)}] {p['name']} ({p['niche']}) "
                f"→ {len(vids)} videos | {rate:.1f}/s eta {eta/60:.0f}min"
            )

            # checkpoint every 50
            if done_count % 50 == 0:
                OUT_PATH.write_text(
                    json.dumps(results, ensure_ascii=False, separators=(",", ":")),
                    encoding="utf-8",
                )
                save_state(state)

    OUT_PATH.write_text(
        json.dumps(results, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    save_state(state)

    with_videos = sum(1 for v in results.values() if v)
    total_videos = sum(len(v) for v in results.values())
    log(f"DONE — places with videos: {with_videos}/{len(results)}, total videos: {total_videos}")


if __name__ == "__main__":
    main()
