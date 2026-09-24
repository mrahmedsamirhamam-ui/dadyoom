#!/usr/bin/env python3
"""
Dadyoom Wan2.1 smoke/throughput worker.

Purpose:
- Keep public AI video generation disabled while benchmarking.
- Claim ONE queued Supabase benchmark job.
- Render a >=30s lesson video with Wan2.1 T2V 1.3B.
- Abort after the first scene if the measured scene time cannot plausibly
  meet the weekly throughput target.
- Use a second T4 for remaining scenes when a second pipeline fits.

Required Kaggle Secrets:
  DADYOOM_SUPABASE_URL
  DADYOOM_SUPABASE_SERVICE_ROLE_KEY

Optional Kaggle Secret:
  HF_TOKEN
"""

from __future__ import annotations

import asyncio
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

try:
    from kaggle_secrets import UserSecretsClient as _KaggleSecretsClient
except Exception:
    _KaggleSecretsClient = None


def _secret(label: str, *, required: bool) -> str:
    env_value = os.getenv(label, "").strip()
    if env_value:
        return env_value

    if _KaggleSecretsClient is not None:
        try:
            value = _KaggleSecretsClient().get_secret(label)
            if value:
                return str(value).strip()
        except Exception:
            pass

    if required:
        raise RuntimeError(f"Missing Kaggle secret: {label}")
    return ""


SUPABASE_URL = _secret("DADYOOM_SUPABASE_URL", required=True).rstrip("/")
SERVICE_KEY = _secret("DADYOOM_SUPABASE_SERVICE_ROLE_KEY", required=True)
HF_TOKEN = _secret("HF_TOKEN", required=False)

if HF_TOKEN:
    os.environ["HF_TOKEN"] = HF_TOKEN
    os.environ["HUGGING_FACE_HUB_TOKEN"] = HF_TOKEN


def ensure_packages() -> None:
    required = {
        "diffusers": "diffusers>=0.35.0",
        "transformers": "transformers>=4.44.0",
        "accelerate": "accelerate>=0.33.0",
        "imageio_ffmpeg": "imageio-ffmpeg>=0.5.1",
        "edge_tts": "edge-tts>=6.1.12",
        "requests": "requests>=2.31.0",
        "ftfy": "ftfy>=6.2.0",
    }
    missing: list[str] = []
    for module, package in required.items():
        try:
            __import__(module)
        except Exception:
            missing.append(package)

    if missing:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", *missing]
        )


ensure_packages()

import requests
import torch
from diffusers import AutoencoderKLWan, WanPipeline
from diffusers.schedulers.scheduling_unipc_multistep import (
    UniPCMultistepScheduler,
)
from diffusers.utils import export_to_video

MODEL_ID = os.getenv(
    "DADYOOM_WAN_MODEL",
    "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
).strip()

BUCKET = "generated-curriculum-videos"
WORKER_ID = os.getenv(
    "DADYOOM_WORKER_ID",
    f"kaggle-wan-{uuid.uuid4().hex[:10]}",
)

# 41 = 4*k+1, as required by Wan. 41 @ 8 fps ~= 5.125 sec/scene.
NUM_FRAMES = 41
FPS = 8
WIDTH = 832
HEIGHT = 480
INFERENCE_STEPS = 16
GUIDANCE_SCALE = 5.0
MAX_JOBS = 1

# With two T4s, six scenes are three waves. To reach roughly 50 videos within
# 22.5 effective GPU-hours/week, a scene should stay under about 9 minutes.
FIRST_SCENE_MAX_SECONDS = 540.0

VOICE = os.getenv("DADYOOM_ARABIC_VOICE", "ar-SA-HamedNeural").strip()

NEGATIVE = (
    "static image, slideshow, text, subtitles, captions, logos, watermarks, "
    "deformed hands, extra fingers, distorted faces, flicker, jitter, blur, "
    "low quality, duplicate people, malformed anatomy"
)

STYLE = (
    "premium realistic Arabic educational film, modern classroom, natural "
    "Middle Eastern teacher and students, consistent teacher face and wardrobe, "
    "cinematic but believable lighting, smooth camera motion, no readable text"
)

SCENE_TEMPLATES = [
    "Wide establishing shot: teacher introduces the lesson using gestures and real objects.",
    "Medium shot: the same teacher demonstrates two clear contrasting examples.",
    "Student interaction: a learner answers while the teacher guides using physical cards with no writing.",
    "Practical demonstration: teacher and learner apply the idea with real classroom objects.",
    "Close and medium shots: students practice while the teacher gives visual feedback.",
    "Recap: the same teacher summarizes with gestures and ends with an encouraging question.",
]

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}


