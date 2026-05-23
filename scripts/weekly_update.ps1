# weekly_update.ps1 — re-enrich + rebuild data + git push.
#
# Runs every Sunday 3am via Windows Task Scheduler.
# Vercel auto-deploys on push.
#
# WHAT IT DOES:
#   1. Re-runs all 4 enrichment scripts on every master CSV that exists
#      (Klook/Viator/etc deeplinks, pricing, beginner flag — pricing/beginner
#      need reviews CSV sidecar; safe to skip if not present)
#   2. Regenerates public/data/places.json + by-niche/*.json
#   3. git add public/data/, commits with timestamped message, pushes
#   4. Vercel picks up the push and rebuilds
#
# WHAT IT DOES NOT DO:
#   - Does NOT re-scrape (that's a 24-30h job; do manually monthly or via
#     pipeline_master_v2.py on demand)
#   - Does NOT bump dependencies / rebuild node_modules
#
# Output log: C:\dbd-scraper\weekly_update.log (rolling)

$ErrorActionPreference = "Continue"
$ROOT = "C:\Users\yunmin\Desktop\siamverified"
$DBD = "C:\dbd-scraper"
$PY = "C:\Users\yunmin\Desktop\wongnai_scraper\.venv\Scripts\python.exe"
$NODE = "C:\Program Files\nodejs\node.exe"
$GIT = "C:\Program Files\Git\cmd\git.exe"
$LOG = "$DBD\weekly_update.log"

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Write-Host $line
  Add-Content -Path $LOG -Value $line -Encoding UTF8
}

Log "============================================================"
Log "WEEKLY UPDATE START"
Log "============================================================"

# Step 1: Re-enrich all masters (idempotent — safe to re-run anytime)
Log "Step 1: re-running enrichment on all 7-9 masters"
try {
  & $PY "$DBD\_run_enrichment_all.py" 2>&1 | ForEach-Object { Log "  $_" }
} catch {
  Log "  ENRICHMENT ERROR: $_"
}

# Step 2: rebuild places.json from CSVs
Log "Step 2: rebuilding places.json"
Set-Location $ROOT
try {
  & $NODE scripts/build-data.mjs 2>&1 | ForEach-Object { Log "  $_" }
} catch {
  Log "  BUILD-DATA ERROR: $_"
  exit 1
}

# Step 3: git add + commit + push (only if there are changes)
Log "Step 3: git commit + push"
Set-Location $ROOT
& $GIT add public/data/ 2>&1 | Out-Null

$status = & $GIT status --porcelain public/data/
if (-not $status) {
  Log "  No data changes — skipping commit"
  Log "DONE (no-op)"
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd"
$commitMsg = "Weekly data refresh $timestamp"
& $GIT commit -m $commitMsg 2>&1 | ForEach-Object { Log "  $_" }

$pushResult = & $GIT push origin main 2>&1
foreach ($line in $pushResult) { Log "  $line" }

if ($LASTEXITCODE -eq 0) {
  Log "✓ Pushed to origin. Vercel will auto-deploy."
} else {
  Log "✗ Push failed (exit $LASTEXITCODE). Check credentials."
}

Log "DONE"
Log ""
