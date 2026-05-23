# register_weekly_task.ps1 — registers Windows Task Scheduler entry.
# Run ONCE as admin (or right-click → Run with PowerShell).
#
# Schedule: every Sunday 3:00 AM, wakes computer if sleeping.
# If missed (computer was off), runs as soon as computer wakes.

$taskName = "SiamVerifiedWeeklyUpdate"
$scriptPath = "C:\Users\yunmin\Desktop\siamverified\scripts\weekly_update.ps1"

# Action: run PowerShell with the update script
$action = New-ScheduledTaskAction `
  -Execute "PowerShell.exe" `
  -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$scriptPath`""

# Trigger: weekly, Sunday at 03:00
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "3:00 AM"

# Settings: wake to run, run when missed, allow on battery
$settings = New-ScheduledTaskSettingsSet `
  -WakeToRun `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# Principal: run as current user with normal privileges
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

$task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Refresh Siam Verified data + push to GitHub (auto-deploys to Vercel)"

# Replace existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -InputObject $task | Out-Null

Write-Host "✓ Registered task: $taskName"
Write-Host "  Schedule: every Sunday 3:00 AM"
Write-Host "  Wake-to-run: enabled (laptop wakes from sleep)"
Write-Host "  Catch-up: enabled (runs after wake if missed)"
Write-Host ""
Write-Host "To verify:"
Write-Host "  Get-ScheduledTask -TaskName $taskName"
Write-Host ""
Write-Host "To run manually now:"
Write-Host "  Start-ScheduledTask -TaskName $taskName"
Write-Host ""
Write-Host "To remove:"
Write-Host "  Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
