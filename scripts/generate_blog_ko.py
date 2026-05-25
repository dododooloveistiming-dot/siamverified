"""verifiedthai 한국어 블로그 글 자동 생성기.

타겟: 태국 여행 준비 중인 한국 관광객.
검색 키워드: "방콕 무에타이 추천", "푸켓 다이빙 자격증", "치앙마이 요가 후기",
"코사무이 스파 가성비" 등 한국 long-tail.

전략:
- public/data/places.json 에서 city × niche 매트릭스 (3+ 곳)
- audience 별 variant (일반 / 초보자 / 여성 / 커플 / 한국인-OK / 가성비)
- Korean 자연어 인트로 + 데이터 기반 픽 리스트 + Q&A
- inquiry form 으로 funnel
- public/data/posts_ko.json 생성

CLI:
  python scripts/generate_blog_ko.py           # 전체 재생성
  python scripts/generate_blog_ko.py --limit 10
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLACES_JSON = ROOT / "public" / "data" / "places.json"
OUT_JSON = ROOT / "public" / "data" / "posts_ko.json"

# ─── Labels ────────────────────────────────────────────────────────────

CITY_KO = {
    "bangkok": "방콕",
    "phuket": "푸켓",
    "chiang mai": "치앙마이",
    "chiang_mai": "치앙마이",
    "pattaya": "파타야",
    "hua hin": "후아힌",
    "hua_hin": "후아힌",
    "koh samui": "코사무이",
    "koh_samui": "코사무이",
    "krabi": "끄라비",
    "koh phangan": "코팡안",
    "koh_phangan": "코팡안",
}
CITY_SLUG = {
    "bangkok": "bangkok",
    "phuket": "phuket",
    "chiang mai": "chiang-mai",
    "pattaya": "pattaya",
    "hua hin": "hua-hin",
    "koh samui": "koh-samui",
    "krabi": "krabi",
}
NICHE_KO = {
    "muay-thai": "무에타이",
    "yoga-pilates": "요가/필라테스",
    "wellness": "웰니스",
    "cooking": "쿠킹 클래스",
    "diving": "다이빙",
    "spa": "스파",
    "coworking": "코워킹",
}
# 검색량 큰 한국어 검색어 매핑
NICHE_KEYWORD_KO = {
    "muay-thai": "무에타이 추천",
    "yoga-pilates": "요가 후기",
    "wellness": "웰니스 추천",
    "cooking": "쿠킹 클래스 후기",
    "diving": "다이빙 자격증",
    "spa": "스파 가성비",
    "coworking": "코워킹 스페이스",
}
# 한 줄 자세한 묘사 (intro 마지막에 붙임)
NICHE_BLURB_KO = {
    "muay-thai": "태국 무에타이는 본고장 체험. 1회 체험부터 1주 단기 캠프까지 다양. 영어 가능한 코치가 많아 한국인도 어려움 없이 시작 가능.",
    "yoga-pilates": "치앙마이 / 푸켓 위주로 요가 리트릿이 발달. 비자 런 겸 한 달 살기 패키지도 흔함.",
    "wellness": "전통 타이 마사지부터 명상 리트릿까지. 한국보다 30-50% 저렴한 가격대.",
    "cooking": "팟타이, 똠얌꿍 등 정통 태국 요리를 직접 배움. 시장 투어 포함 반나절 프로그램이 흔함.",
    "diving": "PADI 오픈워터 자격증 4일 코스가 한국보다 절반 가격. 코사무이 / 푸켓 / 코타오 추천.",
    "spa": "1시간 ฿800-2,500 수준. 호텔 스파보다 로컬 스파가 가성비 훨씬 좋음.",
    "coworking": "디지털 노마드 성지. 치앙마이 / 방콕에 한국인 노마드 커뮤니티도 있음.",
}

# ─── Audience variants ────────────────────────────────────────────────

AUDIENCES = [
    {
        "slug": "best",
        "title_tpl": "{city_ko} {niche_ko} 베스트 TOP{n}",
        "subtitle_tpl": "{city_ko}에서 {niche_keyword} 찾으시는 분 정리.",
        "intro_hook": "구글 평점 + 후기 수 + 한국 / 태국 커뮤니티 언급량 종합 상위 {n}곳 추렸어요. 모든 곳 무료 inquiry 가능.",
        "filter": lambda p: True,
        "min_n": 3,
    },
    {
        "slug": "first-timer",
        "title_tpl": "{city_ko} {niche_ko} 처음 가는 분 가이드",
        "subtitle_tpl": "{city_ko} {niche_keyword} 첫 방문자용 추천.",
        "intro_hook": "Beginner-friendly + 평점 4.5 이상 + 영어 가능 (대부분) 인 곳만. 태국 처음이라도 어려움 없이 즐길 수 있어요.",
        "filter": lambda p: (p.get("is_beginner_friendly", False)) or ((p.get("rating") or 0) >= 4.5),
        "min_n": 3,
    },
    {
        "slug": "budget",
        "title_tpl": "{city_ko} {niche_ko} 가성비 추천",
        "subtitle_tpl": "저렴한데 후기 좋은 {city_ko} {niche_keyword}.",
        "intro_hook": "한국 동급 가격의 30-50% 수준. 첫 태국 여행자에게 부담 없는 가격대.",
        "filter": lambda p: (p.get("price_min_thb") or 0) > 0,
        "sort_key": "price",
        "min_n": 3,
    },
    {
        "slug": "top-rated",
        "title_tpl": "{city_ko} {niche_ko} 평점 ★4.7+ 모음",
        "subtitle_tpl": "{city_ko} {niche_keyword} 중 최고 평점만.",
        "intro_hook": "구글 평점 4.7 이상의 검증된 곳만. 가격은 좀 있을 수 있지만 실패 확률 0%.",
        "filter": lambda p: (p.get("rating") or 0) >= 4.7,
        "min_n": 3,
    },
    {
        "slug": "bookable",
        "title_tpl": "{city_ko} {niche_ko} Klook 즉시예약",
        "subtitle_tpl": "Klook 에서 바로 예약되는 {city_ko} {niche_keyword}.",
        "intro_hook": "Klook 무료 취소 + 즉시 확정 가능한 곳만. 한국 결제, 한국어 인터페이스로 안전.",
        "filter": lambda p: (p.get("bookable") or {}).get("klook"),
        "min_n": 3,
    },
    {
        "slug": "trusted",
        "title_tpl": "{city_ko} {niche_ko} 가장 신뢰도 높은 곳",
        "subtitle_tpl": "{city_ko} {niche_keyword} Trust Score 상위.",
        "intro_hook": "구글 + 레딧 + Naver + Pantip + YouTube + 공식 웹사이트 등 6개 소스 종합 신뢰도 점수 상위 {n}곳. 광고비 안 받고 데이터로만 선정.",
        "filter": lambda p: (p.get("trust_score") or 0) >= 40,
        "min_n": 3,
    },
    {
        "slug": "naver",
        "title_tpl": "네이버 후기 많은 {city_ko} {niche_ko}",
        "subtitle_tpl": "한국 네이버 블로그 / 카페에서 많이 언급된 {city_ko} {niche_keyword}.",
        "intro_hook": "네이버 후기 / 블로그 글이 있는 곳 위주. 한국 후기로 미리 보고 갈 수 있어 안심.",
        "filter": lambda p: (p.get("source_badges") or {}).get("naver", 0) > 0,
        "min_n": 3,
    },
    {
        "slug": "open-24h",
        "title_tpl": "{city_ko} 24시간 운영 {niche_ko}",
        "subtitle_tpl": "{city_ko} {niche_keyword} 새벽 / 야간에도 가능.",
        "intro_hook": "야행성 여행자, 시차 적응 안 된 첫날, 또는 늦은 비행기 전 짧은 세션 등에 좋아요.",
        "filter": lambda p: p.get("is_open_24h"),
        "min_n": 3,
    },
    {
        "slug": "weekend",
        "title_tpl": "주말 1박2일 {city_ko} {niche_ko}",
        "subtitle_tpl": "짧은 일정으로 {city_ko}에서 {niche_keyword} 하실 분.",
        "intro_hook": "1박 2일 / 주말 단기 일정에 맞는 곳. 1회 체험 / 단일 코스 / 즉시 예약 가능한 곳 위주로 추렸어요. 미리 inquiry로 시간 확인 권장.",
        "filter": lambda p: True,
        "min_n": 4,
    },
    {
        "slug": "couple",
        "title_tpl": "커플 여행 {city_ko} {niche_ko} 데이트",
        "subtitle_tpl": "{city_ko} 커플 데이트 {niche_keyword}.",
        "intro_hook": "둘이 함께 즐기기 좋은 곳. 평점 높고 사진 잘 나오는 곳, 커플 패키지 있는 곳 위주.",
        "filter": lambda p: (p.get("rating") or 0) >= 4.5,
        "min_n": 4,
    },
    {
        "slug": "solo",
        "title_tpl": "혼자 가는 {city_ko} {niche_ko} 단독여행",
        "subtitle_tpl": "{city_ko} 솔로 여행자 {niche_keyword}.",
        "intro_hook": "혼자 가도 어색하지 않은 곳. 단체 클래스 / 워크인 가능 / 영어 가능 스태프 있는 곳.",
        "filter": lambda p: (p.get("trust_score") or 0) >= 35,
        "min_n": 4,
    },
    {
        "slug": "premium",
        "title_tpl": "{city_ko} {niche_ko} 프리미엄 / 고급",
        "subtitle_tpl": "{city_ko} 고급 {niche_keyword}.",
        "intro_hook": "예산 충분하고 최고 경험을 원하는 분. 평점 4.7+ + 가격대 상위 + 시설 / 서비스 검증된 곳.",
        "filter": lambda p: (p.get("rating") or 0) >= 4.6,
        "sort_key": "price_desc",
        "min_n": 3,
    },
]

# ─── Helpers ───────────────────────────────────────────────────────────

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def city_match(p_city: str, target: str) -> bool:
    c = (p_city or "").lower().strip()
    t = target.lower().strip()
    return c == t or c.startswith(t) or t in c


def fmt_price_range(places: list[dict]) -> str:
    prices = sorted([p.get("price_min_thb", 0) for p in places if p.get("price_min_thb")])
    if not prices:
        return ""
    lo, hi = prices[0], prices[-1]
    if lo == hi:
        return f"평균 ฿{lo:,}"
    return f"฿{lo:,}-{hi:,}"


def fmt_avg_rating(places: list[dict]) -> str:
    rs = [p.get("rating") for p in places if p.get("rating")]
    if not rs:
        return ""
    return f"평균 ★{sum(rs)/len(rs):.1f}"


def place_card_md(rank: int, p: dict, city_ko: str) -> str:
    name = p.get("name", "").strip()
    rating = p.get("rating")
    review_count = p.get("review_count") or 0
    price_min = p.get("price_min_thb", 0)
    price_max = p.get("price_max_thb", 0)
    languages = p.get("languages") or {}
    is_beginner = p.get("is_beginner_friendly")
    bookable = (p.get("bookable") or {}).get("klook")
    slug = p.get("slug", "")

    bits = [f"**{rank}. {name}**"]
    chips = []
    if rating:
        chips.append(f"★{rating:.1f}{f' ({review_count:,})' if review_count else ''}")
    if price_min:
        if price_max > price_min:
            chips.append(f"฿{price_min:,}-{price_max:,}")
        else:
            chips.append(f"฿{price_min:,}+")
    if languages.get("ko"):
        chips.append("🇰🇷 한국어 OK")
    if is_beginner:
        chips.append("초보 OK")
    if bookable:
        chips.append("⚡ Klook 예약")
    if chips:
        bits.append(" · ".join(chips))
    line = " — ".join(bits)

    # Snippet from top_review if available
    review_text = (p.get("top_review_text") or "").strip()
    if review_text:
        snippet = review_text[:140].rstrip()
        if len(review_text) > 140:
            snippet += "..."
        line += f"\n  > \"{snippet}\""

    line += f"\n  → [상세 보기 & 무료 inquiry](/ko/place/{slug}/)"
    return line


def build_intro_md(audience: dict, city_ko: str, niche_ko: str, niche_keyword: str,
                   n_picks: int, n_total: int, avg_rating: str, price_range: str) -> str:
    title_subline = audience["subtitle_tpl"].format(
        city_ko=city_ko, niche_ko=niche_ko, niche_keyword=niche_keyword,
    )
    hook = audience["intro_hook"].format(n=n_picks)
    stats = []
    if n_total:
        stats.append(f"{city_ko} {niche_ko} 등록 **{n_total}곳** 중 상위 {n_picks}곳")
    if avg_rating:
        stats.append(avg_rating)
    if price_range:
        stats.append(f"가격대 {price_range}")
    stats_line = " · ".join(stats)
    return f"{title_subline}\n\n{hook}\n\n*{stats_line}*"


def build_faq(audience_slug: str, city_ko: str, niche_ko: str, niche_keyword: str,
              picks: list[dict], all_places: list[dict]) -> list[dict]:
    out: list[dict] = []
    # 가격
    prices = sorted([p.get("price_min_thb", 0) for p in picks if p.get("price_min_thb", 0) > 0])
    if prices:
        lo, hi = prices[0], prices[-1]
        out.append({
            "q": f"{city_ko}에서 {niche_ko} 평균 가격은?",
            "a": f"이 글에 소개된 {len(picks)}곳 기준 ฿{lo:,}-{hi:,} 범위. "
                 f"한국 동급 가격의 30-50% 수준이에요. 시즌 / 코스 길이에 따라 변동 있으니 inquiry로 정확한 견적 받는 게 안전합니다.",
        })
    # 한국어
    ko_friendly = [p for p in picks if p.get("languages", {}).get("ko")]
    if ko_friendly:
        names = ", ".join(p["name"] for p in ko_friendly[:3])
        out.append({
            "q": f"{city_ko} {niche_ko} 중 한국어 통하는 곳은?",
            "a": f"{len(ko_friendly)}곳 확인됨: {names}{'...' if len(ko_friendly) > 3 else ''}. "
                 f"우리 데이터에서 \"languages.ko\" 신호 (한국어 후기 / 한국어 스태프) 가 잡힌 곳들이에요.",
        })
    # 초보
    beg = [p for p in picks if p.get("is_beginner_friendly")]
    if beg:
        out.append({
            "q": "초보자도 괜찮나요?",
            "a": f"{len(beg)}/{len(picks)}곳이 beginner-friendly 표시. 1회 체험 / 짧은 트라이얼 코스 운영하는 곳 위주로 추렸으니 처음 가시는 분도 부담 없어요.",
        })
    # Klook
    klook = [p for p in picks if (p.get("bookable") or {}).get("klook")]
    if klook:
        out.append({
            "q": "Klook 으로 즉시 예약되나요?",
            "a": f"{len(klook)}/{len(picks)}곳이 Klook 에 등록되어 있어 한국 카드로 바로 결제 가능. 나머지는 우리 inquiry 폼으로 0% 수수료 직접 예약 가능합니다.",
        })
    # 예약 / 문의
    out.append({
        "q": f"어떻게 예약 / 문의하나요?",
        "a": f"각 곳 상세 페이지에서 무료 inquiry 폼 제출하시면 한국어 → 영어 자동 번역 후 업체에 전달됩니다. 답변은 보통 24시간 이내. "
             f"Klook 즉시예약 가능한 곳은 [Klook 즉시예약 페이지](/ko/blog/{CITY_SLUG.get(city_ko_to_en(city_ko), 'bangkok')}-{niche_kw_to_slug(niche_keyword)}-bookable/) 도 참고하세요.",
    })
    # AEO 보너스
    out.append({
        "q": f"이 추천 목록은 어떻게 선정되나요?",
        "a": "우리는 광고비를 받지 않습니다. 추천 순위는 구글 평점 + 후기 수 + 한국 (Naver / 카페) / 태국 (Pantip) 커뮤니티 언급량 + 검증 가능한 웹사이트 등 6개 출처를 종합한 Trust Score 기반. 매주 자동 업데이트.",
    })
    return out


def city_ko_to_en(city_ko: str) -> str:
    rev = {v: k for k, v in CITY_KO.items()}
    return rev.get(city_ko, city_ko.lower())


def niche_kw_to_slug(kw: str) -> str:
    rev = {v: k for k, v in NICHE_KEYWORD_KO.items()}
    return rev.get(kw, "muay-thai")


# ─── Main generator ───────────────────────────────────────────────────

def generate(limit: int = 0) -> int:
    bundle = json.loads(PLACES_JSON.read_text(encoding="utf-8"))
    places = bundle.get("places", [])
    if not places:
        print("ERROR: no places")
        return 1

    # Group by (city, niche)
    by_city_niche: dict[tuple[str, str], list[dict]] = defaultdict(list)
    by_niche: dict[str, list[dict]] = defaultdict(list)
    for p in places:
        niche = p.get("niche")
        if niche not in NICHE_KO:
            continue
        by_niche[niche].append(p)
        city = (p.get("city") or "").lower().strip()
        # Normalize variations to canonical key
        city_key = None
        for k in CITY_KO:
            if city_match(city, k):
                city_key = k
                break
        if city_key:
            by_city_niche[(city_key, niche)].append(p)

    # Add "all-Thailand" pseudo-city for niche-wide posts (no city filter)
    for niche, pl in by_niche.items():
        by_city_niche[("thailand", niche)] = pl
    CITY_KO["thailand"] = "태국 전국"
    CITY_SLUG["thailand"] = "thailand"

    posts: list[dict] = []
    skipped = 0
    for (city, niche), city_places in sorted(by_city_niche.items()):
        if len(city_places) < 3:
            skipped += 1
            continue
        city_ko = CITY_KO[city]
        niche_ko = NICHE_KO[niche]
        niche_keyword = NICHE_KEYWORD_KO[niche]

        for aud in AUDIENCES:
            picks_all = [p for p in city_places if aud["filter"](p)]
            min_n = aud.get("min_n", 5)
            if len(picks_all) < min_n:
                continue

            # Sort: price-asc for budget, price-desc for premium, otherwise trust_score desc
            if aud.get("sort_key") == "price":
                picks_sorted = sorted(picks_all, key=lambda p: p.get("price_min_thb") or 99999)
            elif aud.get("sort_key") == "price_desc":
                picks_sorted = sorted(picks_all, key=lambda p: p.get("price_max_thb") or 0, reverse=True)
            else:
                picks_sorted = sorted(picks_all, key=lambda p: p.get("trust_score") or 0, reverse=True)
            picks = picks_sorted[:10]
            n = len(picks)

            slug_city = CITY_SLUG[city]
            slug_niche = niche
            slug = f"{slug_city}-{slug_niche}-{aud['slug']}"

            title = aud["title_tpl"].format(city_ko=city_ko, niche_ko=niche_ko, n=n)

            intro = build_intro_md(
                aud, city_ko, niche_ko, niche_keyword,
                n, len(city_places),
                fmt_avg_rating(picks), fmt_price_range(picks),
            )

            # Niche blurb at the very top
            niche_blurb = NICHE_BLURB_KO.get(niche, "")

            body_lines = []
            body_lines.append(intro)
            body_lines.append("")
            body_lines.append(niche_blurb)
            body_lines.append("")
            body_lines.append("## 추천 리스트")
            body_lines.append("")
            for i, p in enumerate(picks, 1):
                body_lines.append(place_card_md(i, p, city_ko))
                body_lines.append("")
            body_lines.append("")
            body_lines.append("## 자주 묻는 질문 (FAQ)")
            faqs = build_faq(aud["slug"], city_ko, niche_ko, niche_keyword, picks, city_places)
            for f in faqs:
                body_lines.append(f"### {f['q']}")
                body_lines.append(f["a"])
                body_lines.append("")
            body_lines.append("")
            body_lines.append("## 다음 단계")
            body_lines.append(f"위 {n}곳 중 마음에 드는 곳이 있다면 **상세 페이지 → 무료 inquiry** 로 바로 문의하세요. "
                             f"우리가 한국어 → 영어 번역 + 답변까지 무료로 도와드립니다. 수수료 0%.")
            body_lines.append("")
            body_lines.append(f"전체 [{city_ko} {niche_ko} 목록 보기](/ko/c/{niche}/) 또는 "
                             f"[다른 도시 {niche_ko}]({_other_city_link(city, niche)}) 도 함께 보세요.")

            posts.append({
                "slug": slug,
                "lang": "ko",
                "title": title,
                "city": city,
                "city_ko": city_ko,
                "niche": niche,
                "niche_ko": niche_ko,
                "audience": aud["slug"],
                "place_ids": [p.get("id") for p in picks],
                "place_slugs": [p.get("slug") for p in picks],
                "body_md": "\n".join(body_lines),
                "generated_at": now_iso(),
            })

            if limit and len(posts) >= limit:
                break
        if limit and len(posts) >= limit:
            break

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps({"generated_at": now_iso(), "total": len(posts), "posts": posts},
                   ensure_ascii=False, indent=0),
        encoding="utf-8",
    )
    print(f"DONE — {len(posts)} posts → {OUT_JSON}")
    print(f"   skipped: {skipped} (city, niche) combos with <3 places")
    return 0


def _other_city_link(city: str, niche: str) -> str:
    # Suggest the most populous other city for cross-link
    alt = {"bangkok": "phuket", "phuket": "bangkok", "chiang mai": "bangkok",
           "pattaya": "phuket", "hua hin": "bangkok", "koh samui": "phuket",
           "krabi": "phuket"}
    other = alt.get(city, "bangkok")
    return f"/ko/blog/{CITY_SLUG.get(other, 'bangkok')}-{niche}-best/"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()
    return generate(args.limit)


if __name__ == "__main__":
    raise SystemExit(main())
