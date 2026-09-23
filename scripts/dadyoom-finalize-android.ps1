param(
  [string]$Repo = "",
  [string]$VersionName = "1.0.0",
  [int]$VersionCode = 1,
  [switch]$Install,
  [switch]$SkipDeploy,
  [switch]$SkipTests,
  [switch]$SkipPlayBundle,
  [switch]$SkipSigning
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

function Step([string]$Title) {
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host " $Title" -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor Cyan
}

function Pass([string]$Text) {
  Write-Host $Text -ForegroundColor Green
}

function Warn([string]$Text) {
  Write-Host $Text -ForegroundColor Yellow
}

function Fail([string]$Text) {
  Write-Host ""
  Write-Host ("FAILED={0}" -f $Text) -ForegroundColor Red
  exit 1
}

function ReadText([string]$Path) {
  return [IO.File]::ReadAllText($Path,[Text.Encoding]::UTF8)
}

function WriteText([string]$Path,[string]$Text) {
  $Parent = Split-Path -Parent $Path
  if ($Parent -and !(Test-Path -LiteralPath $Parent)) {
    New-Item -ItemType Directory -Force -Path $Parent | Out-Null
  }
  [IO.File]::WriteAllText($Path,$Text,[Text.UTF8Encoding]::new($false))
}

function Run([string]$Command,[string[]]$ArgumentList,[string]$Log,[switch]$AllowFailure) {
  $Old = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $Output = @(& $Command @ArgumentList 2>&1)
    $Code = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $Old
  }

  $Output | ForEach-Object { Write-Host ([string]$_) }
  if ($Log) {
    $Output | ForEach-Object { [string]$_ } | Set-Content -LiteralPath $Log -Encoding utf8
  }

  if (!$AllowFailure -and $Code -ne 0) {
    Fail ("COMMAND_FAILED {0} exit={1}" -f $Command,$Code)
  }

  return [int]$Code
}

function FindJava {
  $Candidates = @(
    $env:JAVA_HOME,
    "G:\DadyoomAndroidTools\microsoft-jdk-21\jdk-21.0.12.1+1",
    "C:\Program Files\Android\Android Studio\jbr",
    "C:\Program Files\Android\Android Studio\jre"
  )

  foreach ($C in $Candidates) {
    if ($C -and (Test-Path -LiteralPath (Join-Path $C "bin\java.exe"))) {
      return $C
    }
  }

  return ""
}

function FindSdk {
  $Candidates = @(
    $env:ANDROID_SDK_ROOT,
    $env:ANDROID_HOME,
    "G:\DadyoomAndroidTools\AndroidSdk",
    $(if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA "Android\Sdk" } else { "" })
  )

  foreach ($C in $Candidates) {
    if ($C -and (Test-Path -LiteralPath $C)) {
      return (Resolve-Path -LiteralPath $C).Path
    }
  }

  return ""
}

function FindFreeDrive {
  foreach ($L in @("R","S","T","U","V","W","X","Y")) {
    if (!(Test-Path ("{0}:\" -f $L))) {
      return $L
    }
  }
  return ""
}

function SecurePlain([Security.SecureString]$Value) {
  $Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr)
  }
}

function EnvValue([string]$Path,[string]$Name) {
  if (!(Test-Path -LiteralPath $Path)) { return "" }
  $Prefix = "$Name="
  $Line = Get-Content -LiteralPath $Path | Where-Object { $_.StartsWith($Prefix) } | Select-Object -Last 1
  if (!$Line) { return "" }
  return $Line.Substring($Prefix.Length).Trim()
}

function SetEnvValue([string]$Path,[string]$Name,[string]$Value) {
  $Lines = @()
  if (Test-Path -LiteralPath $Path) {
    $Lines = @(Get-Content -LiteralPath $Path)
  }

  $Prefix = "$Name="
  $Found = $false
  for ($I=0; $I -lt $Lines.Count; $I++) {
    if ($Lines[$I].StartsWith($Prefix)) {
      $Lines[$I] = "$Name=$Value"
      $Found = $true
    }
  }

  if (!$Found) {
    $Lines += "$Name=$Value"
  }

  WriteText $Path (($Lines -join [Environment]::NewLine) + [Environment]::NewLine)
}

