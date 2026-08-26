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

type RewardBadge = {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
};

type RewardAchievement = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
};

type CompletionResult = {
  xp: number;
  lessonXP: number;
  totalXP: number;
  level: number;
  score: number;
  correctAnswers: number;
  answeredQuestions: number;
  totalQuestions: number;

  levelUp: {
    from: number;
    to: number;
  } | null;

  unlockedBadges:
    RewardBadge[];

  completedAchievements:
    RewardAchievement[];
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
        <div className="text-3xl">
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
              XP المكتسبة الآن
            </div>

            <div className="mt-1 text-2xl font-black text-amber-600">
              +{completion.xp} XP
            </div>
          </div>
        </div>

        {completion.xp === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600">
            سبق أن حصلت على مكافأة هذا المستوى من الدرس.
            حسّن أفضل نتيجتك لتحصل على XP إضافية.
          </div>
        ) : null}

        {completion.levelUp ? (
          <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <div className="text-3xl">
              🚀
            </div>

            <h4 className="mt-2 text-lg font-black text-violet-900">
              ارتقيت إلى المستوى{" "}
              {completion.levelUp.to}
            </h4>

            <p className="mt-1 text-sm font-semibold text-violet-700">
              انتقلت من المستوى{" "}
              {completion.levelUp.from}{" "}
              إلى المستوى{" "}
              {completion.levelUp.to}.
            </p>
          </div>
        ) : null}

        {completion.unlockedBadges.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h4 className="font-black text-amber-900">
              🏆 شارات جديدة
            </h4>

            <div className="mt-3 flex flex-wrap gap-3">
              {completion.unlockedBadges.map(
                (badge) => (
                  <div
                    key={badge.id}
                    className="rounded-xl bg-white px-4 py-3 font-bold text-amber-900 shadow-sm"
                  >
                    <span className="ml-2">
                      {badge.icon}
                    </span>

                    {badge.title}
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}

        {completion.completedAchievements.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <h4 className="font-black text-sky-900">
              🌟 إنجازات مكتملة
            </h4>

            <div className="mt-3 space-y-3">
              {completion.completedAchievements.map(
                (achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-xl bg-white p-4"
                  >
                    <div className="font-black text-sky-900">
                      {achievement.title}
                    </div>

                    <div className="mt-1 text-sm text-sky-700">
                      {achievement.description}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-xl bg-white p-4 text-sm font-semibold text-slate-600">
          إجمالي رصيدك الآن:{" "}
          <strong className="text-amber-700">
            {completion.totalXP} XP
          </strong>
          {" "}• المستوى{" "}
          <strong className="text-violet-700">
            {completion.level}
          </strong>
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

                  lessonXP:
                    result.lessonXP,

                  totalXP:
                    result.totalXP,

                  level:
                    result.level,

                  score:
                    result.score,

                  correctAnswers:
                    result.correctAnswers,

                  answeredQuestions:
                    result.answeredQuestions,

                  totalQuestions:
                    result.totalQuestions,

                  levelUp:
                    result.levelUp,

                  unlockedBadges:
                    result.unlockedBadges,

                  completedAchievements:
                    result.completedAchievements,
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
          ? "جارٍ حساب النتيجة والمكافآت..."
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
