"""
Fetch SHA+ and DBD bulk datasets from data.go.th via CKAN API.
Outputs raw CSVs to public/data/_raw/gov/ for downstream matching.
"""
import json, os, sys, time, re
from pathlib import Path
from urllib.parse import urlparse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "data" / "_raw" / "gov"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CKAN_DATAGOV = "https://data.go.th/api/3/action"
CKAN_TAT = "https://datacatalog.tat.or.th/api/3/action"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

# TAT national master datasets (preferred — superset of provincial fragments)
TAT_DATASETS = [
    "sha",           # SHA + SHA+ + SHA Extra Plus national lists
    "allstandard",   # All TAT standards (TTA, STGs STAR, CF Hotels, etc.)
    "accommodation", # Accommodation registry
    "restaurant",    # Restaurants
    "tourist-attraction",  # Attractions
    "souvenir-shop", # Souvenir shops
]

# data.go.th province-level (skip — we have TAT master now)
SHA_DATASETS = []

DBD_DATASETS = [
    "dataset_11_0121",   # New legal entity registrations (monthly)
]

def ckan_get(action: str, params: dict, base: str = CKAN_DATAGOV) -> dict:
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{base}/{action}?{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def safe_filename(s: str) -> str:
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s)[:120]
    return s or "file"

def fetch_dataset(dataset_id: str, label: str, base: str = CKAN_DATAGOV) -> list[dict]:
    """Return list of {dataset_id, name, format, url, downloaded_path}."""
    try:
        pkg = ckan_get("package_show", {"id": dataset_id}, base=base)
    except Exception as e:
        print(f"  FAIL package_show {dataset_id}: {e}")
        return []
    if not pkg.get("success"):
        print(f"  FAIL package_show {dataset_id}: not success")
        return []
    result = pkg["result"]
    title = result.get("title") or result.get("name") or dataset_id
    print(f"  [{dataset_id}] {title}  ({result.get('num_resources','?')} resources)")
    out = []
    for res in result.get("resources", []):
        fmt = (res.get("format") or "").upper()
        url = res.get("url") or ""
        if not url:
            continue
        # Skip non-tabular formats
        if fmt not in ("CSV", "XLS", "XLSX", "JSON"):
            continue
        # Build local filename
        url_path = urlparse(url).path
        base = os.path.basename(url_path) or f"{res.get('name','file')}.{fmt.lower()}"
        local_name = safe_filename(f"{label}_{dataset_id}_{base}")
        local_path = OUT_DIR / local_name
        # Skip if already downloaded recently
        if local_path.exists() and local_path.stat().st_size > 0:
            print(f"    skip (cached): {local_name}")
            out.append({
                "dataset_id": dataset_id, "title": title, "format": fmt,
                "url": url, "local_path": str(local_path),
                "resource_name": res.get("name", ""),
                "last_modified": res.get("last_modified") or res.get("created", ""),
            })
            continue
        # Download
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            local_path.write_bytes(data)
            print(f"    saved: {local_name}  ({len(data)//1024} KB)")
            out.append({
                "dataset_id": dataset_id, "title": title, "format": fmt,
                "url": url, "local_path": str(local_path),
                "resource_name": res.get("name", ""),
                "last_modified": res.get("last_modified") or res.get("created", ""),
            })
        except Exception as e:
            print(f"    FAIL download {url}: {e}")
        time.sleep(0.5)
    return out

def main():
    manifest = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "tat": [], "sha": [], "dbd": []}
    print("=== TAT national datasets (datacatalog.tat.or.th) ===")
    for d in TAT_DATASETS:
        manifest["tat"].extend(fetch_dataset(d, "tat", base=CKAN_TAT))
    print("=== SHA+ datasets (data.go.th — provincial) ===")
    for d in SHA_DATASETS:
        manifest["sha"].extend(fetch_dataset(d, "sha"))
    print("=== DBD datasets ===")
    for d in DBD_DATASETS:
        manifest["dbd"].extend(fetch_dataset(d, "dbd"))
    manifest_path = OUT_DIR / "_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nManifest: {manifest_path}")
    print(f"Total TAT resources: {len(manifest['tat'])}")
    print(f"Total SHA resources: {len(manifest['sha'])}")
    print(f"Total DBD resources: {len(manifest['dbd'])}")

if __name__ == "__main__":
    main()
