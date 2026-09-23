param(
  [string]$Repo = "",
  [string]$KaggleUsername = "",
  [string]$ToolsRoot = "G:\DadyoomTools\KaggleFactory"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Pass([string]$Message) { Write-Host $Message -ForegroundColor Green }
function Warn([string]$Message) { Write-Host $Message -ForegroundColor Yellow }
function Fail([string]$Message) { Write-Host ("FAILED={0}" -f $Message) -ForegroundColor Red; exit 1 }
function EnsureDir([string]$Path) { if (-not (Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null } }

if ([string]::IsNullOrWhiteSpace($Repo)) {
  $Current = (Get-Location).Path
  if (Test-Path -LiteralPath (Join-Path $Current "package.json")) { $Repo = $Current }
  else { $Repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path }
}

Set-Location -LiteralPath $Repo

if (-not (Test-Path "kaggle\dadyoom-video-factory\dadyoom_video_factory.py")) { Fail "KAGGLE_WORKER_SOURCE_MISSING" }
if (-not $ToolsRoot.StartsWith("G:\",[StringComparison]::OrdinalIgnoreCase)) { Fail "TOOLS_ROOT_MUST_BE_ON_G_DRIVE" }

$PythonRoot = Join-Path $ToolsRoot "python312"
$PythonExe = Join-Path $PythonRoot "python.exe"
$TempRoot = Join-Path $ToolsRoot "tmp"
$PipCache = Join-Path $ToolsRoot "pip-cache"
$KaggleConfig = Join-Path $ToolsRoot "kaggle-config"
$DownloadRoot = Join-Path $ToolsRoot "downloads"
$WorkDir = Join-Path $Repo ".dadyoom-kaggle\video-factory"

foreach ($Dir in @($ToolsRoot,$PythonRoot,$TempRoot,$PipCache,$KaggleConfig,$DownloadRoot,$WorkDir)) { EnsureDir $Dir }

$env:TEMP = $TempRoot
$env:TMP = $TempRoot
$env:PIP_CACHE_DIR = $PipCache
$env:PYTHONPYCACHEPREFIX = (Join-Path $ToolsRoot "pycache")
$env:KAGGLE_CONFIG_DIR = $KaggleConfig
$env:XDG_CONFIG_HOME = $KaggleConfig
$env:XDG_CACHE_HOME = (Join-Path $ToolsRoot "xdg-cache")
$env:HF_HOME = (Join-Path $ToolsRoot "hf-cache")
$env:TRANSFORMERS_CACHE = (Join-Path $ToolsRoot "hf-cache\transformers")

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DADYOOM KAGGLE VIDEO FACTORY - G DRIVE ONLY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ("REPO={0}" -f $Repo)
Write-Host ("TOOLS_ROOT={0}" -f $ToolsRoot)
Write-Host ("TEMP={0}" -f $env:TEMP)
Write-Host ("PIP_CACHE={0}" -f $env:PIP_CACHE_DIR)
Write-Host ("KAGGLE_CONFIG_DIR={0}" -f $env:KAGGLE_CONFIG_DIR)

if (-not (Test-Path -LiteralPath $PythonExe)) {
  Warn "Portable Python was not found on G:. Downloading it to G: only."
  $PythonVersion = "3.12.10"
  $Zip = Join-Path $DownloadRoot "python-$PythonVersion-embed-amd64.zip"
  $PythonUrl = "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip"
  if (-not (Test-Path -LiteralPath $Zip)) { Invoke-WebRequest -Uri $PythonUrl -OutFile $Zip }
  Expand-Archive -LiteralPath $Zip -DestinationPath $PythonRoot -Force
  $Pth = Get-ChildItem -LiteralPath $PythonRoot -Filter "python*._pth" | Select-Object -First 1
  if (-not $Pth) { Fail "PORTABLE_PYTHON_PTH_NOT_FOUND" }
  $PthText = Get-Content -LiteralPath $Pth.FullName -Raw
  if ($PthText -match "#import site") {
    $PthText = $PthText -replace "#import site","import site"
    [IO.File]::WriteAllText($Pth.FullName,$PthText,[Text.UTF8Encoding]::new($false))
  }
  Pass "PORTABLE_PYTHON_DOWNLOADED_TO_G=PASS"
}

if (-not (Test-Path -LiteralPath $PythonExe)) { Fail "PORTABLE_PYTHON_NOT_FOUND_AFTER_SETUP" }
& $PythonExe --version
if ($LASTEXITCODE -ne 0) { Fail "PORTABLE_PYTHON_FAILED" }
Pass ("PYTHON_ON_G={0}" -f $PythonExe)

& $PythonExe -m pip --version *> $null
if ($LASTEXITCODE -ne 0) {
  $GetPip = Join-Path $DownloadRoot "get-pip.py"
  if (-not (Test-Path -LiteralPath $GetPip)) { Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile $GetPip }
  & $PythonExe $GetPip --no-warn-script-location
  if ($LASTEXITCODE -ne 0) { Fail "PIP_BOOTSTRAP_ON_G_FAILED" }
}
Pass "PIP_ON_G=PASS"

& $PythonExe -m pip install --upgrade --no-warn-script-location --cache-dir $PipCache kaggle
if ($LASTEXITCODE -ne 0) { Fail "KAGGLE_CLI_INSTALL_ON_G_FAILED" }

$KaggleExe = Join-Path $PythonRoot "Scripts\kaggle.exe"
if (-not (Test-Path -LiteralPath $KaggleExe)) { Fail "KAGGLE_EXE_NOT_FOUND_ON_G" }
Pass ("KAGGLE_CLI_ON_G={0}" -f $KaggleExe)

Warn "A browser window may open for Kaggle OAuth login."
& $KaggleExe auth login
if ($LASTEXITCODE -ne 0) { Fail "KAGGLE_AUTH_FAILED" }
Pass "KAGGLE_AUTH=PASS"
Pass ("KAGGLE_AUTH_FILES_ON_G={0}" -f $KaggleConfig)

if ([string]::IsNullOrWhiteSpace($KaggleUsername)) { $KaggleUsername = Read-Host "Kaggle username" }
$KaggleUsername = $KaggleUsername.Trim()
if ([string]::IsNullOrWhiteSpace($KaggleUsername)) { Fail "KAGGLE_USERNAME_REQUIRED" }

Copy-Item -LiteralPath (Join-Path $Repo "kaggle\dadyoom-video-factory\dadyoom_video_factory.py") -Destination (Join-Path $WorkDir "dadyoom_video_factory.py") -Force

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

[IO.File]::WriteAllText((Join-Path $WorkDir "kernel-metadata.json"),$Metadata,[Text.UTF8Encoding]::new($false))

& $KaggleExe kernels push -p $WorkDir --no-run --accelerator NvidiaTeslaT4
if ($LASTEXITCODE -ne 0) { Fail "KAGGLE_KERNEL_CREATE_FAILED" }

$NotebookUrl = "https://www.kaggle.com/code/$KaggleUsername/dadyoom-video-factory"
Write-Host ""
Pass "KAGGLE_KERNEL_CREATED=PASS"
Write-Host ("KAGGLE_NOTEBOOK={0}" -f $NotebookUrl)
Write-Host ("LOCAL_TOOLS_ON_G={0}" -f $ToolsRoot)
Write-Host "C_DRIVE_HEAVY_INSTALLS=NONE" -ForegroundColor Green

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
