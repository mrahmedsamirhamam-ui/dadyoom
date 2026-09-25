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

if (-not (Test-Path -LiteralPath $envFile)) { throw ".env.local not found: $envFile" }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "GitHub CLI (gh) is required." }

function Read-DotEnvValue {
  param([string]$Path, [string[]]$Names)
  foreach ($name in $Names) {
    $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match ("^\s*" + [regex]::Escape($name) + "\s*=") } | Select-Object -First 1
    if ($null -eq $line) { continue }
    $value = ($line -split "=", 2)[1].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if ($value.Trim()) { return $value.Trim() }
  }
  return ""
}

# Prefer the modern Supabase secret key over a potentially stale legacy service_role key.
$serviceKey = Read-DotEnvValue -Path $envFile -Names @("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY")
if (-not $serviceKey) { throw "No Supabase elevated server key was found in .env.local. Add SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY." }

$projectUrl = Read-DotEnvValue -Path $envFile -Names @("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")
if (-not $projectUrl) { throw "No Supabase project URL was found in .env.local." }
$projectUrl = $projectUrl.TrimEnd("/")
if ($projectUrl -ne "https://hvqsvtomhlxavmfqoxfz.supabase.co") {
  throw "Supabase URL mismatch. Expected the Dadyoom project URL (project ref hvqsvtomhlxavmfqoxfz)."
}

$keySource = if ($serviceKey.StartsWith("sb_secret_")) { "SUPABASE_SECRET_KEY" } else { "LEGACY_SERVICE_ROLE_OR_SECRET" }
Write-Host "SUPABASE_ELEVATED_KEY_SOURCE=$keySource" -ForegroundColor DarkGray

# Validate the exact elevated key locally before spending a full GitHub Actions run.
# The key and response body are never printed.
try {
  $headers = @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey" }
  $probe = Invoke-WebRequest -Uri ($projectUrl + "/auth/v1/admin/users?page=1&per_page=1") -Headers $headers -Method Get -UseBasicParsing -TimeoutSec 30
  if ($probe.StatusCode -ne 200) { throw "HTTP $($probe.StatusCode)" }
}
catch {
  throw "Supabase elevated key validation failed for Dadyoom (project hvqsvtomhlxavmfqoxfz). The value in .env.local is invalid, disabled, stale, or belongs to another project. Open Supabase Dashboard -> dadyoom -> Settings -> API Keys and copy a current Secret key (sb_secret_...) into SUPABASE_SECRET_KEY. Do not paste the key into chat. No GitHub secret was changed and no workflow was dispatched."
}

Write-Host "SUPABASE_ELEVATED_KEY_LOCAL_VALIDATION=PASS" -ForegroundColor Green
& gh auth status | Out-Null

# Keep the existing Actions secret name for compatibility with the workflow.
$serviceKey | & gh secret set SUPABASE_SERVICE_ROLE_KEY --repo $Repository --body -
if ($LASTEXITCODE -ne 0) { throw "Failed to set GitHub Actions secret." }
Write-Host "SUPABASE_SERVICE_ROLE_KEY=CONFIGURED_IN_GITHUB" -ForegroundColor Green

& gh workflow run "mobile-final-verify.yml" --repo $Repository --ref $Branch
if ($LASTEXITCODE -ne 0) { throw "Failed to dispatch Mobile Final Verify." }

Write-Host "AUTHENTICATED_E2E_RETRIGGERED=PASS" -ForegroundColor Green
Write-Host "The secret value was not printed." -ForegroundColor DarkGray
