import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";


type SchoolAnalyticsRow = {
  total_teachers: number | string | null;
  total_classes: number | string | null;
  total_students: number | string | null;
  active_students: number | string | null;
  completed_lessons: number | string | null;
  mastered_lessons: number | string | null;
  average_best_score: number | string | null;
  total_xp: number | string | null;
};


type ClassAnalyticsRow = {
  teacher_id: string;
  teacher_name: string | null;

  class_id: string;
  class_name: string;

  student_count: number | string | null;
  active_student_count: number | string | null;

  completed_lessons: number | string | null;
  mastered_lessons: number | string | null;

  average_best_score: number | string | null;
  total_xp: number | string | null;
};


type InsightRow = {
  insight_type: string;
  severity: string;

  teacher_id: string;
  teacher_name: string | null;

  class_id: string;
  class_name: string;

  student_count: number | string | null;
  active_student_count: number | string | null;

  completed_lessons: number | string | null;
  mastered_lessons: number | string | null;

  average_best_score: number | string | null;
  total_xp: number | string | null;
};


type InterventionRow = {
  intervention_id: string;

  status: string;
  priority: string;

  title: string;
  notes: string | null;

  teacher_id: string | null;
  teacher_name: string | null;

  class_id: string | null;
  class_name: string | null;

  student_id: string | null;
  student_name: string | null;

  created_at: string;
  resolved_at: string | null;
};


function toNumber(
  value:
    | number
    | string
    | null
    | undefined
) {
  const number =
    Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}