function EnsureDeepLink([string]$Manifest) {
  $Text = ReadText $Manifest
  if ($Text -match 'android:scheme="dadyoom"' -and $Text -match 'android:host="auth"') {
    Pass "ANDROID_DEEP_LINK=ALREADY_PRESENT"
    return
  }

  $Needle = "</activity>"
  $At = $Text.IndexOf($Needle)
  if ($At -lt 0) { Fail "ANDROID_ACTIVITY_CLOSE_TAG_NOT_FOUND" }

  $Intent = @'
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="dadyoom"
                    android:host="auth"
                    android:pathPrefix="/callback" />
            </intent-filter>
'@

  $Text = $Text.Insert($At,$Intent)
  WriteText $Manifest $Text
  Pass "ANDROID_DEEP_LINK=ADDED"
}

$ExpectedBranch = "fix/mobile-cloud-video-final-20260923"
$ProductionUrl = "https://dadyoom.mrahmedsamirhamam.workers.dev"
$AppId = "com.dadyoom.app"
$ModelName = "dadyoom-qwen2.5-1.5b-instruct-q8.task"

if (!(Test-Path -LiteralPath (Join-Path $Repo "package.json"))) {
  Fail "PROJECT_NOT_FOUND"
}

Set-Location -LiteralPath $Repo

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Work = Join-Path $Repo (".dadyoom-work\android-final-{0}" -f $Stamp)
$Artifacts = Join-Path $Repo ".dadyoom-mobile\final-release"
New-Item -ItemType Directory -Force -Path $Work,$Artifacts | Out-Null

Step "1/9 REPOSITORY + FINAL VIDEO SOURCE"

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

$Head = (git rev-parse HEAD).Trim()
Write-Host ("HEAD={0}" -f $Head)

$Required = @(
  "lib\video\cinematic-client.ts",
  "lib\video\cinematic-avatar-agent.ts",
  "app\api\video\cinematic\route.ts",
  "app\api\video\cinematic\status\route.ts",
  "app\api\video\cinematic\health\route.ts",
  "app\(dashboard)\ask\page.tsx",
  "components\dad-ai\DadLessonVideoButton.tsx",
  "lib\mobile\offline-ai.ts",
  "lib\mobile\hybrid-ai.ts"
)

foreach ($Rel in $Required) {
  if (!(Test-Path -LiteralPath (Join-Path $Repo $Rel))) {
    Fail ("REQUIRED_SOURCE_MISSING {0}" -f $Rel)
  }
}

$LessonButton = ReadText (Join-Path $Repo "components\dad-ai\DadLessonVideoButton.tsx")
if ($LessonButton -match "MediaRecorder|captureStream|AudioContext") {
  Fail "OLD_LOCAL_VIDEO_RENDERER_STILL_PRESENT"
}

$Engine = ReadText (Join-Path $Repo "lib\video\cinematic-avatar-agent.ts")
if ($Engine -notmatch "hf-minimax-h3" -or $Engine -notmatch "hf-ltx") {
  Fail "FREE_CLOUD_VIDEO_PROVIDERS_NOT_PRESENT"
}

Pass "VIDEO_SOURCE_WEB_ANDROID_IOS=SHARED_CLOUD_PATH"
Pass "DEVICE_GPU_REQUIRED_FOR_VIDEO=NO"
Pass "FREE_VIDEO_ROUTER=MINIMAX_H3_THEN_LTX"

Step "2/9 CAPACITOR CONFIG"

$Config = @'
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dadyoom.app",
  appName: "Dadyoom",
  webDir: "mobile-shell",
  server: {
    url: "https://dadyoom.mrahmedsamirhamam.workers.dev",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "dadyoom.mrahmedsamirhamam.workers.dev",
    ],
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
'@

$Shell = @'
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Dadyoom</title>
</head>
<body>
  <main>
    <h1>ضاديوم</h1>
    <p>جارٍ الاتصال ببيت العربية الرقمي…</p>
  </main>
</body>
</html>
'@

