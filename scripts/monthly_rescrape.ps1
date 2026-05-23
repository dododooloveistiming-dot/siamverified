# monthly_rescrape.ps1 — full re-scrape ONE niche per month (rotation).
#
# Niche rotation (month % 7):
#   Jan/Aug:    muaythai
#   Feb/Sep:    pilates
#   Mar/Oct:    wellness
#   Apr/Nov:    cooking
#   May/Dec:    diving
#   Jun:        spa
#   Jul:        coworking
#
# WHAT IT DOES:
#   1. Determines niche from current month
#   2. Starts wongnai discovery (Google Maps grid search)
#   3. Starts 3 broad scrapers (Naver / Pantip / Reddit)
#   4. Starts pipeline_<niche>.py orchestrator (waits discovery →
#      builds input → launches 4 enrichers → merges)
#   5. Polls pipeline.log for "PIPELINE DONE" marker (max 14h)
#   6. Re-runs enrichment on the updated master
#   7. Rebuilds places.json + by-niche slices
#   8. Git commit + push → Vercel auto-deploys
#
# RUNTIME: ~6-12 hours per niche (depends on discovery results)
# SCHEDULE: 1st of each month, 3am via Task Scheduler
# RESUMABLE: if computer turns off mid-run, scraper state files preserve
#            progress. Re-running manually picks up where it left off.

$ErrorActionPreference = "Continue"
$ROOT = "C:\Users\yunmin\Desktop\siamverified"
$DBD = "C:\dbd-scraper"
$WONGNAI_WD = "C:\Users\yunmin\Desktop\wongnai_scraper"
$PY = "$WONGNAI_WD\.venv\Scripts\python.exe"
$NODE = "C:\Program Files\nodejs\node.exe"
$GIT = "C:\Program Files\Git\cmd\git.exe"

# Niche rotation
$NICHES = @("muaythai", "pilates", "wellness", "cooking", "diving", "spa", "coworking")
$monthIdx = ((Get-Date).Month - 1) % $NICHES.Count
$NICHE = $NICHES[$monthIdx]

$LOG = "$DBD\monthly_rescrape.log"

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$NICHE] $msg"
  Write-Host $line
  Add-Content -Path $LOG -Value $line -Encoding UTF8
}

Log "============================================================"
Log "MONTHLY RESCRAPE START — niche of the month: $NICHE"
Log "============================================================"

# Setup folders
$nicheDir = "$DBD\$NICHE"
$logsDir = "$nicheDir\logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

# Step 1: wongnai discovery
Log "Step 1: launching wongnai discovery for $NICHE"
$dProc = Start-Process $PY `
  -ArgumentList "-m", "hair_transplant", "--job", $NICHE `
  -WorkingDirectory $WONGNAI_WD `
  -RedirectStandardOutput "$logsDir\discovery_stdout.log" `
  -RedirectStandardError "$logsDir\discovery_stderr.log" `
  -NoNewWindow -PassThru
Log "  wongnai PID: $($dProc.Id)"

# Step 2: broad scrapers
Log "Step 2: launching Naver / Pantip / Reddit broad scrapers"
foreach ($src in @("naver", "pantip", "reddit")) {
  $script = "$nicheDir\scrape_${src}_${NICHE}.py"
  if (-not (Test-Path $script)) {
    Log "  SKIP $src — script missing: $script"
    continue
  }
  $args = @($script)
  if ($src -eq "naver" -or $src -eq "pantip") { $args += @("--max-pages", "10", "--rate-sec", "2") }
  if ($src -eq "reddit") { $args += @("--limit-per-query", "25", "--rate-sec", "2.5") }
  $p = Start-Process $PY -ArgumentList $args `
    -RedirectStandardOutput "$logsDir\${src}_stdout.log" `
    -RedirectStandardError "$logsDir\${src}_stderr.log" `
    -NoNewWindow -PassThru
  Log "  $src PID: $($p.Id)"
}

Start-Sleep -Seconds 60

# Step 3: pipeline orchestrator
Log "Step 3: launching pipeline_$NICHE.py orchestrator"
$pipelineScript = "$DBD\pipeline_$NICHE.py"
if (-not (Test-Path $pipelineScript)) {
  Log "ERROR: $pipelineScript not found — aborting"
  exit 1
}
$pipProc = Start-Process $PY -ArgumentList $pipelineScript `
  -RedirectStandardOutput "$logsDir\pipeline_stdout.log" `
  -RedirectStandardError "$logsDir\pipeline_stderr.log" `
  -NoNewWindow -PassThru
Log "  pipeline PID: $($pipProc.Id)"

# Step 4: poll for completion (max 14h)
$pipelineLog = "$logsDir\pipeline.log"
$deadline = (Get-Date).AddHours(14)
$marker = "PIPELINE DONE"
Log "Step 4: polling $pipelineLog for '$marker' (max 14h)"

while ((Get-Date) -lt $deadline) {
  if (Test-Path $pipelineLog) {
    if ((Get-Content $pipelineLog -Raw -ErrorAction SilentlyContinue) -match $marker) {
      Log "  ✓ '$marker' found"
      break
    }
  }
  Start-Sleep -Seconds 300  # 5 min poll
}

if (-not ((Test-Path $pipelineLog) -and ((Get-Content $pipelineLog -Raw -ErrorAction SilentlyContinue) -match $marker))) {
  Log "  ⏱ Hit 14h cap. Continuing with whatever was produced."
}

# Step 5: enrichment
Log "Step 5: re-running enrichment on $NICHE master"
$master = "$DBD\$NICHE\thai${NICHE}_master.csv"
# Niche-specific master filename quirks
if ($NICHE -eq "pilates") { $master = "$DBD\pilates\thaipilatesyoga_master.csv" }
if (-not (Test-Path $master)) {
  Log "  WARNING: master CSV not found at $master — skipping enrichment"
} else {
  foreach ($enricher in @("enrich_klook_deeplinks.py", "enrich_pricing.py", "enrich_beginner_flag.py")) {
    Log "  running $enricher"
    & $PY "$DBD\$enricher" --master $master --in-place 2>&1 | ForEach-Object { Log "    $_" }
  }
}

# Step 6: rebuild places.json
Log "Step 6: rebuilding places.json"
Set-Location $ROOT
& $NODE scripts/build-data.mjs 2>&1 | ForEach-Object { Log "  $_" }

# Step 7: git commit + push
Log "Step 7: git commit + push"
Set-Location $ROOT
& $GIT add public/data/ 2>&1 | Out-Null

$status = & $GIT status --porcelain public/data/
if (-not $status) {
  Log "  No data changes — skipping commit"
  Log "DONE (no-op)"
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd"
$commitMsg = "Monthly $NICHE rescrape ($timestamp)"
& $GIT commit -m $commitMsg 2>&1 | ForEach-Object { Log "  $_" }

$pushResult = & $GIT push origin main 2>&1
foreach ($line in $pushResult) { Log "  $line" }

if ($LASTEXITCODE -eq 0) {
  Log "✓ Pushed. Vercel will auto-deploy."
} else {
  Log "✗ Push failed (exit $LASTEXITCODE)"
}

Log "MONTHLY RESCRAPE DONE for $NICHE"
Log ""
