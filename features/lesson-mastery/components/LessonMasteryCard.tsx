"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type LessonMastery = {
  mastery_score: number;
  correct_answers: number;
  wrong_answers: number;
  asked_questions: number;
  last_question: string | null;
  last_answer: string | null;
  updated_at: string | null;
};

type MasteryResponse = {
  mastery?: LessonMastery;
  error?: string;
};

type LessonMasteryCardProps = {
  lessonId: string;
};

function getRecommendation(
  score: number
): string {
  if (score >= 90) {
    return "أحسنت! يمكنك الانتقال إلى الدرس التالي.";
  }

  if (score >= 70) {
    return "مستواك جيد جدًا. جرّب اختبار الدرس.";
  }

  if (score >= 40) {
    return "واصل الإجابة عن الأسئلة لتثبيت فهمك.";
  }

  return "أعد قراءة الدرس، ثم اسأل ضاد عن الأجزاء الصعبة.";
}

export default function LessonMasteryCard({
  lessonId,
}: LessonMasteryCardProps) {
  const [mastery, setMastery] =
    useState<LessonMastery | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const loadMastery =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/lesson-mastery?lessonId=${encodeURIComponent(
            lessonId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as
            MasteryResponse;

        if (
          !response.ok ||
          data.error
        ) {
          throw new Error(
            data.error ||
              "تعذر تحميل مستوى الإتقان."
          );
        }

        setMastery(
          data.mastery ?? null
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "حدث خطأ غير متوقع."
        );
      } finally {
        setIsLoading(false);
      }
    }, [lessonId]);

  useEffect(() => {
    const initialLoadTimer =
      window.setTimeout(() => {
        void loadMastery();
      }, 0);

    function handleMasteryUpdated(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<{
          lessonId?: string;
        }>;

      if (
        !customEvent.detail
          ?.lessonId ||
        customEvent.detail
          .lessonId === lessonId
      ) {
        void loadMastery();
      }
    }

    window.addEventListener(
      "lesson-mastery-updated",
      handleMasteryUpdated
    );

    return () => {
      window.clearTimeout(
        initialLoadTimer
      );

      window.removeEventListener(
        "lesson-mastery-updated",
        handleMasteryUpdated
      );
    };
  }, [lessonId, loadMastery]);

  if (isLoading) {
    return (
      <section
        dir="rtl"
        className="rounded-3xl bg-white p-6 shadow-sm"
      >
        <p className="text-slate-500">
          جارٍ تحميل مستوى الإتقان...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        dir="rtl"
        className="rounded-3xl border border-red-200 bg-red-50 p-6"
      >
        <p className="text-red-700">
          {error}
        </p>
      </section>
    );
  }

  const score =
    Math.max(
      0,
      Math.min(
        100,
        mastery?.mastery_score ??
          0
      )
    );

  return (
    <section
      dir="rtl"
      className="rounded-3xl bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            تقدمك في الدرس
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            مستوى الإتقان
          </h2>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-5 py-3 text-2xl font-black text-emerald-700">
          {score}%
        </div>
      </div>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
          style={{
            width: `${score}%`,
          }}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">
            {mastery?.correct_answers ??
              0}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            إجابات صحيحة
          </p>
        </div>

        <div className="rounded-2xl bg-red-50 p-4 text-center">
          <p className="text-2xl font-black text-red-700">
            {mastery?.wrong_answers ??
              0}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            إجابات تحتاج مراجعة
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4 text-center">
          <p className="text-2xl font-black text-blue-700">
            {mastery?.asked_questions ??
              0}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            عدد الأسئلة
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">
          توصية ضاد
        </p>

        <p className="mt-2 leading-7 text-slate-800">
          {getRecommendation(score)}
        </p>
      </div>

      {mastery?.last_question ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-700">
            آخر سؤال
          </p>

          <p className="mt-2 leading-7 text-slate-800">
            {mastery.last_question}
          </p>
        </div>
      ) : null}
    </section>
  );
}
