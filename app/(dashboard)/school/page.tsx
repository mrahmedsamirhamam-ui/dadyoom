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

type SchoolPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
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