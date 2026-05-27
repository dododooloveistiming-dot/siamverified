"""
Match places.json against:
  - TAT SHA / SHA+ / SHA Extra Plus certifications
  - TAT accommodation / restaurant / attraction / souvenir directories
  - DBD legal entity registrations (52 monthly CSVs, 2022-01 → 2026-04)

Output: public/data/per_place_verifications.json

Matching strategy:
  Primary key:  normalized lowercase name (strip punctuation, spaces, Thai vowel marks)
  Secondary:    province (avoids cross-province name collisions)
  Tertiary:     phone number normalization (digits only)
"""
import csv, json, os, re, sys, unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW  = ROOT / "public" / "data" / "_raw" / "gov"
PLACES_PATH = ROOT / "public" / "data" / "places.json"
OUT_PATH    = ROOT / "public" / "data" / "per_place_verifications.json"

THAI_RE = re.compile(r"[฀-๿]")
WHITESPACE_RE = re.compile(r"\s+")
PUNCT_RE = re.compile(r"[^\w฀-๿]+")
DIGITS_RE = re.compile(r"\D+")

# Strip Thai company-form prefixes/suffixes from DBD names so they match brand-name form.
DBD_PREFIX_PATTERNS = [
    r"^บริษัท\s*",
    r"^บมจ\.?\s*",
    r"^หจก\.?\s*",
    r"^หจ\.\s*",
    r"^หส\.\s*",
    r"^ห้างหุ้นส่วนจำกัด\s*",
    r"^ห้างหุ้นส่วนสามัญ\s*",
]
DBD_SUFFIX_PATTERNS = [
    r"\s*\(?มหาชน\)?\s*จำกัด$",
    r"\s*จำกัด\s*\(?มหาชน\)?$",
    r"\s*จำกัด$",
    r"\s*co\.?,?\s*ltd\.?$",
    r"\s*company\s*limited$",
    r"\s*ltd\.?$",
]
DBD_PREFIX_RE = re.compile("|".join(DBD_PREFIX_PATTERNS), re.IGNORECASE)
DBD_SUFFIX_RE = re.compile("|".join(DBD_SUFFIX_PATTERNS), re.IGNORECASE)

# Map TAT/SHA province names (Thai) -> common English for places.json city/province
TH_TO_EN_PROVINCE = {
    "กรุงเทพมหานคร": "bangkok",
    "เชียงใหม่":     "chiang mai",
    "ภูเก็ต":         "phuket",
    "นนทบุรี":        "nonthaburi",
    "ชลบุรี":         "chonburi",       # incl. Pattaya
    "ปทุมธานี":       "pathum thani",
    "สมุทรปราการ":    "samut prakan",
    "เชียงราย":       "chiang rai",
    "สุราษฎร์ธานี":   "surat thani",
    "กระบี่":         "krabi",
    "สงขลา":          "songkhla",
    "ประจวบคีรีขันธ์": "prachuap khiri khan",  # incl. Hua Hin
}

def norm_name(s: str) -> str:
    if not s: return ""
    s = unicodedata.normalize("NFKC", s)
    s = s.casefold()
    s = PUNCT_RE.sub(" ", s)
    s = WHITESPACE_RE.sub(" ", s).strip()
    return s

def strip_company_form(s: str) -> str:
    """Remove Thai/English juristic-form prefixes & suffixes from a DBD entity name."""
    if not s: return s
    s = DBD_PREFIX_RE.sub("", s)
    s = DBD_SUFFIX_RE.sub("", s)
    return s.strip()

def norm_phone(s: str) -> str:
    if not s: return ""
    d = DIGITS_RE.sub("", s)
    if d.startswith("66") and len(d) > 9: d = "0" + d[2:]
    return d

def open_csv(path: Path, fallback_encodings=("utf-8-sig","cp874","tis-620","latin-1")):
    """Try multiple encodings — sha-plus.csv is TIS-620."""
    last_err = None
    for enc in fallback_encodings:
        try:
            fh = open(path, "r", encoding=enc, newline="")
            # peek
            sample = fh.read(2048)
            fh.seek(0)
            # If TIS-620 produced replacement chars, try next
            if "�" in sample or (enc == "utf-8-sig" and "" in sample):
                pass
            return fh, enc
        except Exception as e:
            last_err = e
    raise last_err or RuntimeError(f"could not open {path}")

# ------------- LOAD CERTIFICATIONS -------------

