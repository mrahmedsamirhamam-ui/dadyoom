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
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is required for the Supabase key preflight." }

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

# Validate through supabase-js, exactly like the E2E gate, without printing the key.
$env:DADYOOM_E2E_PROBE_URL = $projectUrl
$env:DADYOOM_E2E_PROBE_KEY = $serviceKey
$probeScript = @'
import { createClient } from "@supabase/supabase-js";
const url = process.env.DADYOOM_E2E_PROBE_URL;
const key = process.env.DADYOOM_E2E_PROBE_KEY;
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const { error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
if (error) { console.error("SUPABASE_E2E_KEY_PROBE_FAILED:" + error.message); process.exit(41); }
console.log("SUPABASE_E2E_KEY_PROBE=PASS");
'@
try {
  & node --input-type=module -e $probeScript
  if ($LASTEXITCODE -ne 0) { throw "Supabase key probe failed." }
}
catch {
  throw "Supabase elevated key validation failed for Dadyoom (project hvqsvtomhlxavmfqoxfz). The value in .env.local is invalid, disabled, stale, or belongs to another project. Open Supabase Dashboard -> dadyoom -> Settings -> API Keys and copy a current Secret key (sb_secret_...) into SUPABASE_SECRET_KEY. Do not paste the key into chat. No GitHub secret was changed and no workflow was dispatched."
}
finally {
  Remove-Item Env:DADYOOM_E2E_PROBE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:DADYOOM_E2E_PROBE_KEY -ErrorAction SilentlyContinue
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
