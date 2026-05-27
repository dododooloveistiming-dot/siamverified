"""
Extract social handles per place from:
  1. places.json `website` field (when it points to facebook/instagram/line/tiktok)
  2. TAT directories (accommodation/restaurant/attraction/souvenir) — match by
     normalized name AND phone, then pull whatever FB/IG/LINE/TikTok the TAT
     row exposes.

Output: public/data/per_place_social.json keyed by place_id.
"""
import csv, json, re, sys, unicodedata
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent.parent
RAW  = ROOT / "public" / "data" / "_raw" / "gov"
PLACES_PATH = ROOT / "public" / "data" / "places.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_social.json"

WHITESPACE_RE = re.compile(r"\s+")
PUNCT_RE = re.compile(r"[^\w฀-๿]+")
DIGITS_RE = re.compile(r"\D+")

# ---------- normalization ----------

def clean_handle(s: str) -> str:
    """Strip trailing HTML-escape junk (\\, /, whitespace, &amp; remnants) from a handle."""
    if not s: return s
    return s.rstrip("\\/ \t\r\n;,.").strip()

def norm_name(s: str) -> str:
    if not s: return ""
    s = unicodedata.normalize("NFKC", s)
    s = s.casefold()
    s = PUNCT_RE.sub(" ", s)
    return WHITESPACE_RE.sub(" ", s).strip()

def norm_phone(s: str) -> str:
    if not s: return ""
    d = DIGITS_RE.sub("", s)
    if d.startswith("66") and len(d) > 9: d = "0" + d[2:]
    return d

# ---------- handle extractors ----------

FB_HOSTS = {"facebook.com","m.facebook.com","www.facebook.com","fb.com","fb.me","www.fb.com"}
IG_HOSTS = {"instagram.com","www.instagram.com","instagr.am"}
LINE_HOSTS = {"line.me","lin.ee","page.line.me","liff.line.me","timeline.line.me"}
TT_HOSTS = {"tiktok.com","www.tiktok.com","vm.tiktok.com"}
YT_HOSTS = {"youtube.com","www.youtube.com","youtu.be","m.youtube.com"}

# Generic FB URL paths to discard as "handle"
FB_RESERVED = {"sharer","share","plugins","ads","groups","watch","gaming","marketplace","help","login","r.php",
               "search","events","story.php","photos","posts","videos","login.php","permalink.php",
               "pages","public","profile.php","reel","reels","tr","p","l.php","dialog","intern",
               "policies","terms","privacy","about","careers","brand","hashtag","games","fundraisers"}

# Bare names of 3rd-party platforms / marketing tools that are never a real business handle.
# Matched ACROSS all platforms, with and without leading "@".
_THIRD_PARTY_NAMES = {
    "linktr.ee","linktree","getyourguide","getseeu","getseeuth","openlinkco","openlink",
    "wix","2008","wordpress","squarespace","tripadvisor","klook","trip.com","booking.com",
    "airbnb","google","tiktok","instagram","facebook","line","youtube","twitter","threads",
}
HANDLE_BLACKLIST = set()
for plat in ("facebook","instagram","line","tiktok","youtube"):
    for name in _THIRD_PARTY_NAMES:
        HANDLE_BLACKLIST.add((plat, name))
        HANDLE_BLACKLIST.add((plat, "@"+name))

def extract_fb(url: str) -> str:
    """Return canonical FB handle (lowercase) or empty."""
    if not url: return ""
    try:
        u = urlparse(url if "://" in url else "https://" + url)
    except Exception:
        return ""
    host = (u.hostname or "").lower()
    if host not in FB_HOSTS: return ""
    path = (u.path or "/").strip("/").split("/")
    if not path or not path[0]: return ""
    first = path[0].lower()
    # profile.php?id=NNNN
    if first == "profile.php":
        qs = parse_qs(u.query)
        ids = qs.get("id") or qs.get("ID") or []
        return clean_handle("profile:" + ids[0]) if ids else ""
    if first in FB_RESERVED: return ""
    return clean_handle(first.lower())

def extract_ig(url: str) -> str:
    if not url: return ""
    try:
        u = urlparse(url if "://" in url else "https://" + url)
    except Exception:
        return ""
    host = (u.hostname or "").lower()
    if host not in IG_HOSTS: return ""
    path = (u.path or "/").strip("/").split("/")
    if not path or not path[0]: return ""
    first = path[0].lower()
    if first in {"p","explore","reel","reels","stories","accounts","direct","tv"}:
        return ""
    return clean_handle(first)

