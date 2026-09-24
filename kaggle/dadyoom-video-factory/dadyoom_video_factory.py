#!/usr/bin/env python3
"""
Dadyoom Kaggle Video Factory
----------------------------
Claims server-only jobs from Supabase, renders >=30s educational videos
as multiple short scenes, adds Arabic narration, uploads the final MP4,
and records benchmark timing for weekly-capacity decisions.

Kaggle secrets required:
  DADYOOM_SUPABASE_URL
  DADYOOM_SUPABASE_SERVICE_ROLE_KEY

Recommended first benchmark:
  DADYOOM_MAX_JOBS=10
  DADYOOM_VIDEO_MODEL=zai-org/CogVideoX-2b
"""

from __future__ import annotations

import asyncio
import json
import math
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any

try:
    from kaggle_secrets import UserSecretsClient as _KaggleSecretsClient
except Exception:
    _KaggleSecretsClient = None

def _early_secret(label: str) -> str:
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

    raise RuntimeError(f"Missing Kaggle secret: {label}")

# Fail before package/model downloads when Kaggle secrets are not attached.
SUPABASE_URL = _early_secret("DADYOOM_SUPABASE_URL").rstrip("/")
SERVICE_KEY = _early_secret("DADYOOM_SUPABASE_SERVICE_ROLE_KEY")

def ensure_packages() -> None:
    required = {
        "diffusers": "diffusers>=0.35.0",
        "transformers": "transformers>=4.44.0",
        "accelerate": "accelerate>=0.33.0",
        "imageio_ffmpeg": "imageio-ffmpeg>=0.5.1",
        "edge_tts": "edge-tts>=6.1.12",
        "requests": "requests>=2.31.0",
    }
    missing: list[str] = []
    for module, package in required.items():
        try:
            __import__(module)
        except Exception:
            missing.append(package)
    if missing:
        subprocess.check_call(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "-q",
                *missing,
            ]
        )

ensure_packages()

import requests
import torch
from diffusers import CogVideoXPipeline
from diffusers.utils import export_to_video

BUCKET = "generated-curriculum-videos"
WORKER_ID = os.getenv(
    "DADYOOM_WORKER_ID",
    f"kaggle-{uuid.uuid4().hex[:10]}",
)
MAX_JOBS = max(1, int(os.getenv("DADYOOM_MAX_JOBS", "1")))
MODEL_ID = os.getenv(
    "DADYOOM_VIDEO_MODEL",
    "zai-org/CogVideoX-2b",
).strip()
INFERENCE_STEPS = max(
    12,
    int(os.getenv("DADYOOM_VIDEO_STEPS", "12")),
)
GUIDANCE_SCALE = float(
    os.getenv("DADYOOM_VIDEO_GUIDANCE", "6.0")
)
FPS = max(6, int(os.getenv("DADYOOM_VIDEO_FPS", "8")))
NUM_FRAMES = max(
    33,
    int(os.getenv("DADYOOM_VIDEO_FRAMES", "49")),
)
VOICE = os.getenv(
    "DADYOOM_ARABIC_VOICE",
    "ar-SA-HamedNeural",
).strip()

NEGATIVE = (
    "text, subtitles, captions, letters, logos, watermarks, signs, "
    "deformed hands, extra fingers, distorted faces, frozen image, "
    "slideshow, flicker, jitter, low quality, blur"
)

STYLE = (
    "premium realistic Arabic educational film, modern classroom, "
    "natural Middle Eastern teacher and students, cinematic lighting, "
    "consistent wardrobe and faces, smooth camera motion, warm teal cream "
    "and gold accents, no readable text anywhere in the frame"
)

