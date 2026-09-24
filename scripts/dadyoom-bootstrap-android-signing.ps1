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
  $existingLength = (Get-Item -LiteralPath $keystore).Length
  if ($existingLength -eq 0) {
    Write-Host "Removing zero-byte keystore left by the failed attempt." -ForegroundColor Yellow
    Remove-Item -LiteralPath $keystore -Force
  }
  else {
    throw "Existing keystore found at $keystore. Preserve its original password; do not replace an existing Android signing identity."
  }
}

function New-AsciiSigningTempDir {
  $candidates = @(
    "C:\Users\Public\DadyoomSigningTemp",
    "G:\DadyoomAndroidTools\SigningTemp"
  )

  if ($env:TEMP -and $env:TEMP -notmatch '[^\x00-\x7F]') {
    $candidates += (Join-Path $env:TEMP "DadyoomSigningTemp")
  }

  foreach ($base in $candidates) {
    try {
      New-Item -ItemType Directory -Force -Path $base | Out-Null
      $probe = Join-Path $base (".write-test-" + [Guid]::NewGuid().ToString("N"))
      [IO.File]::WriteAllText($probe, "ok")
      Remove-Item -LiteralPath $probe -Force

      $dir = Join-Path $base ([Guid]::NewGuid().ToString("N"))
      New-Item -ItemType Directory -Force -Path $dir | Out-Null

      if ($dir -match '[^\x00-\x7F]') {
        Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
        continue
      }

      return $dir
    }
    catch {
      continue
    }
  }

  throw "No writable ASCII-only temporary path was found for Java keytool."
}

$tempSigningDir = New-AsciiSigningTempDir
$tempKeystore = Join-Path $tempSigningDir "dadyoom-upload-key.jks"

try {
  Write-Host ("KEYTOOL_TEMP_PATH={0}" -f $tempKeystore)

  & $keytool "-genkeypair" "-v" "-keystore" $tempKeystore "-alias" $alias "-keyalg" "RSA" "-keysize" "4096" "-validity" "10000" "-storepass" $storePass "-keypass" $keyPass "-dname" "CN=Dadyoom, O=Dadyoom, C=BH"
  if ($LASTEXITCODE -ne 0) { throw "Failed to create Android signing key in ASCII temporary path." }

  if (!(Test-Path -LiteralPath $tempKeystore)) {
    throw "keytool reported success but the temporary keystore was not created."
  }

  $tempLength = (Get-Item -LiteralPath $tempKeystore).Length
  if ($tempLength -lt 1000) {
    throw "Generated keystore is unexpectedly small ($tempLength bytes)."
  }

  Copy-Item -LiteralPath $tempKeystore -Destination $keystore -Force

  if (!(Test-Path -LiteralPath $keystore)) {
    throw "Failed to copy Android signing key into the project signing directory."
  }

  $finalLength = (Get-Item -LiteralPath $keystore).Length
  if ($finalLength -ne $tempLength) {
    throw "Android signing key copy verification failed."
  }

  Write-Host "ANDROID_UPLOAD_KEY=CREATED" -ForegroundColor Green
  Write-Host ("ANDROID_UPLOAD_KEY_BYTES={0}" -f $finalLength)

  $bytes = [IO.File]::ReadAllBytes($tempKeystore)
  $b64 = [Convert]::ToBase64String($bytes)
}
finally {
  if (Test-Path -LiteralPath $tempSigningDir) {
    Remove-Item -LiteralPath $tempSigningDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

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