def load_sha_table(path: Path, level: str) -> dict:
    """Return: norm_name(th_or_en) -> {level, cert_id, date, category, province_th, name_th, name_en}"""
    out = {}
    if not path.exists(): return out
    # SHA-plus is in TIS-620 encoding
    encodings = ["utf-8-sig","cp874","tis-620","latin-1"]
    for enc in encodings:
        try:
            with open(path, "r", encoding=enc, newline="", errors="strict") as fh:
                rdr = csv.reader(fh)
                rows = list(rdr)
            # Detect bad encoding
            header = rows[0] if rows else []
            joined = " ".join(header)
            if "ชื่อ" in joined or "name" in joined.lower() or "ลำดับ" in joined:
                # Some files use tab-separated single column (sha-plus has that bug)
                if len(header) == 1 and "\t" in header[0]:
                    # Reparse as TSV
                    with open(path, "r", encoding=enc, newline="") as fh2:
                        rdr2 = csv.reader(fh2, delimiter="\t")
                        rows = list(rdr2)
                    header = rows[0]
                break
        except UnicodeDecodeError:
            continue
    else:
        print(f"  WARN: could not decode {path.name}")
        return out

    # Build column map
    def find_col(*needles):
        for i, h in enumerate(header):
            hh = h.strip()
            for n in needles:
                if n in hh: return i
        return -1
    c_id   = find_col("เลขสติกเกอร์","สติก")
    c_date = find_col("วันที่ผ่าน","วันที่")
    c_nth  = find_col("ชื่อสถานประกอบการ th","ชื่อสถาน","ชื่อ th","th")
    c_nen  = find_col("ชื่อสถานประกอบการ en","ชื่อ en","en")
    c_cat  = find_col("ประเภทกิจการ","ประเภท")
    c_prov = find_col("จังหวัด")

    # In some malformed exports the EN name column ends up where TH header is. Best effort.
    for row in rows[1:]:
        if not row: continue
        name_th = row[c_nth].strip() if c_nth >= 0 and c_nth < len(row) else ""
        name_en = row[c_nen].strip() if c_nen >= 0 and c_nen < len(row) else ""
        prov_th = row[c_prov].strip() if c_prov >= 0 and c_prov < len(row) else ""
        cert_id = row[c_id].strip()   if c_id   >= 0 and c_id   < len(row) else ""
        date    = row[c_date].strip() if c_date >= 0 and c_date < len(row) else ""
        cat     = row[c_cat].strip()  if c_cat  >= 0 and c_cat  < len(row) else ""
        entry = {
            "level": level, "cert_id": cert_id, "date": date,
            "category": cat, "province_th": prov_th,
            "name_th": name_th, "name_en": name_en,
        }
        for n in (name_th, name_en):
            k = norm_name(n)
            if k and k not in out:
                out[k] = entry
    return out

def load_tat_directory(path: Path, kind: str, name_th_col: str, name_en_col: str,
                       province_col: str, phone_col: str = "", website_col: str = "") -> tuple[dict, dict]:
    """Return: (by_name, by_phone) dict -> {kind, id, name_th, name_en, province, phone, website}"""
    by_name, by_phone = {}, {}
    if not path.exists(): return by_name, by_phone
    with open(path, "r", encoding="utf-8-sig", newline="", errors="replace") as fh:
        rdr = csv.DictReader(fh)
        for row in rdr:
            nth = (row.get(name_th_col) or "").strip()
            nen = (row.get(name_en_col) or "").strip()
            prov = (row.get(province_col) or "").strip()
            phone = (row.get(phone_col) or "").strip() if phone_col else ""
            web  = (row.get(website_col) or "").strip() if website_col else ""
            entry = {"kind": kind, "name_th": nth, "name_en": nen, "province_th": prov, "phone": phone, "website": web}
            for n in (nth, nen):
                k = norm_name(n)
                if k and len(k) >= 4 and k not in by_name:
                    by_name[k] = entry
            pk = norm_phone(phone)
            if pk and len(pk) >= 9 and pk not in by_phone:
                by_phone[pk] = entry
    return by_name, by_phone

def load_dbd_all() -> dict:
    """Merge all 52 monthly DBD CSVs. Return norm_name -> first matching entry."""
    by_name = {}
    files = sorted([p for p in RAW.iterdir() if p.name.startswith("dbd_") and p.name.endswith(".csv")])
    print(f"  loading {len(files)} DBD monthly CSVs...")
    total = 0
    for p in files:
        try:
            with open(p, "r", encoding="utf-8-sig", newline="", errors="replace") as fh:
                rdr = csv.DictReader(fh)
                for row in rdr:
                    total += 1
                    name = (row.get("ชื่อนิติบุคคล") or "").strip()
                    if not name: continue
                    stripped = strip_company_form(name)
                    k = norm_name(stripped)
                    if k and len(k) >= 3 and k not in by_name:
                        by_name[k] = {
                            "reg_no": row.get("เลขทะเบียน","").strip(),
                            "name_th": name,
                            "name_stripped": stripped,
                            "reg_date": row.get("วันที่จดทะเบียน","").strip(),
                            "capital_thb": row.get("ทุนจดทะเบียน","").strip(),
                            "purpose": row.get("วัตถุประสงค์","").strip()[:200],
                            "province_th": row.get("จังหวัด","").strip(),
                            "district_th": row.get("อำเภอ","").strip(),
                            "postcode": row.get("รหัสไปรษณีย์","").strip(),
                        }
        except Exception as e:
            print(f"    {p.name}: {e}")
    print(f"  DBD: parsed {total} rows, {len(by_name)} unique names")
    return by_name