SCENE_TEMPLATES = [
    "Wide establishing shot. The teacher welcomes learners and introduces the idea using gestures and physical objects.",
    "Medium shot. The same teacher demonstrates the concept with two contrasting real-world examples, using a clean board with no writing.",
    "Over-the-shoulder classroom shot. A student responds while the teacher guides the student using cards and objects with no printed words.",
    "Close and medium alternating shots. The same teacher gives a practical demonstration; students react naturally and participate.",
    "Recap scene. The same teacher and learner review the idea together, ending with an encouraging question and a confident classroom reaction.",
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
        headers={
            **HEADERS,
            **kwargs.pop("headers", {}),
        },
        timeout=timeout,
        **kwargs,
    )
    if not response.ok:
        raise RuntimeError(
            f"HTTP {response.status_code}: "
            f"{response.text[:1000]}"
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
    values["updated_at"] = (
        time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
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
    return (
        f"{SUPABASE_URL}/storage/v1/object/public/"
        f"{BUCKET}/{safe}"
    )

def upload_video(local_path: Path, remote_path: str) -> str:
    data = local_path.read_bytes()
    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{BUCKET}/{remote_path}"
    )
    response = requests.post(
        url,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "video/mp4",
            "x-upsert": "true",
        },
        data=data,
        timeout=300,
    )
    if not response.ok:
        raise RuntimeError(
            f"Storage upload failed {response.status_code}: "
            f"{response.text[:1000]}"
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
    text = compact_arabic(
        str(job.get("narration_text") or "")
    )
    if text:
        return text
    prompt = compact_arabic(
        str(job.get("prompt_text") or ""),
        300,
    )
    return (
        "مرحبًا بك في ضاديوم. "
        f"في هذا الفيديو نتعلم الفكرة التالية: {prompt}. "
        "شاهد الأمثلة البصرية، وفكر في الفرق بينها، "
        "ثم حاول أن تشرح الفكرة بطريقتك في نهاية الفيديو."
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

def scene_prompt(
    job: dict[str, Any],
    scene_index: int,
) -> str:
    topic = " ".join(
        str(job.get("prompt_text") or "").split()
    )[:900]
    template = SCENE_TEMPLATES[
        min(scene_index, len(SCENE_TEMPLATES) - 1)
    ]
    return (
        f"{STYLE}. Educational topic/intent: {topic}. "
        f"Scene {scene_index + 1}: {template} "
        "Keep the SAME teacher, SAME classroom, SAME wardrobe and "
        "same overall visual identity as the other scenes. "
        "Real motion must be visible in people, hands and camera. "
        f"Avoid: {NEGATIVE}."
    )

def load_pipelines() -> list[tuple[CogVideoXPipeline, str]]:
    print(
        json.dumps(
            {
                "worker": WORKER_ID,
                "model": MODEL_ID,
                "cuda": torch.cuda.is_available(),
                "gpu_count": (
                    torch.cuda.device_count()
                    if torch.cuda.is_available()
                    else 0
                ),
                "gpus": (
                    [
                        torch.cuda.get_device_name(i)
                        for i in range(torch.cuda.device_count())
                    ]
                    if torch.cuda.is_available()
                    else []
                ),
            },
            ensure_ascii=False,
        ),
        flush=True,
    )

    if not torch.cuda.is_available():
        raise RuntimeError("KAGGLE_GPU_REQUIRED")

    gpu_count = max(1, min(torch.cuda.device_count(), 2))
    pipelines: list[tuple[CogVideoXPipeline, str]] = []

    for gpu_index in range(gpu_count):
        device = f"cuda:{gpu_index}"
        print(
            f"LOADING_PIPELINE device={device}",
            flush=True,
        )
        pipe = CogVideoXPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16,
        )
        # CogVideoX-2B fits a 16GB T4 in FP16. Keeping it fully on the
        # assigned GPU avoids the severe PCIe/CPU-offload bottleneck.
        pipe.to(device)
        pipe.vae.enable_tiling()
        pipe.vae.enable_slicing()
        pipelines.append((pipe, device))

    return pipelines

def render_scene(
    pipe: CogVideoXPipeline,
    device: str,
    prompt: str,
    output_path: Path,
    seed: int,
) -> float:
    started = time.perf_counter()
    generator = torch.Generator(device="cpu").manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE,
        num_videos_per_prompt=1,
        num_inference_steps=INFERENCE_STEPS,
        num_frames=NUM_FRAMES,
        guidance_scale=GUIDANCE_SCALE,
        generator=generator,
    )

    frames = result.frames[0]
    export_to_video(
        frames,
        str(output_path),
        fps=FPS,
    )

    del result, frames
    if torch.cuda.is_available():
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
        "\n".join(
            f"file '{scene.as_posix()}'"
            for scene in scenes
        )
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

