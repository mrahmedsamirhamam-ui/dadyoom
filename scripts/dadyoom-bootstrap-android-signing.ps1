param(
  [string]$Repo = "mrahmedsamirhamam-ui/dadyoom",
  [string]$Branch = "fix/mobile-cloud-video-final-20260923",
  [string]$VersionName = "1.0.0",
  [int]$VersionCode = 1
)

$ErrorActionPreference = "Stop"

function New-StrongSecret([int]$Bytes = 32) {
  $buffer = New-Object byte[] $Bytes
  [Security.Cryptography.RandomNumberGenerator]::Fill($buffer)
  return [Convert]::ToBase64String($buffer).Replace("+","-").Replace("/","_").TrimEnd("=")
}

if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required for the one-time secure secret setup."
}

& gh auth status
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI is not authenticated. Run: gh auth login"
}

$keytool = $null
if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\keytool.exe"))) {
  $keytool = Join-Path $env:JAVA_HOME "bin\keytool.exe"
}
if (!$keytool) {
  $candidate = "G:\DadyoomAndroidTools\microsoft-jdk-21\jdk-21.0.12.1+1\bin\keytool.exe"
  if (Test-Path $candidate) { $keytool = $candidate }
}
if (!$keytool) {
  $cmd = Get-Command keytool -ErrorAction SilentlyContinue
  if ($cmd) { $keytool = $cmd.Source }
}
if (!$keytool) {
  throw "keytool was not found. Java 21 is required."
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$signingDir = Join-Path $root ".dadyoom-mobile\signing"
$keystore = Join-Path $signingDir "dadyoom-upload-key.jks"
New-Item -ItemType Directory -Force -Path $signingDir | Out-Null

$alias = "dadyoom-upload"
$storePass = New-StrongSecret
$keyPass = $storePass

if (Test-Path $keystore) {
  throw "Existing keystore found at $keystore. Preserve its original password; do not replace an existing Android signing identity."
}

& $keytool "-genkeypair" "-v" "-keystore" $keystore "-alias" $alias "-keyalg" "RSA" "-keysize" "4096" "-validity" "10000" "-storepass" $storePass "-keypass" $keyPass "-dname" "CN=Dadyoom, O=Dadyoom, C=BH"
if ($LASTEXITCODE -ne 0) { throw "Failed to create Android signing key." }

Write-Host "ANDROID_UPLOAD_KEY=CREATED" -ForegroundColor Green

$bytes = [IO.File]::ReadAllBytes($keystore)
$b64 = [Convert]::ToBase64String($bytes)

$b64 | & gh secret set DADYOOM_ANDROID_KEYSTORE_B64 --repo $Repo
$storePass | & gh secret set DADYOOM_ANDROID_STORE_PASSWORD --repo $Repo
$keyPass | & gh secret set DADYOOM_ANDROID_KEY_PASSWORD --repo $Repo
$alias | & gh secret set DADYOOM_ANDROID_KEY_ALIAS --repo $Repo
if ($LASTEXITCODE -ne 0) { throw "Failed to set GitHub signing secrets." }

$backupNote = Join-Path $signingDir "BACKUP-ANDROID-SIGNING.txt"
$note = "DADYOOM ANDROID SIGNING BACKUP" + [Environment]::NewLine +
        "Keystore: " + $keystore + [Environment]::NewLine +
        "Alias: " + $alias + [Environment]::NewLine +
        "Store/Key password: " + $storePass + [Environment]::NewLine +
        "IMPORTANT: Keep the JKS and this password in a private backup. Future Android updates must use the same signing key."
$note | Set-Content -LiteralPath $backupNote -Encoding utf8

Write-Host "GitHub signing secrets are configured." -ForegroundColor Green
Write-Host "Private backup note: $backupNote" -ForegroundColor Yellow
Write-Host "Back up the JKS and note securely. Never commit or share them publicly." -ForegroundColor Yellow

& gh workflow run native-mobile-build.yml --repo $Repo --ref $Branch -f publish_android_release=true -f version_name=$VersionName -f version_code=$VersionCode
if ($LASTEXITCODE -ne 0) { throw "Failed to trigger the signed Native Mobile Build." }

Write-Host "SIGNED_NATIVE_BUILD_TRIGGERED=PASS" -ForegroundColor Green
