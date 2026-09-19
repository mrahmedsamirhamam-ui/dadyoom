"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { askDadyoomHybrid } from "@/lib/mobile/hybrid-ai";

type LessonOption = {
  id: string;
  title: string;
  lessonNumber?: number | null;
};

type LessonsPayload = {
  lessons?: LessonOption[];
  gradeNumber?: number | null;
  countryCode?: string;
  error?: string;
};

type CreateVideoPayload = {
  sessionId?: string;
  videoId?: string;
  status?: string;
  error?: string;
};

type VideoStatusPayload = {
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

  const [lessons, setLessons] =
    useState<LessonOption[]>([]);
  const [
    selectedLessonId,
    setSelectedLessonId,
  ] =
    useState("");
  const [
    loadingLessons,
    setLoadingLessons,
  ] =
    useState(true);
  const [
    videoBusy,
    setVideoBusy,
  ] =
    useState(false);
  const [
    videoStatus,
    setVideoStatus,
  ] =
    useState("");
  const [
    videoError,
    setVideoError,
  ] =
    useState("");
  const [
    videoUrl,
    setVideoUrl,
  ] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadLessons() {
      try {
        const response =
          await fetch(
            "/api/ask/lessons",
            {
              cache:
                "no-store",
            },
          );

        const payload =
          (await response.json()) as LessonsPayload;

        if (
          !active
        ) {
          return;
        }

        if (
          !response.ok
        ) {
          setVideoError(
            payload.error ??
              "تعذر تحميل قائمة الدروس.",
          );
          return;
        }

        const rows =
          Array.isArray(
            payload.lessons,
          )
            ? payload.lessons
            : [];

        setLessons(
          rows,
        );

        if (
          rows[0]?.id
        ) {
          setSelectedLessonId(
            rows[0].id,
          );
        }
      } catch {
        if (
          active
        ) {
          setVideoError(
            "تعذر تحميل قائمة الدروس.",
          );
        }
      } finally {
        if (
          active
        ) {
          setLoadingLessons(
            false,
          );
        }
      }
    }

    void loadLessons();

    return () => {
      active = false;
    };
  }, []);

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

    if (
      !selectedLessonId
    ) {
      setVideoError(
        "اختر درسًا أولًا.",
      );
      return;
    }

    setVideoBusy(true);
    setVideoError("");
    setVideoUrl("");
    setVideoStatus(
      "ضاد يجهز سيناريو الحوار بين الأفاتارين...",
    );

    try {
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
                lessonId:
                  selectedLessonId,
              }),
          },
        );

      const created =
        (await createResponse.json()) as CreateVideoPayload;

      if (
        !createResponse.ok ||
        !created.sessionId
      ) {
        throw new Error(
          created.error ??
            "تعذر بدء إنشاء الفيديو.",
        );
      }

      let videoId =
        created.videoId ??
        "";

      setVideoStatus(
        "يتم الآن تمثيل الدرس بأفاتارين وحوار عربي سينمائي...",
      );

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
          throw new Error(
            status.message ??
              "تعذر متابعة حالة الفيديو.",
          );
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
            "تم إنشاء فيديو الأفاتارين بنجاح ✅",
          );
          return;
        }

        if (
          status.status ===
          "failed"
        ) {
          throw new Error(
            status.message ??
              "تعذر إنشاء الفيديو السينمائي.",
          );
        }

        setVideoStatus(
          status.status ===
            "queued"
            ? "الفيديو في قائمة المعالجة..."
            : "الأفاتاران يصوران المشاهد الآن...",
        );
      }

      throw new Error(
        "استغرق إنشاء الفيديو وقتًا أطول من المتوقع. حاول تحديث الصفحة بعد قليل.",
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
              🎬 Video Agent
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              فيديو أفاتار للدرس
            </h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#e5f2ee]">
              معلم وطالب يتحدثان بالعربية في مشهد تمثيلي سينمائي، بدل شرائح الشرح المتحركة.
            </p>
          </div>

          <div className="space-y-4 p-5 sm:p-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#e2d3b4] bg-white p-4 text-center">
                <div className="text-3xl">
                  👨‍🏫
                </div>
                <div className="mt-2 text-sm font-black text-[#123f39]">
                  أفاتار المعلم
                </div>
              </div>
              <div className="rounded-2xl border border-[#e2d3b4] bg-white p-4 text-center">
                <div className="text-3xl">
                  🧑‍🎓
                </div>
                <div className="mt-2 text-sm font-black text-[#123f39]">
                  أفاتار الطالب
                </div>
              </div>
            </div>

            <label
              htmlFor="video-lesson"
              className="block font-black text-[#123f39]"
            >
              اختر الدرس
            </label>

            <select
              id="video-lesson"
              value={
                selectedLessonId
              }
              onChange={(event) =>
                setSelectedLessonId(
                  event.target.value,
                )
              }
              disabled={
                loadingLessons ||
                videoBusy
              }
              className="w-full rounded-2xl border border-[#d8c7a6] bg-white px-4 py-4 font-bold text-[#3f3931] outline-none focus:border-[#123f39]"
            >
              {loadingLessons ? (
                <option value="">
                  جارٍ تحميل دروس صفك...
                </option>
              ) : lessons.length ? (
                lessons.map(
                  (lesson) => (
                    <option
                      key={
                        lesson.id
                      }
                      value={
                        lesson.id
                      }
                    >
                      {lesson.lessonNumber
                        ? `${lesson.lessonNumber}. `
                        : ""}
                      {lesson.title}
                    </option>
                  ),
                )
              ) : (
                <option value="">
                  لا توجد دروس منشورة لصفك حاليًا
                </option>
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                void createAvatarVideo()
              }
              disabled={
                videoBusy ||
                !selectedLessonId
              }
              className="w-full rounded-2xl bg-[#b7862d] px-6 py-4 font-black text-white shadow-md transition hover:bg-[#9d7021] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {videoBusy
                ? "يتم إنشاء الفيديو…"
                : "🎬 أنشئ فيديو أفاتار للدرس"}
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
              الفيديو يعتمد على محتوى الدرس المنشور داخل ضاديوم، ويُطلب من محرك الأفاتار الحفاظ على شخصيتين ثابتتين وحوار عربي طبيعي.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