def render_job(
    pipelines: list[tuple[CogVideoXPipeline, str]],
    job: dict[str, Any],
) -> None:
    job_id = str(job["id"])
    target = max(30, int(job.get("target_duration_seconds") or 30))
    requested_scene_seconds = max(
        4,
        int(job.get("scene_seconds") or 6),
    )

    # CogVideoX-2B standard 49 frames at 8 fps ~= 6.1 s.
    native_scene_seconds = NUM_FRAMES / FPS
    scene_count = max(
        int(job.get("scene_count") or 5),
        math.ceil(target / native_scene_seconds),
    )

    # Avoid accidental runaway jobs.
    scene_count = min(scene_count, 12)

    update_job(
        job_id,
        status="rendering",
        started_at=time.strftime(
            "%Y-%m-%dT%H:%M:%SZ",
            time.gmtime(),
        ),
        model_key=MODEL_ID,
        scene_count=scene_count,
        scene_seconds=requested_scene_seconds,
        metadata={
            **(job.get("metadata") or {}),
            "fps": FPS,
            "frames_per_scene": NUM_FRAMES,
            "steps": INFERENCE_STEPS,
            "guidance": GUIDANCE_SCALE,
            "worker": WORKER_ID,
        },
    )

    with tempfile.TemporaryDirectory(
        prefix=f"dadyoom-{job_id[:8]}-"
    ) as temp_dir:
        root = Path(temp_dir)
        scenes: list[Path] = []
        gpu_seconds = 0.0

        base_seed = int(
            (job.get("metadata") or {}).get(
                "seed",
                int(job_id.replace("-", "")[:8], 16),
            )
        )

        scene_results: dict[int, tuple[Path, float]] = {}
        gpu_workers = max(1, min(len(pipelines), scene_count))

        print(
            f"[{job_id}] parallel_gpu_workers={gpu_workers} "
            f"steps={INFERENCE_STEPS}",
            flush=True,
        )

        def render_worker(
            worker_index: int,
        ) -> list[tuple[int, Path, float]]:
            pipe, device = pipelines[worker_index]
            worker_results: list[tuple[int, Path, float]] = []

            for index in range(
                worker_index,
                scene_count,
                gpu_workers,
            ):
                scene_path = root / f"scene-{index + 1:02d}.mp4"
                prompt = scene_prompt(job, index)
                print(
                    f"[{job_id}] scene {index + 1}/{scene_count} "
                    f"START device={device}",
                    flush=True,
                )
                elapsed = render_scene(
                    pipe,
                    device,
                    prompt,
                    scene_path,
                    base_seed + index,
                )
                print(
                    f"[{job_id}] scene {index + 1}/{scene_count} "
                    f"DONE seconds={elapsed:.1f} device={device}",
                    flush=True,
                )
                worker_results.append(
                    (index, scene_path, elapsed)
                )

            return worker_results

        with ThreadPoolExecutor(
            max_workers=gpu_workers,
        ) as executor:
            futures = [
                executor.submit(
                    render_worker,
                    worker_index,
                )
                for worker_index in range(gpu_workers)
            ]

            for future in as_completed(futures):
                for index, scene_path, elapsed in future.result():
                    scene_results[index] = (
                        scene_path,
                        elapsed,
                    )

        for index in range(scene_count):
            scene_path, elapsed = scene_results[index]
            scenes.append(scene_path)
            gpu_seconds += elapsed

        silent = root / "silent.mp4"
        concat_scenes(
            scenes,
            silent,
            target,
        )

        narration = narration_for(job)
        audio = root / "narration.mp3"
        asyncio.run(
            make_tts(
                narration,
                audio,
            )
        )

        final = root / "final.mp4"
        mux_audio(
            silent,
            audio,
            final,
            target,
        )

        duration = ffprobe_duration(final)
        if duration < 29.5:
            raise RuntimeError(
                f"FINAL_VIDEO_TOO_SHORT:{duration:.2f}"
            )

        update_job(
            job_id,
            status="uploading",
            gpu_seconds=round(gpu_seconds, 2),
            output_duration_seconds=round(duration, 2),
        )

        country = (
            str(job.get("country_code") or "XX")
            .strip()
            .upper()
        )
        lesson = str(job.get("lesson_id") or job_id)
        remote_path = (
            f"{country}/{lesson}/{job_id}.mp4"
        )

        output_url = upload_video(
            final,
            remote_path,
        )

        total_render = max(
            gpu_seconds,
            float(job.get("render_seconds") or 0),
        )

        update_job(
            job_id,
            status="completed",
            output_path=remote_path,
            output_url=output_url,
            output_duration_seconds=round(duration, 2),
            gpu_seconds=round(gpu_seconds, 2),
            render_seconds=round(total_render, 2),
            completed_at=time.strftime(
                "%Y-%m-%dT%H:%M:%SZ",
                time.gmtime(),
            ),
            error_code=None,
            error_message=None,
        )

        print(
            json.dumps(
                {
                    "job": job_id,
                    "status": "completed",
                    "duration": duration,
                    "gpu_seconds": gpu_seconds,
                    "url": output_url,
                },
                ensure_ascii=False,
            ),
            flush=True,
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
                "%Y-%m-%dT%H:%M:%SZ",
                time.gmtime(),
            ),
        )
    except Exception as update_error:
        print(
            f"Could not record failure: {update_error}",
            flush=True,
        )

def main() -> int:
    print(
        f"DADYOOM_VIDEO_FACTORY worker={WORKER_ID} "
        f"max_jobs={MAX_JOBS} model={MODEL_ID}",
        flush=True,
    )

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("FFMPEG_REQUIRED")

    pipelines = load_pipelines()
    processed = 0

    while processed < MAX_JOBS:
        job = claim_job()
        if job is None:
            print("QUEUE_EMPTY", flush=True)
            break

        processed += 1
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

    print(
        f"DADYOOM_VIDEO_FACTORY_DONE processed={processed}",
        flush=True,
    )
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
