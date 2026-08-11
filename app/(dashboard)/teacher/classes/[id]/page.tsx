import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";

type TeacherClass = {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  academic_year: string | null;
  join_code: string;
  is_active: boolean;
  created_at: string;
};

type RosterRow = {
  student_id: string;
  full_name: string | null;
  email: string | null;

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

  joined_at: string;
};

type PageProps = {
  params: Promise<{
    id: string;
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

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "ar-BH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(
    new Date(value)
  );
}

export default async function TeacherClassPage({
  params,
}: PageProps) {
  const { id } =
    await params;

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
    redirect(
      "/login"
    );
  }

  /*
   * جداول Classroom وRPC أضيفت بعد
   * آخر توليد لأنواع Supabase.
   */
  const classroomDb =
    supabase as unknown as
      SupabaseClient;

  const {
    data: classData,
    error: classError,
  } = await classroomDb
    .from(
      "teacher_classes"
    )
    .select(`
      id,
      teacher_id,
      name,
      description,
      academic_year,
      join_code,
      is_active,
      created_at
    `)
    .eq(
      "id",
      id
    )
    .maybeSingle();

  if (classError) {
    throw classError;
  }

  if (!classData) {
    notFound();
  }

  const teacherClass =
    classData as TeacherClass;

  const {
    data: rosterData,
    error: rosterError,
  } =
    await classroomDb.rpc(
      "get_teacher_class_roster",
      {
        p_class_id:
          teacherClass.id,
      }
    );

  if (rosterError) {
    throw rosterError;
  }

  const roster =
    (
      rosterData ??
      []
    ) as RosterRow[];

  const totalStudents =
    roster.length;

  const totalCompleted =
    roster.reduce(
      (
        sum,
        student
      ) =>
        sum +
        toNumber(
          student.completed_lessons
        ),
      0
    );

  const totalMastered =
    roster.reduce(
      (
        sum,
        student
      ) =>
        sum +
        toNumber(
          student.mastered_lessons
        ),
      0
    );

  const totalXP =
    roster.reduce(
      (
        sum,
        student
      ) =>
        sum +
        toNumber(
          student.total_xp
        ),
      0
    );

  const classAverage =
    totalStudents > 0
      ? Math.round(
          roster.reduce(
            (
              sum,
              student
            ) =>
              sum +
              toNumber(
                student.average_best_score
              ),
            0
          ) /
            totalStudents
        )
      : 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">

        <div>
          <Link
            href="/teacher"
            className="text-sm font-black text-emerald-700 hover:underline"
          >
            ← العودة إلى لوحة المعلم
          </Link>
        </div>


        <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-700 via-teal-700 to-teal-600 p-7 text-white shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div>
              <p className="text-sm font-black text-emerald-100">
                🏫 إدارة الفصل
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                {teacherClass.name}
              </h1>

              <p className="mt-3 text-emerald-50">
                {
                  teacherClass.academic_year ??
                  "العام الدراسي غير محدد"
                }
              </p>

              {
                teacherClass.description
                  ? (
                    <p className="mt-3 max-w-3xl leading-7 text-teal-50">
                      {
                        teacherClass.description
                      }
                    </p>
                  )
                  : null
              }
            </div>

            <div className="rounded-2xl bg-white/15 px-6 py-4 text-center backdrop-blur">
              <div className="text-xs font-bold text-emerald-100">
                كود الانضمام
              </div>

              <div
                dir="ltr"
                className="mt-2 text-2xl font-black tracking-[0.25em]"
              >
                {
                  teacherClass.join_code
                }
              </div>

              <div className="mt-2 text-xs text-emerald-100">
                شاركه مع طلاب الفصل
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <Metric
              label="الطلاب"
              value={
                totalStudents
              }
            />

            <Metric
              label="الدروس المكتملة"
              value={
                totalCompleted
              }
            />

            <Metric
              label="الدروس المتقنة"
              value={
                totalMastered
              }
            />

            <Metric
              label="متوسط الدرجات"
              value={
                `${classAverage}%`
              }
            />

            <Metric
              label="إجمالي XP"
              value={
                totalXP
              }
            />

          </div>
        </section>


        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-sm font-black text-emerald-700">
                👨‍🎓 الطلاب
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                طلاب الفصل
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                البيانات التالية مرتبطة مباشرة بتقدم كل طالب في ضاديوم.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              {totalStudents} طالب
            </span>
          </div>


          {roster.length > 0 ? (
            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">

                    <th className="p-4 text-right">
                      الطالب
                    </th>

                    <th className="p-4 text-center">
                      مكتمل
                    </th>

                    <th className="p-4 text-center">
                      متقن
                    </th>

                    <th className="p-4 text-center">
                      متوسط الدرجة
                    </th>

                    <th className="p-4 text-center">
                      XP
                    </th>

                    <th className="p-4 text-center">
                      تاريخ الانضمام
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {roster.map(
                    (
                      student
                    ) => {

                      const averageScore =
                        Math.round(
                          toNumber(
                            student.average_best_score
                          )
                        );

                      return (
                        <tr
                          key={
                            student.student_id
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          <td className="p-4">
                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
                                {
                                  (
                                    student.full_name ??
                                    "ط"
                                  )
                                    .trim()
                                    .charAt(0)
                                }
                              </div>

                              <div>
                                <Link
  href={`/teacher/classes/${teacherClass.id}/students/${student.student_id}`}
  className="font-black text-slate-900 transition hover:text-emerald-700 hover:underline"
>
  {
    student.full_name ??
    "طالب"
  }
</Link>

                                <div
                                  dir="ltr"
                                  className="mt-1 text-right text-xs text-slate-500"
                                >
                                  {
                                    student.email ??
                                    ""
                                  }
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <span className="font-black text-emerald-700">
                              {
                                toNumber(
                                  student.completed_lessons
                                )
                              }
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <span className="font-black text-violet-700">
                              {
                                toNumber(
                                  student.mastered_lessons
                                )
                              }
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <div className="mx-auto max-w-[130px]">
                              <div className="font-black text-slate-900">
                                {
                                  averageScore
                                }%
                              </div>

                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-emerald-600"
                                  style={{
                                    width:
                                      `${Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          averageScore
                                        )
                                      )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-center font-black text-amber-600">
                            {
                              toNumber(
                                student.total_xp
                              )
                            }
                          </td>

                          <td className="p-4 text-center text-sm text-slate-500">
                            {
                              formatDate(
                                student.joined_at
                              )
                            }
                          </td>

                        </tr>
                      );
                    }
                  )}
                </tbody>

              </table>

            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

              <div className="text-5xl">
                👨‍🎓
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-900">
                لا يوجد طلاب في الفصل بعد
              </h3>

              <p className="mt-2 text-slate-500">
                أعط الطلاب كود الانضمام الظاهر بالأعلى، وسيظهرون هنا بعد الانضمام.
              </p>

            </div>
          )}

        </section>


        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">

          <div className="flex items-start gap-4">

            <div className="text-3xl">
              📊
            </div>

            <div>
              <h2 className="text-xl font-black text-indigo-900">
                المتابعة التعليمية
              </h2>

              <p className="mt-2 leading-7 text-indigo-800">
                تعرض هذه الصفحة الآن بيانات الطلاب الفعلية من نظام التقدم.
                وفي المرحلة التالية سنضيف تفاصيل كل طالب وإسناد الدروس والواجبات للفصل.
              </p>
            </div>

          </div>

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
  value:
    | number
    | string;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur">
      <div className="text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-emerald-50">
        {label}
      </div>
    </div>
  );
}