def extract_line(url: str) -> str:
    """
    LINE OA URLs:
      - line.me/R/ti/p/@abc       → @abc
      - line.me/R/ti/p/~abc       → ~abc
      - lin.ee/XXXXX               → lin.ee/XXXXX (shortcode)
      - line.me/ti/p/@abc          → @abc
      - page.line.me/abc           → abc
    """
    if not url: return ""
    try:
        u = urlparse(url if "://" in url else "https://" + url)
    except Exception:
        return ""
    host = (u.hostname or "").lower()
    if host not in LINE_HOSTS: return ""
    path = (u.path or "/").strip("/")
    if not path: return ""
    # Clean trailing escapes / garbage
    path = path.rstrip("\\/").strip()
    if host == "lin.ee":
        token = path.split("/")[0]
        # URL-decode %40 -> @ etc.
        from urllib.parse import unquote
        token = unquote(token).rstrip("\\/ ")
        return f"lin.ee/{token}".lower() if token else ""
    parts = [p for p in path.split("/") if p]
    if not parts: return ""
    # R/ti/p/<id>
    for marker in ("p","g"):
        if marker in parts:
            i = parts.index(marker)
            if i+1 < len(parts):
                from urllib.parse import unquote
                token = unquote(parts[i+1]).rstrip("\\/ ")
                return token if len(token) >= 2 else ""
    from urllib.parse import unquote
    token = unquote(parts[-1]).rstrip("\\/ ")
    return token if len(token) >= 2 else ""

def extract_tt(url: str) -> str:
    if not url: return ""
    try:
        u = urlparse(url if "://" in url else "https://" + url)
    except Exception:
        return ""
    host = (u.hostname or "").lower()
    if host not in TT_HOSTS: return ""
    path = (u.path or "/").strip("/").split("/")
    if not path or not path[0]: return ""
    first = path[0]
    if first.startswith("@"): return clean_handle(first.lower())
    return clean_handle(first.lower())

def extract_yt(url: str) -> str:
    if not url: return ""
    try:
        u = urlparse(url if "://" in url else "https://" + url)
    except Exception:
        return ""
    host = (u.hostname or "").lower()
    if host not in YT_HOSTS: return ""
    path = (u.path or "/").strip("/").split("/")
    if not path or not path[0]: return ""
    first = path[0]
    if first.startswith("@") or first in ("c","channel","user"):
        if first.startswith("@"): return clean_handle(first.lower())
        if len(path) >= 2: return clean_handle(("@" if first=="c" else "") + path[1].lower())
    return ""

EXTRACTORS = {"facebook": extract_fb, "instagram": extract_ig, "line": extract_line, "tiktok": extract_tt, "youtube": extract_yt}

def extract_any(url: str) -> tuple[str, str]:
    """Detect which platform a URL is on and return (platform, handle)."""
    if not url: return "", ""
    for platform, fn in EXTRACTORS.items():
        h = fn(url)
        if h: return platform, h
    return "", ""

# ---------- TAT loader ----------

TAT_FILES = [
    # (filename, name_th, name_en, province, phone, fb, ig, line, tiktok)
    ("tat_accommodation_accommodation.csv","ACC_NAME_TH","ACC_NAME_EN","PROVINCE_NAME_TH","ACC_TEL","ACC_FACEBOOK","ACC_INSTAGRAM","ACC_LINE","ACC_TIKTOK"),
    ("tat_restaurant_restaurant.csv","PLACE_NAME_TH","PLACE_NAME_EN","PROVINCE_NAME_TH","PLACE_PHONE","PLACE_FACEBOOK","PLACE_INSTAGRAM","PLACE_LINE","PLACE_TIKTOK"),
    ("tat_tourist-attraction_attraction.csv","ATT_NAME_TH","ATT_NAME_EN","PROVINCE_NAME_TH","ATT_TEL","ATT_FACEBOOK","ATT_INSTAGRAM","ATT_LINE","ATT_TIKTOK"),
    ("tat_souvenir-shop_souvenir.csv","PLACE_NAME_TH","PLACE_NAME_EN","PROVINCE_NAME_TH","PLACE_PHONE","PLACE_FACEBOOK","PLACE_INSTAGRAM","PLACE_LINE","PLACE_TIKTOK"),
]

