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

type SchoolClassRow = {
  class_id: string;
  class_name: string;
  class_description: string | null;
  academic_year: string | null;
  join_code: string;
  class_is_active: boolean;
  class_created_at: string;

  teacher_id: string;
  teacher_name: string | null;
  teacher_email: string | null;

  student_id: string | null;
  student_name: string | null;
  student_email: string | null;
  joined_at: string | null;

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
  value: string | null
) {
  if (!value) {
    return "";
  }

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

export default async function SchoolClassDetailsPage({
  params,
}: PageProps) {
  const {
    id,
  } = await params;

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

  const {
    data,
    error,
  } =
    await db.rpc(
      "get_school_class_details",
      {
        p_class_id: id,
      }
    );

  if (error) {
    throw error;
  }

  const rows =
    (
      data ??
      []
    ) as SchoolClassRow[];

  if (rows.length === 0) {
    notFound();
  }

  const classInfo =
    rows[0];

  const students =
    rows.filter(
      (row) =>
        row.student_id !== null
    );

  const totalStudents =
    students.length;

  const totalCompleted =
    students.reduce(
      (sum, student) =>
        sum +
        toNumber(
          student.completed_lessons
        ),
      0
    );

  const totalMastered =
    students.reduce(
      (sum, student) =>
        sum +
        toNumber(
          student.mastered_lessons
        ),
      0
    );

  const totalXP =
    students.reduce(
      (sum, student) =>
        sum +
        toNumber(
          student.total_xp
        ),
      0
    );

  const averageScore =
    totalStudents > 0
      ? Math.round(
          students.reduce(
            (sum, student) =>
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
            href={`/school/teachers/${classInfo.teacher_id}`}
            className="text-sm font-black text-indigo-700 hover:underline"
          >
            ← العودة إلى تفاصيل المعلم
          </Link>
        </div>


        <section className="rounded-3xl bg-gradient-to-l from-indigo-800 via-violet-700 to-purple-700 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-indigo-100">
            🏫 تفاصيل الفصل
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {classInfo.class_name}
          </h1>

          <p className="mt-2 text-indigo-100">
            المعلم:{" "}
            <span className="font-black">
              {
                classInfo.teacher_name ??
                "معلم"
              }
            </span>
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <Metric
              label="الطلاب"
              value={totalStudents}
            />

            <Metric
              label="الدروس المكتملة"
              value={totalCompleted}
            />

            <Metric
              label="الدروس المتقنة"
              value={totalMastered}
            />

            <Metric
              label="متوسط الدرجات"
              value={`${averageScore}%`}
            />

            <Metric
              label="إجمالي XP"
              value={totalXP}
            />

          </div>

        </section>


        <section className="grid gap-5 lg:grid-cols-3">

          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">

            <p className="text-sm font-black text-indigo-700">
              👨‍🎓 الطلاب
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              طلاب الفصل
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              متابعة تقدم جميع الطلاب المنضمين إلى هذا الفصل.
            </p>


            {students.length > 0 ? (

              <div className="mt-6 grid gap-4">

                {students.map(
                  (student) => {

                    const studentId =
                      student.student_id as string;

                    const score =
                      Math.round(
                        toNumber(
                          student.average_best_score
                        )
                      );

                    return (
                      <article
                        key={studentId}
                        className="rounded-2xl border border-slate-200 p-5"
                      >

                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                          <div>

                            <h3 className="text-lg font-black text-slate-900">
                              {
                                student.student_name ??
                                "طالب"
                              }
                            </h3>

                            <p
                              dir="ltr"
                              className="mt-1 text-right text-sm text-slate-500"
                            >
                              {
                                student.student_email ??
                                ""
                              }
                            </p>

                            {student.joined_at ? (
                              <p className="mt-2 text-xs text-slate-500">
                                انضم:{" "}
                                {
                                  formatDate(
                                    student.joined_at
                                  )
                                }
                              </p>
                            ) : null}

                          </div>


                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                            <MiniMetric
                              label="مكتمل"
                              value={
                                toNumber(
                                  student.completed_lessons
                                )
                              }
                            />

                            <MiniMetric
                              label="متقن"
                              value={
                                toNumber(
                                  student.mastered_lessons
                                )
                              }
                            />

                            <MiniMetric
                              label="المتوسط"
                              value={`${score}%`}
                            />

                            <MiniMetric
                              label="XP"
                              value={
                                toNumber(
                                  student.total_xp
                                )
                              }
                            />

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            ) : (

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">

                <div className="text-4xl">
                  👨‍🎓
                </div>

                <h3 className="mt-3 text-lg font-black text-slate-900">
                  لا يوجد طلاب في هذا الفصل بعد
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  سيظهر الطلاب هنا تلقائيًا عندما ينضموا إلى الفصل.
                </p>

              </div>

            )}

          </article>


          <aside className="space-y-5">

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <p className="text-sm font-black text-indigo-700">
                📋 بيانات الفصل
              </p>

              <div className="mt-5 space-y-4">

                <InfoRow
                  label="الحالة"
                  value={
                    classInfo.class_is_active
                      ? "نشط"
                      : "غير نشط"
                  }
                />

                <InfoRow
                  label="كود الفصل"
                  value={
                    classInfo.join_code
                  }
                  ltr
                />

                <InfoRow
                  label="العام الدراسي"
                  value={
                    classInfo.academic_year ??
                    "-"
                  }
                />

                <InfoRow
                  label="تاريخ الإنشاء"
                  value={
                    formatDate(
                      classInfo.class_created_at
                    )
                  }
                />

              </div>

            </section>


            {classInfo.class_description ? (

              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

                <p className="text-sm font-black text-indigo-700">
                  📝 وصف الفصل
                </p>

                <p className="mt-3 leading-7 text-slate-600">
                  {
                    classInfo.class_description
                  }
                </p>

              </section>

            ) : null}

          </aside>

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


function MiniMetric({
  label,
  value,
}: {
  label: string;
  value:
    | number
    | string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">

      <div className="font-black text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-slate-500">
        {label}
      </div>

    </div>
  );
}


function InfoRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0">

      <div className="text-xs font-bold text-slate-500">
        {label}
      </div>

      <div
        dir={
          ltr
            ? "ltr"
            : undefined
        }
        className="mt-1 font-black text-slate-900"
      >
        {value}
      </div>

    </div>
  );
}