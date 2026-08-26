import Link from "next/link";
import SchoolTeacherLinkCard from "@/features/school-link/components/SchoolTeacherLinkCard";
import {
  redirect,
} from "next/navigation";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createSchoolAction,
  createSchoolInterventionAction,
  updateSchoolInterventionStatusAction,
  deleteSchoolInterventionAction,
} from "./actions";

type SchoolDashboardRow = {
  school_id: string;
  school_name: string;

  teacher_count:
    | number
    | string
    | null;

  class_count:
    | number
    | string
    | null;

  student_count:
    | number
    | string
    | null;
};

type SchoolTeacherRow = {
  teacher_id: string;
  teacher_name: string | null;
  teacher_email: string | null;
  joined_at: string | null;
  class_count: number | string | null;
  student_count: number | string | null;
};
type SchoolAnalyticsRow = {
  total_teachers:
    | number
    | string
    | null;

  total_classes:
    | number
    | string
    | null;

  total_students:
    | number
    | string
    | null;

  active_students:
    | number
    | string
    | null;

  completed_lessons:
    | number
    | string
    | null;

  mastered_lessons:
    | number
    | string
    | null;

  average_best_score:
    | number
    | string
    | null;

  total_xp:
    | number
    | string
    | null;
};

type SchoolInterventionRow = {
  intervention_id: string;

  status: string;
  priority: string;

  insight_type: string | null;
  action_type: string;

  title: string;
  notes: string | null;

  teacher_id: string | null;
  teacher_name: string | null;

  class_id: string | null;
  class_name: string | null;

  student_id: string | null;
  student_name: string | null;

  due_date: string | null;
  created_at: string;
  resolved_at: string | null;
};

type SchoolInsightRow = {
  insight_type: string;
  severity: string;

  teacher_id: string;
  teacher_name: string | null;

  class_id: string;
  class_name: string;

  student_count:
    | number
    | string
    | null;

  active_student_count:
    | number
    | string
    | null;

  completed_lessons:
    | number
    | string
    | null;

  mastered_lessons:
    | number
    | string
    | null;

  average_best_score:
    | number
    | string
    | null;

  mastery_rate:
    | number
    | string
    | null;

  message: string;
};

type SchoolTeacherClassAnalyticsRow = {
  teacher_id: string;
  teacher_name: string | null;
  teacher_email: string | null;

  class_id: string;
  class_name: string;
  academic_year: string | null;

  student_count:
    | number
    | string
    | null;

  active_student_count:
    | number
    | string
    | null;

  completed_lessons:
    | number
    | string
    | null;

  mastered_lessons:
    | number
    | string
    | null;

  average_best_score:
    | number
    | string
    | null;

  total_xp:
    | number
    | string
    | null;
};

type SchoolPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
    q?: string;
    status?: string;
    priority?: string;
    teacher?: string;
    classId?: string;
  }>;
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

