# Dadyoom Kaggle Video Factory

Purpose: produce reusable curriculum videos that are at least 30 seconds long without relying on the learner's device GPU.

## First benchmark

The production database is seeded with 10 Bahrain benchmark jobs covering grades 1–10.

Each job:
- targets 30 seconds;
- renders five or more short scenes;
- uses a consistent classroom/teacher visual brief;
- adds Arabic narration after video generation;
- rejects a final file shorter than 29.5 seconds;
- uploads the MP4 to the Supabase bucket `generated-curriculum-videos`;
- records render/GPU timing in `public.video_batch_jobs`.

Default benchmark model:
`zai-org/CogVideoX-2b`

The model can be changed later with:
`DADYOOM_VIDEO_MODEL`

## Capacity gate

Do not expose this as an unlimited public feature until 10 completed videos are measured.

The database view `public.video_batch_benchmark_summary` uses a conservative 75% of a 30 GPU-hour weekly budget.

Gate:
- PASS: at least 10 completed jobs and estimated safe weekly capacity >= 50 complete videos.
- FAIL: benchmark is complete but the estimated safe capacity is below 50.
- BENCHMARKING: fewer than 10 completed jobs.

Run locally after the Kaggle benchmark:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\dadyoom-video-benchmark-report.ps1"
```

## Kaggle setup

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\dadyoom-kaggle-video-factory-setup.ps1"
```

The setup script creates a private Kaggle script without running it.

Open the created Kaggle notebook and attach these secrets through **Add-ons -> Secrets**:
- `DADYOOM_SUPABASE_URL`
- `DADYOOM_SUPABASE_SERVICE_ROLE_KEY`

Never commit or print the service-role key.

Enable GPU and run the notebook. The worker claims queued jobs one at a time and stops after `DADYOOM_MAX_JOBS` jobs (default 10) or when the queue is empty.
