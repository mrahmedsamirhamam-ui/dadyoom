"use client";

import {
  FormEvent,
  useState,
} from "react";

import { askDadyoomHybrid } from "@/lib/mobile/hybrid-ai";
import {
  generateCinematicVideo,
  openGeneratedVideo,
} from "@/lib/video/cinematic-client";

export default function AskPage() {
  const [question, setQuestion] =
    useState("");
  const [answer, setAnswer] =
    useState("");
  const [error, setError] =
    useState("");
  const [isSending, setIsSending] =
    useState(false);

  const [videoPrompt, setVideoPrompt] =
    useState("");
  const [videoBusy, setVideoBusy] =
    useState(false);
  const [videoStatus, setVideoStatus] =
    useState("");
  const [videoError, setVideoError] =
    useState("");
  const [videoUrl, setVideoUrl] =
    useState("");

  async function ask(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanQuestion =
      question.trim();

    if (
      !cleanQuestion ||
      isSending
    ) {
      return;
    }

    setIsSending(true);
    setError("");
    setAnswer("");

    try {
      const result =
        await askDadyoomHybrid(
          cleanQuestion,
        );

      setAnswer(
        result.text,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر تشغيل ضاد الآن. حاول مرة أخرى.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function createVideo() {
    if (videoBusy) {
      return;
    }

    const cleanPrompt =
      videoPrompt.trim();

    if (!cleanPrompt) {
      setVideoError(
        "اكتب برومبت الفيديو أولًا.",
      );
      return;
    }

    setVideoBusy(true);
    setVideoError("");
    setVideoUrl("");
    setVideoStatus(
      "ضاد يجهز الفيديو على السحابة...",
    );

    try {
      const result =
        await generateCinematicVideo({
          prompt:
            cleanPrompt,
          onStatus:
            setVideoStatus,
        });

      setVideoUrl(
        result.videoUrl,
      );
    } catch (cause) {
      setVideoError(
        cause instanceof Error
          ? cause.message
          : "تعذر إنشاء الفيديو.",
      );
      setVideoStatus("");
    } finally {
      setVideoBusy(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-teal-50 via-white to-white px-4 py-8 sm:px-6"
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-xl shadow-teal-950/5">
          <div className="bg-gradient-to-l from-[#123f39] to-[#1f665c] p-7 text-white sm:p-9">
            <p className="text-sm font-black text-teal-100">
              ضاد · رفيق العربية
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              اسأل ضاد
            </h1>
            <p className="mt-3 text-sm font-bold leading-7 text-teal-50">
              ضاد متخصص في اللغة العربية: شرح، تصحيح، نحو، إملاء، قراءة، كتابة، مفردات وأدب.
            </p>
          </div>

          <form
            onSubmit={ask}
            className="p-5 sm:p-8"
          >
            <label
              htmlFor="dad-question"
              className="font-black text-[#123f39]"
            >
              سؤالك
            </label>

            <textarea
              id="dad-question"
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value,
                )
              }
              placeholder="اكتب سؤالك في اللغة العربية هنا..."
              className="mt-3 min-h-36 w-full rounded-2xl border border-[#d8c7a6] p-4 text-base outline-none focus:border-[#123f39]"
            />

            <button
              type="submit"
              disabled={
                isSending ||
                !question.trim()
              }
              className="touch-manipulation mt-4 w-full rounded-2xl bg-[#123f39] px-6 py-4 font-black text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSending
                ? "ضاد يفكر…"
                : "اسأل ضاد"}
            </button>

            {error ? (
              <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-bold leading-7 text-rose-800">
                {error}
              </div>
            ) : null}

            {answer ? (
              <article className="mt-5 whitespace-pre-wrap rounded-2xl bg-[#eef8f4] p-5 leading-8 text-[#263f3a]">
                {answer}
              </article>
            ) : null}
          </form>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#d8c493] bg-[#fffaf0] shadow-xl shadow-[#123f39]/5">
          <div className="bg-[#0f4942] p-7 text-white sm:p-8">
            <p className="text-sm font-black text-[#f5cf7a]">
              🎬 Video Agent · تجريبي
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              اصنع فيديو بالذكاء الاصطناعي
            </h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#e5f2ee]">
              ميزة تجريبية: اكتب فكرتك وسيحاول ضاديوم إنشاء الفيديو عند توفر مزود سحابي صالح؛ قد تتعذر المحاولة مؤقتًا دون أن يتأثر ضاد أو الدرس.
            </p>
          </div>

          <div className="space-y-4 p-5 sm:p-8">
            <label
              htmlFor="video-prompt"
              className="block font-black text-[#123f39]"
            >
              اكتب برومبت الفيديو
            </label>

            <textarea
              id="video-prompt"
              value={videoPrompt}
              onChange={(event) =>
                setVideoPrompt(
                  event.target.value,
                )
              }
              disabled={videoBusy}
              rows={9}
              placeholder="مثال: أنشئ فيديو تعليمي جذاب عن المبتدأ والخبر، بلغة عربية فصحى واضحة، مع أمثلة بصرية قصيرة وانتقالات هادئة."
              className="w-full rounded-2xl border border-[#d8c7a6] bg-white px-4 py-4 font-bold leading-8 text-[#3f3931] outline-none focus:border-[#123f39]"
            />

            <button
              type="button"
              onClick={() =>
                void createVideo()
              }
              disabled={
                videoBusy ||
                !videoPrompt.trim()
              }
              className="w-full rounded-2xl bg-[#b7862d] px-6 py-4 font-black text-white shadow-md transition hover:bg-[#9d7021] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {videoBusy
                ? "يتم إنشاء الفيديو…"
                : "🎬 أنشئ الفيديو من البرومبت"}
            </button>

            {videoStatus ? (
              <div className="rounded-2xl border border-[#d9c89f] bg-white p-4 text-sm font-bold leading-7 text-[#5d513e]">
                {videoStatus}
              </div>
            ) : null}

            {videoError ? (
              <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-800">
                {videoError}
              </div>
            ) : null}

            {videoUrl ? (
              <div className="space-y-3">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={videoUrl}
                  className="aspect-video w-full rounded-2xl bg-black shadow-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    void openGeneratedVideo(
                      videoUrl,
                    )
                  }
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#b7862d] bg-white px-5 py-3 font-black text-[#123f39]"
                >
                  فتح الفيديو بالحجم الكامل
                </button>
              </div>
            ) : null}

            <p className="text-xs font-bold leading-6 text-[#806f57]">
              إنشاء الفيديو يتم على السحابة وليس على معالج الهاتف. يحاول ضاديوم استخدام مزود بديل عند الفشل، لكن الميزة تظل تجريبية وقد تتوقف مؤقتًا إذا نفدت الحصة أو تعطل المزود.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
