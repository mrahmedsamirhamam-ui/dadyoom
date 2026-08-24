"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type SkillName =
  | "reading"
  | "writing"
  | "listening"
  | "speaking";

type SkillProgressRow = {
  skill: SkillName;
  best_score: number;
  latest_score: number;
  attempts: number;
  xp: number;
  level: string;
  updated_at: string;
};

type ProgressResponse = {
  ok: boolean;
  progress?: SkillProgressRow[];
  error?: string;
};

const skillMeta: Record<
  SkillName,
  {
    title: string;
    icon: string;
    href: string;
  }
> = {
  reading: {
    title: "القراءة",
    icon: "📖",
    href:
      "/skills/reading/practice",
  },

  writing: {
    title: "الكتابة",
    icon: "✍️",
    href:
      "/skills/writing/practice",
  },

  listening: {
    title: "الاستماع",
    icon: "🎧",
    href:
      "/skills/listening/practice",
  },

  speaking: {
    title: "التحدث",
    icon: "🎙️",
    href:
      "/skills/speaking/practice",
  },
};

const allSkills:
  SkillName[] = [
    "reading",
    "writing",
    "listening",
    "speaking",
  ];

function scoreMessage(
  score: number
) {
  if (score >= 90) {
    return "ممتاز";
  }

  if (score >= 75) {
    return "قوي";
  }

  if (score >= 60) {
    return "جيد";
  }

  if (score > 0) {
    return "يحتاج تدريبًا";
  }

  return "لم يبدأ";
}

export default function SkillsProgressCard() {
  const [
    progress,
    setProgress,
  ] =
    useState<
      SkillProgressRow[]
    >([]);

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
            "/api/skills/progress",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response
            .json() as
            ProgressResponse;

        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.error ||
            "تعذر تحميل تقدم المهارات."
          );
        }

        if (active) {
          setProgress(
            data.progress ??
            []
          );
        }
      }
      catch (requestError) {
        if (active) {
          setError(
            requestError
              instanceof Error
              ? requestError
                  .message
              : "تعذر تحميل تقدم المهارات."
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

  const rows =
    useMemo(
      () =>
        allSkills.map(
          skill => {
            const found =
              progress.find(
                item =>
                  item.skill ===
                  skill
              );

            return {
              skill,

              latest:
                Number(
                  found
                    ?.latest_score ??
                  0
                ),

              best:
                Number(
                  found
                    ?.best_score ??
                  0
                ),

              attempts:
                Number(
                  found
                    ?.attempts ??
                  0
                ),

              xp:
                Number(
                  found
                    ?.xp ??
                  0
                ),

              level:
                found
                  ?.level ??
                "مبتدئ",
            };
          }
        ),
      [progress]
    );

  const totalXp =
    rows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.xp,
      0
    );

  const practiced =
    rows.filter(
      row =>
        row.attempts > 0
    );

  const average =
    practiced.length > 0
      ? Math.round(
          practiced.reduce(
            (
              total,
              row
            ) =>
              total +
              row.best,
            0
          ) /
          practiced.length
        )
      : 0;

  const weakest =
    practiced.length > 0
      ? [...practiced]
          .sort(
            (
              a,
              b
            ) =>
              a.best -
              b.best
          )[0]
      : null;

  const recommendation =
    weakest
      ? skillMeta[
          weakest.skill
        ]
      : skillMeta.reading;

  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-violet-700">
            ضاديوم • ملف مهاراتي
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950">
            مهارات اللغة الأربع
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            تابع تطورك في القراءة والكتابة والاستماع والتحدث.
          </p>
        </div>

        {!loading ? (
          <div className="rounded-2xl bg-violet-50 px-4 py-3 text-center">
            <p className="text-xs font-black text-violet-600">
              مجموع XP
            </p>

            <p className="mt-1 text-2xl font-black text-violet-900">
              {totalXp}
            </p>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center font-bold text-slate-500">
          جارٍ تحميل تقدمك...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-800">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {rows.map(
              row => {
                const meta =
                  skillMeta[
                    row.skill
                  ];

                return (
                  <Link
                    key={
                      row.skill
                    }
                    href={
                      meta.href
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {
                            meta.icon
                          }
                        </span>

                        <div>
                          <h3 className="font-black text-slate-900">
                            {
                              meta.title
                            }
                          </h3>

                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {
                              row.level
                            }
                          </p>
                        </div>
                      </div>

                      <span className="text-2xl font-black text-violet-700">
                        {
                          row.best
                        }%
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{
                          width:
                            `${row.best}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-white p-2">
                        <div className="font-black text-slate-900">
                          {
                            row.latest
                          }%
                        </div>

                        <div className="mt-1 text-slate-500">
                          آخر نتيجة
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-2">
                        <div className="font-black text-slate-900">
                          {
                            row.attempts
                          }
                        </div>

                        <div className="mt-1 text-slate-500">
                          المحاولات
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-2">
                        <div className="font-black text-slate-900">
                          {
                            row.xp
                          }
                        </div>

                        <div className="mt-1 text-slate-500">
                          XP
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-black text-violet-700">
                      {
                        scoreMessage(
                          row.best
                        )
                      }
                    </p>
                  </Link>
                );
              }
            )}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-black text-slate-400">
                متوسط أفضل النتائج
              </p>

              <p className="mt-2 text-4xl font-black">
                {average}%
              </p>

              <p className="mt-2 text-sm leading-7 text-slate-300">
                يعتمد المتوسط على المهارات التي بدأت التدريب عليها بالفعل.
              </p>
            </article>

            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-black text-amber-700">
                تدريب ضاد المقترح
              </p>

              <h3 className="mt-2 text-xl font-black text-amber-950">
                {weakest
                  ? `ركز الآن على مهارة ${recommendation.title}`
                  : "ابدأ أول تدريب لك"}
              </h3>

              <p className="mt-2 text-sm leading-7 text-amber-900">
                {weakest
                  ? `أفضل نتيجتك الحالية في هذه المهارة هي ${weakest.best}%، لذلك هي الأنسب للتدريب التالي.`
                  : "ابدأ بالقراءة، ثم جرّب باقي المهارات حتى يبني ضاديوم صورة متكاملة عن مستواك."}
              </p>

              <Link
                href={
                  recommendation.href
                }
                className="mt-4 inline-flex rounded-xl bg-amber-700 px-5 py-3 font-black text-white"
              >
                ابدأ التدريب
              </Link>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