export default async function SchoolReportsPage() {

  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    redirect("/login");
  }


  const db =
    supabase as unknown as SupabaseClient;


  const [
    analyticsResult,
    classesResult,
    insightsResult,
    interventionsResult,
  ] =
    await Promise.all([
      db.rpc(
        "get_school_analytics_v1"
      ),

      db.rpc(
        "get_school_teacher_class_analytics_v1"
      ),

      db.rpc(
        "get_school_insights_v1"
      ),

      db.rpc(
        "get_school_interventions_v1"
      ),
    ]);


  if (analyticsResult.error) {
    throw analyticsResult.error;
  }

  if (classesResult.error) {
    throw classesResult.error;
  }

  if (insightsResult.error) {
    throw insightsResult.error;
  }

  if (interventionsResult.error) {
    throw interventionsResult.error;
  }


  const analyticsData =
    analyticsResult.data;

  const analyticsRow =
    Array.isArray(
      analyticsData
    )
      ? analyticsData[0]
      : analyticsData;

  const analytics =
    (
      analyticsRow ??
      {}
    ) as Partial<SchoolAnalyticsRow>;


  const classes =
    (
      classesResult.data ??
      []
    ) as ClassAnalyticsRow[];


  const insights =
    (
      insightsResult.data ??
      []
    ) as InsightRow[];


  const interventions =
    (
      interventionsResult.data ??
      []
    ) as InterventionRow[];


  const teachers =
    new Set(
      classes.map(
        (row) =>
          row.teacher_id
      )
    );


  const totalTeachers =
    toNumber(
      analytics.total_teachers
    ) ||
    teachers.size;


  const totalClasses =
    toNumber(
      analytics.total_classes
    ) ||
    classes.length;


  const totalStudents =
    toNumber(
      analytics.total_students
    );


  const activeStudents =
    toNumber(
      analytics.active_students
    );


  const completedLessons =
    toNumber(
      analytics.completed_lessons
    );


  const masteredLessons =
    toNumber(
      analytics.mastered_lessons
    );


  const averageScore =
    Math.round(
      toNumber(
        analytics.average_best_score
      )
    );


  const totalXP =
    toNumber(
      analytics.total_xp
    );


  const masteryRate =
    completedLessons > 0
      ? Math.round(
          (
            masteredLessons /
            completedLessons
          ) *
            100
        )
      : 0;


  const rankedClasses =
    [...classes].sort(
      (a, b) =>
        toNumber(
          b.average_best_score
        ) -
        toNumber(
          a.average_best_score
        )
    );


  const bestClasses =
    rankedClasses.slice(
      0,
      5
    );


  const classesNeedingSupport =
    rankedClasses
      .filter(
        (row) =>
          toNumber(
            row.average_best_score
          ) < 70
      )
      .sort(
        (a, b) =>
          toNumber(
            a.average_best_score
          ) -
          toNumber(
            b.average_best_score
          )
      );


  const highPriorityInsights =
    insights.filter(
      (item) =>
        item.severity === "high"
    );


  const openInterventions =
    interventions.filter(
      (item) =>
        item.status === "open"
    );


  const inProgressInterventions =
    interventions.filter(
      (item) =>
        item.status === "in_progress"
    );


  const resolvedInterventions =
    interventions.filter(
      (item) =>
        item.status === "resolved"
    );


  const highPriorityInterventions =
    interventions.filter(
      (item) =>
        item.priority === "high" &&
        item.status !== "resolved"
    );


  const resolutionRate =
    interventions.length > 0
      ? Math.round(
          (
            resolvedInterventions.length /
            interventions.length
          ) *
            100
        )
      : 0;


  const schoolStatus =
    averageScore >= 85 &&
    masteryRate >= 70
      ? "أداء متميز"
      : averageScore >= 70
        ? "أداء جيد"
        : averageScore >= 50
          ? "يحتاج متابعة"
          : "يحتاج تدخل";


  const executiveRecommendation =
    highPriorityInterventions.length > 0
      ? "توجد إجراءات متابعة عالية الأولوية لم تُحل بعد. يوصى بمراجعتها أولًا وتحديد مسؤول وموعد متابعة لكل إجراء."
      : classesNeedingSupport.length > 0
        ? "توجد فصول دون المستوى المستهدف. يوصى بمراجعة خطط الدعم الأكاديمي ومتابعة الطلاب الأقل أداءً."
        : averageScore >= 85
          ? "المؤشرات الأكاديمية قوية. يوصى بالتركيز على الإثراء والمحافظة على مستوى الإتقان الحالي."
          : "المؤشرات مستقرة بصورة عامة. استمر في متابعة الإتقان والنشاط مع التدخل المبكر عند ظهور انخفاض في الأداء.";


  return (

    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >

      <div className="mx-auto max-w-7xl space-y-7">


        <div className="flex flex-wrap items-center justify-between gap-3">

          <Link
            href="/school"
            className="text-sm font-black text-indigo-700 hover:underline"
          >
            ← العودة إلى لوحة المدرسة
          </Link>

          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">
            تقرير إداري مباشر
          </span>

        </div>


        <section className="rounded-3xl bg-gradient-to-l from-indigo-800 via-violet-700 to-purple-700 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-indigo-100">
            📊 تقارير المدرسة
          </p>

          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h1 className="text-3xl font-black sm:text-4xl">
                التقرير التنفيذي للمدرسة
              </h1>

              <p className="mt-2 max-w-3xl text-indigo-100">
                ملخص موحد للأداء الأكاديمي والفصول والتنبيهات وإجراءات المتابعة.
              </p>

            </div>

            <span className="inline-flex self-start rounded-full bg-white/15 px-5 py-3 text-sm font-black backdrop-blur">
              {schoolStatus}
            </span>

          </div>


          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <HeroMetric
              label="المعلمون"
              value={totalTeachers}
            />

            <HeroMetric
              label="الفصول"
              value={totalClasses}
            />

            <HeroMetric
              label="الطلاب"
              value={totalStudents}
            />

            <HeroMetric
              label="الطلاب النشطون"
              value={activeStudents}
            />

          </div>

        </section>


        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <ReportMetric
            label="متوسط الأداء"
            value={`${averageScore}%`}
            description="متوسط أفضل النتائج المسجلة."
          />

          <ReportMetric
            label="نسبة الإتقان"
            value={`${masteryRate}%`}
            description="الدروس المتقنة مقارنة بالمكتملة."
          />

          <ReportMetric
            label="الدروس المكتملة"
            value={completedLessons}
            description="إجمالي الإنجاز المسجل."
          />

          <ReportMetric
            label="إجمالي XP"
            value={totalXP}
            description="نقاط الخبرة على مستوى المدرسة."
          />

        </section>


        <section className="grid gap-5 lg:grid-cols-2">


          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <p className="text-sm font-black text-emerald-700">
              🏆 أعلى الفصول أداءً
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              أفضل النتائج
            </h2>


            {bestClasses.length > 0 ? (

              <div className="mt-5 space-y-3">

                {bestClasses.map(
                  (row, index) => (

                    <Link
                      key={row.class_id}
                      href={`/school/classes/${row.class_id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                    >

                      <div>

                        <div className="font-black text-slate-900">
                          {index + 1}. {row.class_name}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {row.teacher_name ?? "معلم"} ·{" "}
                          {toNumber(row.student_count)} طالب
                        </div>

                      </div>

                      <span className="text-xl font-black text-emerald-700">
                        {Math.round(
                          toNumber(
                            row.average_best_score
                          )
                        )}%
                      </span>

                    </Link>

                  )
                )}

              </div>

            ) : (

              <EmptyState
                text="لا توجد بيانات فصول كافية بعد."
              />

            )}

          </article>


          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <p className="text-sm font-black text-amber-700">
              ⚠️ فصول تحتاج دعمًا
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              أولويات التحسين
            </h2>


            {classesNeedingSupport.length > 0 ? (

              <div className="mt-5 space-y-3">

                {classesNeedingSupport
                  .slice(0, 5)
                  .map(
                    (row) => (

                      <Link
                        key={row.class_id}
                        href={`/school/classes/${row.class_id}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-amber-300 hover:bg-amber-50"
                      >

                        <div>

                          <div className="font-black text-slate-900">
                            {row.class_name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {row.teacher_name ?? "معلم"}
                          </div>

                        </div>

                        <span
                          className={
                            "text-xl font-black " +
                            (
                              toNumber(
                                row.average_best_score
                              ) < 50
                                ? "text-rose-700"
                                : "text-amber-700"
                            )
                          }
                        >
                          {Math.round(
                            toNumber(
                              row.average_best_score
                            )
                          )}%
                        </span>

                      </Link>

                    )
                  )}

              </div>

            ) : (

              <EmptyState
                text="لا توجد فصول تحت مستوى المتابعة حاليًا."
              />

            )}

          </article>

        </section>


        <section className="grid gap-5 lg:grid-cols-3">


          <ReportMetric
            label="متابعات مفتوحة"
            value={openInterventions.length}
            description="إجراءات لم تبدأ بعد."
          />

          <ReportMetric
            label="قيد المتابعة"
            value={inProgressInterventions.length}
            description="إجراءات يجري العمل عليها."
          />

          <ReportMetric
            label="نسبة الحل"
            value={`${resolutionRate}%`}
            description={`${resolvedInterventions.length} إجراء تم حله.`}
          />

        </section>


        <section className="grid gap-5 lg:grid-cols-2">


          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <p className="text-sm font-black text-rose-700">
              🚨 الأولوية الإدارية
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              إجراءات تحتاج الانتباه
            </h2>


            {highPriorityInterventions.length > 0 ? (

              <div className="mt-5 space-y-3">

                {highPriorityInterventions
                  .slice(0, 6)
                  .map(
                    (item) => (

                      <div
                        key={item.intervention_id}
                        className="rounded-2xl border border-rose-100 bg-rose-50 p-4"
                      >

                        <div className="font-black text-slate-900">
                          {item.title}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">

                          {item.student_name ? (
                            <span>
                              الطالب: {item.student_name}
                            </span>
                          ) : null}

                          {item.class_name ? (
                            <span>
                              الفصل: {item.class_name}
                            </span>
                          ) : null}

                          {item.teacher_name ? (
                            <span>
                              المعلم: {item.teacher_name}
                            </span>
                          ) : null}

                        </div>

                      </div>

                    )
                  )}

              </div>

            ) : (

              <EmptyState
                text="لا توجد إجراءات عالية الأولوية غير محلولة."
              />

            )}

          </article>


          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <p className="text-sm font-black text-violet-700">
              🧠 التنبيهات الأكاديمية
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              تنبيهات مرتفعة الأولوية
            </h2>


            {highPriorityInsights.length > 0 ? (

              <div className="mt-5 space-y-3">

                {highPriorityInsights
                  .slice(0, 6)
                  .map(
                    (item, index) => (

                      <Link
                        key={`${item.class_id}-${item.insight_type}-${index}`}
                        href={`/school/classes/${item.class_id}`}
                        className="block rounded-2xl border border-violet-100 bg-violet-50 p-4 transition hover:border-violet-300"
                      >

                        <div className="font-black text-slate-900">
                          {item.class_name}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.teacher_name ?? "معلم"}
                        </div>

                        <div className="mt-2 text-sm font-bold text-violet-700">
                          متوسط الأداء:{" "}
                          {Math.round(
                            toNumber(
                              item.average_best_score
                            )
                          )}%
                        </div>

                      </Link>

                    )
                  )}

              </div>

            ) : (

              <EmptyState
                text="لا توجد تنبيهات مرتفعة الأولوية حاليًا."
              />

            )}

          </article>

        </section>


        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">

          <p className="text-sm font-black text-indigo-700">
            📌 التوصية التنفيذية
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            ما الذي ينبغي أن تركز عليه المدرسة الآن؟
          </h2>

          <p className="mt-4 max-w-4xl leading-8 text-slate-700">
            {executiveRecommendation}
          </p>


          <div className="mt-6 flex flex-wrap gap-3">

            <Link
              href="/school"
              className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-800"
            >
              إدارة المتابعات
            </Link>

            {classesNeedingSupport[0] ? (

              <Link
                href={`/school/classes/${classesNeedingSupport[0].class_id}`}
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
              >
                مراجعة الفصل الأكثر احتياجًا
              </Link>

            ) : null}

          </div>

        </section>


      </div>

    </main>
  );
}


function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-5 text-center backdrop-blur">

      <div className="text-3xl font-black">
        {value}
      </div>

      <div className="mt-1 text-sm font-bold text-indigo-100">
        {label}
      </div>

    </div>
  );
}


function ReportMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">

      <div className="text-3xl font-black text-slate-900">
        {value}
      </div>

      <div className="mt-2 font-black text-indigo-700">
        {label}
      </div>

      <p className="mt-2 text-xs leading-6 text-slate-500">
        {description}
      </p>

    </article>
  );
}


function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
