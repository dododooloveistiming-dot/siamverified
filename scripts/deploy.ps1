# deploy.ps1 — push the current build to production and purge the edge cache.
#
# The site moved Vercel accounts on 2026-09-02 after the old one hit its
# free-tier ceiling (402 DEPLOYMENT_DISABLED). The new project has no GitHub
# connection, so `git push` no longer triggers a deploy — this script is the
# delivery path, and weekly_update.ps1 / monthly_rescrape.ps1 call it.
#
# It also purges Cloudflare, which is not optional: cache rules hold HTML at
# the edge for 1 day (7 days for /place/ pages), so a data refresh would
# otherwise sit invisible behind a stale cache long after it deployed.
#
# SETUP — put these in <repo>/.env.local (gitignored, never committed):
#   VERCEL_TOKEN=...            https://vercel.com/account/tokens
#   CLOUDFLARE_API_TOKEN=...    needs Zone:Cache Purge on verifiedthai.com
#   CLOUDFLARE_ZONE_ID=f2606936ec119d85ce793e261ed0fbbb
#   TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID   (already there — see notify.ps1)
#
# Usage:
#   powershell -File scripts\deploy.ps1            # standalone: reports to Telegram
#   powershell -File scripts\deploy.ps1 -Quiet     # called by a scheduler, which reports

param([switch]$Quiet)

$ErrorActionPreference = "Continue"
$ROOT = "C:\Users\yunmin\Desktop\siamverified"
$LOG = "C:\dbd-scraper\deploy.log"

. "$ROOT\scripts\notify.ps1"

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Write-Host $line
  Add-Content -Path $LOG -Value $line -Encoding UTF8
}

$conf = Read-EnvLocal -Root $ROOT
$problems = @()
$notes = @()

Log "============================================================"
Log "DEPLOY START"

if (-not $conf["VERCEL_TOKEN"]) {
  Log "! VERCEL_TOKEN missing from .env.local - cannot deploy. See header."
  $problems += "VERCEL_TOKEN missing from .env.local - nothing was deployed"
  if (-not $Quiet) {
    $notified = Send-RunSummary -Title "Deploy" -Problems $problems -LogPath $LOG -Conf $conf -Root $ROOT
    Log $(if ($notified) { "OK Telegram alert sent." } else { "X Telegram alert NOT sent - check TELEGRAM_* in .env.local." })
  }
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
  $prodUrl = ($out | Select-String -Pattern 'https://\S+\.vercel\.app' -AllMatches |
              Select-Object -Last 1).Matches.Value
} catch {
  Log "  DEPLOY ERROR: $_"
  $deployOk = $false
} finally {
  Pop-Location
  Remove-Item Env:\VERCEL_TOKEN -ErrorAction SilentlyContinue
}

if (-not $deployOk) {
  Log "! Deploy failed - skipping cache purge so the last good version keeps serving."
  $problems += "vercel deploy failed - the live site is unchanged (last good build still serving)"
  if (-not $Quiet) {
    $notified = Send-RunSummary -Title "Deploy" -Problems $problems -LogPath $LOG -Conf $conf -Root $ROOT
    Log $(if ($notified) { "OK Telegram alert sent." } else { "X Telegram alert NOT sent - check TELEGRAM_* in .env.local." })
  }
  exit 1
}
Log "OK Deployed."
if ($prodUrl) { $notes += "build: $prodUrl" }

# Step 2: purge Cloudflare so the refreshed data is actually visible
$cfToken = $conf["CLOUDFLARE_API_TOKEN"]
$cfZone  = $conf["CLOUDFLARE_ZONE_ID"]
if (-not $cfToken -or -not $cfZone) {
  Log "! CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID missing - edge cache NOT purged."
  Log "  New data stays hidden behind the edge cache for up to 7 days. See header."
  $problems += "deployed, but CLOUDFLARE_API_TOKEN/ZONE_ID missing - the edge cache was not purged, so the new build stays hidden for up to 7 days"
} else {
  Log "Step 2: purge Cloudflare cache"
  try {
    $resp = Invoke-RestMethod -Method Post -TimeoutSec 60 `
      -Uri "https://api.cloudflare.com/client/v4/zones/$cfZone/purge_cache" `
      -Headers @{ Authorization = "Bearer $cfToken" } `
      -ContentType "application/json" -Body '{"purge_everything":true}'
    if ($resp.success) {
      Log "OK Cache purged."
    } else {
      $err = ($resp.errors | ConvertTo-Json -Compress)
      Log "! Purge rejected: $err"
      $problems += "deployed, but the Cloudflare purge was rejected ($err) - the new build stays hidden behind the edge cache"
    }
  } catch {
    Log "  PURGE ERROR: $_"
    $problems += "deployed, but the Cloudflare purge threw ($_) - the new build stays hidden behind the edge cache"
  }
}

Log "DEPLOY DONE"

# When a scheduler invoked this, it owns the one-message-per-run rule.
if (-not $Quiet) {
  $notified = Send-RunSummary -Title "Deploy" -Problems $problems -Notes $notes -LogPath $LOG -Conf $conf -Root $ROOT
  Log $(if ($notified) { "OK Telegram summary sent." } else { "X Telegram summary NOT sent - check TELEGRAM_* in .env.local." })
}
if ($problems.Count -gt 0) { exit 2 }
exit 0
