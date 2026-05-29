"""
Build a prioritized owner-outreach queue for verifiedthai.com.

Joins places.json + per_place_emails.json + per_place_klook.json +
per_place_wayback.json + per_place_dns.json + per_place_recency.json to
produce a ranked CSV/JSON of venues whose owners we should invite to
claim their listing.

Priority score (0–100ish):
  same_domain email   +30   (contact@place.com — high deliverability)
  personal email      +15   (gmail/yahoo — still owner, lower confidence)
  has Klook product   +25   (pays Klook ~25% — strong 0% pitch)
  veteran 10y+        +10
  active in 30d       +10
  trust_score ÷ 5     +0–20

Exclusions:
  is_partner = true   (already claimed)
  email tier "other"  (third-party scrape, low confidence)
  trust_score < 30    (low-signal listings)

Also writes per-place email drafts under outreach/drafts/{niche}/.

Output is gitignored — contains owner email addresses (PII).
"""
import csv, json, os, re, sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLACES   = ROOT / "public" / "data" / "places.json"
EMAILS   = ROOT / "public" / "data" / "per_place_emails.json"
KLOOK    = ROOT / "public" / "data" / "per_place_klook.json"
WAYBACK  = ROOT / "public" / "data" / "per_place_wayback.json"
DNS      = ROOT / "public" / "data" / "per_place_dns.json"
RECENCY  = ROOT / "public" / "data" / "per_place_recency.json"
OUT_DIR  = ROOT / "outreach"
DRAFTS   = OUT_DIR / "drafts"

SITE = "https://verifiedthai.com"

NICHE_LABEL = {
    "muay-thai": "Muay Thai gym",
    "yoga-pilates": "yoga/pilates studio",
    "wellness": "wellness retreat",
    "cooking": "cooking school",
    "diving": "dive center",
    "spa": "spa & massage",
    "coworking": "coworking space",
}
NICHE_INTRO = {
    "muay-thai": "Korean travelers actively search for Muay Thai camps in your area",
    "yoga-pilates": "wellness travelers from Korea, Japan, and the Middle East look for studios like yours",
    "wellness": "international wellness travelers (KR/JP/EN) discover venues like yours through us",
    "cooking": "tourists looking for authentic Thai cooking classes find your school through our site",
    "diving": "divers planning Thailand trips compare PADI centers on our directory",
    "spa": "tourists comparing spas in Bangkok, Phuket, and Chiang Mai use us to filter the legit ones",
    "coworking": "digital nomads researching Thai coworking spaces land on our directory",
}


def slugify_email_local(e):
    return re.sub(r"[^a-z0-9]", "", e.split("@")[0].lower())[:20]


def load(p):
    if not p.exists(): return {}
    try: return json.loads(p.read_text(encoding="utf-8"))
    except Exception: return {}


def score(place, email_rec, has_klook, age_years, recency, professional):
    s = 0.0
    tier = (email_rec or {}).get("primary_tier", "")
    if tier == "same_domain": s += 30
    elif tier == "personal":  s += 15
    if has_klook:                                 s += 25
    if age_years and age_years >= 10:             s += 10
    if recency and recency.get("reviews_last_30d", 0) > 0: s += 10
    if professional:                              s += 5
    s += min(20, place.get("trust_score", 0) / 5)
    return round(s, 1)


def draft_body(place, email_rec, has_klook, age_years, claim_url, listing_url, lang="en"):
    name = place["name"]
    city = place.get("city", "Thailand")
    niche = place["niche"]
    label = NICHE_LABEL.get(niche, "venue")
    intro = NICHE_INTRO.get(niche, "international travelers find venues like yours through us")

    age_line = ""
    if age_years and age_years >= 10:
        age_line = f"Your venue shows up on archive.org as far back as {int(age_years)}+ years ago — clearly established.\n\n"

    klook_line = ""
    if has_klook:
        klook_line = (
            "I see you're listed on Klook. Their commission is typically 20–25%. "
            "Direct inquiries through verifiedthai.com pay 0% — the lead goes straight to your inbox.\n\n"
        )

    subject = f"Free verifiedthai.com listing for {name} — claim in 60 seconds?"
    body = f"""Hi {name} team,

We run verifiedthai.com — a directory of trusted {label}s in Thailand built for international travelers. {intro.capitalize()}.

We've built a listing for {name} ({city}) based on your public Google profile and website:
{listing_url}

{age_line}{klook_line}If you'd like to take it over (free), you can:
  • Add your own photos, hours, and service menu
  • Receive direct inquiries from travelers (0% commission, lead goes to your email)
  • Highlight Korean/English/Thai language support

Claim here: {claim_url}

If you'd rather we remove the listing, just reply "REMOVE" and we'll take it down within 24h.

Best,
verifiedthai.com team
"""
    return subject, body


