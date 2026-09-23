param(
  [string]$Repo = ""
)

$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
  Write-Host ("FAILED={0}" -f $Message) -ForegroundColor Red
  exit 1
}

function EnvValue([string]$Path,[string]$Name) {
  if (!(Test-Path -LiteralPath $Path)) { return "" }
  $Prefix = "$Name="
  $Line = Get-Content -LiteralPath $Path | Where-Object { $_.StartsWith($Prefix) } | Select-Object -Last 1
  if (!$Line) { return "" }
  return $Line.Substring($Prefix.Length).Trim()
}

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $Current = (Get-Location).Path
  if (Test-Path -LiteralPath (Join-Path $Current "package.json")) {
    $Repo = $Current
  }
  else {
    $Repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
  }
}

Set-Location -LiteralPath $Repo
$EnvFile = Join-Path $Repo ".env.local"
$Url = EnvValue $EnvFile "NEXT_PUBLIC_SUPABASE_URL"
if (-not $Url) { $Url = EnvValue $EnvFile "SUPABASE_URL" }
$Key = EnvValue $EnvFile "SUPABASE_SERVICE_ROLE_KEY"

if (-not $Url -or -not $Key) {
  Fail "SUPABASE_ENV_MISSING"
}

$Headers = @{
  apikey = $Key
  Authorization = "Bearer $Key"
}

$Endpoint = "$Url/rest/v1/video_batch_benchmark_summary?select=*&order=started_at.desc&limit=1"
$Rows = Invoke-RestMethod -Uri $Endpoint -Headers $Headers -Method Get -TimeoutSec 60

if (-not $Rows -or $Rows.Count -eq 0) {
  Fail "NO_BENCHMARK_FOUND"
}

$Row = $Rows[0]

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DADYOOM VIDEO FACTORY BENCHMARK" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ("BATCH={0}" -f $Row.benchmark_batch)
Write-Host ("JOBS_TOTAL={0}" -f $Row.jobs_total)
Write-Host ("JOBS_COMPLETED={0}" -f $Row.jobs_completed)
Write-Host ("JOBS_FAILED={0}" -f $Row.jobs_failed)
Write-Host ("AVG_OUTPUT_SECONDS={0}" -f $Row.avg_output_seconds)
Write-Host ("AVG_GPU_SECONDS={0}" -f $Row.avg_gpu_seconds)
Write-Host ("MEDIAN_GPU_SECONDS={0}" -f $Row.median_gpu_seconds)
Write-Host ("ESTIMATED_SAFE_WEEKLY_VIDEOS={0}" -f $Row.estimated_safe_weekly_videos)

if ($Row.public_generation_gate -eq "pass") {
  Write-Host "PUBLIC_GENERATION_GATE=PASS" -ForegroundColor Green
  Write-Host "Decision: keep public video generation enabled." -ForegroundColor Green
}
elseif ($Row.public_generation_gate -eq "fail") {
  Write-Host "PUBLIC_GENERATION_GATE=FAIL" -ForegroundColor Red
  Write-Host "Decision: do not expose unlimited public generation with this profile." -ForegroundColor Yellow
}
else {
  Write-Host "PUBLIC_GENERATION_GATE=BENCHMARKING" -ForegroundColor Yellow
  Write-Host "Decision: wait until 10 completed videos are measured." -ForegroundColor Yellow
}