def load_tat_social() -> tuple[dict, dict]:
    """
    Return (by_name, by_phone). Each maps key → {facebook, instagram, line, tiktok, kind, name_th, name_en, province_th}.
    Only entries with at least one social handle are indexed.
    """
    by_name, by_phone = {}, {}
    for fname, nth, nen, prov, tel, fb, ig, ln, tt in TAT_FILES:
        path = RAW / fname
        if not path.exists(): continue
        kind = fname.split("_")[1]
        with open(path, "r", encoding="utf-8-sig", newline="", errors="replace") as fh:
            rdr = csv.DictReader(fh)
            for row in rdr:
                fb_h = extract_fb(row.get(fb,"")) or (row.get(fb,"").strip() if "facebook" in (row.get(fb,"") or "").lower() else "")
                ig_h = extract_ig(row.get(ig,""))
                ln_h = extract_line(row.get(ln,""))
                tt_h = extract_tt(row.get(tt,""))
                if not (fb_h or ig_h or ln_h or tt_h): continue
                rec = {
                    "kind": kind,
                    "name_th": (row.get(nth) or "").strip(),
                    "name_en": (row.get(nen) or "").strip(),
                    "province_th": (row.get(prov) or "").strip(),
                    "facebook": fb_h, "instagram": ig_h, "line": ln_h, "tiktok": tt_h,
                    "source": "tat_" + kind,
                }
                for n in (rec["name_th"], rec["name_en"]):
                    k = norm_name(n)
                    if k and len(k) >= 4 and k not in by_name:
                        by_name[k] = rec
                pk = norm_phone(row.get(tel,""))
                if pk and len(pk) >= 9 and pk not in by_phone:
                    by_phone[pk] = rec
    return by_name, by_phone

# ---------- main ----------

def main():
    print("Loading TAT social index...")
    tat_n, tat_p = load_tat_social()
    print(f"  TAT entries indexed: {len(tat_n)} names / {len(tat_p)} phones")

    print("Loading places.json...")
    with open(PLACES_PATH, "r", encoding="utf-8") as f:
        pj = json.load(f)
    places = pj["places"]

    out = {}
    stats = {
        "from_website": 0,
        "from_tat_name": 0,
        "from_tat_phone": 0,
        "facebook": 0, "instagram": 0, "line": 0, "tiktok": 0, "youtube": 0,
        "any_handle": 0,
    }
    for p in places:
        pid = p["id"]
        entry = {"facebook": "", "instagram": "", "line": "", "tiktok": "", "youtube": "", "sources": []}

        # 1) website field
        website = (p.get("website") or "").strip()
        if website:
            platform, handle = extract_any(website)
            if platform and handle:
                entry[platform] = handle
                entry["sources"].append({"platform": platform, "via": "website"})
                stats["from_website"] += 1

        # 2) TAT match by normalized name
        nname = norm_name(p.get("name",""))
        if nname and nname in tat_n:
            tat = tat_n[nname]
            for plat in ("facebook","instagram","line","tiktok"):
                if tat.get(plat) and not entry[plat]:
                    entry[plat] = tat[plat]
                    entry["sources"].append({"platform": plat, "via": "tat_name", "kind": tat["kind"]})
            stats["from_tat_name"] += 1

        # 3) TAT match by phone
        phone = norm_phone(p.get("phone",""))
        if phone and len(phone) >= 9 and phone in tat_p:
            tat = tat_p[phone]
            for plat in ("facebook","instagram","line","tiktok"):
                if tat.get(plat) and not entry[plat]:
                    entry[plat] = tat[plat]
                    entry["sources"].append({"platform": plat, "via": "tat_phone", "kind": tat["kind"]})
            stats["from_tat_phone"] += 1

        # Save only if at least one handle
        any_h = False
        for plat in ("facebook","instagram","line","tiktok","youtube"):
            if entry[plat]:
                stats[plat] += 1
                any_h = True
        if any_h:
            stats["any_handle"] += 1
            out[pid] = entry

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    print(f"\nWrote {OUT_PATH}")
    print(f"  places with any SNS handle: {stats['any_handle']}/{len(places)}  ({100*stats['any_handle']/len(places):.1f}%)")
    print(f"  via website field:       {stats['from_website']}")
    print(f"  via TAT name match:      {stats['from_tat_name']}")
    print(f"  via TAT phone match:     {stats['from_tat_phone']}")
    print(f"  facebook:  {stats['facebook']}")
    print(f"  instagram: {stats['instagram']}")
    print(f"  line:      {stats['line']}")
    print(f"  tiktok:    {stats['tiktok']}")
    print(f"  youtube:   {stats['youtube']}")

if __name__ == "__main__":
    main()
