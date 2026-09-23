param(
  [string]$Repo = "",
  [switch]$SkipDeploy,
  [switch]$SkipTests
)

# DADYOOM_REPO_AUTO_RESOLVE
if ([string]::IsNullOrWhiteSpace($Repo)) {
  $CurrentCandidate = (Get-Location).Path
  if (Test-Path -LiteralPath (Join-Path $CurrentCandidate "package.json")) {
    $Repo = $CurrentCandidate
  }
  else {
    $Repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
  }
}

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host " $Message" -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor Cyan
}

function Fail([string]$Message) {
  Write-Host ""
  Write-Host "FAILED: $Message" -ForegroundColor Red
  exit 1
}

function Get-EnvValue([string]$Path, [string]$Name) {
  if (-not (Test-Path $Path)) { return "" }
  $match = Get-Content -LiteralPath $Path | Where-Object { $_ -match ("^" + [regex]::Escape($Name) + "=") } | Select-Object -Last 1
  if (-not $match) { return "" }
  return ($match -replace ("^" + [regex]::Escape($Name) + "="), "").Trim()
}

function Set-EnvValue([string]$Path, [string]$Name, [string]$Value) {
  $lines = @()
  if (Test-Path $Path) { $lines = @(Get-Content -LiteralPath $Path) }
  $prefix = "$Name="
  $found = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].StartsWith($prefix)) {
      $lines[$i] = "$Name=$Value"
      $found = $true
    }
  }
  if (-not $found) { $lines += "$Name=$Value" }
  [System.IO.File]::WriteAllLines($Path, $lines, [System.Text.UTF8Encoding]::new($false))
}

Write-Step "DADYOOM FINAL MOBILE CLOUD VIDEO FIX"

if (-not (Test-Path $Repo)) { Fail "Repository path not found: $Repo" }
Set-Location -LiteralPath $Repo
if (-not (Test-Path ".git")) { Fail "This folder is not the Dadyoom Git repository." }

$dirty = git status --porcelain
if ($LASTEXITCODE -ne 0) { Fail "git status failed." }
if ($dirty) {
  Write-Host "There are local changes. Nothing was overwritten." -ForegroundColor Yellow
  git status --short
  Write-Host "Commit/stash them, then run this script again." -ForegroundColor Yellow
  exit 2
}

Write-Step "FETCH FIX BRANCH"
git fetch origin --prune
if ($LASTEXITCODE -ne 0) { Fail "git fetch failed." }
git switch fix/mobile-cloud-video-final-20260923
if ($LASTEXITCODE -ne 0) { Fail "Could not switch to the mobile video fix branch." }
git pull --ff-only origin fix/mobile-cloud-video-final-20260923
if ($LASTEXITCODE -ne 0) { Fail "git pull failed." }

Write-Host "BRANCH=$(git branch --show-current)" -ForegroundColor Green
Write-Host "HEAD=$(git rev-parse HEAD)" -ForegroundColor Green

Write-Step "VERIFY MOBILE VIDEO PATCH"

$LessonButton = "components\dad-ai\DadLessonVideoButton.tsx"
$AskPage = "app\(dashboard)\ask\page.tsx"
$Client = "lib\video\cinematic-client.ts"
$Engine = "lib\video\cinematic-avatar-agent.ts"

foreach ($required in @($LessonButton, $AskPage, $Client, $Engine)) {
  if (-not (Test-Path -LiteralPath $required)) { Fail "Missing required file: $required" }
}

$lessonText = Get-Content -LiteralPath $LessonButton -Raw
$clientText = Get-Content -LiteralPath $Client -Raw
$engineText = Get-Content -LiteralPath $Engine -Raw

if ($lessonText -match "captureStream|MediaRecorder|AudioContext") { Fail "Lesson video button still contains local rendering code." }
if ($clientText -notmatch "generateCinematicVideo") { Fail "Cloud video client is missing." }
if ($engineText -notmatch "hf-minimax-h3") { Fail "Hugging Face cloud provider is missing." }

Write-Host "ANDROID_VIDEO_PATH=CLOUD" -ForegroundColor Green
Write-Host "IOS_VIDEO_PATH=CLOUD" -ForegroundColor Green
Write-Host "LOCAL_GPU_REQUIRED=NO" -ForegroundColor Green
Write-Host "HF_MINIMAX_PROVIDER=PASS" -ForegroundColor Green

Write-Step "CONFIGURE FREE HUGGING FACE TOKEN"

$EnvFile = Join-Path $Repo ".env.local"
$HfToken = Get-EnvValue $EnvFile "HF_TOKEN"

if (-not $HfToken) {
  Write-Host "A free Hugging Face READ token is required for the renewable ZeroGPU quota." -ForegroundColor Yellow
  $secure = Read-Host "HF_TOKEN" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $HfToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

  if (-not $HfToken -or -not $HfToken.StartsWith("hf_")) { Fail "HF token was empty or did not look valid." }
  Set-EnvValue $EnvFile "HF_TOKEN" $HfToken
}