def request_json(
    method: str,
    url: str,
    *,
    timeout: int = 60,
    **kwargs: Any,
) -> Any:
    response = requests.request(
        method,
        url,
        headers={**HEADERS, **kwargs.pop("headers", {})},
        timeout=timeout,
        **kwargs,
    )
    if not response.ok:
        raise RuntimeError(
            f"HTTP {response.status_code}: {response.text[:1200]}"
        )
    if not response.text:
        return None
    return response.json()


def claim_job() -> dict[str, Any] | None:
    payload = request_json(
        "POST",
        f"{SUPABASE_URL}/rest/v1/rpc/claim_video_batch_job",
        json={"p_worker_id": WORKER_ID},
    )
    if not payload:
        return None
    return dict(payload[0])


def update_job(job_id: str, **values: Any) -> None:
    values["updated_at"] = time.strftime(
        "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
    )
    request_json(
        "PATCH",
        f"{SUPABASE_URL}/rest/v1/video_batch_jobs?id=eq.{job_id}",
        headers={"Prefer": "return=minimal"},
        json=values,
    )


def public_video_url(path: str) -> str:
    safe = "/".join(
        requests.utils.quote(part, safe="")
        for part in path.split("/")
    )
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{safe}"


def upload_video(local_path: Path, remote_path: str) -> str:
    response = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{remote_path}",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "video/mp4",
            "x-upsert": "true",
        },
        data=local_path.read_bytes(),
        timeout=300,
    )
    if not response.ok:
        raise RuntimeError(
            f"Storage upload failed {response.status_code}: "
            f"{response.text[:1200]}"
        )
    return public_video_url(remote_path)


def run(cmd: list[str]) -> None:
    print("$", " ".join(cmd), flush=True)
    subprocess.check_call(cmd)


def ffprobe_duration(path: Path) -> float:
    output = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(output)


def compact_arabic(text: str, max_chars: int = 360) -> str:
    clean = " ".join(str(text or "").split())
    if len(clean) <= max_chars:
        return clean
    short = clean[:max_chars]
    cut = max(
        short.rfind("؟"),
        short.rfind("."),
        short.rfind("،"),
        short.rfind(" "),
    )
    return short[: cut if cut > 80 else max_chars].strip()


def narration_for(job: dict[str, Any]) -> str:
    text = compact_arabic(str(job.get("narration_text") or ""))
    if text:
        return text

    prompt = compact_arabic(str(job.get("prompt_text") or ""), 300)
    return (
        "مرحبًا بك في ضاديوم. "
        f"في هذا الفيديو نتعلم الفكرة التالية: {prompt}. "
        "شاهد الأمثلة، ثم حاول أن تشرح الفكرة بطريقتك."
    )


async def make_tts(text: str, output_path: Path) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(
        text=text,
        voice=VOICE,
        rate="+2%",
        pitch="+10Hz",
    )
    await communicate.save(str(output_path))


def scene_prompt(job: dict[str, Any], scene_index: int) -> str:
    topic = " ".join(str(job.get("prompt_text") or "").split())[:900]
    template = SCENE_TEMPLATES[min(scene_index, len(SCENE_TEMPLATES) - 1)]
    return (
        f"{STYLE}. Educational topic: {topic}. "
        f"Scene {scene_index + 1}: {template} "
        "Keep the SAME teacher, SAME classroom, SAME wardrobe, SAME visual identity."
    )


def load_pipeline(device: str) -> WanPipeline:
    print(
        f"LOADING_WAN_PIPELINE device={device} model={MODEL_ID}",
        flush=True,
    )

    vae = AutoencoderKLWan.from_pretrained(
        MODEL_ID,
        subfolder="vae",
        torch_dtype=torch.float32,
    )
    vae.enable_tiling()
    vae.enable_slicing()

    pipe = WanPipeline.from_pretrained(
        MODEL_ID,
        vae=vae,
        torch_dtype=torch.float16,
    )
    pipe.scheduler = UniPCMultistepScheduler.from_config(
        pipe.scheduler.config,
        flow_shift=5.0,
    )
    pipe.to(device)
    return pipe


