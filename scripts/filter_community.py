"""Filter siamverified community/*.json — remove off-topic entries + clean markup.

Original data sorted threads by raw engagement metrics, pulling in irrelevant viral
posts (e.g. yoga-pilates niche -> "I watched 135 time loop movies").

Applies a relevance filter per source:
  - Reddit: title must match BOTH thailand AND niche keywords (or relevant subs)
  - Pantip: title must match niche keyword (Pantip is already Thailand-domain)
  - Naver: title/snippet must match Thailand keyword AND niche keyword

Also strips Naver search-markup tokens like {{em}} / {{eem}}.
Run idempotently.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMUNITY_DIR = ROOT / "public" / "data" / "community"

THAILAND_KEYWORDS = [
    "thailand", "thai", "bangkok", "phuket", "pattaya", "chiang mai", "chiangmai",
    "koh samui", "koh phangan", "krabi", "hua hin", "khao lak", "khao yai",
    "ayutthaya", "kanchanaburi", "koh tao", "koh lanta", "koh chang",
    "koh phi phi", "phiphi", "samui", "phangan", "isaan", "isan",
]

THAILAND_SUBS = {
    "thailand", "thailandtourism", "thaivisa", "bangkok", "phuket", "pattaya",
    "chiangmai", "kohsamui", "kohphangan", "krabi", "huahin", "khaolak",
    "thaifood", "thailandsex", "thailandcasinos",
}

THAI_KW = ["ไทย", "กรุงเทพ", "ภูเก็ต", "พัทยา", "เชียงใหม่", "หัวหิน",
           "สมุย", "พะงัน", "กระบี่", "เกาะเต่า", "เกาะ"]
KOREAN_TH_KW = ["태국", "방콕", "푸켓", "파타야", "치앙마이", "후아힌",
                "코사무이", "코팡안", "끄라비", "카오락", "사무이"]

NICHE_CONFIG: dict[str, dict] = {
    "muay-thai": {
        "keywords": ["muay thai", "muaythai", "kickbox", "thai boxing", "moo-ay", "martial art"],
        "subs": {"muaythai", "mma", "martialarts", "kickboxing", "boxing", "bjj"},
        "th_keywords": ["มวย", "muay"],
        "ko_keywords": ["무에타이", "muay"],
    },
    "yoga-pilates": {
        "keywords": ["yoga", "pilates", "reformer", "asana", "vinyasa", "ashtanga"],
        "subs": {"yoga", "pilates", "pilatesworkout", "yogateachers", "yogavinyasa"},
        "th_keywords": ["พิลาทิส", "โยคะ", "pilates", "yoga", "พีลาทิส"],
        "ko_keywords": ["필라테스", "요가", "pilates", "yoga"],
    },
    "spa": {
        "keywords": ["spa", "massage", "facial", "sauna", "hammam", "scrub", "thai massage"],
        "subs": {"spa", "massage", "asianbeauty", "skincareaddiction", "facialfitness"},
        "th_keywords": ["สปา", "นวด", "massage", "spa"],
        "ko_keywords": ["스파", "마사지", "페이셜", "spa", "massage"],
    },
    "diving": {
        "keywords": ["scuba", "dive", "diving", "snorkel", "reef", "padi", "freedive"],
        "subs": {"scuba", "diving", "freediving", "scubadiving", "snorkeling"},
        "th_keywords": ["ดำน้ำ", "scuba", "diving"],
        "ko_keywords": ["다이빙", "스쿠버", "scuba", "diving"],
    },
    "cooking": {
        "keywords": ["cook", "cooking class", "recipe", "thai food", "pad thai",
                     "thai curry", "som tam", "tom yum", "papaya salad"],
        "subs": {"cooking", "recipes", "askculinary", "thaifood", "asianfood", "food"},
        "th_keywords": ["ทำอาหาร", "สูตร", "ครัว", "cooking"],
        "ko_keywords": ["쿠킹", "요리", "음식", "맛집", "cooking"],
    },
    "coworking": {
        "keywords": ["coworking", "co-working", "workspace", "remote work",
                     "digital nomad", "wifi cafe", "nomad"],
        "subs": {"coworking", "digitalnomad", "remotework", "nomadlife", "expats"},
        "th_keywords": ["coworking", "co-working", "ทำงาน"],
        "ko_keywords": ["코워킹", "디지털노마드", "coworking", "노마드"],
    },
    "wellness": {
        "keywords": ["wellness", "retreat", "detox", "meditation", "mindful",
                     "ayurveda", "vipassana", "holistic"],
        "subs": {"wellness", "meditation", "ayurveda", "vipassana", "selfcare",
                 "buddhism", "mentalhealth"},
        "th_keywords": ["wellness", "สุขภาพ", "retreat", "รีทรีท", "สมาธิ"],
        "ko_keywords": ["웰니스", "명상", "요가", "리트릿", "wellness"],
    },
}

_MARKUP_RE = re.compile(r"\{\{e?em\}\}")


def _clean_markup(s: str) -> str:
    return _MARKUP_RE.sub("", s or "").strip()


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", _clean_markup(s or "").lower())


def is_relevant_reddit(entry: dict, niche: str) -> bool:
    cfg = NICHE_CONFIG.get(niche)
    if not cfg:
        return False
    title = _norm(entry.get("title", ""))
    snippet = _norm(entry.get("snippet", ""))
    sub = _norm(entry.get("subreddit", ""))
    text = f"{title} {snippet}"

    has_thailand = (
        any(kw in text for kw in THAILAND_KEYWORDS)
        or sub in THAILAND_SUBS
    )
    has_niche = (
        any(kw in text for kw in cfg["keywords"])
        or sub in cfg["subs"]
    )
    return has_thailand and has_niche


def is_relevant_pantip(entry: dict, niche: str) -> bool:
    cfg = NICHE_CONFIG.get(niche)
    if not cfg:
        return False
    title = _clean_markup(entry.get("title", "")).lower()
    snippet = _clean_markup(entry.get("snippet", "")).lower()
    text = f"{title} {snippet}"
    th_kws = cfg.get("th_keywords", []) + cfg["keywords"]
    return any(kw.lower() in text for kw in th_kws)


def is_relevant_naver(entry: dict, niche: str) -> bool:
    cfg = NICHE_CONFIG.get(niche)
    if not cfg:
        return False
    title = _clean_markup(entry.get("title", "")).lower()
    snippet = _clean_markup(entry.get("snippet", "")).lower()
    text = f"{title} {snippet}"
    has_thailand = any(kw in text for kw in KOREAN_TH_KW)
    ko_kws = cfg.get("ko_keywords", []) + cfg["keywords"]
    has_niche = any(kw.lower() in text for kw in ko_kws)
    return has_thailand and has_niche


def _clean_entry(e: dict) -> dict:
    e = dict(e)
    if "title" in e:
        e["title"] = _clean_markup(e["title"])
    if "snippet" in e:
        e["snippet"] = _clean_markup(e["snippet"])
    return e


def filter_file(p: Path) -> dict:
    d = json.loads(p.read_text(encoding="utf-8"))
    niche = d.get("niche", "")
    if niche not in NICHE_CONFIG:
        print(f"  skip {p.name}: unknown niche")
        return {}

    stats = {}
    for kind, predicate in [
        ("top_reddit", is_relevant_reddit),
        ("top_pantip", is_relevant_pantip),
        ("top_naver", is_relevant_naver),
    ]:
        original = d.get(kind, [])
        filtered = [_clean_entry(e) for e in original if predicate(e, niche)]
        d[kind] = filtered
        stats[kind] = (len(original), len(filtered))

    if "counts" in d:
        d["counts"]["reddit_filtered"] = stats["top_reddit"][1]
        d["counts"]["pantip_filtered"] = stats["top_pantip"][1]
        d["counts"]["naver_filtered"] = stats["top_naver"][1]
    d["filtered_at"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()

    p.write_text(
        json.dumps(d, ensure_ascii=False, indent=0),
        encoding="utf-8",
    )
    return stats


def main() -> int:
    if not COMMUNITY_DIR.exists():
        print(f"missing: {COMMUNITY_DIR}")
        return 1
    print(f"filtering {COMMUNITY_DIR}")
    totals = {"top_reddit": [0, 0], "top_pantip": [0, 0], "top_naver": [0, 0]}
    for f in sorted(COMMUNITY_DIR.glob("*.json")):
        stats = filter_file(f)
        if not stats:
            continue
        parts = []
        for k, (n_in, n_out) in stats.items():
            totals[k][0] += n_in
            totals[k][1] += n_out
            label = k.replace("top_", "")
            parts.append(f"{label} {n_in}->{n_out}")
        print(f"  {f.name}: " + " | ".join(parts))
    print("TOTAL:", " | ".join(
        f"{k.replace('top_','')} {v[0]}->{v[1]}" for k, v in totals.items()
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
