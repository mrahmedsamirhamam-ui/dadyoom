"use client";

import Link from "next/link";

import {
  useState,
  useTransition,
} from "react";

import {
  submitPracticeAction,
} from "../actions/submitPractice";

export type PracticeOption = {
  id: string;
  text: string;
};

export type PracticeQuestion = {
  id: string;
  question: string;
  questionOrder: number;
  options: PracticeOption[];
};

type Props = {
  lessonId: string;
  questions: PracticeQuestion[];
};

type PracticeResult = {
  score: number;
  passScore: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
};

export default function LessonPractice({
  lessonId,
  questions,
}: Props) {
  const [
    answers,
    setAnswers,
  ] = useState<
    Record<string, string>
  >({});

  const [
    result,
    setResult,
  ] =
    useState<
      PracticeResult | null
    >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null);

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const answeredCount =
    Object.keys(
      answers
    ).length;

  function selectAnswer(
    questionId: string,
    optionId: string
  ) {
    if (result) {
      return;
    }

    setAnswers(
      (current) => ({
        ...current,
        [questionId]:
          optionId,
      })
    );
  }

  function submitPractice() {
    setErrorMessage(null);

    if (
      answeredCount <
      questions.length
    ) {
      setErrorMessage(
        `أجب عن جميع الأسئلة أولًا. أجبت عن ${answeredCount} من ${questions.length}.`
      );

      return;
    }

    startTransition(
      async () => {
        try {
          const response =
            await submitPracticeAction(
              lessonId,
              Object.entries(
                answers
              ).map(
                ([
                  questionId,
                  optionId,
                ]) => ({
                  questionId,
                  optionId,
                })
              )
            );

          setResult({
            score:
              response.score,

            passScore:
              response.passScore,

            passed:
              response.passed,

            correctAnswers:
              response.correctAnswers,

            totalQuestions:
              response.totalQuestions,
          });
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "تعذر تصحيح التدريب."
          );
        }
      }
    );
  }

  function retryPractice() {
    setAnswers({});
    setResult(null);
    setErrorMessage(null);
  }

  if (result) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="text-center">
          <div className="text-6xl">
            {result.passed
              ? "🎉"
              : "💪"}
          </div>

          <h2 className="mt-4 text-3xl font-black text-slate-900">
            {result.passed
              ? "أحسنت! اجتزت التدريب"
              : "محاولة جيدة، واصل التدريب"}
          </h2>

          <p className="mt-3 text-slate-600">
            المطلوب لاجتياز التدريب{" "}
            {result.passScore}%.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-5 text-center">
            <div className="text-sm font-bold text-emerald-700">
              النتيجة
            </div>

            <div className="mt-2 text-4xl font-black text-emerald-800">
              {result.score}%
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <div className="text-sm font-bold text-slate-600">
              الإجابات الصحيحة
            </div>

            <div
              dir="ltr"
              className="mt-2 text-4xl font-black text-slate-900"
            >
              {result.correctAnswers}
              {" / "}
              {result.totalQuestions}
            </div>
          </div>
        </div>

        {result.passed ? (
          <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-black text-emerald-900">
              ✅ اكتملت خطوة التدريب.
            </p>

            <p className="mt-2 leading-7 text-emerald-800">
              تم فتح خطوة التقييم التالية في مسارك التكيفي.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/assessment/${lessonId}`}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white transition hover:bg-emerald-700"
              >
                ابدأ التقييم ←
              </Link>

              <Link
                href="/student"
                className="rounded-xl border border-emerald-300 bg-white px-5 py-3 font-black text-emerald-800"
              >
                لوحة الطالب
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={
                retryPractice
              }
              className="rounded-xl bg-amber-600 px-6 py-3 font-black text-white transition hover:bg-amber-700"
            >
              أعد التدريب
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-l from-teal-700 to-emerald-600 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-black text-emerald-100">
          ✍️ الخطوة الثانية
        </p>

        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          تدريب تثبيت المهارة
        </h1>

        <p className="mt-3 max-w-2xl leading-7 text-emerald-50">
          أجب عن جميع الأسئلة. تحتاج إلى 70% على الأقل لفتح التقييم التالي.
        </p>

        <div
          dir="ltr"
          className="mt-5 w-fit rounded-full bg-white/15 px-4 py-2 text-sm font-black"
        >
          {answeredCount}
          {" / "}
          {questions.length}
        </div>
      </div>

      {questions.map(
        (
          question,
          index
        ) => (
          <article
            key={question.id}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 font-black text-teal-800">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black leading-8 text-slate-900">
                  {question.question}
                </h2>

                <div className="mt-5 space-y-3">
                  {question.options.map(
                    (option) => {
                      const selected =
                        answers[
                          question.id
                        ] ===
                        option.id;

                      return (
                        <button
                          key={
                            option.id
                          }
                          type="button"
                          disabled={
                            isPending
                          }
                          onClick={() =>
                            selectAnswer(
                              question.id,
                              option.id
                            )
                          }
                          className={[
                            "flex w-full items-center gap-3 rounded-2xl border p-4 text-right font-bold transition",
                            selected
                              ? "border-teal-500 bg-teal-50 text-teal-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                              selected
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-slate-300",
                            ].join(" ")}
                          >
                            {selected
                              ? "✓"
                              : ""}
                          </span>

                          {option.text}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </article>
        )
      )}

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      <div className="sticky bottom-4 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur">
        <button
          type="button"
          disabled={
            isPending ||
            answeredCount <
              questions.length
          }
          onClick={
            submitPractice
          }
          className="w-full rounded-xl bg-teal-700 px-6 py-4 text-lg font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "جارٍ تصحيح التدريب..."
            : "إنهاء التدريب"}
        </button>
      </div>
    </section>
  );
}