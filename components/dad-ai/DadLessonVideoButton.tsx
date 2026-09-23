"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  generateCinematicVideo,
  openGeneratedVideo,
} from "@/lib/video/cinematic-client";

function lessonIdFromPath() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  const match =
    window.location.pathname.match(
      /\/lessons\/([^/?#]+)/u,
    );

  return match?.[1]
    ? decodeURIComponent(
        match[1],
      )
    : "";
}

export default function DadLessonVideoButton({
  lessonTitle,
}: {
  lessonTitle: string;
}) {
  const [busy, setBusy] =
    useState(false);
  const [status, setStatus] =
    useState("");
  const [error, setError] =
    useState("");
  const [videoUrl, setVideoUrl] =
    useState("");

  const videoPrompt =
    useMemo(
      () =>
        [
          "أنشئ فيديو تعليمي عربي واضح وممتع لهذا الدرس.",
          `عنوان الدرس: ${lessonTitle || "الدرس الحالي"}.`,
          "استخدم العربية الفصحى السهلة، ومشاهد بصرية قصيرة، وانتقالات هادئة، ولا تنسخ صفحات الكتاب حرفيًا.",
        ].join(" "),
      [lessonTitle],
    );

  async function makeVideo() {
    if (busy) {
      return;
    }

    const lessonId =
      lessonIdFromPath();

    if (!lessonId) {
      setError(
        "افتح درسًا أولًا ثم اطلب الفيديو من ضاد.",
      );
      return;
    }

    setBusy(true);
    setError("");
    setVideoUrl("");
    setStatus(
      "ضاد يجهز فيديو الدرس على السحابة...",
    );

    try {
      const result =
        await generateCinematicVideo({
          lessonId,
          prompt:
            videoPrompt,
          onStatus:
            setStatus,
        });

      setVideoUrl(
        result.videoUrl,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر إنشاء الفيديو.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 rounded-2xl border border-[#d8c493] bg-[#fff8e8] p-3">
      <button
        type="button"
        onClick={() =>
          void makeVideo()
        }
        disabled={busy}
        className="w-full rounded-xl bg-[#123f39] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
      >
        {busy
          ? "ضاد يصنع فيديو الدرس..."
          : "إنشاء فيديو الدرس بالـ AI"}
      </button>

      <p className="mt-2 text-[10px] font-bold leading-5 text-[#8a7650]">
        الرندر يتم على السحابة، لذلك لا يعتمد على قوة الهاتف أو الكمبيوتر.
      </p>

      {status ? (
        <p className="mt-2 text-xs font-bold leading-6 text-[#6f5b37]">
          {status}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-2 rounded-xl bg-rose-50 p-2 text-xs font-bold leading-6 text-rose-800"
        >
          {error}
        </p>
      ) : null}

      {videoUrl ? (
        <div className="mt-3 space-y-2">
          <video
            controls
            playsInline
            preload="metadata"
            src={videoUrl}
            className="w-full rounded-xl bg-black"
          />

          <button
            type="button"
            onClick={() =>
              void openGeneratedVideo(
                videoUrl,
              )
            }
            className="inline-flex w-full items-center justify-center rounded-xl border border-[#c5a866] bg-white px-3 py-2 text-xs font-black text-[#123f39]"
          >
            فتح الفيديو بالحجم الكامل
          </button>
        </div>
      ) : null}
    </div>
  );
}
