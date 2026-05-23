# register_monthly_task.ps1 — register the monthly rescrape task.
# Run ONCE.
#
# Schedule: 1st of every month at 3:00 AM
# Niche rotation handled inside monthly_rescrape.ps1 (one niche per month)

$taskName = "SiamVerifiedMonthlyRescrape"
$scriptPath = "C:\Users\yunmin\Desktop\siamverified\scripts\monthly_rescrape.ps1"

$action = New-ScheduledTaskAction `
  -Execute "PowerShell.exe" `
  -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$scriptPath`""

# Monthly: 1st of every month at 3am.
# (PowerShell's built-in Monthly trigger via cmdlet is limited; use COM.)
$trigger = New-CimInstance -CimClass (Get-CimClass -ClassName MSFT_TaskMonthlyTrigger -Namespace Root/Microsoft/Windows/TaskScheduler) -Property @{
  StartBoundary = "$(Get-Date -Format 'yyyy-MM-01T03:00:00')"
  Enabled       = $true
  DaysOfMonth   = 1
  MonthsOfYear  = 4095  # all 12 months (bitmask 2^0 + 2^1 + ... + 2^11)
} -ClientOnly

$settings = New-ScheduledTaskSettingsSet `
  -WakeToRun `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 16)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

$task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
  -Description "Monthly full re-scrape of one Siam Verified niche (rotation). Pushes to GitHub on completion."

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -InputObject $task | Out-Null

Write-Host "✓ Registered: $taskName"
Write-Host "  Schedule: 1st of every month, 3:00 AM"
Write-Host "  Wake-to-run: enabled"
Write-Host "  Catch-up if missed: enabled"
Write-Host "  Time limit: 16 hours per run"
Write-Host ""
Write-Host "Niche rotation (by month):"
Write-Host "  Jan/Aug → muaythai"
Write-Host "  Feb/Sep → pilates"
Write-Host "  Mar/Oct → wellness"
Write-Host "  Apr/Nov → cooking"
Write-Host "  May/Dec → diving"
Write-Host "  Jun      → spa"
Write-Host "  Jul      → coworking"
Write-Host ""
Write-Host "Verify:        Get-ScheduledTask -TaskName $taskName"
Write-Host "Run manually:  Start-ScheduledTask -TaskName $taskName"
Write-Host "Remove:        Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
