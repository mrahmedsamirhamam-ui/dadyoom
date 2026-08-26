"use client";

import {
  useState,
  useTransition,
} from "react";

import { useRouter } from "next/navigation";

import type {
  WeakQuestion,
} from "../queries/getWeakQuestions";

import {
  resetWeakQuestion,
} from "../actions/resetWeakQuestion";

type Props = {
  lessonId: string;
  questions: WeakQuestion[];
};

export default function WeakQuestionsReview({
  lessonId,
  questions,
}: Props) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    activeQuestionId,
    setActiveQuestionId,
  ] = useState<string | null>(
    null
  );

  if (questions.length === 0) {
    return null;
  }

  function retryQuestion(
    questionId: string
  ) {
    setActiveQuestionId(
      questionId
    );

    startTransition(async () => {
      try {
        await resetWeakQuestion(
          lessonId,
          questionId
        );

        router.refresh();

        /*
         * ننتظر لحظة قصيرة حتى تنتهي
         * إعادة رسم السؤال بعد refresh.
         */
        window.setTimeout(
          () => {
            document
              .getElementById(
                `question-${questionId}`
              )
              ?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });

            setActiveQuestionId(
              null
            );
          },
          250
        );
      } catch (error) {
        console.error(
          "WEAK_QUESTION_RETRY_FAILED",
          error
        );

        setActiveQuestionId(
          null
        );
      }
    });
  }

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-amber-700">
            المراجعة الذكية
          </p>

          <h2 className="mt-1 text-2xl font-black text-amber-950">
            أسئلة تحتاج إلى مراجعة
          </h2>
        </div>

        <div className="w-fit rounded-full bg-amber-200 px-4 py-2 text-sm font-black text-amber-950">
          {questions.length}{" "}
          {questions.length === 1
            ? "سؤال"
            : "أسئلة"}
        </div>
      </div>

      <p className="mt-4 leading-7 text-amber-800">
        أعد الأسئلة التي أخطأت فيها.
        بعد تحسين إجاباتك ستتحدث
        نسبة الإتقان تلقائيًا.
      </p>

      <div className="mt-6 space-y-4">
        {questions.map(
          (
            question,
            index
          ) => {
            const isActive =
              activeQuestionId ===
              question.id;

            return (
              <article
                key={question.id}
                className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 font-black text-amber-800">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-7 text-slate-900">
                      {question.question}
                    </p>

                    {question.explanation ? (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-600">
                        💡 تلميح:{" "}
                        {question.explanation}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        retryQuestion(
                          question.id
                        )
                      }
                      className="mt-4 rounded-xl bg-amber-600 px-5 py-3 font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isActive
                        ? "جارٍ تجهيز السؤال..."
                        : "أعد محاولة السؤال"}
                    </button>
                  </div>
                </div>
              </article>
            );
          }
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4 text-sm leading-7 text-amber-900">
        🎯 الهدف: صحّح الأسئلة الضعيفة
        حتى تصل إلى مستوى الإتقان
        المطلوب لإنهاء الدرس.
      </div>
    </section>
  );
}
