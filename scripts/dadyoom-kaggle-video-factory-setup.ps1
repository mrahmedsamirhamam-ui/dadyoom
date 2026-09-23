param(
  [string]$Repo = "",
  [string]$KaggleUsername = ""
)

$ErrorActionPreference = "Stop"

function Pass([string]$Message) {
  Write-Host $Message -ForegroundColor Green
}

function Warn([string]$Message) {
  Write-Host $Message -ForegroundColor Yellow
}

function Fail([string]$Message) {
  Write-Host ("FAILED={0}" -f $Message) -ForegroundColor Red
  exit 1
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

if (-not (Test-Path "kaggle\dadyoom-video-factory\dadyoom_video_factory.py")) {
  Fail "KAGGLE_WORKER_SOURCE_MISSING"
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DADYOOM KAGGLE VIDEO FACTORY SETUP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Python = Get-Command py -ErrorAction SilentlyContinue
if (-not $Python) {
  $Python = Get-Command python -ErrorAction SilentlyContinue
}
if (-not $Python) {
  Fail "PYTHON_NOT_FOUND"
}

& $Python.Source -m pip install --upgrade kaggle
if ($LASTEXITCODE -ne 0) {
  Fail "KAGGLE_CLI_INSTALL_FAILED"
}

$Kaggle = Get-Command kaggle -ErrorAction SilentlyContinue
if (-not $Kaggle) {
  $ScriptsDir = & $Python.Source -c "import sysconfig; print(sysconfig.get_path('scripts'))"
  $env:Path = "$ScriptsDir;$env:Path"
  $Kaggle = Get-Command kaggle -ErrorAction SilentlyContinue
}
if (-not $Kaggle) {
  Fail "KAGGLE_COMMAND_NOT_FOUND_AFTER_INSTALL"
}

Pass "KAGGLE_CLI=READY"

Write-Host ""
Warn "A browser window may open for Kaggle OAuth login."
& $Kaggle.Source auth login
if ($LASTEXITCODE -ne 0) {
  Fail "KAGGLE_AUTH_FAILED"
}

Pass "KAGGLE_AUTH=PASS"

if ([string]::IsNullOrWhiteSpace($KaggleUsername)) {
  $KaggleUsername = Read-Host "Kaggle username"
}
$KaggleUsername = $KaggleUsername.Trim()

if ([string]::IsNullOrWhiteSpace($KaggleUsername)) {
  Fail "KAGGLE_USERNAME_REQUIRED"
}

$WorkDir = Join-Path $Repo ".dadyoom-kaggle\video-factory"
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null

Copy-Item `
  -LiteralPath (Join-Path $Repo "kaggle\dadyoom-video-factory\dadyoom_video_factory.py") `
  -Destination (Join-Path $WorkDir "dadyoom_video_factory.py") `
  -Force

$Metadata = @{
  id = "$KaggleUsername/dadyoom-video-factory"
  title = "Dadyoom Video Factory"
  code_file = "dadyoom_video_factory.py"
  language = "python"
  kernel_type = "script"
  is_private = $true
  enable_gpu = $true
  enable_internet = $true
  dataset_sources = @()
  competition_sources = @()
  kernel_sources = @()
} | ConvertTo-Json -Depth 6

[IO.File]::WriteAllText(
  (Join-Path $WorkDir "kernel-metadata.json"),
  $Metadata,
  [Text.UTF8Encoding]::new($false)
)

& $Kaggle.Source kernels push `
  -p $WorkDir `
  --no-run `
  --accelerator NvidiaTeslaT4

if ($LASTEXITCODE -ne 0) {
  Fail "KAGGLE_KERNEL_CREATE_FAILED"
}

$NotebookUrl = "https://www.kaggle.com/code/$KaggleUsername/dadyoom-video-factory"

Pass "KAGGLE_KERNEL_CREATED=PASS"
Write-Host ("KAGGLE_NOTEBOOK={0}" -f $NotebookUrl)

$EnvPath = Join-Path $Repo ".env.local"
if (-not (Test-Path -LiteralPath $EnvPath)) {
  Warn ".env.local was not found. You will need the Supabase URL and service-role key before the Kaggle run."
}

Write-Host ""
Write-Host "NEXT_ONE_TIME_STEP:" -ForegroundColor Cyan
Write-Host "1) Open the Kaggle notebook URL above." -ForegroundColor White
Write-Host "2) Add-ons -> Secrets." -ForegroundColor White
Write-Host "3) Attach these TWO secrets:" -ForegroundColor White
Write-Host "   DADYOOM_SUPABASE_URL" -ForegroundColor Yellow
Write-Host "   DADYOOM_SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
Write-Host "4) Never paste either secret into chat or source code." -ForegroundColor Red
Write-Host "5) Confirm GPU is enabled, then Save Version / Run All." -ForegroundColor White
Write-Host ""
Write-Host "The queue already contains the 10-video Bahrain benchmark." -ForegroundColor Cyan
Write-Host "Each accepted output must be at least 30 seconds." -ForegroundColor Cyan
