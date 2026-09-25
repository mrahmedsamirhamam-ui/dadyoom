#Requires -Version 7.0
[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$Repository = "mrahmedsamirhamam-ui/dadyoom",
  [string]$Branch = "fix/mobile-cloud-video-final-20260923",
  [string]$ProductionUrl = "https://dadyoom.mrahmedsamirhamam.workers.dev"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Pass([string]$Message) { Write-Host "[PASS] $Message" -ForegroundColor Green }
function Step([string]$Message) { Write-Host ""; Write-Host "==> $Message" -ForegroundColor Cyan }

Set-Location -LiteralPath $ProjectRoot
$currentBranch = (& git branch --show-current).Trim()
if ($currentBranch -ne $Branch) {
  throw "Refusing to switch branches. Current branch is '$currentBranch'; expected '$Branch'."
}

Step "Sync current Dadyoom branch"
& git fetch origin
if ($LASTEXITCODE -ne 0) { throw "git fetch failed." }
& git pull --ff-only origin $Branch
if ($LASTEXITCODE -ne 0) { throw "git pull --ff-only failed." }
Pass "Branch synced: $Branch"

Step "Configure authenticated E2E secret without printing it"
$bootstrap = Join-Path $ProjectRoot "scripts\dadyoom-bootstrap-authenticated-e2e.ps1"
if (-not (Test-Path -LiteralPath $bootstrap)) { throw "Missing bootstrap script: $bootstrap" }
$beforeDispatch = [DateTimeOffset]::UtcNow
& $bootstrap -ProjectRoot $ProjectRoot -Repository $Repository -Branch $Branch
if ($LASTEXITCODE -ne 0) { throw "Authenticated E2E bootstrap failed." }

Step "Resolve the workflow_dispatch run"
$runId = $null
$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline -and -not $runId) {
  Start-Sleep -Seconds 4
  $json = & gh run list --repo $Repository --workflow "mobile-final-verify.yml" --branch $Branch --event workflow_dispatch --limit 10 --json databaseId,createdAt,status,conclusion,headSha
  if ($LASTEXITCODE -ne 0) { throw "Unable to list GitHub workflow runs." }
  $runs = $json | ConvertFrom-Json
  $match = $runs | Where-Object { [DateTimeOffset]$_.createdAt -ge $beforeDispatch.AddSeconds(-10) } | Sort-Object { [DateTimeOffset]$_.createdAt } -Descending | Select-Object -First 1
  if ($null -ne $match) { $runId = [string]$match.databaseId }
}
if (-not $runId) { throw "Could not resolve the newly-dispatched Mobile Final Verify run." }
Write-Host "MOBILE_FINAL_VERIFY_RUN=$runId"

Step "Wait for complete authenticated E2E verification"
& gh run watch $runId --repo $Repository --exit-status
if ($LASTEXITCODE -ne 0) { throw "Mobile Final Verify / authenticated E2E failed. Deployment was NOT started." }
Pass "Authenticated release verification passed"

Step "Deploy verified current branch to Cloudflare"
& npm run deploy:vinext
if ($LASTEXITCODE -ne 0) { throw "Cloudflare production deployment failed." }
Pass "Cloudflare deployment command completed"

Step "Verify production endpoints"
$health = Invoke-WebRequest -Uri ($ProductionUrl.TrimEnd("/") + "/api/ai/health") -UseBasicParsing -TimeoutSec 45
if ($health.StatusCode -ne 200) { throw "Production AI health returned HTTP $($health.StatusCode)." }
$provider = Invoke-WebRequest -Uri ($ProductionUrl.TrimEnd("/") + "/api/auth/provider-status") -UseBasicParsing -TimeoutSec 45
if ($provider.StatusCode -ne 200) { throw "Production auth provider status returned HTTP $($provider.StatusCode)." }
$providerJson = $provider.Content | ConvertFrom-Json
if ($providerJson.google -ne $true) { throw "Production Google provider is not enabled." }
try {
  $version = Invoke-WebRequest -Uri ($ProductionUrl.TrimEnd("/") + "/app-version.json") -UseBasicParsing -TimeoutSec 45
  if ($version.StatusCode -eq 200) { Write-Host "PRODUCTION_APP_VERSION=$($version.Content)" }
} catch {
  Write-Host "PRODUCTION_APP_VERSION=UNAVAILABLE_NON_BLOCKING"
}
Pass "Production AI health"
Pass "Production Google provider"
Pass "Production deploy verification"
Write-Host ""
Write-Host "DADYOOM_FINAL_CLOSURE=PASS" -ForegroundColor Green
