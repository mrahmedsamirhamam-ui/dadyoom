param(
  [string]$Repo = "mrahmedsamirhamam-ui/dadyoom",
  [string]$Branch = "fix/mobile-cloud-video-final-20260923",
  [Parameter(Mandatory=$true)][string]$CertificateP12,
  [Parameter(Mandatory=$true)][string]$ProvisioningProfile,
  [Parameter(Mandatory=$true)][string]$TeamId,
  [string]$SigningIdentity = "Apple Distribution"
)

$ErrorActionPreference = "Stop"

if (!(Get-Command gh -ErrorAction SilentlyContinue)) { throw "GitHub CLI (gh) is required." }
& gh auth status
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI is not authenticated. Run: gh auth login" }

$cert = (Resolve-Path -LiteralPath $CertificateP12).Path
$profile = (Resolve-Path -LiteralPath $ProvisioningProfile).Path

if ([IO.Path]::GetExtension($cert).ToLowerInvariant() -notin @(".p12", ".pfx")) { throw "CertificateP12 must point to a .p12 or .pfx file exported with its private key." }
if ([IO.Path]::GetExtension($profile).ToLowerInvariant() -ne ".mobileprovision") { throw "ProvisioningProfile must point to an Apple .mobileprovision Ad Hoc profile." }
if ((Get-Item -LiteralPath $cert).Length -lt 1000) { throw "The certificate file is unexpectedly small." }
if ((Get-Item -LiteralPath $profile).Length -lt 1000) { throw "The provisioning profile file is unexpectedly small." }

$secure = Read-Host "Password used when exporting the Apple .p12 certificate" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $certPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

if ([string]::IsNullOrWhiteSpace($certPassword)) { throw "Certificate password cannot be empty." }

$certB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($cert))
$profileB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($profile))

$certB64 | & gh secret set DADYOOM_IOS_CERTIFICATE_P12_BASE64 --repo $Repo
$certPassword | & gh secret set DADYOOM_IOS_CERTIFICATE_PASSWORD --repo $Repo
$profileB64 | & gh secret set DADYOOM_IOS_PROVISIONING_PROFILE_BASE64 --repo $Repo
$TeamId | & gh secret set DADYOOM_IOS_TEAM_ID --repo $Repo
$SigningIdentity | & gh secret set DADYOOM_IOS_SIGNING_IDENTITY --repo $Repo
if ($LASTEXITCODE -ne 0) { throw "Failed to configure one or more GitHub iOS signing secrets." }

Write-Host "IOS_SIGNING_SECRETS=CONFIGURED" -ForegroundColor Green

& gh workflow run native-mobile-build.yml --repo $Repo --ref $Branch -f publish_android_release=false -f build_android=false -f build_ios=true -f ios_sign_ad_hoc=true
if ($LASTEXITCODE -ne 0) { throw "Failed to trigger the signed iOS workflow." }

Write-Host "IOS_SIGNED_BUILD_TRIGGERED=PASS" -ForegroundColor Green
Write-Host "The resulting Ad Hoc IPA installs only on device UDIDs included in the provisioning profile." -ForegroundColor Yellow
