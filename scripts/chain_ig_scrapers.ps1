# chain_ig_scrapers.ps1
#
# 1. Waits for the places IG scraper (PID arg) to exit.
# 2. Then launches the clinic IG scraper as a detached Start-Process so it
#    survives the controlling session too.
# 3. Logs the whole chain to logs/ig_chain.log so you can tail it later.
#
# Usage:  powershell -File scripts\chain_ig_scrapers.ps1 -PlacesPid <PID>

param(
  [int]$PlacesPid = 0
)

$ErrorActionPreference = "Continue"
$ROOT   = "C:\Users\yn\Desktop\Work\0_main\deliverable\deliverable\siamverified-portable"
$PY     = "C:\Users\yn\AppData\Local\Programs\Python\Python312\python.exe"
$LogDir = Join-Path $ROOT "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Chain  = Join-Path $LogDir "ig_chain.log"

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Write-Host $line
  Add-Content -Path $Chain -Value $line -Encoding UTF8
}

Log "===================================================================="
Log "IG chain start  PlacesPid=$PlacesPid"
Log "===================================================================="

# Step 1: wait for places scraper to exit
if ($PlacesPid -gt 0) {
  $tries = 0
  while ($true) {
    $proc = Get-Process -Id $PlacesPid -ErrorAction SilentlyContinue
    if (-not $proc) {
      Log "places scraper PID $PlacesPid exited"
      break
    }
    $tries++
    if (($tries % 30) -eq 1) {
      # log every ~15 minutes (30 polls * 30s)
      $cache = Join-Path $ROOT "public\data\_raw\ig_cache.json"
      if (Test-Path $cache) {
        $sz = (Get-Item $cache).Length
        Log "still waiting...  cache size: $sz bytes"
      } else {
        Log "still waiting..."
      }
    }
    Start-Sleep -Seconds 30
  }
} else {
  Log "no PlacesPid given - skipping wait, going straight to clinic scraper"
}

# Brief settling time so file handles release cleanly
Start-Sleep -Seconds 10

# Step 2: launch clinic scraper, detached
$ClinicStdout = Join-Path $LogDir "ig_clinics_stdout.log"
$ClinicStderr = Join-Path $LogDir "ig_clinics_stderr.log"
Set-Content -Path $ClinicStdout -Value "" -Encoding UTF8
Set-Content -Path $ClinicStderr -Value "" -Encoding UTF8
$env:PYTHONIOENCODING = "utf-8"

Log "launching clinic IG scraper..."
$proc = Start-Process $PY `
  -ArgumentList "scripts\scrape_instagram_clinics.py" `
  -WorkingDirectory $ROOT `
  -WindowStyle Hidden `
  -RedirectStandardOutput $ClinicStdout `
  -RedirectStandardError $ClinicStderr `
  -PassThru
Log "clinic scraper launched  PID=$($proc.Id)"
Log "  stdout: $ClinicStdout"
Log "  stderr: $ClinicStderr"
Log "  scrape log: $ROOT\public\data\_raw\ig_scrape_clinics.log"
Log "chain done - clinic scraper now running on its own"