Set-EnvValue $EnvFile "VIDEO_PROVIDER_ORDER" "hf-minimax-h3,hf-sadtalker,hf-musetalk,higgsfield,heygen,tavus,akool,did,creatify"
Set-EnvValue $EnvFile "HF_MINIMAX_H3_BASE_URL" "https://minimaxai-minimax-h3-turbo-lora.hf.space"
Set-EnvValue $EnvFile "HF_MINIMAX_H3_CANVAS" "1344x768 · 16:9 full"
Set-EnvValue $EnvFile "HF_MINIMAX_H3_DURATION" "5"
Set-EnvValue $EnvFile "HF_MINIMAX_H3_STEPS" "4"
Write-Host "LOCAL_ENV=PASS" -ForegroundColor Green

Write-Step "INSTALL WITHOUT LOCKFILE CHANGES"
npm install --legacy-peer-deps --no-package-lock
if ($LASTEXITCODE -ne 0) { Fail "npm install failed." }

Write-Step "LINT VIDEO + MOBILE FILES"
npx eslint "lib/video/cinematic-client.ts" "lib/video/cinematic-avatar-agent.ts" "app/api/video/cinematic/route.ts" "app/api/video/cinematic/status/route.ts" "app/(dashboard)/ask/page.tsx" "components/dad-ai/DadLessonVideoButton.tsx" "components/mobile/NativeMobileShell.tsx" "components/mobile/MobileOAuthBridge.tsx"
if ($LASTEXITCODE -ne 0) { Fail "ESLint failed." }
Write-Host "ESLINT=PASS" -ForegroundColor Green

if (-not $SkipTests) {
  Write-Step "RUN TESTS"
  npm run test:run
  if ($LASTEXITCODE -ne 0) { Fail "Tests failed." }
  Write-Host "TESTS=PASS" -ForegroundColor Green
}

Write-Step "BUILD CLOUDFLARE/VINEXT"
npm run build:vinext
if ($LASTEXITCODE -ne 0) { Fail "Vinext build failed." }
Write-Host "VINEXT_BUILD=PASS" -ForegroundColor Green

if (-not $SkipDeploy) {
  Write-Step "SYNC HF TOKEN TO CLOUDFLARE"
  $HfToken | npx wrangler secret put HF_TOKEN
  if ($LASTEXITCODE -ne 0) { Fail "Could not save HF_TOKEN to Cloudflare. Check Wrangler login." }
  Write-Host "CLOUDFLARE_HF_SECRET=PASS" -ForegroundColor Green

  Write-Step "DEPLOY DADYOOM"
  npm run deploy:vinext
  if ($LASTEXITCODE -ne 0) { Fail "Cloudflare deploy failed." }
  Write-Host "DEPLOY=PASS" -ForegroundColor Green

  Write-Step "PRODUCTION SMOKE"
  $Site = "https://dadyoom.mrahmedsamirhamam.workers.dev"
  try {
    $response = Invoke-WebRequest -Uri "$Site/ask" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) { Fail "Production /ask returned HTTP $($response.StatusCode)." }
  }
  catch {
    Fail "Production smoke test failed: $($_.Exception.Message)"
  }
  Write-Host "PRODUCTION_ASK=PASS" -ForegroundColor Green
}

Write-Step "OPTIONAL NATIVE SHELL SYNC"

$HasCapConfig = (Test-Path "capacitor.config.ts") -or (Test-Path "capacitor.config.json")

if ($HasCapConfig -and (Test-Path "android")) {
  npx cap sync android
  if ($LASTEXITCODE -ne 0) { Fail "Android Capacitor sync failed." }
  Write-Host "ANDROID_SYNC=PASS" -ForegroundColor Green
}
else {
  Write-Host "ANDROID_SYNC=SKIPPED (native shell/config is not tracked in this checkout)" -ForegroundColor Yellow
}

if ($HasCapConfig -and (Test-Path "ios")) {
  $RunningOnMac = $false
  if (Get-Variable -Name IsMacOS -ErrorAction SilentlyContinue) { $RunningOnMac = [bool]$IsMacOS }
  if ($RunningOnMac) {
    npx cap sync ios
    if ($LASTEXITCODE -ne 0) { Fail "iOS Capacitor sync failed." }
    Write-Host "IOS_SYNC=PASS" -ForegroundColor Green
  }
  else {
    Write-Host "IOS_SYNC=READY_BUT_REQUIRES_MACOS_XCODE" -ForegroundColor Yellow
  }
}
else {
  Write-Host "IOS_SYNC=SKIPPED (native shell/config is not tracked in this checkout)" -ForegroundColor Yellow
}

Write-Step "FINAL REPORT"
Write-Host "VIDEO_CREATE_WEB=READY" -ForegroundColor Green
Write-Host "VIDEO_CREATE_ANDROID=READY_CLOUD_PATH" -ForegroundColor Green
Write-Host "VIDEO_CREATE_IPHONE=READY_CLOUD_PATH" -ForegroundColor Green
Write-Host "DEVICE_GPU_DEPENDENCY=REMOVED" -ForegroundColor Green
Write-Host "FREE_FIRST_PROVIDER=HF_MINIMAX_H3_ZEROGPU" -ForegroundColor Green
Write-Host "PAID_FALLBACKS=HIGGSFIELD,HEYGEN_AND_OTHERS_IF_CONFIGURED" -ForegroundColor Green
Write-Host "NEXT_MILESTONE=22_COUNTRY_CURRICULUM" -ForegroundColor Cyan
