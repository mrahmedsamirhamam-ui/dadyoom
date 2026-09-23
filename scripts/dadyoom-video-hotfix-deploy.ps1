param(
  [string]$Repo = ""
)

$ErrorActionPreference = "Stop"

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

$Branch = (git branch --show-current).Trim()
if ($Branch -ne "fix/mobile-cloud-video-final-20260923") {
  Fail ("WRONG_BRANCH " + $Branch)
}

git pull --ff-only origin fix/mobile-cloud-video-final-20260923
if ($LASTEXITCODE -ne 0) { Fail "GIT_PULL_FAILED" }

npm install --legacy-peer-deps --no-package-lock
if ($LASTEXITCODE -ne 0) { Fail "NPM_INSTALL_FAILED" }

npx eslint "lib/video/cinematic-avatar-agent.ts" "lib/video/cinematic-client.ts" "app/api/video/cinematic/route.ts" "app/api/video/cinematic/status/route.ts" "app/api/video/cinematic/health/route.ts"
if ($LASTEXITCODE -ne 0) { Fail "VIDEO_LINT_FAILED" }

npm run test:run
if ($LASTEXITCODE -ne 0) { Fail "TESTS_FAILED" }

npm run build:vinext
if ($LASTEXITCODE -ne 0) { Fail "BUILD_FAILED" }

npm run deploy:vinext
if ($LASTEXITCODE -ne 0) { Fail "DEPLOY_FAILED" }

$Url = "https://dadyoom.mrahmedsamirhamam.workers.dev/api/video/cinematic/health"

try {
  $Health = Invoke-RestMethod -Uri $Url -TimeoutSec 60
  Write-Host ("VIDEO_HEALTH=" + ($Health | ConvertTo-Json -Compress)) -ForegroundColor Green
  if (-not $Health.ok) { Fail "VIDEO_HEALTH_NOT_READY" }
}
catch {
  Fail ("VIDEO_HEALTH_REQUEST_FAILED " + $_.Exception.Message)
}

Write-Host ""
Write-Host "VIDEO_HOTFIX_DEPLOY=PASS" -ForegroundColor Green
Write-Host "NO_ANDROID_REBUILD_REQUIRED=YES" -ForegroundColor Green
Write-Host "RETEST_WEB_AND_EXISTING_ANDROID_APK=NOW" -ForegroundColor Cyan
