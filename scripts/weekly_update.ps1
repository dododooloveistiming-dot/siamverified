# weekly_update.ps1 — re-enrich + rebuild data + git push.
#
# Runs every Sunday 3am via Windows Task Scheduler.
# Deploys via scripts/deploy.ps1 (the Vercel project has no Git connection).
#
# WHAT IT DOES:
#   1. Re-runs all 4 enrichment scripts on every master CSV that exists
#      (Klook/Viator/etc deeplinks, pricing, beginner flag — pricing/beginner
#      need reviews CSV sidecar; safe to skip if not present)
#   2. Regenerates public/data/places.json + by-niche/*.json
#   3. git add public/data/, commits with timestamped message, pushes
#   4. scripts/deploy.ps1 builds, deploys, and purges the Cloudflare cache
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

. "$ROOT\scripts\notify.ps1"
$conf = Read-EnvLocal -Root $ROOT
# Collected across the run, then sent as one message. See notify.ps1 for why.
$problems = @()
$notes = @()

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
# Handle index behind /[lang]/verify/ — derived from places.json, so it
# has to be rebuilt whenever that is.
& $NODE scripts/build-handles.mjs 2>&1 | ForEach-Object { Log "  $_" }
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
  $null = Send-RunSummary -Title "Weekly refresh" -Notes @("no data changes - nothing to deploy") -LogPath $LOG -Conf $conf -Root $ROOT
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd"
$commitMsg = "Weekly data refresh $timestamp"
& $GIT commit -m $commitMsg 2>&1 | ForEach-Object { Log "  $_" }

$pushResult = & $GIT push origin main 2>&1
foreach ($line in $pushResult) { Log "  $line" }

if ($LASTEXITCODE -eq 0) {
  Log "OK Pushed to origin."
} else {
  Log "X PUSH FAILED (exit $LASTEXITCODE) - the GitHub backup is now behind."
  Log "  Check the credential: the repo is dododooloveistiming-dot/siamverified."
  Log "  Deploying anyway - the push is a backup, not the delivery path."
  $problems += "git push failed - the GitHub backup is behind. Repo is dododooloveistiming-dot/siamverified; the credential must be the presidentoko account."
}

# Always deploy. The new Vercel project has no GitHub connection (account
# move, 2026-09-02), so nothing else ships this build. deploy.ps1 also purges
# the Cloudflare edge cache, without which the refresh stays invisible for up
# to 7 days. -Quiet because this script sends the single run summary.
Log "Step 4: deploy + purge edge cache"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$ROOT\scripts\deploy.ps1" -Quiet 2>&1 | ForEach-Object { Log "  $_" }
if ($LASTEXITCODE -ne 0) {
  Log "X DEPLOY step reported exit $LASTEXITCODE"
  $problems += "deploy.ps1 exited $LASTEXITCODE - see deploy.log. The site may still be serving the previous build."
}

Log "DONE"
$notified = Send-RunSummary -Title "Weekly refresh" -Problems $problems -Notes $notes -LogPath $LOG -Conf $conf -Root $ROOT
Log $(if ($notified) { "OK Telegram summary sent." } else { "X Telegram summary NOT sent - check TELEGRAM_* in .env.local." })
Log ""