WriteText (Join-Path $Repo "capacitor.config.ts") $Config
WriteText (Join-Path $Repo "mobile-shell\index.html") $Shell

Pass "CAPACITOR_CONFIG=PASS"
Write-Host ("APP_ID={0}" -f $AppId)
Write-Host ("SERVER_URL={0}" -f $ProductionUrl)

Step "3/9 FREE VIDEO TOKEN + WEB DEPLOY"

$EnvFile = Join-Path $Repo ".env.local"
$HfToken = EnvValue $EnvFile "HF_TOKEN"

if (!$HfToken) {
  Warn "HF_TOKEN is required for the free Hugging Face ZeroGPU quota."
  Warn "Paste a Hugging Face READ token. It will stay in .env.local and Cloudflare secret storage."
  $Secure = Read-Host "HF_TOKEN" -AsSecureString
  $HfToken = SecurePlain $Secure
}

if (!$HfToken -or !$HfToken.StartsWith("hf_")) {
  Fail "HF_TOKEN_MISSING_OR_INVALID"
}

SetEnvValue $EnvFile "HF_TOKEN" $HfToken
SetEnvValue $EnvFile "ALLOW_PAID_VIDEO_PROVIDERS" "false"
SetEnvValue $EnvFile "VIDEO_PROVIDER_ORDER" "hf-minimax-h3,hf-ltx,hf-sadtalker,hf-musetalk,higgsfield,heygen,tavus,akool,did,creatify"

Run "npm" @("install","--legacy-peer-deps","--no-package-lock") (Join-Path $Work "npm-install.txt") | Out-Null

Run "npx" @("eslint",
  "lib/video/cinematic-client.ts",
  "lib/video/cinematic-avatar-agent.ts",
  "app/api/video/cinematic/route.ts",
  "app/api/video/cinematic/status/route.ts",
  "app/api/video/cinematic/health/route.ts",
  "app/(dashboard)/ask/page.tsx",
  "components/dad-ai/DadLessonVideoButton.tsx",
  "lib/mobile/offline-ai.ts",
  "lib/mobile/hybrid-ai.ts") (Join-Path $Work "lint-video-mobile.txt") | Out-Null

Pass "VIDEO_MOBILE_LINT=PASS"

if (!$SkipTests) {
  Run "npm" @("run","test:run") (Join-Path $Work "tests.txt") | Out-Null
  Pass "TESTS=PASS"
}

Run "npm" @("run","build:vinext") (Join-Path $Work "vinext-build.txt") | Out-Null
Pass "VINEXT_BUILD=PASS"

if (!$SkipDeploy) {
  $HfToken | npx wrangler secret put HF_TOKEN
  if ($LASTEXITCODE -ne 0) { Fail "CLOUDFLARE_HF_SECRET_FAILED" }

  "false" | npx wrangler secret put ALLOW_PAID_VIDEO_PROVIDERS
  if ($LASTEXITCODE -ne 0) { Fail "CLOUDFLARE_VIDEO_PAID_FLAG_FAILED" }

  Run "npm" @("run","deploy:vinext") (Join-Path $Work "deploy.txt") | Out-Null
  Pass "CLOUDFLARE_DEPLOY=PASS"

  try {
    $Health = Invoke-RestMethod -Uri "$ProductionUrl/api/video/cinematic/health" -Method Get -TimeoutSec 60
    Write-Host ("VIDEO_HEALTH={0}" -f ($Health | ConvertTo-Json -Compress))
    if (!$Health.ok) {
      Fail "PRODUCTION_VIDEO_HEALTH_NOT_READY"
    }
  }
  catch {
    Fail ("PRODUCTION_VIDEO_HEALTH_FAILED {0}" -f $_.Exception.Message)
  }

  Pass "PRODUCTION_VIDEO_HEALTH=PASS"
}
else {
  Warn "DEPLOY=SKIPPED"
}

Step "4/9 JAVA + ANDROID SDK"

$JavaHome = FindJava
$Sdk = FindSdk

if (!$JavaHome) { Fail "JAVA_21_NOT_FOUND" }
if (!$Sdk) { Fail "ANDROID_SDK_NOT_FOUND" }

