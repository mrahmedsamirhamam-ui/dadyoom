param(
  [ValidateSet("sandbox", "production")]
  [string]$Environment = "sandbox"
)

$ErrorActionPreference = "Stop"

function Read-PlainSecret {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label
  )

  $secure = Read-Host $Label -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)

  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Set-WorkerSecret {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "$Name is empty."
  }

  Write-Host "Setting $Name..." -ForegroundColor Cyan
  $Value | & npx.cmd wrangler secret put $Name --config "wrangler.jsonc"

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to set $Name."
  }
}

if (-not (Test-Path "wrangler.jsonc")) {
  throw "Run this script from the Dadyoom repository root."
}

Write-Host "DADYOOM PAYMENTS + ADS CONFIGURATION" -ForegroundColor Green
Write-Host "Environment: $Environment"
Write-Host "Secrets are sent directly to Cloudflare and are not written to Git."

$clientToken = Read-PlainSecret "Paddle client-side token"
$priceId = Read-Host "Paddle Plus monthly Price ID (pri_...)"
$webhookSecret = Read-PlainSecret "Paddle webhook endpoint secret"
$apiKey = Read-PlainSecret "Paddle API key"
$adsenseClient = Read-Host "AdSense client (ca-pub-16digits) [optional - press Enter to skip]"

if ($priceId -notmatch '^pri_[a-z0-9]+$') {
  throw "PADDLE_PLUS_PRICE_ID must start with pri_."
}

if ($Environment -eq "sandbox" -and $clientToken -notmatch '^test_') {
  throw "PADDLE_CLIENT_TOKEN must start with test_ in sandbox. Copy the token value, not the ctkn_ entity ID."
}

if ($Environment -eq "production" -and $clientToken -notmatch '^live_') {
  throw "PADDLE_CLIENT_TOKEN must start with live_ in production."
}

if ($apiKey -notmatch '^pdl_(live|sdbx)_apikey_') {
  Write-Warning "Paddle API key does not look like a current Paddle Billing API key."
}

if (
  -not [string]::IsNullOrWhiteSpace($adsenseClient) -and
  $adsenseClient -notmatch '^ca-pub-\d{16}
Set-WorkerSecret -Name "PADDLE_ENVIRONMENT" -Value $Environment
Set-WorkerSecret -Name "PADDLE_CLIENT_TOKEN" -Value $clientToken
Set-WorkerSecret -Name "PADDLE_PLUS_PRICE_ID" -Value $priceId
Set-WorkerSecret -Name "PADDLE_WEBHOOK_SECRET" -Value $webhookSecret
Set-WorkerSecret -Name "PADDLE_API_KEY" -Value $apiKey

if (-not [string]::IsNullOrWhiteSpace($adsenseClient)) {
  Set-WorkerSecret -Name "ADSENSE_CLIENT" -Value $adsenseClient
}
else {
  Write-Host "AdSense skipped. ADSENSE_CLIENT was not configured." -ForegroundColor Yellow
}

# Also expose these values to the local build process without writing them to disk.
$env:PADDLE_ENVIRONMENT = $Environment
$env:PADDLE_CLIENT_TOKEN = $clientToken
$env:PADDLE_PLUS_PRICE_ID = $priceId
$env:PADDLE_WEBHOOK_SECRET = $webhookSecret
$env:PADDLE_API_KEY = $apiKey

if (-not [string]::IsNullOrWhiteSpace($adsenseClient)) {
  $env:ADSENSE_CLIENT = $adsenseClient
}
else {
  Remove-Item Env:ADSENSE_CLIENT -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Cloudflare launch variables configured." -ForegroundColor Green
Write-Host "Next verification commands:" -ForegroundColor Yellow
Write-Host "  npm run lint"
Write-Host "  npm run test:run"
Write-Host "  npm run curriculum:gate:official-22"
Write-Host "  npm run build:vinext"
Write-Host "  npm run deploy:vinext"
Write-Host ""
Write-Host "Paddle webhook URL:"
Write-Host "  https://<production-domain>/api/payments/paddle/webhook"
Write-Host ""
Write-Host "Do not paste these secrets into chat, Git, or screenshots."

) {
  throw "ADSENSE_CLIENT must use the ca-pub-0000000000000000 format, or be left blank to keep AdSense disabled."
}

Set-WorkerSecret -Name "PADDLE_ENVIRONMENT" -Value $Environment
Set-WorkerSecret -Name "PADDLE_CLIENT_TOKEN" -Value $clientToken
Set-WorkerSecret -Name "PADDLE_PLUS_PRICE_ID" -Value $priceId
Set-WorkerSecret -Name "PADDLE_WEBHOOK_SECRET" -Value $webhookSecret
Set-WorkerSecret -Name "PADDLE_API_KEY" -Value $apiKey
Set-WorkerSecret -Name "ADSENSE_CLIENT" -Value $adsenseClient

# Also expose these values to the local build process without writing them to disk.
$env:PADDLE_ENVIRONMENT = $Environment
$env:PADDLE_CLIENT_TOKEN = $clientToken
$env:PADDLE_PLUS_PRICE_ID = $priceId
$env:PADDLE_WEBHOOK_SECRET = $webhookSecret
$env:PADDLE_API_KEY = $apiKey
$env:ADSENSE_CLIENT = $adsenseClient

Write-Host ""
Write-Host "Cloudflare launch variables configured." -ForegroundColor Green
Write-Host "Next verification commands:" -ForegroundColor Yellow
Write-Host "  npm run lint"
Write-Host "  npm run test:run"
Write-Host "  npm run curriculum:gate:official-22"
Write-Host "  npm run build:vinext"
Write-Host "  npm run deploy:vinext"
Write-Host ""
Write-Host "Paddle webhook URL:"
Write-Host "  https://<production-domain>/api/payments/paddle/webhook"
Write-Host ""
Write-Host "Do not paste these secrets into chat, Git, or screenshots."
