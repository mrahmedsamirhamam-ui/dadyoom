import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getPublishedUnits } from "@/services/lessons/catalog";

type SkillRow = {
  skill: string;
  score: number;
};

function skillLabel(skill: string) {
  switch (skill) {
    case "reading":
      return "القراءة";
    case "writing":
      return "الكتابة";
    case "listening":
      return "الاستماع";
    case "speaking":
      return "التحدث";
    default:
      return skill;
  }
}

export default async function JourneyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    catalog,
    profileResult,
    progressResult,
    skillsResult,
    statsResult,
  ] = await Promise.all([
    getPublishedUnits(),

    supabase
      .from("profiles")
      .select("full_name,country,role")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("student_lesson_progress")
      .select(
        "lesson_id,status,progress_percent,best_score,xp,updated_at"
      )
      .eq("student_id", user.id),

    user.email
      ? supabase
          .from("student_skills")
          .select("skill,score")
          .eq("student_email", user.email)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    user.email
      ? supabase
          .from("student_stats")
          .select(
            "points,completed_lessons,completed_courses"
          )
          .eq("student_email", user.email)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ]);

  const allLessons =
    catalog.flatMap(
      (unit) =>
        unit.lessons.map(
          (lesson) => ({
            ...lesson,
            unitTitle: unit.title,
            countryName:
              unit.country.name,
            curriculumName:
              unit.curriculum.name,
            gradeName:
              unit.grade.name,
          })
        )
    );

  const progressRows =
    progressResult.data ?? [];

  const completedIds =
    new Set(
      progressRows
        .filter(
          (row) =>
            row.status ===
              "completed" ||
            row.status ===
              "mastered"
        )
        .map(
          (row) =>
            row.lesson_id
        )
    );

  const nextLesson =
    allLessons.find(
      (lesson) =>
        !completedIds.has(
          lesson.id
        )
    ) ??
    allLessons[0] ??
    null;

  const completedLessons =
    completedIds.size;

  const totalLessons =
    allLessons.length;

  const curriculumPercent =
    totalLessons > 0
      ? Math.min(
          100,
          Math.round(
            (
              completedLessons /
              totalLessons
            ) *
              100
          )
        )
      : 0;

  const skillRows =
    (
      skillsResult.data ??
      []
    ) as SkillRow[];

  const skillScores =
    new Map(
      skillRows.map(
        (row) => [
          row.skill,
          Number(
            row.score ?? 0
          ),
        ]
      )
    );

  const stats =
    statsResult.data;

  const displayName =
    profileResult.data
      ?.full_name
      ?.trim() ||
    user.email?.split(
      "@"
    )[0] ||
    "صديق العربية";

  const assessmentHref =
    nextLesson
      ? `/assessment/${nextLesson.id}`
      : "/courses";

  return (
    <main
      dir="rtl"
      className="min-h-screen px-4 py-7 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
                رحلتك الشخصية في بيت العربية الرقمي
              </span>

              <h1 className="mt-4 font-arabic-display text-3xl font-black sm:text-5xl">
                أهلاً {displayName}
              </h1>

              <p className="mt-4 max-w-3xl font-arabic-reading text-xl leading-9 text-[#e7f1ed]">
                المنهج يعطيك الطريق، والمهارات تمنحك الممارسة،
                والتقييم يحدد خطوتك التالية، وضاد يرافقك للفهم
                دون أن يحل مكانك.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {profileResult.data?.country ??
                    "الدولة من ملفك"}
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {completedLessons} درس مكتمل
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {Number(
                    stats?.points ??
                      0
                  )}{" "}
                  نقطة
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-[#ffe3a6]">
                    تقدم المنهج
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {curriculumPercent}%
                  </p>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#f5cf7a] text-2xl">
                  📚
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#f5cf7a]"
                  style={{
                    width: `${curriculumPercent}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-sm font-bold text-[#e6f1ed]">
                {completedLessons} من{" "}
                {totalLessons} درس
                ظاهر في مسارك الحالي.
              </p>
            </div>
          </div>
        </section>

        {nextLesson ? (
          <section className="arabic-panel grid gap-5 rounded-[2rem] border border-[#dfcfad] p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black text-[#9a7028]">
                خطوتك التالية
              </p>
              <h2 className="mt-2 font-arabic-display text-2xl font-black text-[#123f39]">
                {nextLesson.title}
              </h2>
              <p className="mt-2 font-arabic-reading text-lg leading-8 text-[#73695d]">
                {nextLesson.countryName} •{" "}
                {nextLesson.gradeName} •{" "}
                {nextLesson.unitTitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/lessons/${nextLesson.id}`}
                className="rounded-full bg-[#123f39] px-6 py-3 text-sm font-black text-white"
              >
                أكمل التعلم
              </Link>

              <Link
                href="/journey/daily"
                className="rounded-full border border-[#d2bd92] bg-[#fffaf0] px-6 py-3 text-sm font-black text-[#735b2e]"
              >
                رحلة اليوم
              </Link>
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-4">
            <p className="text-xs font-black text-[#9a7028]">
              منظومة تعلم واحدة
            </p>
            <h2 className="mt-1 font-arabic-display text-3xl font-black text-[#123f39]">
              كل أدوات ضاديوم في رحلة واحدة
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HubCard icon="📚" title="منهجي" text="الوحدات والدروس الأساسية الجاهزة حسب الدولة والصف والسنة." href="/courses" action="افتح المنهج" />
            <HubCard icon="🧭" title="رحلة اليوم" text="خطة قصيرة تجمع درسًا ومهارة وتقييمًا وتحديًا يوميًا." href="/journey/daily" action="ابدأ اليوم" />
            <HubCard icon="🧠" title="المهارات الأربع" text="قراءة وكتابة واستماع وتحدث مع تدريب تكيفي حسب مستواك." href="/skills" action="تدرّب" />
            <HubCard icon="📖" title="تحدي القراءة" text="جواز قراءة، ملخصات، فهم، تفكير ناقد واستجابة إبداعية." href="/reading-challenge" action="افتح الجواز" />
            <HubCard icon="🔎" title="قاموس السياق" text="اكتشف معنى الكلمة داخل الجملة لا بعيدًا عن سياقها." href="/dictionary" action="حلّل كلمة" />
            <HubCard icon="🎯" title="التقييم الذكي" text="اعرف ما أتقنته وما يحتاج تدريبًا، ثم خذ خطوتك التالية." href={assessmentHref} action="قيّم مستواي" />
            <HubCard icon="🤖" title="ضاد" text="رفيق عربي يعرف سياق الدرس ويعطي تفسيرًا وتلميحًا لا إجابة جاهزة." href="/ask" action="اسأل ضاد" />
            <HubCard icon="🏆" title="التقدم والتحفيز" text="XP ومستويات وإنجازات وتحديات يومية تجمع رحلتك في مكان واحد." href="/student" action="شاهد إنجازاتي" />
          </div>
        </section>

        <section className="arabic-panel rounded-[2rem] border border-[#dfcfad] p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black text-[#9a7028]">
                نبض المهارات
              </p>
              <h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
                أين أقف الآن؟
              </h2>
            </div>

            <Link
              href="/skills/adaptive"
              className="rounded-full border border-[#d3c099] bg-[#fffaf0] px-5 py-2.5 text-sm font-black text-[#6f572d]"
            >
              تدريب تكيفي
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["reading", "📖"],
              ["writing", "✍️"],
              ["listening", "🎧"],
              ["speaking", "🎙️"],
            ].map(
              ([skill, icon]) => {
                const score =
                  Math.max(
                    0,
                    Math.min(
                      100,
                      skillScores.get(
                        skill
                      ) ?? 0
                    )
                  );

                return (
                  <div
                    key={skill}
                    className="rounded-2xl border border-[#e1d4bb] bg-[#fffdf8] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">
                        {icon}
                      </span>
                      <strong className="text-[#123f39]">
                        {score}%
                      </strong>
                    </div>
                    <div className="mt-3 font-black text-[#37352f]">
                      {skillLabel(
                        skill
                      )}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee6d7]">
                      <div
                        className="h-full rounded-full bg-[#174f47]"
                        style={{
                          width: `${score}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function HubCard({
  icon,
  title,
  text,
  href,
  action,
}: {
  icon: string;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.7rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#b9944e] hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">
          {icon}
        </span>
        <span className="text-[#b28a3f] transition group-hover:translate-x-[-3px]">
          ←
        </span>
      </div>
      <h3 className="mt-4 font-arabic-display text-xl font-black text-[#123f39]">
        {title}
      </h3>
      <p className="mt-2 min-h-20 font-arabic-reading text-base leading-7 text-[#73695d]">
        {text}
      </p>
      <div className="mt-4 text-sm font-black text-[#8a6527]">
        {action}
      </div>
    </Link>
  );
}