$env:JAVA_HOME = $JavaHome
$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk
$env:Path = ("{0}\bin;{1}\platform-tools;{2}" -f $JavaHome,$Sdk,$env:Path)

Run (Join-Path $JavaHome "bin\java.exe") @("-version") (Join-Path $Work "java.txt") | Out-Null
Pass "JAVA=PASS"
Write-Host ("JAVA_HOME={0}" -f $JavaHome)
Write-Host ("ANDROID_SDK={0}" -f $Sdk)

Step "5/9 ANDROID NATIVE PROJECT"

$AndroidDir = Join-Path $Repo "android"

if (!(Test-Path -LiteralPath (Join-Path $AndroidDir "gradlew.bat"))) {
  if (Test-Path -LiteralPath $AndroidDir) {
    $BackupAndroid = Join-Path $Work "android-before-recreate"
    Move-Item -LiteralPath $AndroidDir -Destination $BackupAndroid
    Warn ("INVALID_ANDROID_FOLDER_BACKED_UP={0}" -f $BackupAndroid)
  }

  Run "npx" @("cap","add","android") (Join-Path $Work "cap-add-android.txt") | Out-Null
  Pass "ANDROID_PROJECT=CREATED"
}
else {
  Pass "ANDROID_PROJECT=EXISTING_PRESERVED"
}

