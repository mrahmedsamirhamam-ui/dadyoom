#Requires -Version 7.0
[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$Repository = "mrahmedsamirhamam-ui/dadyoom",
  [string]$Branch = "fix/mobile-cloud-video-final-20260923"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$envFile = Join-Path $ProjectRoot ".env.local"

if (-not (Test-Path -LiteralPath $envFile)) {
  throw ".env.local not found: $envFile"
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI (gh) is required."
}

function Read-DotEnvValue {
  param(
    [string]$Path,
    [string[]]$Names
  )

  foreach ($name in $Names) {
    $line = Get-Content -LiteralPath $Path |
      Where-Object {
        $_ -match ("^\s*" + [regex]::Escape($name) + "\s*=")
      } |
      Select-Object -First 1

    if ($null -eq $line) {
      continue
    }

    $value = ($line -split "=", 2)[1].Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    if ($value.Trim()) {
      return $value.Trim()
    }
  }

  return ""
}

$serviceKey = Read-DotEnvValue -Path $envFile -Names @(
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY"
)

if (-not $serviceKey) {
  throw "No Supabase service-role key was found in .env.local."
}

& gh auth status | Out-Null

$serviceKey | & gh secret set SUPABASE_SERVICE_ROLE_KEY --repo $Repository --body -

if ($LASTEXITCODE -ne 0) {
  throw "Failed to set GitHub Actions secret."
}

Write-Host "SUPABASE_SERVICE_ROLE_KEY=CONFIGURED_IN_GITHUB" -ForegroundColor Green

& gh workflow run "mobile-final-verify.yml" --repo $Repository --ref $Branch

if ($LASTEXITCODE -ne 0) {
  throw "Failed to dispatch Mobile Final Verify."
}

Write-Host "AUTHENTICATED_E2E_RETRIGGERED=PASS" -ForegroundColor Green
Write-Host "The secret value was not printed." -ForegroundColor DarkGray