def render_scene(
    pipe: WanPipeline,
    device: str,
    prompt: str,
    output_path: Path,
    seed: int,
) -> float:
    started = time.perf_counter()
    generator = torch.Generator(device=device).manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE,
        height=HEIGHT,
        width=WIDTH,
        num_frames=NUM_FRAMES,
        num_inference_steps=INFERENCE_STEPS,
        guidance_scale=GUIDANCE_SCALE,
        generator=generator,
    )

    frames = result.frames[0]
    export_to_video(frames, str(output_path), fps=FPS)

    del result, frames
    with torch.cuda.device(device):
        torch.cuda.empty_cache()

    return time.perf_counter() - started


def concat_scenes(
    scenes: list[Path],
    output_path: Path,
    target_duration: int,
) -> None:
    concat_file = output_path.parent / "concat.txt"
    concat_file.write_text(
        "\n".join(f"file '{scene.as_posix()}'" for scene in scenes)
        + "\n",
        encoding="utf-8",
    )

    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-t",
            str(target_duration),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "21",
            "-pix_fmt",
            "yuv420p",
            "-an",
            str(output_path),
        ]
    )


def mux_audio(
    video_path: Path,
    audio_path: Path,
    output_path: Path,
    target_duration: int,
) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-i",
            str(audio_path),
            "-filter_complex",
            "[1:a]apad=pad_dur=60[a]",
            "-map",
            "0:v:0",
            "-map",
            "[a]",
            "-t",
            str(target_duration),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            str(output_path),
        ]
    )


def fail_job(job: dict[str, Any], exc: BaseException) -> None:
    job_id = str(job.get("id") or "")
    message = str(exc)[:1800]
    code = (
        message.split(":", 1)[0][:120]
        if message
        else type(exc).__name__
    )
    try:
        update_job(
            job_id,
            status="failed",
            error_code=code,
            error_message=message,
            completed_at=time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
            ),
        )
    except Exception as update_error:
        print(
            f"Could not record failure: {update_error}",
            flush=True,
        )


def render_job(
    pipelines: list[tuple[WanPipeline, str]],
    job: dict[str, Any],
) -> None:
    job_id = str(job["id"])
    target = max(30, int(job.get("target_duration_seconds") or 30))
    native_scene_seconds = NUM_FRAMES / FPS
    scene_count = max(6, math.ceil(target / native_scene_seconds))

    update_job(
        job_id,
        status="rendering",
        started_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        model_key=MODEL_ID,
        scene_count=scene_count,
        scene_seconds=int(round(native_scene_seconds)),
        metadata={
            **(job.get("metadata") or {}),
            "benchmark_engine": "wan2.1-t2v-1.3b",
            "fps": FPS,
            "frames_per_scene": NUM_FRAMES,
            "steps": INFERENCE_STEPS,
            "guidance": GUIDANCE_SCALE,
            "width": WIDTH,
            "height": HEIGHT,
            "worker": WORKER_ID,
            "gpu_count": len(pipelines),
        },
    )

    with tempfile.TemporaryDirectory(prefix=f"dadyoom-wan-{job_id[:8]}-") as temp_dir:
        root = Path(temp_dir)
        base_seed = int(
            (job.get("metadata") or {}).get(
                "seed",
                int(job_id.replace("-", "")[:8], 16),
            )
        )

        # First scene alone is the throughput gate.
        first_path = root / "scene-01.mp4"
        first_pipe, first_device = pipelines[0]
        print(
            f"[{job_id}] WAN_SMOKE scene=1/{scene_count} START "
            f"device={first_device}",
            flush=True,
        )
        first_elapsed = render_scene(
            first_pipe,
            first_device,
            scene_prompt(job, 0),
            first_path,
            base_seed,
        )
        print(
            f"[{job_id}] WAN_SMOKE scene=1/{scene_count} DONE "
            f"seconds={first_elapsed:.1f}",
            flush=True,
        )

        if first_elapsed > FIRST_SCENE_MAX_SECONDS:
            raise RuntimeError(
                "WAN_SCENE_TOO_SLOW:"
                f"{first_elapsed:.1f}s>{FIRST_SCENE_MAX_SECONDS:.0f}s"
            )

        scene_results: dict[int, tuple[Path, float]] = {
            0: (first_path, first_elapsed)
        }

        worker_count = max(1, min(len(pipelines), scene_count - 1))

        def render_worker(worker_index: int) -> list[tuple[int, Path, float]]:
            pipe, device = pipelines[worker_index]
            out: list[tuple[int, Path, float]] = []

            for index in range(1 + worker_index, scene_count, worker_count):
                scene_path = root / f"scene-{index + 1:02d}.mp4"
                print(
                    f"[{job_id}] scene {index + 1}/{scene_count} START "
                    f"device={device}",
                    flush=True,
                )
                elapsed = render_scene(
                    pipe,
                    device,
                    scene_prompt(job, index),
                    scene_path,
                    base_seed + index,
                )
                print(
                    f"[{job_id}] scene {index + 1}/{scene_count} DONE "
                    f"seconds={elapsed:.1f} device={device}",
                    flush=True,
                )
                out.append((index, scene_path, elapsed))

            return out

        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            futures = [
                executor.submit(render_worker, worker_index)
                for worker_index in range(worker_count)
            ]
            for future in as_completed(futures):
                for index, scene_path, elapsed in future.result():
                    scene_results[index] = (scene_path, elapsed)

        scenes: list[Path] = []
        gpu_seconds = 0.0
        for index in range(scene_count):
            scene_path, elapsed = scene_results[index]
            scenes.append(scene_path)
            gpu_seconds += elapsed

        silent = root / "silent.mp4"
        concat_scenes(scenes, silent, target)

        audio = root / "narration.mp3"
        asyncio.run(make_tts(narration_for(job), audio))

        final = root / "final.mp4"
        mux_audio(silent, audio, final, target)

        duration = ffprobe_duration(final)
        if duration < 29.5:
            raise RuntimeError(f"FINAL_VIDEO_TOO_SHORT:{duration:.2f}")

        update_job(
            job_id,
            status="uploading",
            gpu_seconds=round(gpu_seconds, 2),
            output_duration_seconds=round(duration, 2),
        )

        country = str(job.get("country_code") or "XX").strip().upper()
        lesson = str(job.get("lesson_id") or job_id)
        remote_path = f"{country}/{lesson}/{job_id}-wan21.mp4"
        output_url = upload_video(final, remote_path)

        update_job(
            job_id,
            status="completed",
            output_path=remote_path,
            output_url=output_url,
            output_duration_seconds=round(duration, 2),
            gpu_seconds=round(gpu_seconds, 2),
            render_seconds=round(gpu_seconds, 2),
            completed_at=time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
            ),
            error_code=None,
            error_message=None,
        )

        print(
            json.dumps(
                {
                    "job": job_id,
                    "status": "completed",
                    "engine": "wan2.1-t2v-1.3b",
                    "duration": duration,
                    "gpu_seconds": gpu_seconds,
                    "url": output_url,
                },
                ensure_ascii=False,
            ),
            flush=True,
        )


