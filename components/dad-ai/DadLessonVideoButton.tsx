"use client";

import { useMemo, useRef, useState } from "react";

type Slide = {
  title: string;
  bullets: string[];
  narration?: string;
  seconds?: number;
};

type StudyResponse = {
  data?: {
    slides?: unknown;
  };
  error?: string;
};

function rows(value: unknown): Slide[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw): Slide | null => {
      if (!raw || typeof raw !== "object") return null;

      const item = raw as Record<string, unknown>;
      const title = String(item.title ?? "").trim();

      if (!title) return null;

      const bullets = Array.isArray(item.bullets)
        ? item.bullets.map((value) => String(value)).filter(Boolean)
        : [];

      return {
        title,
        bullets,
        narration: String(item.narration ?? "").trim() || undefined,
        seconds: Math.max(4, Number(item.seconds ?? 8)),
      };
    })
    .filter((item): item is Slide => item !== null);
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (context.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  return lines;
}

function paintSlide(
  canvas: HTMLCanvasElement,
  item: Slide,
  index: number,
  total: number,
) {
  const context = canvas.getContext("2d");

  if (!context) return;

  context.direction = "rtl";
  context.fillStyle = index === 0 ? "#123f39" : "#fffdf8";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.textAlign = "right";
  context.fillStyle = index === 0 ? "#ffffff" : "#123f39";
  context.font = "bold 48px Arial";

  wrapText(context, item.title, 820)
    .slice(0, 2)
    .forEach((line, lineIndex) => {
      context.fillText(line, 900, 95 + lineIndex * 62);
    });

  context.font = "30px Arial";
  context.fillStyle = index === 0 ? "#f5e7c3" : "#403a31";

  let y = 235;

  for (const bullet of item.bullets.slice(0, 5)) {
    for (const line of wrapText(context, `• ${bullet}`, 760).slice(0, 2)) {
      context.fillText(line, 875, y);
      y += 45;
    }

    y += 15;
  }

  context.font = "18px Arial";
  context.fillStyle = index === 0 ? "#e7d3a5" : "#8d7d60";
  context.fillText(`ضاديوم • ${index + 1}/${total}`, 900, 510);
}

function lessonIdFromPath() {
  if (typeof window === "undefined") return "";

  const match = window.location.pathname.match(
    /\/lessons\/([^/?#]+)/u,
  );

  return match?.[1]
    ? decodeURIComponent(match[1])
    : "";
}

export default function DadLessonVideoButton({
  lessonTitle,
}: {
  lessonTitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const fileName = useMemo(
    () =>
      `${lessonTitle || "درس-ضاديوم"}-AI.webm`
        .replace(/[\\/:*?"<>|]+/gu, "-"),
    [lessonTitle],
  );

  async function narration(text: string) {
    const response = await fetch("/api/dad-voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, 2400),
        mood: "normal",
      }),
    });

    if (!response.ok) {
      throw new Error("تعذر إنشاء صوت الفيديو.");
    }

    return response.arrayBuffer();
  }

  async function makeVideo() {
    if (busy) return;

    const lessonId = lessonIdFromPath();

    if (!lessonId) {
      setStatus("افتح درسًا أولًا ثم اطلب الفيديو من ضاد.");
      return;
    }

    const canvas = canvasRef.current;

    if (
      !canvas ||
      typeof MediaRecorder === "undefined" ||
      typeof canvas.captureStream !== "function"
    ) {
      setStatus(
        "هذا الجهاز لا يدعم تصدير فيديو Canvas محليًا. جرّب Chrome/Edge أو نسخة الجهاز المدعومة.",
      );
      return;
    }

    setBusy(true);
    setStatus("ضاد يجهز سيناريو الفيديو...");

    try {
      const limitResponse = await fetch("/api/usage/consume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature: "video_ai",
        }),
      });

      if (!limitResponse.ok) {
        const payload = (await limitResponse
          .json()
          .catch(() => ({}))) as {
          error?: string;
        };

        throw new Error(
          payload.error ??
            "وصلت إلى حد إنشاء فيديوهات AI اليوم.",
        );
      }

      const storyboardResponse = await fetch(
        "/api/lessons/study",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId,
            task: "video_storyboard",
            question: "",
          }),
        },
      );

      const storyboard =
        (await storyboardResponse.json()) as StudyResponse;

      if (!storyboardResponse.ok || !storyboard.data) {
        throw new Error(
          storyboard.error ??
            "تعذر إنشاء سيناريو الفيديو.",
        );
      }

      const slides = rows(storyboard.data.slides);

      if (!slides.length) {
        throw new Error(
          "لم يصل سيناريو فيديو صالح.",
        );
      }

      setStatus("ضاد يصنع الفيديو على جهازك...");

      const audioContext = new AudioContext();
      await audioContext.resume();

      const audioOut =
        audioContext.createMediaStreamDestination();

      const canvasStream =
        canvas.captureStream(30);

      const combined = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioOut.stream.getAudioTracks(),
      ]);

      const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];

      const mime =
        candidates.find((item) =>
          MediaRecorder.isTypeSupported(item),
        ) ?? "";

      const recorder = new MediaRecorder(
        combined,
        mime ? { mimeType: mime } : undefined,
      );

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) {
          chunks.push(event.data);
        }
      };

      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start(500);

      for (const [index, item] of slides.entries()) {
        paintSlide(
          canvas,
          item,
          index,
          slides.length,
        );

        try {
          const bytes = await narration(
            item.narration ||
              [item.title, ...item.bullets].join(". "),
          );

          const decoded =
            await audioContext.decodeAudioData(
              bytes.slice(0),
            );

          const source =
            audioContext.createBufferSource();

          source.buffer = decoded;
          source.connect(audioOut);
          source.connect(audioContext.destination);

          const ended = new Promise<void>((resolve) => {
            source.onended = () => resolve();
          });

          source.start();
          await ended;
        } catch {
          await wait(
            Math.max(4, item.seconds ?? 8) * 1000,
          );
        }

        await wait(250);
      }

      recorder.stop();
      await stopped;

      const blob = new Blob(chunks, {
        type: recorder.mimeType || "video/webm",
      });

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      const nextUrl = URL.createObjectURL(blob);

      setVideoUrl(nextUrl);
      setStatus(
        "تم إنشاء الفيديو داخل ضاد. يمكنك تشغيله أو تنزيله.",
      );

      await audioContext.close();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "تعذر إنشاء الفيديو.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 rounded-2xl border border-[#d8c493] bg-[#fff8e8] p-3">
      <button
        type="button"
        onClick={() => void makeVideo()}
        disabled={busy}
        className="w-full rounded-xl bg-[#123f39] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
      >
        {busy
          ? "ضاد يصنع فيديو الدرس..."
          : "إنشاء فيديو الدرس بالـ AI"}
      </button>

      {status ? (
        <p className="mt-2 text-xs font-bold leading-6 text-[#6f5b37]">
          {status}
        </p>
      ) : null}

      {videoUrl ? (
        <div className="mt-3 space-y-2">
          <video
            controls
            src={videoUrl}
            className="w-full rounded-xl bg-black"
          />

          <a
            href={videoUrl}
            download={fileName}
            className="inline-flex rounded-xl border border-[#c5a866] bg-white px-3 py-2 text-xs font-black text-[#123f39]"
          >
            تنزيل الفيديو
          </a>
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
