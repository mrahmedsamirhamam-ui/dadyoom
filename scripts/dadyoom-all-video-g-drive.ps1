param(
  [string]$Repo = "G:\ضاضيوم\dadyoom",
  [string]$ToolsRoot = "G:\DadyoomTools\KaggleFactory",
  [string]$KaggleUsername = "mrahmedsamirhamam",
  [switch]$ReportOnly
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Pass([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Warn([string]$Message) { Write-Host $Message -ForegroundColor Yellow }
function Fail([string]$Message) { Write-Host ("FAILED={0}" -f $Message) -ForegroundColor Red; exit 1 }
function EnsureDir([string]$Path) { if (-not (Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null } }

function MoveCacheSafely([string]$Source,[string]$Destination,[string]$Label) {
  if (-not (Test-Path -LiteralPath $Source)) { return }
  EnsureDir $Destination
  Write-Host ("MOVING_{0}: {1} -> {2}" -f $Label,$Source,$Destination) -ForegroundColor Cyan
  & robocopy $Source $Destination /E /MOVE /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
  $Code = $LASTEXITCODE
  if ($Code -gt 7) {
    Warn ("MOVE_{0}_ROBOCOPY_EXIT={1}; source kept if files remain." -f $Label,$Code)
    return
  }
  if (Test-Path -LiteralPath $Source) {
    try {
      $Remaining = Get-ChildItem -LiteralPath $Source -Force -ErrorAction Stop | Select-Object -First 1
      if (-not $Remaining) { Remove-Item -LiteralPath $Source -Force -ErrorAction SilentlyContinue }
    } catch {}
  }
  Pass ("MOVE_{0}=PASS" -f $Label)
}

function EnvValue([string]$Path,[string]$Name) {
  if (-not (Test-Path -LiteralPath $Path)) { return "" }
  $Prefix = "$Name="
  $Line = Get-Content -LiteralPath $Path | Where-Object { $_.StartsWith($Prefix) } | Select-Object -Last 1
  if (-not $Line) { return "" }
  return $Line.Substring($Prefix.Length).Trim()
}

if (-not (Test-Path -LiteralPath $Repo)) { Fail "REPO_NOT_FOUND" }
if (-not $Repo.StartsWith("G:\",[StringComparison]::OrdinalIgnoreCase)) { Fail "REPO_MUST_BE_ON_G_DRIVE" }
if (-not $ToolsRoot.StartsWith("G:\",[StringComparison]::OrdinalIgnoreCase)) { Fail "TOOLS_ROOT_MUST_BE_ON_G_DRIVE" }

Set-Location -LiteralPath $Repo

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DADYOOM ALL VIDEO FACTORY - MOVE + SETUP + BENCHMARK" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ("REPO={0}" -f $Repo)
Write-Host ("TOOLS_ROOT={0}" -f $ToolsRoot)

$TempRoot = Join-Path $ToolsRoot "tmp"
$PipCache = Join-Path $ToolsRoot "pip-cache"
$KaggleConfig = Join-Path $ToolsRoot "kaggle-config"
$HfCache = Join-Path $ToolsRoot "hf-cache"
$TorchCache = Join-Path $ToolsRoot "torch-cache"
$XdgCache = Join-Path $ToolsRoot "xdg-cache"
$PyCache = Join-Path $ToolsRoot "pycache"

foreach ($Dir in @($ToolsRoot,$TempRoot,$PipCache,$KaggleConfig,$HfCache,$TorchCache,$XdgCache,$PyCache)) { EnsureDir $Dir }

# Move only relevant AI/Kaggle caches from C:. Do not touch system Python or Windows folders.
$OldPip = Join-Path $env:LOCALAPPDATA "pip\Cache"
$OldHf = Join-Path $env:USERPROFILE ".cache\huggingface"
$OldKaggle = Join-Path $env:USERPROFILE ".kaggle"
MoveCacheSafely $OldPip $PipCache "PIP_CACHE"
MoveCacheSafely $OldHf $HfCache "HF_CACHE"
MoveCacheSafely $OldKaggle $KaggleConfig "KAGGLE_CONFIG"

# Current process: everything heavy goes to G:.
$env:TEMP = $TempRoot
$env:TMP = $TempRoot
$env:PIP_CACHE_DIR = $PipCache
$env:PYTHONPYCACHEPREFIX = $PyCache
$env:KAGGLE_CONFIG_DIR = $KaggleConfig
$env:XDG_CONFIG_HOME = $KaggleConfig
$env:XDG_CACHE_HOME = $XdgCache
$env:HF_HOME = $HfCache
$env:TRANSFORMERS_CACHE = (Join-Path $HfCache "transformers")
$env:TORCH_HOME = $TorchCache

# Persist only cache/config locations. TEMP/TMP are intentionally session-only.
[Environment]::SetEnvironmentVariable("PIP_CACHE_DIR",$PipCache,"User")
[Environment]::SetEnvironmentVariable("KAGGLE_CONFIG_DIR",$KaggleConfig,"User")
[Environment]::SetEnvironmentVariable("HF_HOME",$HfCache,"User")
[Environment]::SetEnvironmentVariable("TRANSFORMERS_CACHE",(Join-Path $HfCache "transformers"),"User")
[Environment]::SetEnvironmentVariable("TORCH_HOME",$TorchCache,"User")

Pass "G_DRIVE_CACHE_ROUTING=PASS"
Write-Host ("TEMP={0}" -f $env:TEMP)
Write-Host ("PIP_CACHE={0}" -f $env:PIP_CACHE_DIR)
Write-Host ("KAGGLE_CONFIG={0}" -f $env:KAGGLE_CONFIG_DIR)
Write-Host ("HF_HOME={0}" -f $env:HF_HOME)
Write-Host ("TORCH_HOME={0}" -f $env:TORCH_HOME)

if ($ReportOnly) {
  $ReportScript = Join-Path $Repo "scripts\dadyoom-video-benchmark-report.ps1"
  if (-not (Test-Path -LiteralPath $ReportScript)) { Fail "BENCHMARK_REPORT_SCRIPT_MISSING" }
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ReportScript -Repo $Repo
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[1/3] Pull latest factory code..." -ForegroundColor Cyan
git pull --ff-only origin fix/mobile-cloud-video-final-20260923
if ($LASTEXITCODE -ne 0) { Fail "GIT_PULL_FAILED" }
Pass "GIT_PULL=PASS"

Write-Host ""
Write-Host "[2/3] Set up Kaggle factory on G:..." -ForegroundColor Cyan
$SetupScript = Join-Path $Repo "scripts\dadyoom-kaggle-video-factory-setup.ps1"
if (-not (Test-Path -LiteralPath $SetupScript)) { Fail "KAGGLE_SETUP_SCRIPT_MISSING" }

$SetupArgs = @(
  "-NoProfile",
  "-ExecutionPolicy","Bypass",
  "-File",$SetupScript,
  "-Repo",$Repo,
  "-ToolsRoot",$ToolsRoot
)
if (-not [string]::IsNullOrWhiteSpace($KaggleUsername)) {
  $SetupArgs += @("-KaggleUsername",$KaggleUsername)
}

& powershell.exe @SetupArgs
if ($LASTEXITCODE -ne 0) { Fail "KAGGLE_FACTORY_SETUP_FAILED" }
Pass "KAGGLE_FACTORY_SETUP=PASS"

Write-Host ""
Write-Host "[3/3] Check prepared benchmark queue..." -ForegroundColor Cyan
$EnvFile = Join-Path $Repo ".env.local"
$Url = EnvValue $EnvFile "NEXT_PUBLIC_SUPABASE_URL"
if (-not $Url) { $Url = EnvValue $EnvFile "SUPABASE_URL" }
$Key = EnvValue $EnvFile "SUPABASE_SERVICE_ROLE_KEY"

if ($Url -and $Key) {
  try {
    $Headers = @{ apikey = $Key; Authorization = "Bearer $Key" }
    $Endpoint = "$Url/rest/v1/video_batch_jobs?select=id,status,target_duration_seconds,benchmark_batch&benchmark_batch=not.is.null&order=created_at.asc"
    $Jobs = Invoke-RestMethod -Uri $Endpoint -Headers $Headers -Method Get -TimeoutSec 60
    $Queued = @($Jobs | Where-Object { $_.status -eq "queued" }).Count
    $Completed = @($Jobs | Where-Object { $_.status -eq "completed" }).Count
    Write-Host ("BENCHMARK_JOBS_TOTAL={0}" -f @($Jobs).Count)
    Write-Host ("BENCHMARK_QUEUED={0}" -f $Queued)
    Write-Host ("BENCHMARK_COMPLETED={0}" -f $Completed)
  } catch {
    Warn ("BENCHMARK_QUEUE_CHECK_SKIPPED: " + $_.Exception.Message)
  }
} else {
  Warn "Supabase values not found in .env.local; queue check skipped."
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " LOCAL FACTORY SETUP COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Heavy local files/caches: G: only." -ForegroundColor Green
Write-Host "Kaggle GPU/model downloads: run in Kaggle cloud, not on this PC." -ForegroundColor Green
Write-Host "Benchmark: 10 videos, each accepted output >= 30 seconds." -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT: open the Kaggle notebook printed above, add the two Supabase secrets, enable GPU, then Save Version / Run All." -ForegroundColor Yellow
Write-Host ""
Write-Host "After the 10 videos finish, run:" -ForegroundColor Cyan
Write-Host ("powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"{0}`" -Repo `"{1}`"" -f (Join-Path $Repo "scripts\dadyoom-video-benchmark-report.ps1"),$Repo)
