# deploy.ps1 — push the current build to production and purge the edge cache.
#
# The site moved Vercel accounts on 2026-09-02 after the old one hit its
# free-tier ceiling (402 DEPLOYMENT_DISABLED). The new project has no GitHub
# connection, so `git push` no longer triggers a deploy — weekly_update.ps1
# and monthly_rescrape.ps1 call this script instead.
#
# It also purges Cloudflare, which is not optional: cache rules hold HTML at
# the edge for 1 day (7 days for /place/ pages), so a data refresh would
# otherwise sit invisible behind a stale cache long after it deployed.
#
# SETUP — put these in <repo>/.env.local (gitignored, never committed):
#   VERCEL_TOKEN=...            https://vercel.com/account/tokens
#   CLOUDFLARE_API_TOKEN=...    needs Zone:Cache Purge on verifiedthai.com
#   CLOUDFLARE_ZONE_ID=f2606936ec119d85ce793e261ed0fbbb
#
# Usage:  powershell -File scripts\deploy.ps1

$ErrorActionPreference = "Continue"
$ROOT = "C:\Users\yunmin\Desktop\siamverified"
$LOG = "C:\dbd-scraper\deploy.log"

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Write-Host $line
  Add-Content -Path $LOG -Value $line -Encoding UTF8
}

# Read .env.local without exporting it into the parent shell's environment.
$envPath = Join-Path $ROOT ".env.local"
$conf = @{}
if (Test-Path $envPath) {
  foreach ($line in (Get-Content $envPath -Encoding UTF8)) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $conf[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
} else {
  Log "! .env.local not found at $envPath"
}

Log "============================================================"
Log "DEPLOY START"

if (-not $conf.ContainsKey("VERCEL_TOKEN") -or -not $conf["VERCEL_TOKEN"]) {
  Log "! VERCEL_TOKEN missing from .env.local — cannot deploy. See header."
  exit 1
}

# Step 1: build + deploy to production
Log "Step 1: vercel deploy --prod"
$env:VERCEL_TOKEN = $conf["VERCEL_TOKEN"]
Push-Location $ROOT
try {
  $out = & npx vercel deploy --prod --yes --archive=tgz 2>&1
  foreach ($line in $out) { Log "  $line" }
  $deployOk = $LASTEXITCODE -eq 0
} catch {
  Log "  DEPLOY ERROR: $_"
  $deployOk = $false
} finally {
  Pop-Location
  Remove-Item Env:\VERCEL_TOKEN -ErrorAction SilentlyContinue
}

if (-not $deployOk) {
  Log "! Deploy failed — skipping cache purge so the last good version keeps serving."
  exit 1
}
Log "OK Deployed."

# Step 2: purge Cloudflare so the refreshed data is actually visible
$cfToken = $conf["CLOUDFLARE_API_TOKEN"]
$cfZone  = $conf["CLOUDFLARE_ZONE_ID"]
if (-not $cfToken -or -not $cfZone) {
  Log "! CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID missing — edge cache NOT purged."
  Log "  New data stays hidden behind the edge cache for up to 7 days. See header."
  exit 0
}

Log "Step 2: purge Cloudflare cache"
try {
  $resp = Invoke-RestMethod -Method Post `
    -Uri "https://api.cloudflare.com/client/v4/zones/$cfZone/purge_cache" `
    -Headers @{ Authorization = "Bearer $cfToken"; "Content-Type" = "application/json" } `
    -Body '{"purge_everything":true}'
  if ($resp.success) { Log "OK Cache purged." }
  else { Log "! Purge rejected: $($resp.errors | ConvertTo-Json -Compress)" }
} catch {
  Log "  PURGE ERROR: $_"
}

Log "DEPLOY DONE"
