"use client";

import {
  FormEvent,
  useState,
} from "react";

import { askDadyoomHybrid } from "@/lib/mobile/hybrid-ai";

type CreateVideoPayload = {
  requestId?: string;
  provider?: string;
  sessionId?: string;
  videoId?: string;
  status?: string;
  degraded?: boolean;
  configuredProviders?: string[];
  error?: string;
};

type VideoStatusPayload = {
  provider?: string;
  status?: "queued" | "generating" | "completed" | "failed";
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  message?: string;
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds,
    );
  });
}

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

  async function createAvatarVideo() {
    if (
      videoBusy
    ) {
      return;
    }

    const cleanPrompt =
      videoPrompt.trim();

    if (
      !cleanPrompt
    ) {
      setVideoError(
        "اكتب برومبت الفيديو أولًا.",
      );
      return;
    }

    setVideoBusy(true);
    setVideoError("");
    setVideoUrl("");
    setVideoStatus(
      "ضاد يبحث عن أفضل محرك فيديو متاح...",
    );

    const attemptedProviders: string[] = [];
    let requestId = "";

    try {
      for (
        let providerAttempt = 0;
        providerAttempt < 8;
        providerAttempt += 1
      ) {
        const createResponse =
          await fetch(
            "/api/video/cinematic",
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  prompt:
                    cleanPrompt,
                  ...(requestId
                    ? {
                        requestId,
                      }
                    : {}),
                }),
            },
          );

        const created =
          (await createResponse.json()) as CreateVideoPayload;

        if (
          !createResponse.ok ||
          !created.sessionId ||
          !created.provider
        ) {
          throw new Error(
            created.error ??
              "لا يوجد محرك فيديو متاح الآن.",
          );
        }

        if (
          created.requestId
        ) {
          requestId =
            created.requestId;
        }

        const provider =
          created.provider;

        if (
          !attemptedProviders.includes(
            provider,
          )
        ) {
          attemptedProviders.push(
            provider,
          );
        }

        let videoId =
          created.videoId ??
          "";

        setVideoStatus(
          created.degraded
            ? "تم اختيار محرك احتياطي. يتم إنشاء الفيديو من البرومبت الذي كتبته..."
            : "يتم الآن إنشاء الفيديو وفق البرومبت الذي كتبته...",
        );

        let providerFailed =
          false;

        for (
          let attempt = 0;
          attempt < 90;
          attempt += 1
        ) {
          await wait(
            attempt < 12
              ? 5000
              : 10000,
          );

          const query =
            new URLSearchParams({
              provider,
              sessionId:
                created.sessionId,
              ...(videoId
                ? {
                    videoId,
                  }
                : {}),
            });

          const statusResponse =
            await fetch(
              `/api/video/cinematic/status?${query.toString()}`,
              {
                cache:
                  "no-store",
              },
            );

          const status =
            (await statusResponse.json()) as VideoStatusPayload;

          if (
            !statusResponse.ok
          ) {
            providerFailed =
              true;
            break;
          }

          if (
            status.videoId
          ) {
            videoId =
              status.videoId;
          }

          if (
            status.status ===
              "completed" &&
            status.videoUrl
          ) {
            setVideoUrl(
              status.videoUrl,
            );
            setVideoStatus(
              "تم إنشاء الفيديو بنجاح ✅",
            );
            return;
          }

          if (
            status.status ===
            "failed"
          ) {
            providerFailed =
              true;
            break;
          }

          setVideoStatus(
            status.status ===
              "queued"
              ? "الفيديو في قائمة المعالجة..."
              : "يتم تصوير وتجهيز المشاهد الآن...",
          );
        }

        if (
          !providerFailed
        ) {
          throw new Error(
            "استغرق إنشاء الفيديو وقتًا أطول من المتوقع.",
          );
        }

        setVideoStatus(
          "المحرك الحالي لم يكمل الفيديو. ضاد ينتقل تلقائيًا للمحرك التالي...",
        );
      }

      throw new Error(
        "جُرّبت المحركات المتاحة ولم يكتمل الفيديو الآن. حاول مرة أخرى لاحقًا.",
      );
    } catch (cause) {
      setVideoError(
        cause instanceof Error
          ? cause.message
          : "تعذر إنشاء فيديو الأفاتار.",
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
              rows={7}
              placeholder="اكتب وصف الفيديو الذي تريده: الموضوع، الأسلوب، الشخصيات، المشاهد، التعليق الصوتي، المدة أو أي تفاصيل مهمة..."
              className="w-full rounded-2xl border border-[#d8c7a6] bg-white px-4 py-4 font-bold leading-8 text-[#3f3931] outline-none focus:border-[#123f39]"
            />

            <button
              type="button"
              onClick={() =>
                void createAvatarVideo()
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
                  src={videoUrl}
                  className="aspect-video w-full rounded-2xl bg-black shadow-lg"
                />
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#b7862d] bg-white px-5 py-3 font-black text-[#123f39]"
                >
                  فتح الفيديو في نافذة جديدة
                </a>
              </div>
            ) : null}

            <p className="text-xs font-bold leading-6 text-[#806f57]">
              ضاد يختار تلقائيًا أول محرك متاح، وإذا انتهت حصته أو فشل التوليد ينتقل للمحرك التالي دون أن يحتاج الطالب إلى تغيير أي إعداد. المحركات الاحتياطية البسيطة قد تستخدم أفاتارًا واحدًا مع بقاء محتوى الدرس والحوار محفوظين.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}