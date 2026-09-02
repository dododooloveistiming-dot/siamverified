# notify.ps1 — shared config + Telegram alerting for the scheduled scripts.
#
# Dot-source it:  . "$ROOT\scripts\notify.ps1"
#
# Why this exists: between 2026-07-05 and 2026-09-03 every scheduled run
# failed to push, logged one line about it, and carried on. The GitHub backup
# fell 21 commits behind and — because deploys were push-triggered then — no
# data refresh reached the site for two months. Nothing was watching the log.
#
# So each script now sends exactly one Telegram message per run: a failure
# alert, or a one-line heartbeat on success. The heartbeat is the point as
# much as the alert — a run that never starts sends nothing at all, and only
# an expected-but-missing message makes that visible.
#
# Credentials come from <repo>/.env.local (gitignored):
#   TELEGRAM_BOT_TOKEN   from @BotFather
#   TELEGRAM_CHAT_ID     your user or group chat id
# Both already exist there for the inquiry notifications in lib/notify.ts.

# Windows PowerShell 5.1 negotiates TLS 1.0 by default, which both
# api.telegram.org and api.cloudflare.com reject outright.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Read .env.local into a hashtable without leaking it into the environment.
function Read-EnvLocal {
  param([string]$Root)
  $conf = @{}
  $path = Join-Path $Root ".env.local"
  if (-not (Test-Path $path)) { return $conf }
  foreach ($line in (Get-Content $path -Encoding UTF8)) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $conf[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $conf
}

function ConvertTo-TelegramHtml {
  param([string]$Text)
  # Telegram's HTML parse mode only needs these three escaped.
  return $Text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
}

# Best-effort by design: a broken notifier must never fail a data refresh or
# a deploy. Returns $true if Telegram accepted the message.
function Send-Telegram {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [hashtable]$Conf,
    [string]$Root = "C:\Users\yunmin\Desktop\siamverified",
    [switch]$Silent          # delivered without a notification sound
  )
  if (-not $Conf) { $Conf = Read-EnvLocal -Root $Root }
  $token = $Conf["TELEGRAM_BOT_TOKEN"]
  $chat  = $Conf["TELEGRAM_CHAT_ID"]
  if (-not $token -or -not $chat) {
    Write-Host "[notify] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set in .env.local - skipping"
    return $false
  }
  try {
    $body = @{
      chat_id                  = $chat
      text                     = $Text
      parse_mode               = "HTML"
      disable_web_page_preview = $true
      disable_notification     = [bool]$Silent
    } | ConvertTo-Json -Compress
    $resp = Invoke-RestMethod -Method Post -TimeoutSec 30 `
      -Uri "https://api.telegram.org/bot$token/sendMessage" `
      -ContentType "application/json; charset=utf-8" `
      -Body ([Text.Encoding]::UTF8.GetBytes($body))
    return [bool]$resp.ok
  } catch {
    Write-Host "[notify] telegram send failed: $_"
    return $false
  }
}

# One message per run. $Problems empty => quiet heartbeat; otherwise an alert
# listing what broke, so the log only has to be opened when it says so.
# Returns $true if Telegram accepted it -- callers log that, because an
# alerter that fails quietly reproduces the very outage this guards against.
function Send-RunSummary {
  param(
    [Parameter(Mandatory = $true)][string]$Title,
    [string[]]$Problems = @(),
    [string[]]$Notes = @(),
    [string]$LogPath,
    [hashtable]$Conf,
    [string]$Root = "C:\Users\yunmin\Desktop\siamverified"
  )
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
  if ($Problems.Count -gt 0) {
    $lines = @("&#128308; <b>$(ConvertTo-TelegramHtml $Title) FAILED</b>", "$stamp", "")
    foreach ($p in $Problems) { $lines += "&#8226; $(ConvertTo-TelegramHtml $p)" }
    if ($Notes.Count -gt 0) { $lines += "" ; foreach ($n in $Notes) { $lines += "<i>$(ConvertTo-TelegramHtml $n)</i>" } }
    if ($LogPath) { $lines += ""; $lines += "log: <code>$(ConvertTo-TelegramHtml $LogPath)</code>" }
    return (Send-Telegram -Text ($lines -join "`n") -Conf $Conf -Root $Root)
  } else {
    $lines = @("&#9989; <b>$(ConvertTo-TelegramHtml $Title)</b> ok - $stamp")
    foreach ($n in $Notes) { $lines += ConvertTo-TelegramHtml $n }
    # Silent: success is a heartbeat, not something to interrupt for.
    return (Send-Telegram -Text ($lines -join "`n") -Conf $Conf -Root $Root -Silent)
  }
}