def main():
    places = load(PLACES).get("places", [])
    emails = load(EMAILS)
    klook = load(KLOOK)
    wayback = load(WAYBACK)
    dns = load(DNS)
    recency = load(RECENCY)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DRAFTS.mkdir(parents=True, exist_ok=True)

    rows = []
    skipped = Counter()
    for p in places:
        pid = p["id"]
        if p.get("is_partner"):
            skipped["already_partner"] += 1; continue
        er = emails.get(pid)
        if not er or not er.get("primary_email"):
            skipped["no_email"] += 1; continue
        tier = er.get("primary_tier", "")
        if tier not in ("same_domain", "personal"):
            skipped["weak_email_tier"] += 1; continue
        if p.get("trust_score", 0) < 30:
            skipped["low_trust"] += 1; continue
        wb = wayback.get(pid) or {}
        dn = dns.get(pid) or {}
        rc = recency.get(pid) or {}
        has_klook = bool((klook.get(pid) or {}).get("products"))
        age = wb.get("age_years")
        professional = bool(dn.get("professional"))
        pri = score(p, er, has_klook, age, rc, professional)
        rows.append({
            "place_id": pid,
            "slug": p["slug"],
            "name": p["name"],
            "niche": p["niche"],
            "city": p.get("city", ""),
            "primary_email": er["primary_email"],
            "email_tier": tier,
            "all_emails": ";".join(er.get("emails", [])[:5]),
            "trust_score": p.get("trust_score", 0),
            "is_veteran": bool(age and age >= 10),
            "founding_year": (wb.get("first_capture") or "")[:4],
            "active_30d": bool(rc.get("reviews_last_30d", 0) > 0),
            "active_90d": bool(rc.get("active_90d")),
            "has_klook": has_klook,
            "email_provider": dn.get("provider", "unknown"),
            "priority": pri,
            "claim_url": f"{SITE}/en/auth/signin?callbackUrl=/dashboard/claim/{p['slug']}",
            "listing_url": f"{SITE}/en/place/{p['slug']}/",
        })

    rows.sort(key=lambda r: -r["priority"])
    for i, r in enumerate(rows, 1):
        r["rank"] = i

    # JSON
    (OUT_DIR / "queue.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    # CSV (Google Sheets-friendly)
    cols = ["rank","priority","name","niche","city","primary_email","email_tier",
            "trust_score","is_veteran","founding_year","active_30d","active_90d",
            "has_klook","email_provider","claim_url","listing_url","all_emails","place_id","slug"]
    with (OUT_DIR / "queue.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in rows: w.writerow(r)

    # Per-place drafts grouped by niche
    for r in rows:
        place = next(p for p in places if p["id"] == r["place_id"])
        er = emails[r["place_id"]]
        wb = wayback.get(r["place_id"]) or {}
        claim_url = r["claim_url"]
        subject, body = draft_body(place, er, r["has_klook"], wb.get("age_years"), claim_url, r["listing_url"])
        niche_dir = DRAFTS / r["niche"]
        niche_dir.mkdir(parents=True, exist_ok=True)
        rank_str = f"{r['rank']:04d}"
        slug_short = r["slug"][:60]
        fn = niche_dir / f"{rank_str}_{slug_short}.txt"
        fn.write_text(
            f"To: {r['primary_email']}\n"
            f"Subject: {subject}\n"
            f"X-Priority: {r['priority']}  (rank #{r['rank']})\n"
            f"X-Tier: {r['email_tier']}\n"
            f"\n{body}",
            encoding="utf-8",
        )

    # Per-niche batch (top-50 each) for staged send
    by_niche = {}
    for r in rows:
        by_niche.setdefault(r["niche"], []).append(r)
    batches_dir = OUT_DIR / "batches"
    batches_dir.mkdir(parents=True, exist_ok=True)
    for niche, items in by_niche.items():
        top = items[:50]
        with (batches_dir / f"top50_{niche}.csv").open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            for r in top: w.writerow(r)

    print(f"contactable: {len(rows)}")
    print(f"skipped: {dict(skipped)}")
    print(f"by niche:")
    for niche, items in sorted(by_niche.items(), key=lambda x: -len(x[1])):
        same_dom = sum(1 for x in items if x["email_tier"] == "same_domain")
        klk = sum(1 for x in items if x["has_klook"])
        vet = sum(1 for x in items if x["is_veteran"])
        print(f"  {niche:14}  total={len(items):4}  same_domain={same_dom:3}  klook={klk:3}  veteran={vet:3}")
    print(f"output: {OUT_DIR}")


if __name__ == "__main__":
    main()
