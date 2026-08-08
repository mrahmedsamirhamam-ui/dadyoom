"use client";

import Link from "next/link";
import {
  useState,
  useTransition,
} from "react";

import {
  completeLessonAction,
} from "../actions/completeLesson";

type Props = {
  progressId: string;
  nextLessonId?: string | null;
};

type CompletionResult = {
  xp: number;
  score: number;
  correctAnswers: number;
  answeredQuestions: number;
  totalQuestions: number;
};

export default function CompleteLessonButton({
  progressId,
  nextLessonId = null,
}: Props) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    completion,
    setCompletion,
  ] =
    useState<CompletionResult | null>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  if (completion) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-4xl">
          🎉
        </div>

        <h3 className="mt-3 text-xl font-black text-emerald-900">
          أحسنت! أنهيت الدرس
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 text-center">
            <div className="text-sm font-bold text-slate-500">
              الدرجة
            </div>

            <div className="mt-1 text-2xl font-black text-emerald-700">
              {completion.score}%
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 text-center">
            <div className="text-sm font-bold text-slate-500">
              الإجابات الصحيحة
            </div>

            <div className="mt-1 text-2xl font-black text-emerald-700">
              {completion.correctAnswers}
              /
              {completion.totalQuestions}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 text-center">
            <div className="text-sm font-bold text-slate-500">
              النقاط
            </div>

            <div className="mt-1 text-2xl font-black text-amber-600">
              +{completion.xp} XP
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {nextLessonId ? (
            <Link
              href={`/lessons/${nextLessonId}`}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
            >
              الدرس التالي ←
            </Link>
          ) : null}

          <Link
            href="/student"
            className="rounded-xl border border-emerald-300 bg-white px-5 py-3 font-bold text-emerald-800 hover:bg-emerald-100"
          >
            لوحة الطالب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() => {
          setErrorMessage(null);

          startTransition(
            async () => {
              try {
                const result =
                  await completeLessonAction(
                    progressId
                  );

                setCompletion({
                  xp:
                    result.xp,
                  score:
                    result.score,
                  correctAnswers:
                    result.correctAnswers,
                  answeredQuestions:
                    result.answeredQuestions,
                  totalQuestions:
                    result.totalQuestions,
                });
              } catch (error) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : "تعذر إنهاء الدرس."
                );
              }
            }
          );
        }}
        className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending
          ? "جارٍ حساب النتيجة..."
          : "إنهاء الدرس"}
      </button>

      {errorMessage ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-4 font-semibold text-amber-900">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}