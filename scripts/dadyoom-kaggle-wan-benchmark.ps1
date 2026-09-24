$ErrorActionPreference = "Stop"

$RepoRoot = "G:\ضاضيوم\dadyoom"
$Kaggle = "G:\DadyoomTools\KaggleFactory\python312\Scripts\kaggle.exe"
$WorkDir = Join-Path $RepoRoot ".dadyoom-kaggle\video-factory"

Set-Location $RepoRoot

Write-Host "Pulling Wan benchmark worker..." -ForegroundColor Cyan
git pull --ff-only origin fix/mobile-cloud-video-final-20260923

$Source = Join-Path $RepoRoot "kaggle\dadyoom-video-factory\dadyoom_wan_factory.py"
$Target = Join-Path $WorkDir "dadyoom_video_factory.py"

if (-not (Test-Path $Source)) {
    throw "Wan worker not found: $Source"
}

if (-not (Test-Path $Target)) {
    throw "Kaggle workdir not ready: $Target"
}

Copy-Item $Source $Target -Force

Write-Host "Compiling Wan worker locally..." -ForegroundColor Cyan
& "G:\DadyoomTools\KaggleFactory\python312\python.exe" -m py_compile $Target

Write-Host "Pushing Wan benchmark to Kaggle..." -ForegroundColor Cyan
& $Kaggle kernels push -p $WorkDir --accelerator NvidiaTeslaT4

Write-Host ""
Write-Host "WAN_BENCHMARK_PUSHED=PASS" -ForegroundColor Green
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "1) The automatic CLI run may fail because Kaggle Secrets are not inherited." -ForegroundColor Yellow
Write-Host "2) Open the latest version in Kaggle -> Edit." -ForegroundColor White
Write-Host "3) Enable DADYOOM_SUPABASE_URL and DADYOOM_SUPABASE_SERVICE_ROLE_KEY." -ForegroundColor White
Write-Host "4) HF_TOKEN is optional; do NOT paste it in chat." -ForegroundColor White
Write-Host "5) Internet ON, GPU T4 x2, then Run All from the editor." -ForegroundColor White
Write-Host "6) This benchmark claims ONE queued job only." -ForegroundColor White
