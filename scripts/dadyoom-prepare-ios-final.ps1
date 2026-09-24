param(
  [string]$Repo = "",
  [string]$VersionName = "1.0.0",
  [int]$VersionCode = 1
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

function Pass([string]$Text) {
  Write-Host $Text -ForegroundColor Green
}

function Fail([string]$Text) {
  Write-Host ("FAILED={0}" -f $Text) -ForegroundColor Red
  exit 1
}

$ExpectedBranch = "fix/mobile-cloud-video-final-20260923"
$ModelName = "dadyoom-qwen2.5-1.5b-instruct-q8.task"

if (!(Test-Path -LiteralPath (Join-Path $Repo "package.json"))) {
  Fail "PROJECT_NOT_FOUND"
}

Set-Location -LiteralPath $Repo

$Branch = (git branch --show-current).Trim()
if ($Branch -ne $ExpectedBranch) {
  Fail ("WRONG_BRANCH current={0} expected={1}" -f $Branch,$ExpectedBranch)
}

$Tracked = @(git status --porcelain --untracked-files=no)
if ($Tracked.Count -gt 0) {
  $Tracked | ForEach-Object { Write-Host $_ }
  Fail "TRACKED_WORKTREE_NOT_CLEAN"
}

git fetch origin $ExpectedBranch
if ($LASTEXITCODE -ne 0) { Fail "GIT_FETCH_FAILED" }

git pull --ff-only origin $ExpectedBranch
if ($LASTEXITCODE -ne 0) { Fail "GIT_PULL_FAILED" }

$ModelCandidates = @(
  (Join-Path $Repo ".dadyoom-mobile\models\$ModelName"),
  (Join-Path $Repo "android\app\src\main\assets\$ModelName"),
  (Join-Path $Repo "android\offline_ai_model\src\main\assets\$ModelName")
)

$ModelPath = ""
foreach ($Candidate in $ModelCandidates) {
  if (Test-Path -LiteralPath $Candidate) {
    $ModelPath = (Resolve-Path -LiteralPath $Candidate).Path
    break
  }
}

if (!$ModelPath) {
  Fail ("OFFLINE_MODEL_NOT_FOUND expected={0}" -f (Join-Path $Repo ".dadyoom-mobile\models\$ModelName"))
}

$Kit = Join-Path $Repo ".dadyoom-mobile\ios-final-kit"
New-Item -ItemType Directory -Force -Path $Kit | Out-Null

Copy-Item -LiteralPath $ModelPath -Destination (Join-Path $Kit $ModelName) -Force
Copy-Item -LiteralPath (Join-Path $Repo "scripts\dadyoom-finalize-ios.sh") -Destination (Join-Path $Kit "dadyoom-finalize-ios.sh") -Force

$Readme = @"
DADYOOM IOS FINAL KIT
=====================

Version: $VersionName ($VersionCode)
Branch: $ExpectedBranch
App ID: com.dadyoom.app

This Windows step does NOT create an IPA.
The iOS native app must be generated and signed on macOS with Xcode.

The kit contains:
- $ModelName
- dadyoom-finalize-ios.sh

On the Mac:
1. Clone/pull the Dadyoom repository and switch to:
   $ExpectedBranch
2. Copy this entire ios-final-kit folder into the repository root as:
   .dadyoom-mobile/ios-final-kit
3. Run:
   chmod +x .dadyoom-mobile/ios-final-kit/dadyoom-finalize-ios.sh
   ./.dadyoom-mobile/ios-final-kit/dadyoom-finalize-ios.sh

Optional environment variables:
DADYOOM_APPLE_TEAM_ID=<Apple Developer Team ID>
DADYOOM_IOS_DEVICE=<device UDID>

The script creates/syncs the Capacitor iOS project, embeds the offline Qwen
model in the app bundle, configures dadyoom://auth/callback, validates the
native Xcode build, and can run on a connected iPhone when signing is ready.

AI lesson video generation is intentionally marked "Coming soon" in this release.
The iOS work should not depend on any video-generation token or GPU backend.
"@

Set-Content -LiteralPath (Join-Path $Kit "README-IOS-FINAL.txt") -Value $Readme -Encoding utf8

Pass "IOS_WINDOWS_PREP=PASS"
Write-Host ("IOS_FINAL_KIT={0}" -f $Kit)
Write-Host ("MODEL_BYTES={0}" -f (Get-Item -LiteralPath $ModelPath).Length)
Write-Host "IOS_NATIVE_BUILD=REQUIRES_MACOS_XCODE"
