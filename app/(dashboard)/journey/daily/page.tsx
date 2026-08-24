"use client";

import DailyChallengeActionButton from "@/features/gamification/components/DailyChallengeActionButton";
import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

type JourneyStep = {
  id: string;
  number: number;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  minutes: number;
  available: boolean;
  difficulty?: string;
  targetScore?: number;
};

type DailyChallenge = {
  id: string;
  skill:
    | "reading"
    | "writing"
    | "listening"
    | "speaking";
  title: string;
  description: string;
  icon: string;
  href: string;
  targetScore: number;
  bonusLabel: string;
  estimatedMinutes: number;
};
type DailyJourney = {
  studentName: string;
  headline: string;
  message: string;
  completedLessons: number;
  totalXp: number;
  estimatedMinutes: number;
  focusSkill: string;
  focusDifficulty: string;
  targetScore: number;
  steps: JourneyStep[];
  dailyChallenge: DailyChallenge;
};

export default function DailyJourneyPage() {
  const [
    journey,
    setJourney,
  ] =
    useState<
      DailyJourney | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response =
          await fetch(
            "/api/journey/daily",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.error ||
            "تعذر تحميل رحلة اليوم."
          );
        }

        if (active) {
          setJourney(
            data.journey
          );
        }
      }
      catch (requestError) {
        if (active) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "تعذر تحميل رحلة اليوم."
          );
        }
      }
      finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-violet-50 px-4 py-8 sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-5xl">
        <Link
          href="/student"
          className="font-black text-teal-700 hover:underline"
        >
          ← العودة إلى لوحة الطالب
        </Link>

        {loading ? (
          <section className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">
              🧭
            </div>

            <p className="mt-4 font-black text-slate-700">
              ضاد يُعِدُّ رحلة اليوم...
            </p>
          </section>
        ) : error ? (
          <section className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">
            {error}
          </section>
        ) : journey ? (
          <>
            <header className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-l from-teal-800 via-teal-700 to-violet-700 p-7 text-white shadow-xl sm:p-9">
              <p className="text-sm font-black text-teal-100">
                ضاديوم • الرحلة الذكية اليومية
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-5xl">
                🧭 {journey.headline}
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-teal-50">
                {journey.message}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                  <p className="text-xs font-bold text-teal-100">
                    الوقت المتوقع
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {journey.estimatedMinutes} دقيقة
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                  <p className="text-xs font-bold text-teal-100">
                    تركيز اليوم
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {journey.focusSkill}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                  <p className="text-xs font-bold text-teal-100">
                    الهدف
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {journey.targetScore}%
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                  <p className="text-xs font-bold text-teal-100">
                    مجموع XP
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    ⭐ {journey.totalXp}
                  </p>
                </div>
              </div>
            </header>

            {/* DADYOOM_DAILY_CHALLENGE_PANEL */}
            <section className="mt-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-orange-50 p-6 shadow-sm sm:p-8">

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div className="flex gap-4">

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-4xl">
                    {journey.dailyChallenge.icon}
                  </div>

                  <div>

                    <p className="text-sm font-black text-amber-700">
                      🎯 تحدي اليوم
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      {journey.dailyChallenge.title}
                    </h2>

                    <p className="mt-2 max-w-2xl leading-8 text-slate-600">
                      {journey.dailyChallenge.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">

                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-800 ring-1 ring-amber-200">
                        🎯 الهدف:{" "}
                        {journey.dailyChallenge.targetScore}%
                      </span>

                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-700 ring-1 ring-violet-200">
                        ⭐ {journey.dailyChallenge.bonusLabel}
                      </span>

                      <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                        ⏱️ نحو{" "}
                        {journey.dailyChallenge.estimatedMinutes} دقائق
                      </span>

                    </div>
                  </div>
                </div>

                <DailyChallengeActionButton
                  challengeId={
                    journey.dailyChallenge.id
                  }
                  skill={
                    journey.dailyChallenge.skill
                  }
                  title={
                    journey.dailyChallenge.title
                  }
                  targetScore={
                    journey.dailyChallenge.targetScore
                  }
                  href={
                    journey.dailyChallenge.href
                  }
                />

              </div>
            </section>
            <section className="mt-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-teal-700">
                    مسارك اليوم
                  </p>

                  <h2 className="mt-1 text-3xl font-black text-slate-950">
                    3 خطوات فقط
                  </h2>
                </div>

                <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-800">
                  المستوى: {journey.focusDifficulty}
                </span>
              </div>

              <div className="space-y-5">
                {journey.steps.map(
                  (
                    step,
                    index
                  ) => (
                    <article
                      key={step.id}
                      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
                          {step.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-teal-700">
                              {step.eyebrow}
                            </p>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              نحو {step.minutes} دقائق
                            </span>

                            {step.difficulty ? (
                              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                                {step.difficulty}
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-2 text-2xl font-black text-slate-950">
                            {step.title}
                          </h3>

                          <p className="mt-2 leading-8 text-slate-600">
                            {step.description}
                          </p>

                          {typeof step.targetScore ===
                          "number" ? (
                            <p className="mt-3 font-black text-emerald-700">
                              🎯 هدفك في هذه الخطوة: {step.targetScore}%
                            </p>
                          ) : null}
                        </div>

                        <Link
                          href={step.href}
                          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-6 font-black text-white transition hover:bg-teal-700"
                        >
                          {step.action} ←
                        </Link>
                      </div>

                      {index <
                      journey.steps.length -
                        1 ? (
                        <div className="absolute bottom-0 right-8 h-1 w-16 translate-y-1/2 rounded-full bg-teal-200 sm:right-14" />
                      ) : null}
                    </article>
                  )
                )}
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-xl font-black text-amber-950">
                🌟 ماذا يحدث بعد الانتهاء؟
              </h2>

              <p className="mt-3 leading-8 text-amber-900">
                تحفظ ضاديوم نتائجك في الدرس والمهارات والتقييم، ثم يعيد ضاد حساب أفضل خطوة تالية لك. لذلك قد تختلف رحلة الغد تلقائيًا عن رحلة اليوم.
              </p>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/journey"
                className="rounded-2xl border border-teal-700 px-6 py-3 font-black text-teal-700 transition hover:bg-teal-50"
              >
                🗺️ رحلة الضاد الطويلة
              </Link>

              <Link
                href="/skills/adaptive"
                className="rounded-2xl border border-violet-700 px-6 py-3 font-black text-violet-700 transition hover:bg-violet-50"
              >
                🧠 التدريب التكيفي
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