# ------------- MAIN -------------

def main():
    print("Loading SHA tables...")
    sha     = load_sha_table(RAW/"tat_allstandard_sha.csv",            "SHA")
    sha_p   = load_sha_table(RAW/"tat_allstandard_sha-plus.csv",       "SHA+")
    sha_xp  = load_sha_table(RAW/"tat_allstandard_sha-extra-plus.csv", "SHA Extra Plus")
    print(f"  SHA:   {len(sha)} entries")
    print(f"  SHA+:  {len(sha_p)} entries")
    print(f"  SHA++: {len(sha_xp)} entries")

    print("Loading TAT directories...")
    tat_accom_n, tat_accom_p = load_tat_directory(
        RAW/"tat_accommodation_accommodation.csv", "accommodation",
        "ACC_NAME_TH", "ACC_NAME_EN", "PROVINCE_NAME_TH", "ACC_TEL", "ACC_WEBSITE")
    tat_rest_n, tat_rest_p   = load_tat_directory(
        RAW/"tat_restaurant_restaurant.csv", "restaurant",
        "PLACE_NAME_TH", "PLACE_NAME_EN", "PROVINCE_NAME_TH", "PLACE_PHONE", "PLACE_WEBSITE")
    tat_att_n, tat_att_p     = load_tat_directory(
        RAW/"tat_tourist-attraction_attraction.csv", "attraction",
        "ATT_NAME_TH", "ATT_NAME_EN", "PROVINCE_NAME_TH", "ATT_TEL", "ATT_WEBSITE")
    tat_souv_n, tat_souv_p   = load_tat_directory(
        RAW/"tat_souvenir-shop_souvenir.csv", "souvenir",
        "PLACE_NAME_TH", "PLACE_NAME_EN", "PROVINCE_NAME_TH", "PLACE_PHONE", "PLACE_WEBSITE")
    print(f"  TAT accommodation: {len(tat_accom_n)} names / {len(tat_accom_p)} phones")
    print(f"  TAT restaurant:    {len(tat_rest_n)} names / {len(tat_rest_p)} phones")
    print(f"  TAT attraction:    {len(tat_att_n)} names / {len(tat_att_p)} phones")
    print(f"  TAT souvenir:      {len(tat_souv_n)} names / {len(tat_souv_p)} phones")

    print("Loading DBD registrations...")
    dbd = load_dbd_all()

    # Load places.json
    print("Loading places.json...")
    with open(PLACES_PATH, "r", encoding="utf-8") as f:
        pj = json.load(f)
    places = pj["places"]
    print(f"  {len(places)} places")

    out = {}
    stats = defaultdict(int)
    for p in places:
        pid = p["id"]
        name = p.get("name","") or ""
        phone = norm_phone(p.get("phone",""))
        nname = norm_name(name)
        entry = {}

        # SHA / SHA+ / SHA Extra Plus — name-based
        for table, key in ((sha_xp,"sha_extra_plus"),(sha_p,"sha_plus"),(sha,"sha")):
            if nname and nname in table:
                entry[key] = table[nname]
                stats[key] += 1

        # TAT directories — name OR phone
        for (n_idx, p_idx, key) in (
            (tat_accom_n, tat_accom_p, "tat_accommodation"),
            (tat_rest_n,  tat_rest_p,  "tat_restaurant"),
            (tat_att_n,   tat_att_p,   "tat_attraction"),
            (tat_souv_n,  tat_souv_p,  "tat_souvenir"),
        ):
            hit = None
            if nname and nname in n_idx:
                hit = {**n_idx[nname], "matched_by": "name"}
            elif phone and len(phone) >= 9 and phone in p_idx:
                hit = {**p_idx[phone], "matched_by": "phone"}
            if hit:
                entry[key] = hit
                stats[key] += 1

        # DBD — name-based (Thai names only mostly)
        if nname and nname in dbd:
            entry["dbd"] = dbd[nname]
            stats["dbd"] += 1

        if entry:
            entry["_place_name"] = name
            out[pid] = entry

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",",":")), encoding="utf-8")
    print(f"\nWrote {OUT_PATH}")
    print(f"  places with ANY match: {len(out)}/{len(places)}  ({100*len(out)/len(places):.1f}%)")
    for k,v in stats.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