export default async function SchoolPage({
  searchParams,
}: SchoolPageProps) {
  const {
  success,
  error: errorMessage,
  q: interventionSearchQuery = "",
  status: interventionStatusFilter = "",
  priority: interventionPriorityFilter = "",
  teacher: interventionTeacherFilter = "",
  classId: interventionClassFilter = "",
} = await searchParams;

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

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "full_name,role,country"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    throw new Error(
      "تعذر تحميل بيانات حساب المدرسة."
    );
  }

  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    role !== "school" &&
    role !== "admin"
  ) {
    redirect("/student");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const {
    data,
    error,
  } =
    await db.rpc(
      "get_school_dashboard"
    );

  if (error) {
    throw error;
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  const dashboard =
    row
      ? (
          row as SchoolDashboardRow
        )
      : null;


  if (!dashboard) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 px-4 py-10"
      >
        <div className="mx-auto max-w-3xl">

          <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">

            <p className="text-sm font-black text-indigo-700">
              🏫 إعداد المدرسة
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              مرحبًا بك في ضاديوم للمدارس
            </h1>

            <p className="mt-3 leading-7 text-slate-500">
              أكمل بيانات المدرسة الأساسية لبدء إدارة المعلمين والفصول والطلاب.
            </p>

            {success ? (
              <div className="mt-5 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-700">
                ✓ {success}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-5 rounded-xl bg-rose-50 p-3 font-bold text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <form
              action={createSchoolAction}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  اسم المدرسة
                </span>

                <input
                  name="name"
                  required
                  placeholder="مثال: مدرسة ضاديوم الدولية"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  الدولة
                </span>

                <input
                  name="country"
                  defaultValue={
                    profile.country ??
                    ""
                  }
                  placeholder="البحرين"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  العام الدراسي
                </span>

                <input
                  name="academicYear"
                  placeholder="2026–2027"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-black text-white transition hover:bg-indigo-700"
              >
                إنشاء ملف المدرسة
              </button>
            </form>
          </section>

        </div>
      </main>
    );
  }


  const {
  data: schoolTeachersData,
  error: schoolTeachersError,
} = await db.rpc(
  "get_school_teachers"
);

if (schoolTeachersError) {
  throw schoolTeachersError;
}

const schoolTeachers =
  (
    schoolTeachersData ??
    []
  ) as SchoolTeacherRow[];


const {
  data: schoolAnalyticsData,
  error: schoolAnalyticsError,
} = await db.rpc(
  "get_school_analytics_v1"
);

if (schoolAnalyticsError) {
  throw schoolAnalyticsError;
}

const analyticsRow =
  Array.isArray(
    schoolAnalyticsData
  )
    ? schoolAnalyticsData[0]
    : schoolAnalyticsData;

const analytics =
  analyticsRow
    ? (
        analyticsRow as SchoolAnalyticsRow
      )
    : null;

const {
  data: teacherClassAnalyticsData,
  error: teacherClassAnalyticsError,
} = await db.rpc(
  "get_school_teacher_class_analytics_v1"
);

if (teacherClassAnalyticsError) {
  throw teacherClassAnalyticsError;
}

const teacherClassAnalytics =
  (
    teacherClassAnalyticsData ??
    []
  ) as SchoolTeacherClassAnalyticsRow[];

const rankedTeacherClasses =
  [...teacherClassAnalytics]
    .sort(
      (a, b) =>
        toNumber(
          b.average_best_score
        ) -
        toNumber(
          a.average_best_score
        )
    );

const {
  data: schoolInsightsData,
  error: schoolInsightsError,
} = await db.rpc(
  "get_school_insights_v1"
);

if (schoolInsightsError) {
  throw schoolInsightsError;
}

const schoolInsights =
  (
    schoolInsightsData ??
    []
  ) as SchoolInsightRow[];

const highPriorityInsights =
  schoolInsights.filter(
    (item) =>
      item.severity === "high"
  );

const mediumPriorityInsights =
  schoolInsights.filter(
    (item) =>
      item.severity === "medium"
  );

const positiveInsights =
  schoolInsights.filter(
    (item) =>
      item.severity === "positive"
  );

const {
  data: schoolInterventionsData,
  error: schoolInterventionsError,
} = await db.rpc(
  "get_school_interventions_v1"
);

if (schoolInterventionsError) {
  throw schoolInterventionsError;
}

const schoolInterventions =
  (
    schoolInterventionsData ??
    []
  ) as SchoolInterventionRow[];

const openInterventions =
  schoolInterventions.filter(
    (item) =>
      item.status === "open"
  );

const inProgressInterventions =
  schoolInterventions.filter(
    (item) =>
      item.status === "in_progress"
  );

const resolvedInterventions =
  schoolInterventions.filter(
    (item) =>
      item.status === "resolved"
  );


const normalizedInterventionSearch =
  interventionSearchQuery
    .trim()
    .toLocaleLowerCase("ar");

const interventionTeachers =
  schoolInterventions
    .filter(
      (item) =>
        item.teacher_id &&
        item.teacher_name
    )
    .filter(
      (item, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.teacher_id ===
            item.teacher_id
        ) === index
    );

const interventionClasses =
  schoolInterventions
    .filter(
      (item) =>
        item.class_id &&
        item.class_name
    )
    .filter(
      (item, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.class_id ===
            item.class_id
        ) === index
    );

const filteredSchoolInterventions =
  schoolInterventions.filter(
    (item) => {

      const matchesSearch =
        !normalizedInterventionSearch ||
        [
          item.title,
          item.notes,
          item.teacher_name,
          item.class_name,
          item.student_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("ar")
          .includes(
            normalizedInterventionSearch
          );

      const matchesStatus =
        !interventionStatusFilter ||
        item.status ===
          interventionStatusFilter;

      const matchesPriority =
        !interventionPriorityFilter ||
        item.priority ===
          interventionPriorityFilter;

      const matchesTeacher =
        !interventionTeacherFilter ||
        item.teacher_id ===
          interventionTeacherFilter;

      const matchesClass =
        !interventionClassFilter ||
        item.class_id ===
          interventionClassFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesTeacher &&
        matchesClass
      );
    }
  );

const hasInterventionFilters =
  Boolean(
    interventionSearchQuery ||
    interventionStatusFilter ||
    interventionPriorityFilter ||
    interventionTeacherFilter ||
    interventionClassFilter
  );

const teacherCount =
    toNumber(
      dashboard.teacher_count
    );

  const classCount =
    toNumber(
      dashboard.class_count
    );

  const studentCount =
    toNumber(
      dashboard.student_count
    );

  const activeStudents =
    toNumber(
      analytics?.active_students
    );

  const completedLessons =
    toNumber(
      analytics?.completed_lessons
    );

  const masteredLessons =
    toNumber(
      analytics?.mastered_lessons
    );

  const averageBestScore =
    Math.round(
      toNumber(
        analytics?.average_best_score
      )
    );

  const schoolXP =
    toNumber(
      analytics?.total_xp
    );


  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">

        <div className="flex justify-end">

          <Link
            href="/school/reports"
            className="inline-flex items-center justify-center rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-800"
          >
            📊 التقارير المدرسية
          </Link>

        </div>



        <section className="rounded-3xl bg-gradient-to-l from-indigo-800 via-violet-700 to-purple-700 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-indigo-100">
            🏫 لوحة المدرسة
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {
              dashboard.school_name
            }
          </h1>

          <p className="mt-3 text-indigo-100">
            إدارة المدرسة التعليمية في ضاديوم
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">

            <Metric
              label="المعلمون"
              value={teacherCount}
            />

            <Metric
              label="الفصول"
              value={classCount}
            />

            <Metric
              label="الطلاب"
              value={studentCount}
            />

          </div>
        </section>


        <section className="grid gap-5 md:grid-cols-3">

          <DashboardCard
            icon="👨‍🏫"
            title="المعلمون"
            description="إضافة المعلمين وربط حساباتهم بالمدرسة."
            count={teacherCount}
          />

          <DashboardCard
            icon="🏫"
            title="الفصول"
            description="متابعة الفصول التي أنشأها معلمو المدرسة."
            count={classCount}
          />

          <DashboardCard
            icon="👨‍🎓"
            title="الطلاب"
            description="متابعة الطلاب المنضمين إلى فصول المدرسة."
            count={studentCount}
          />

        </section>


                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div>
            <p className="text-sm font-black text-violet-700">
              📊 تحليلات المدرسة
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              الأداء التعليمي في ضاديوم
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              نظرة شاملة على نشاط الطلاب والإنجاز والإتقان داخل فصول المدرسة.
            </p>
          </div>


          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-2xl bg-indigo-50 p-5">
              <div className="text-sm font-black text-indigo-700">
                الطلاب النشطون
              </div>

              <div className="mt-2 text-3xl font-black text-slate-900">
                {activeStudents}
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                طلاب لديهم نشاط تعلم مسجل.
              </p>
            </div>


            <div className="rounded-2xl bg-emerald-50 p-5">
              <div className="text-sm font-black text-emerald-700">
                الدروس المكتملة
              </div>

              <div className="mt-2 text-3xl font-black text-slate-900">
                {completedLessons}
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                إجمالي الدروس المكتملة داخل المدرسة.
              </p>
            </div>


            <div className="rounded-2xl bg-teal-50 p-5">
              <div className="text-sm font-black text-teal-700">
                الدروس المتقنة
              </div>

              <div className="mt-2 text-3xl font-black text-slate-900">
                {masteredLessons}
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                الدروس التي وصل فيها الطلاب إلى الإتقان.
              </p>
            </div>


            <div className="rounded-2xl bg-amber-50 p-5">
              <div className="text-sm font-black text-amber-700">
                متوسط الأداء
              </div>

              <div className="mt-2 text-3xl font-black text-slate-900">
                {averageBestScore}%
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                متوسط أفضل الدرجات المسجلة.
              </p>
            </div>


            <div className="rounded-2xl bg-purple-50 p-5">
              <div className="text-sm font-black text-purple-700">
                إجمالي XP
              </div>

              <div className="mt-2 text-3xl font-black text-slate-900">
                {schoolXP}
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                مجموع نقاط الخبرة المكتسبة.
              </p>
            </div>

          </div>


          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="font-black text-slate-900">
                  نسبة الإتقان من الدروس المكتملة
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  مؤشر سريع لجودة الإنجاز وليس عدد الدروس فقط.
                </p>
              </div>

              <div className="text-3xl font-black text-violet-700">
                {
                  completedLessons > 0
                    ? Math.round(
                        (
                          masteredLessons /
                          completedLessons
                        ) *
                          100
                      )
                    : 0
                }%
              </div>

            </div>


            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-violet-600"
                style={{
                  width: `${
                    completedLessons > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (
                              masteredLessons /
                              completedLessons
                            ) *
                              100
                          )
                        )
                      : 0
                  }%`,
                }}
              />

            </div>

          </div>

        </section>

                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-sm font-black text-rose-700">
                🚦 رؤى وتنبيهات المدرسة
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                ما الذي يحتاج انتباه الإدارة؟
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                مؤشرات آلية مستخرجة من أداء الفصول لمساعدة الإدارة على اكتشاف ما يحتاج متابعة بسرعة.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">
                {highPriorityInsights.length} عاجل
              </span>

              <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                {mediumPriorityInsights.length} متابعة
              </span>

              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                {positiveInsights.length} إيجابي
              </span>

            </div>

          </div>


          {schoolInsights.length > 0 ? (

            <div className="mt-6 grid gap-4 lg:grid-cols-2">

              {schoolInsights.map(
                (
                  insight
                ) => {

                  const severityStyles =
                    insight.severity === "high"
                      ? "border-rose-200 bg-rose-50"
                      : insight.severity === "medium"
                        ? "border-amber-200 bg-amber-50"
                        : insight.severity === "positive"
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50";

                  const badgeStyles =
                    insight.severity === "high"
                      ? "bg-rose-100 text-rose-700"
                      : insight.severity === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : insight.severity === "positive"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700";

                  const severityLabel =
                    insight.severity === "high"
                      ? "عاجل"
                      : insight.severity === "medium"
                        ? "يحتاج متابعة"
                        : insight.severity === "positive"
                          ? "أداء قوي"
                          : "مستقر";

                  return (

                    <article
                      key={`${insight.class_id}-${insight.insight_type}`}
                      className={`rounded-2xl border p-5 ${severityStyles}`}
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeStyles}`}>
                              {severityLabel}
                            </span>

                            <Link
                              href={`/school/classes/${insight.class_id}`}
                              className="font-black text-slate-900 hover:underline"
                            >
                              {insight.class_name}
                            </Link>

                          </div>


                          <p className="mt-3 leading-7 text-slate-700">
                            {insight.message}
                          </p>


                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">

                            <Link
                              href={`/school/teachers/${insight.teacher_id}`}
                              className="rounded-full bg-white/70 px-3 py-1 hover:underline"
                            >
                              👨‍🏫 {
                                insight.teacher_name ??
                                "معلم"
                              }
                            </Link>

                            <span className="rounded-full bg-white/70 px-3 py-1">
                              👨‍🎓 {
                                toNumber(
                                  insight.student_count
                                )
                              } طالب
                            </span>

                            <span className="rounded-full bg-white/70 px-3 py-1">
                              ⚡ {
                                toNumber(
                                  insight.active_student_count
                                )
                              } نشط
                            </span>

                            <span className="rounded-full bg-white/70 px-3 py-1">
                              📈 {
                                Math.round(
                                  toNumber(
                                    insight.average_best_score
                                  )
                                )
                              }%
                            </span>

                            <span className="rounded-full bg-white/70 px-3 py-1">
                              ⭐ {
                                Math.round(
                                  toNumber(
                                    insight.mastery_rate
                                  )
                                )
                              }% إتقان
                            </span>

                          </div>

                        </div>


                        <form
                          action={createSchoolInterventionAction}
                          className="shrink-0"
                        >
                          <input
                            type="hidden"
                            name="teacherId"
                            value={insight.teacher_id}
                          />

                          <input
                            type="hidden"
                            name="classId"
                            value={insight.class_id}
                          />

                          <input
                            type="hidden"
                            name="insightType"
                            value={insight.insight_type}
                          />

                          <input
                            type="hidden"
                            name="title"
                            value={`متابعة ${insight.class_name}`}
                          />

                          <input
                            type="hidden"
                            name="notes"
                            value={insight.message}
                          />

                          <input
                            type="hidden"
                            name="priority"
                            value={
                              insight.severity === "high"
                                ? "high"
                                : insight.severity === "medium"
                                  ? "medium"
                                  : "low"
                            }
                          />

                          <button
                            type="submit"
                            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-violet-700"
                          >
                            بدء متابعة
                          </button>
                        </form>

                        <Link
                          href={`/school/classes/${insight.class_id}`}
                          className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                          فتح الفصل
                        </Link>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <div className="text-4xl">
                ✅
              </div>

              <h3 className="mt-3 font-black text-slate-900">
                لا توجد تنبيهات حاليًا
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                ستظهر هنا تلقائيًا أي مؤشرات تحتاج إلى تدخل أو متابعة.
              </p>

            </div>

          )}

        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-sm font-black text-indigo-700">
                🗂️ إجراءات المتابعة
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                متابعة القرارات والإجراءات
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                الإجراءات التي سجلتها الإدارة لمتابعة الفصول والمعلمين والتنبيهات الأكاديمية.
              </p>
            </div>


            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">
                {openInterventions.length} مفتوح
              </span>

              <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                {inProgressInterventions.length} قيد المتابعة
              </span>

              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                {resolvedInterventions.length} تم الحل
              </span>

            </div>

          </div>




          {/* school_intervention_filters_marker */}

          <form
            method="get"
            className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="font-black text-slate-900">
                  🔎 البحث وتصفية المتابعات
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  ابحث في العنوان أو الطالب أو المعلم أو الفصل، ثم استخدم الفلاتر لتحديد النتائج.
                </p>

              </div>

              <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-700 ring-1 ring-slate-200">
                {filteredSchoolInterventions.length} من {schoolInterventions.length} نتيجة
              </div>

            </div>


            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">

              <label className="xl:col-span-2">

                <span className="text-xs font-black text-slate-600">
                  البحث
                </span>

                <input
                  type="search"
                  name="q"
                  defaultValue={interventionSearchQuery}
                  placeholder="اسم طالب، معلم، فصل أو عنوان المتابعة..."
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

              </label>


              <label>

                <span className="text-xs font-black text-slate-600">
                  الحالة
                </span>

                <select
                  name="status"
                  defaultValue={interventionStatusFilter}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">
                    كل الحالات
                  </option>

                  <option value="open">
                    مفتوح
                  </option>

                  <option value="in_progress">
                    قيد المتابعة
                  </option>

                  <option value="resolved">
                    تم الحل
                  </option>
                </select>

              </label>


              <label>

                <span className="text-xs font-black text-slate-600">
                  الأولوية
                </span>

                <select
                  name="priority"
                  defaultValue={interventionPriorityFilter}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">
                    كل الأولويات
                  </option>

                  <option value="high">
                    عالية
                  </option>

                  <option value="medium">
                    متوسطة
                  </option>

                  <option value="low">
                    منخفضة
                  </option>
                </select>

              </label>


              <div className="flex items-end">

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-800"
                >
                  تطبيق
                </button>

              </div>

            </div>


            <div className="mt-3 grid gap-3 md:grid-cols-2">

              <label>

                <span className="text-xs font-black text-slate-600">
                  المعلم
                </span>

                <select
                  name="teacher"
                  defaultValue={interventionTeacherFilter}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">
                    جميع المعلمين
                  </option>

                  {interventionTeachers.map(
                    (item) => (

                      <option
                        key={item.teacher_id}
                        value={item.teacher_id ?? ""}
                      >
                        {
                          item.teacher_name ??
                          "معلم"
                        }
                      </option>

                    )
                  )}

                </select>

              </label>


              <label>

                <span className="text-xs font-black text-slate-600">
                  الفصل
                </span>

                <select
                  name="classId"
                  defaultValue={interventionClassFilter}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">
                    جميع الفصول
                  </option>

                  {interventionClasses.map(
                    (item) => (

                      <option
                        key={item.class_id}
                        value={item.class_id ?? ""}
                      >
                        {
                          item.class_name ??
                          "فصل"
                        }
                      </option>

                    )
                  )}

                </select>

              </label>

            </div>


            {hasInterventionFilters ? (

              <div className="mt-4 flex flex-wrap items-center gap-3">

                <Link
                  href="/school"
                  className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-100"
                >
                  ✕ مسح الفلاتر
                </Link>

                <span className="text-xs text-slate-500">
                  يتم عرض النتائج المطابقة فقط.
                </span>

              </div>

            ) : null}

          </form>

{filteredSchoolInterventions.length > 0 ? (

            <div className="mt-6 space-y-4">

              {filteredSchoolInterventions.map(
                (
                  item
                ) => {

                  const statusLabel =
                    item.status === "open"
                      ? "مفتوح"
                      : item.status === "in_progress"
                        ? "قيد المتابعة"
                        : "تم الحل";

                  const statusStyles =
                    item.status === "open"
                      ? "bg-rose-100 text-rose-700"
                      : item.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700";

                  return (

                    <article
                      key={item.intervention_id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyles}`}>
                              {statusLabel}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {
                                item.priority === "high"
                                  ? "أولوية عالية"
                                  : item.priority === "medium"
                                    ? "أولوية متوسطة"
                                    : "أولوية منخفضة"
                              }
                            </span>

                          </div>


                          <h3 className="mt-3 text-lg font-black text-slate-900">
                            {item.title}
                          </h3>


                          {item.notes ? (
                            <p className="mt-2 leading-7 text-slate-600">
                              {item.notes}
                            </p>
                          ) : null}


                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">

                            {item.teacher_id ? (
                              <Link
                                href={`/school/teachers/${item.teacher_id}`}
                                className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 hover:underline"
                              >
                                👨‍🏫 {
                                  item.teacher_name ??
                                  "المعلم"
                                }
                              </Link>
                            ) : null}

                            {item.class_id ? (
                              <Link
                                href={`/school/classes/${item.class_id}`}
                                className="rounded-full bg-violet-50 px-3 py-1 text-violet-700 hover:underline"
                              >
                                🏫 {
                                  item.class_name ??
                                  "الفصل"
                                }
                              </Link>
                            ) : null}

                          </div>

                        </div>


                        <div className="flex shrink-0 flex-wrap gap-2">

                          {item.status !== "in_progress" &&
                           item.status !== "resolved" ? (

                            <form
                              action={updateSchoolInterventionStatusAction}
                            >
                              <input
                                type="hidden"
                                name="interventionId"
                                value={item.intervention_id}
                              />

                              <input
                                type="hidden"
                                name="status"
                                value="in_progress"
                              />

                              <button
                                type="submit"
                                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white transition hover:bg-amber-600"
                              >
                                بدء المتابعة
                              </button>
                            </form>

                          ) : null}


                          {item.status !== "resolved" ? (

                            <form
                              action={updateSchoolInterventionStatusAction}
                            >
                              <input
                                type="hidden"
                                name="interventionId"
                                value={item.intervention_id}
                              />

                              <input
                                type="hidden"
                                name="status"
                                value="resolved"
                              />

                              <button
                                type="submit"
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
                              >
                                تم الحل
                              </button>
                            </form>

                          ) : null}



                      {/* delete_school_intervention_marker */}

                      {item.status === "resolved" ? (

                        <form
                          action={updateSchoolInterventionStatusAction}
                        >
                          <input
                            type="hidden"
                            name="interventionId"
                            value={item.intervention_id}
                          />

                          <input
                            type="hidden"
                            name="status"
                            value="open"
                          />

                          <button
                            type="submit"
                            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-700"
                          >
                            ↩ إعادة فتح
                          </button>
                        </form>

                      ) : null}


                      <details className="relative">

                        <summary className="cursor-pointer list-none rounded-xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100">
                          🗑 حذف
                        </summary>

                        <div className="absolute left-0 z-40 mt-2 w-72 rounded-2xl border border-rose-200 bg-white p-4 shadow-xl">

                          <p className="text-sm font-black text-slate-900">
                            هل تريد حذف إجراء المتابعة؟
                          </p>

                          <p className="mt-2 text-xs leading-6 text-slate-500">
                            سيتم حذف هذا الإجراء نهائيًا من سجل المدرسة.
                          </p>

                          <form
                            action={deleteSchoolInterventionAction}
                            className="mt-3"
                          >
                            <input
                              type="hidden"
                              name="interventionId"
                              value={item.intervention_id}
                            />

                            <button
                              type="submit"
                              className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-700"
                            >
                              🗑 تأكيد الحذف
                            </button>

                          </form>

                        </div>

                      </details>

</div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <div className="text-4xl">
                📋
              </div>

              <h3 className="mt-3 font-black text-slate-900">
                لا توجد إجراءات متابعة بعد
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                يمكنك إنشاء إجراء مباشرة من أحد تنبيهات المدرسة.
              </p>

            </div>

          )}

        </section>

<section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-sm font-black text-violet-700">
                🧭 تحليل المعلمين والفصول
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                مقارنة الأداء الأكاديمي
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                مقارنة نشاط الفصول والطلاب والإنجاز والإتقان ومتوسط الأداء ونقاط الخبرة.
              </p>
            </div>

            <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-black text-violet-700">
              {teacherClassAnalytics.length} فصل
            </div>

          </div>


          {rankedTeacherClasses.length > 0 ? (

            <div className="mt-6 space-y-4">

              {rankedTeacherClasses.map(
                (
                  row,
                  index
                ) => {

                  const students =
                    toNumber(
                      row.student_count
                    );

                  const activeStudents =
                    toNumber(
                      row.active_student_count
                    );

                  const completed =
                    toNumber(
                      row.completed_lessons
                    );

                  const mastered =
                    toNumber(
                      row.mastered_lessons
                    );

                  const score =
                    Math.round(
                      toNumber(
                        row.average_best_score
                      )
                    );

                  const xp =
                    toNumber(
                      row.total_xp
                    );

                  const masteryRate =
                    completed > 0
                      ? Math.round(
                          (
                            mastered /
                            completed
                          ) *
                            100
                        )
                      : 0;

                  return (

                    <article
                      key={row.class_id}
                      className="rounded-2xl border border-slate-200 p-5 transition hover:border-violet-300 hover:shadow-sm"
                    >

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                        <div className="flex min-w-0 gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 font-black text-violet-700">
                            {index + 1}
                          </div>


                          <div className="min-w-0">

                            <Link
                              href={`/school/teachers/${row.teacher_id}`}
                              className="text-lg font-black text-slate-900 hover:text-violet-700 hover:underline"
                            >
                              {
                                row.teacher_name ??
                                "معلم"
                              }
                            </Link>

                            <p
                              dir="ltr"
                              className="mt-1 text-right text-xs text-slate-500"
                            >
                              {
                                row.teacher_email ??
                                ""
                              }
                            </p>


                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              <Link
                                href={`/school/classes/${row.class_id}`}
                                className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-black text-indigo-700 transition hover:bg-indigo-100"
                              >
                                🏫 {row.class_name}
                              </Link>

                              {row.academic_year ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  {row.academic_year}
                                </span>
                              ) : null}

                            </div>

                          </div>

                        </div>


                        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:max-w-4xl">

                          <AnalyticsMiniCard
                            label="الطلاب"
                            value={students}
                          />

                          <AnalyticsMiniCard
                            label="النشطون"
                            value={activeStudents}
                          />

                          <AnalyticsMiniCard
                            label="المكتمل"
                            value={completed}
                          />

                          <AnalyticsMiniCard
                            label="المتقن"
                            value={mastered}
                          />

                          <AnalyticsMiniCard
                            label="متوسط الأداء"
                            value={`${score}%`}
                          />

                          <AnalyticsMiniCard
                            label="نسبة الإتقان"
                            value={`${masteryRate}%`}
                          />

                          <AnalyticsMiniCard
                            label="XP"
                            value={xp}
                          />

                          <div className="flex items-center justify-center">
                            <Link
                              href={`/school/classes/${row.class_id}`}
                              className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-700"
                            >
                              تفاصيل الفصل
                            </Link>
                          </div>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <div className="text-4xl">
                📊
              </div>

              <h3 className="mt-3 font-black text-slate-900">
                لا توجد بيانات فصول للتحليل بعد
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                ستظهر المقارنات تلقائيًا بعد ربط المعلمين وإنشاء الفصول.
              </p>

            </div>

          )}

        </section>

<SchoolTeacherLinkCard successMessage={success} errorMessage={errorMessage} />

    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-black text-indigo-700">
            👨‍🏫 فريق التدريس
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            معلمو المدرسة المرتبطون
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            المعلمون الذين تم ربط حساباتهم بهذه المدرسة.
          </p>
        </div>

        <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">
          {schoolTeachers.length} معلم
        </div>

      </div>


      {schoolTeachers.length > 0 ? (

        <div className="mt-6 grid gap-4">

          {schoolTeachers.map(
            (teacher) => {

              const teacherClassCount =
                toNumber(
                  teacher.class_count
                );

              const teacherStudentCount =
                toNumber(
                  teacher.student_count
                );

              const teacherInitial =
                (
                  teacher.teacher_name ??
                  "م"
                )
                  .trim()
                  .charAt(0);

              return (

                <article
                  key={teacher.teacher_id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-300 hover:shadow-sm"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-start gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-black text-indigo-700">
                        {teacherInitial}
                      </div>

                      <div>

                        <h3 className="text-xl font-black text-slate-900">
                          {
                            teacher.teacher_name ??
                            "معلم"
                          }
                        </h3>

                        <p
                          dir="ltr"
                          className="mt-1 text-right text-sm text-slate-500"
                        >
                          {
                            teacher.teacher_email ??
                            ""
                          }
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                            {teacherClassCount} فصل
                          </span>

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            {teacherStudentCount} طالب
                          </span>

                        </div>

                      </div>

                    </div>


                    <a
                      href={`/school/teachers/${teacher.teacher_id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
                    >
                      عرض التفاصيل
                    </a>

                  </div>

                </article>

              );
            }
          )}

        </div>

      ) : (

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">

          <div className="text-4xl">
            👨‍🏫
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900">
            لا يوجد معلمون مرتبطون بعد
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            استخدم كود المعلم أعلاه لربط أول معلم بالمدرسة.
          </p>

        </div>

      )}

    </section>

        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">

          <h2 className="text-xl font-black text-indigo-900">
            الخطوة التالية
          </h2>

          <p className="mt-2 leading-7 text-indigo-800">
            تم تفعيل نظام ربط المعلمين بالمدرسة،
            والخطوة التالية هي إضافة صفحة تفاصيل كل معلم وفصوله وطلابه.
          </p>

        </section>

      </div>
    </main>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
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


function DashboardCard({
  icon,
  title,
  description,
  count,
}: {
  icon: string;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

      <div className="text-4xl">
        {icon}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">

        <h2 className="text-xl font-black text-slate-900">
          {title}
        </h2>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-black text-indigo-700">
          {count}
        </span>

      </div>

      <p className="mt-3 leading-7 text-slate-500">
        {description}
      </p>

    </article>
  );
}

function AnalyticsMiniCard({
  label,
  value,
}: {
  label: string;
  value:
    | number
    | string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">

      <div className="text-xl font-black text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-slate-500">
        {label}
      </div>

    </div>
  );
}