def main() -> int:
    print(
        json.dumps(
            {
                "worker": WORKER_ID,
                "model": MODEL_ID,
                "cuda": torch.cuda.is_available(),
                "gpu_count": torch.cuda.device_count()
                if torch.cuda.is_available()
                else 0,
                "gpus": [
                    torch.cuda.get_device_name(i)
                    for i in range(torch.cuda.device_count())
                ]
                if torch.cuda.is_available()
                else [],
                "hf_auth": bool(HF_TOKEN),
                "max_jobs": MAX_JOBS,
            },
            ensure_ascii=False,
        ),
        flush=True,
    )

    if not torch.cuda.is_available():
        raise RuntimeError("KAGGLE_GPU_REQUIRED")

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("FFMPEG_REQUIRED")

    pipelines: list[tuple[WanPipeline, str]] = []
    pipelines.append((load_pipeline("cuda:0"), "cuda:0"))

    if torch.cuda.device_count() >= 2:
        try:
            pipelines.append((load_pipeline("cuda:1"), "cuda:1"))
        except torch.cuda.OutOfMemoryError as exc:
            print(
                f"SECOND_GPU_PIPELINE_OOM fallback=single_gpu error={exc}",
                flush=True,
            )
            with torch.cuda.device(1):
                torch.cuda.empty_cache()
        except Exception as exc:
            print(
                f"SECOND_GPU_PIPELINE_FAILED fallback=single_gpu error={exc}",
                flush=True,
            )

    print(
        f"WAN_PIPELINES_READY count={len(pipelines)}",
        flush=True,
    )

    job = claim_job()
    if job is None:
        print("QUEUE_EMPTY", flush=True)
        return 0

    print(
        f"CLAIMED job={job['id']} "
        f"target={job.get('target_duration_seconds')}s",
        flush=True,
    )

    try:
        render_job(pipelines, job)
    except Exception as exc:
        print(
            f"JOB_FAILED id={job.get('id')} error={exc}",
            flush=True,
        )
        fail_job(job, exc)
        return 1

    print("DADYOOM_WAN_FACTORY_DONE processed=1", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
