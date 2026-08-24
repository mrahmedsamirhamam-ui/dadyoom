"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

type Recommendation = {
  skill: string;
  skillLabel: string;
  icon: string;
  difficulty: string;
  difficultyLabel: string;
  targetScore: number;
  href: string;
  reason: string;
  message: string;
  profileComplete: boolean;
};

export default function AdaptiveSkillsPage() {
  const [
    recommendation,
    setRecommendation,
  ] =
    useState<
      Recommendation | null
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
            "/api/skills/adaptive-next",
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
            "تعذر تحديد التدريب التالي."
          );
        }

        if (active) {
          setRecommendation(
            data.recommendation
          );
        }
      }
      catch (requestError) {
        if (active) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "تعذر تحميل التدريب الذكي."
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
      className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"
    >
      <Link
        href="/student"
        className="font-black text-violet-700 hover:underline"
      >
        ← العودة إلى لوحة الطالب
      </Link>

      <section className="mt-5 rounded-3xl bg-gradient-to-l from-violet-700 via-indigo-700 to-blue-700 p-8 text-white shadow-xl">
        <p className="text-sm font-black text-violet-100">
          ضاديوم • التعلم التكيفي
        </p>

        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          🧠 ماذا أتدرب الآن؟
        </h1>

        <p className="mt-4 max-w-3xl leading-8 text-violet-50">
          يراجع ضاد نتائج مهاراتك ويختار الخطوة التالية بدل إعطائك التدريب نفسه كل مرة.
        </p>
      </section>

      {loading ? (
        <section className="mt-6 rounded-3xl bg-white p-8 text-center font-black text-slate-500 shadow-sm">
          ضاد يراجع تقدمك...
        </section>
      ) : error ? (
        <section className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">
          {error}
        </section>
      ) : recommendation ? (
        <section className="mt-6 overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
          <div className="p-7 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="text-5xl">
                  {recommendation.icon}
                </div>

                <p className="mt-5 text-sm font-black text-violet-700">
                  تدريب ضاد المقترح
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {recommendation.skillLabel}
                </h2>
              </div>

              <div className="rounded-2xl bg-violet-50 px-5 py-4 text-center">
                <p className="text-xs font-black text-violet-600">
                  مستوى التدريب
                </p>

                <p className="mt-1 text-xl font-black text-violet-900">
                  {recommendation.difficultyLabel}
                </p>
              </div>
            </div>

            <p className="mt-6 text-lg font-bold leading-9 text-slate-700">
              {recommendation.message}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-black text-slate-500">
                  لماذا اختار ضاد هذا التدريب؟
                </p>

                <p className="mt-2 leading-7 text-slate-800">
                  {recommendation.reason}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-sm font-black text-emerald-700">
                  هدف المحاولة القادمة
                </p>

                <p className="mt-2 text-4xl font-black text-emerald-800">
                  {recommendation.targetScore}%
                </p>
              </div>
            </div>

            {!recommendation.profileComplete ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold leading-7 text-amber-900">
                💡 ضاد ما زال يبني صورة مستواك. بعد تجربة المهارات الأربع سيبدأ تحديد نقطة الضعف اعتمادًا على نتائجك الفعلية.
              </div>
            ) : null}

            <Link
              href={recommendation.href}
              className="mt-7 inline-flex rounded-2xl bg-violet-700 px-7 py-4 text-lg font-black text-white transition hover:bg-violet-800"
            >
              ابدأ التدريب المقترح ←
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
