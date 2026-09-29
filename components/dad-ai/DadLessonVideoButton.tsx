"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  generateCinematicVideo,
  openGeneratedVideo,
} from "@/lib/video/cinematic-client";

export default function DadLessonVideoButton({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const [running, setRunning] =
    useState(false);
  const [status, setStatus] =
    useState(
      "جاهز لإنشاء فيديو قصير من محتوى الدرس.",
    );
  const [error, setError] =
    useState("");
  const [videoUrl, setVideoUrl] =
    useState("");
  const [provider, setProvider] =
    useState("");
  const abortRef =
    useRef<AbortController | null>(
      null,
    );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function generate() {
    if (running) return;

    abortRef.current?.abort();

    const controller =
      new AbortController();

    abortRef.current =
      controller;

    setRunning(true);
    setError("");
    setVideoUrl("");
    setProvider("");

    try {
      const result =
        await generateCinematicVideo({
          lessonId,
          prompt:
            `أنشئ فيديو تعليميًا عربيًا قصيرًا وواضحًا عن درس «${lessonTitle}». اجعله مناسبًا للطالب، بحركة حقيقية، دون كتابة نصوص داخل المشهد، وبمدة قصيرة تقريبًا من 8 إلى 20 ثانية إن كان المحرك يسمح بذلك.`,
          signal:
            controller.signal,
          onStatus:
            setStatus,
        });

      setVideoUrl(
        result.videoUrl,
      );

      setProvider(
        result.provider,
      );

      setStatus(
        "تم إنشاء الفيديو بنجاح ✅",
      );
    } catch (caught) {
      if (
        caught instanceof
          DOMException &&
        caught.name ===
          "AbortError"
      ) {
        return;
      }

      const message =
        caught instanceof Error
          ? caught.message
          : "تعذر إنشاء الفيديو الآن.";

      setError(message);
      setStatus(
        "لم يكتمل الفيديو.",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#d8c493] bg-[#fff8e8] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-[#9f7426]">
            فيديو AI للدرس
          </p>

          <p className="mt-1 text-sm font-bold leading-6 text-[#5f5545]">
            {status}
          </p>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={generate}
          className="rounded-xl bg-[#123f39] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d332e] disabled:cursor-wait disabled:opacity-60"
        >
          {running
            ? "جارٍ الإنشاء..."
            : videoUrl
              ? "إنشاء نسخة جديدة"
              : "إنشاء فيديو الدرس بالـ AI"}
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold leading-6 text-rose-700"
        >
          {error}
        </p>
      ) : null}

      {videoUrl ? (
        <div className="mt-4 space-y-3">
          <video
            controls
            playsInline
            preload="metadata"
            src={videoUrl}
            className="aspect-video w-full rounded-2xl bg-black object-contain"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#7d6d53]">
              اكتمل عبر مسار ضاديوم السحابي
              {provider
                ? ` • ${provider}`
                : ""}
            </span>

            <button
              type="button"
              onClick={() =>
                void openGeneratedVideo(
                  videoUrl,
                )
              }
              className="rounded-full border border-[#caa960] bg-white px-4 py-2 text-xs font-black text-[#6f572d]"
            >
              فتح الفيديو
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
