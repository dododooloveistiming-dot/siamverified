# register_monthly_task.ps1 — register the monthly rescrape task via schtasks XML.
#
# Schedule: 1st of every month at 3:00 AM (all 12 months)
# Niche rotation handled inside monthly_rescrape.ps1 (one niche per month)

$taskName = "SiamVerifiedMonthlyRescrape"
$scriptPath = "C:\Users\yunmin\Desktop\siamverified\scripts\monthly_rescrape.ps1"
$xmlPath = "$env:TEMP\siamverified_monthly_task.xml"

# Build XML for monthly trigger (1st of every month at 3am)
$startTime = "$(Get-Date -Format 'yyyy-MM-01T03:00:00')"
$userId = "$env:USERDOMAIN\$env:USERNAME"

$xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Monthly full re-scrape of one Siam Verified niche (rotation). Pushes to GitHub on completion.</Description>
    <URI>\$taskName</URI>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>$startTime</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByMonth>
        <DaysOfMonth>
          <Day>1</Day>
        </DaysOfMonth>
        <Months>
          <January /><February /><March /><April /><May /><June />
          <July /><August /><September /><October /><November /><December />
        </Months>
      </ScheduleByMonth>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$userId</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>true</WakeToRun>
    <ExecutionTimeLimit>PT16H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>PowerShell.exe</Command>
      <Arguments>-ExecutionPolicy Bypass -NoProfile -File "$scriptPath"</Arguments>
    </Exec>
  </Actions>
</Task>
"@

# UTF-16 (with BOM) is required by schtasks for XML import
$xml | Out-File -FilePath $xmlPath -Encoding Unicode -Force

# Remove existing, then register
schtasks /Delete /TN $taskName /F 2>&1 | Out-Null
$result = schtasks /Create /TN $taskName /XML $xmlPath /F 2>&1
Write-Host $result

Remove-Item $xmlPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Niche rotation (by month):"
Write-Host "  Jan/Aug -> muaythai"
Write-Host "  Feb/Sep -> pilates"
Write-Host "  Mar/Oct -> wellness"
Write-Host "  Apr/Nov -> cooking"
Write-Host "  May/Dec -> diving"
Write-Host "  Jun      -> spa"
Write-Host "  Jul      -> coworking"
Write-Host ""
Write-Host "Verify:        Get-ScheduledTask -TaskName $taskName"
Write-Host "Run manually:  Start-ScheduledTask -TaskName $taskName"
Write-Host "Remove:        schtasks /Delete /TN $taskName /F"