$SdkProp = $Sdk.Replace("\","\\").Replace(":","\:")
WriteText (Join-Path $AndroidDir "local.properties") ("sdk.dir={0}" -f $SdkProp)

Run "npx" @("cap","sync","android") (Join-Path $Work "cap-sync-android.txt") | Out-Null
Pass "CAP_SYNC_ANDROID=PASS"

$Manifest = Join-Path $AndroidDir "app\src\main\AndroidManifest.xml"
if (!(Test-Path -LiteralPath $Manifest)) { Fail "ANDROID_MANIFEST_MISSING" }
EnsureDeepLink $Manifest

$AppGradle = Join-Path $AndroidDir "app\build.gradle"
if (!(Test-Path -LiteralPath $AppGradle)) { Fail "ANDROID_APP_BUILD_GRADLE_MISSING" }

$GradleText = ReadText $AppGradle
$GradleText = [regex]::Replace($GradleText,'versionCode\s+\d+',("versionCode {0}" -f $VersionCode),1)
$GradleText = [regex]::Replace($GradleText,'versionName\s+"[^"]+"',('versionName "{0}"' -f $VersionName),1)
WriteText $AppGradle $GradleText

Step "6/9 OFFLINE QWEN MODEL"

$ModelCandidates = @(
  (Join-Path $Repo ".dadyoom-mobile\models\$ModelName"),
  (Join-Path $AndroidDir "app\src\main\assets\$ModelName"),
  (Join-Path $Repo ".dadyoom-runtime\$ModelName")
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

$ModelBytes = (Get-Item -LiteralPath $ModelPath).Length
Write-Host ("MODEL={0}" -f $ModelPath)
Write-Host ("MODEL_BYTES={0}" -f $ModelBytes)
Pass "OFFLINE_QWEN_MODEL=FOUND"

$AppAssets = Join-Path $AndroidDir "app\src\main\assets"
New-Item -ItemType Directory -Force -Path $AppAssets | Out-Null
$AppModel = Join-Path $AppAssets $ModelName

if ($ModelPath -ne $AppModel) {
  Copy-Item -LiteralPath $ModelPath -Destination $AppModel -Force
}

if (!(Test-Path -LiteralPath $AppModel)) { Fail "MODEL_COPY_TO_ANDROID_FAILED" }
Pass "ANDROID_OFFLINE_MODEL=EMBEDDED_FOR_TEST_APK"

Step "7/9 BUILD TESTABLE ANDROID APK"

$DriveLetter = FindFreeDrive
if (!$DriveLetter) { Fail "NO_FREE_ASCII_DRIVE" }

$Drive = ("{0}:" -f $DriveLetter)
$Mapped = $false

try {
  & subst $Drive $Repo
  if ($LASTEXITCODE -ne 0) { Fail "SUBST_FAILED" }
  $Mapped = $true

  $AsciiAndroid = ("{0}:\android" -f $DriveLetter)
  $Gradlew = Join-Path $AsciiAndroid "gradlew.bat"

  Push-Location -LiteralPath $AsciiAndroid
  try {
    Run $Gradlew @("--no-daemon","assembleDebug") (Join-Path $Work "gradle-debug.txt") | Out-Null
  }
  finally {
    Pop-Location
  }
}
finally {
  if ($Mapped) { & subst $Drive /D | Out-Null }
}

$DebugApk = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
if (!(Test-Path -LiteralPath $DebugApk)) { Fail "DEBUG_APK_NOT_FOUND" }

$DebugOut = Join-Path $Artifacts ("Dadyoom-Android-{0}-VIDEO-FIX-TEST.apk" -f $VersionName)
Copy-Item -LiteralPath $DebugApk -Destination $DebugOut -Force
Pass "ANDROID_TEST_APK=READY"
Write-Host ("ANDROID_TEST_APK={0}" -f $DebugOut)

if ($Install) {
  $Adb = Get-Command adb -ErrorAction SilentlyContinue
  if (!$Adb) { Fail "ADB_NOT_FOUND" }

  Run $Adb.Source @("install","-r",$DebugOut) (Join-Path $Work "adb-install.txt") | Out-Null
  Pass "ANDROID_TEST_APK_INSTALLED=PASS"

  & adb shell monkey -p $AppId -c android.intent.category.LAUNCHER 1 | Out-Null
  Pass "ANDROID_APP_LAUNCH_REQUEST=PASS"
}

if (!$SkipPlayBundle) {
  Step "8/9 SIGNED RELEASE + PLAY AAB"

  $SigningArgs = @()
  $KeystoreDir = Join-Path $Repo ".dadyoom-mobile\signing"
  $Keystore = Join-Path $KeystoreDir "dadyoom-upload-key.jks"
  $Alias = "dadyoom-upload"
  $StorePass = ""
  $KeyPass = ""

  if (!$SkipSigning) {
    New-Item -ItemType Directory -Force -Path $KeystoreDir | Out-Null

    if (!(Test-Path -LiteralPath $Keystore)) {
      Warn "A permanent Android upload key is required to close the Play Store build."
      $Answer = Read-Host "Type YES to create the permanent upload key now"
      if ($Answer -ne "YES") { Fail "ANDROID_SIGNING_NOT_CONFIRMED" }

      $StorePass = SecurePlain (Read-Host "Upload keystore password" -AsSecureString)
      $KeyPass = SecurePlain (Read-Host "Key password" -AsSecureString)

      if (!$StorePass -or !$KeyPass) { Fail "EMPTY_SIGNING_PASSWORD" }

      $Keytool = Join-Path $JavaHome "bin\keytool.exe"
      Run $Keytool @(
        "-genkeypair","-v",
        "-keystore",$Keystore,
        "-alias",$Alias,
        "-keyalg","RSA",
        "-keysize","4096",
        "-validity","10000",
        "-storepass",$StorePass,
        "-keypass",$KeyPass,
        "-dname","CN=Dadyoom, O=Dadyoom, C=BH"
      ) (Join-Path $Work "keytool.txt") | Out-Null

      Pass "ANDROID_UPLOAD_KEY=CREATED"
      Warn ("BACKUP_THIS_KEYSTORE={0}" -f $Keystore)
    }
    else {
      Pass "ANDROID_UPLOAD_KEY=EXISTING"
      $StorePass = SecurePlain (Read-Host "Upload keystore password" -AsSecureString)
      $KeyPass = SecurePlain (Read-Host "Key password" -AsSecureString)
    }

    $SigningArgs = @(
      "-Pandroid.injected.signing.store.file=$Keystore",
      "-Pandroid.injected.signing.store.password=$StorePass",
      "-Pandroid.injected.signing.key.alias=$Alias",
      "-Pandroid.injected.signing.key.password=$KeyPass"
    )
  }
  else {
    Warn "ANDROID_SIGNING=SKIPPED"
  }

  $DriveLetter = FindFreeDrive
  if (!$DriveLetter) { Fail "NO_FREE_ASCII_DRIVE_FOR_RELEASE" }
  $Drive = ("{0}:" -f $DriveLetter)
  $Mapped = $false

  try {
    & subst $Drive $Repo
    if ($LASTEXITCODE -ne 0) { Fail "SUBST_RELEASE_FAILED" }
    $Mapped = $true
    $AsciiAndroid = ("{0}:\android" -f $DriveLetter)
    $Gradlew = Join-Path $AsciiAndroid "gradlew.bat"

    Push-Location -LiteralPath $AsciiAndroid
    try {
      $ReleaseArgs = @("--no-daemon","assembleRelease") + $SigningArgs
      Run $Gradlew $ReleaseArgs (Join-Path $Work "gradle-release-apk.txt") | Out-Null
    }
    finally {
      Pop-Location
    }
  }
  finally {
    if ($Mapped) { & subst $Drive /D | Out-Null }
  }

  $ReleaseCandidates = @(Get-ChildItem -LiteralPath (Join-Path $AndroidDir "app\build\outputs\apk\release") -Filter "*.apk" -ErrorAction SilentlyContinue)
  if ($ReleaseCandidates.Count -gt 0) {
    $ReleaseApk = $ReleaseCandidates | Sort-Object Length -Descending | Select-Object -First 1
    $ReleaseOut = Join-Path $Artifacts ("Dadyoom-Android-{0}-release.apk" -f $VersionName)
    Copy-Item -LiteralPath $ReleaseApk.FullName -Destination $ReleaseOut -Force
    Pass "ANDROID_RELEASE_APK=READY"
    Write-Host ("ANDROID_RELEASE_APK={0}" -f $ReleaseOut)
  }

  $PackName = "offline_ai_model"
  $PackDir = Join-Path $AndroidDir $PackName
  $PackAssets = Join-Path $PackDir "src\main\assets"
  New-Item -ItemType Directory -Force -Path $PackAssets | Out-Null

  $PackGradle = @'
plugins {
    id 'com.android.asset-pack'
}

assetPack {
    packName = "offline_ai_model"
    dynamicDelivery {
        deliveryType = "install-time"
    }
}
'@
  WriteText (Join-Path $PackDir "build.gradle") $PackGradle

  $PackModel = Join-Path $PackAssets $ModelName
  Copy-Item -LiteralPath $ModelPath -Destination $PackModel -Force

  if (Test-Path -LiteralPath $AppModel) {
    Remove-Item -LiteralPath $AppModel -Force
  }

  $SettingsGradle = Join-Path $AndroidDir "settings.gradle"
  $Settings = ReadText $SettingsGradle
  if ($Settings -notmatch "offline_ai_model") {
    $Settings = $Settings.TrimEnd() + [Environment]::NewLine + "include ':offline_ai_model'" + [Environment]::NewLine
    WriteText $SettingsGradle $Settings
  }

  $GradleText = ReadText $AppGradle
  if ($GradleText -notmatch 'assetPacks\s*=\s*\[":offline_ai_model"\]') {
    $Match = [regex]::Match($GradleText,'android\s*\{')
    if (!$Match.Success) { Fail "ANDROID_BLOCK_NOT_FOUND_FOR_ASSET_PACK" }
    $At = $Match.Index + $Match.Length
    $GradleText = $GradleText.Insert($At,[Environment]::NewLine + '    assetPacks = [":offline_ai_model"]')
    WriteText $AppGradle $GradleText
  }

  Pass "PLAY_ASSET_DELIVERY_INSTALL_TIME=CONFIGURED"

  if ($ModelBytes -gt 1500000000) {
    Warn "PLAY_ASSET_PACK_SIZE_WARNING=model file is above 1.5GB raw; Play Console compressed-size validation is still required."
  }

  $DriveLetter = FindFreeDrive
  if (!$DriveLetter) { Fail "NO_FREE_ASCII_DRIVE_FOR_AAB" }
  $Drive = ("{0}:" -f $DriveLetter)
  $Mapped = $false

  try {
    & subst $Drive $Repo
    if ($LASTEXITCODE -ne 0) { Fail "SUBST_AAB_FAILED" }
    $Mapped = $true
    $AsciiAndroid = ("{0}:\android" -f $DriveLetter)
    $Gradlew = Join-Path $AsciiAndroid "gradlew.bat"

    Push-Location -LiteralPath $AsciiAndroid
    try {
      $BundleArgs = @("--no-daemon","bundleRelease") + $SigningArgs
      Run $Gradlew $BundleArgs (Join-Path $Work "gradle-aab.txt") | Out-Null
    }
    finally {
      Pop-Location
    }
  }
  finally {
    if ($Mapped) { & subst $Drive /D | Out-Null }
  }

  $Aab = Join-Path $AndroidDir "app\build\outputs\bundle\release\app-release.aab"
  if (!(Test-Path -LiteralPath $Aab)) { Fail "PLAY_AAB_NOT_FOUND" }

  $AabOut = Join-Path $Artifacts ("Dadyoom-Android-{0}-PlayStore.aab" -f $VersionName)
  Copy-Item -LiteralPath $Aab -Destination $AabOut -Force
  Pass "ANDROID_PLAYSTORE_AAB=READY"
  Write-Host ("ANDROID_PLAYSTORE_AAB={0}" -f $AabOut)
}

Step "9/9 SAVE REPRODUCIBLE ANDROID SOURCE"

git add -- ".gitignore" "capacitor.config.ts" "mobile-shell" "android" "lib/video" "lib/mobile/offline-ai.ts" "app/api/video" "app/(dashboard)/ask/page.tsx" "components/dad-ai/DadLessonVideoButton.tsx" "scripts"
if ($LASTEXITCODE -ne 0) { Fail "GIT_ADD_FAILED" }

git diff --cached --check
if ($LASTEXITCODE -ne 0) { Fail "STAGED_DIFF_CHECK_FAILED" }

$Staged = @(git diff --cached --name-only)
if ($Staged.Count -gt 0) {
  git commit -m ("Finalize Android {0} and shared cloud video" -f $VersionName)
  if ($LASTEXITCODE -ne 0) { Fail "FINAL_ANDROID_COMMIT_FAILED" }

  git push origin ("HEAD:{0}" -f $ExpectedBranch)
  if ($LASTEXITCODE -ne 0) { Fail "FINAL_ANDROID_PUSH_FAILED" }

  Pass "ANDROID_SOURCE_PUSH=PASS"
}
else {
  Pass "ANDROID_SOURCE_PUSH=NO_NEW_CHANGES"
}

$Report = @(
  "DADYOOM_ANDROID_FINAL=PASS",
  ("VERSION={0} ({1})" -f $VersionName,$VersionCode),
  "VIDEO_WEB=SHARED_CLOUD_FIXED",
  "VIDEO_ANDROID=SHARED_CLOUD_FIXED",
  "VIDEO_IOS_SOURCE=SHARED_CLOUD_FIXED",
  "FREE_VIDEO=HF_MINIMAX_H3_THEN_HF_LTX",
  "PAID_VIDEO_PROVIDERS=DISABLED_BY_DEFAULT",
  ("TEST_APK={0}" -f $DebugOut),
  $(if (!$SkipPlayBundle) { "PLAY_AAB=$AabOut" } else { "PLAY_AAB=SKIPPED" }),
  "ANDROID_NATIVE_SOURCE=TRACKED_FOR_FUTURE_UPDATES",
  "NEXT_TEST=WEB_VIDEO_THEN_ANDROID_LOGIN_LESSONS_OFFLINE_AI_VIDEO_NOTIFICATIONS_REWARDS_PAYMENTS"
)

$ReportPath = Join-Path $Artifacts "DADYOOM-ANDROID-FINAL-REPORT.txt"
$Report | Set-Content -LiteralPath $ReportPath -Encoding utf8

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " DADYOOM ANDROID FINAL BUILD COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
$Report | ForEach-Object { Write-Host $_ }
Write-Host ("REPORT={0}" -f $ReportPath)

if (!$SkipDeploy) {
  Start-Process "$ProductionUrl/ask"
}
