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

type TeacherDetailsRow = {
  teacher_id: string;
  teacher_name: string | null;
  teacher_email: string | null;

  class_id: string | null;
  class_name: string | null;
  class_description: string | null;
  academic_year: string | null;
  join_code: string | null;
  class_is_active: boolean | null;
  class_created_at: string | null;

  student_count:
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

export default async function SchoolTeacherDetailsPage({
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
      "get_school_teacher_details",
      {
        p_teacher_id: id,
      }
    );

  if (error) {
    throw error;
  }

  const rows =
    (
      data ??
      []
    ) as TeacherDetailsRow[];

  if (rows.length === 0) {
    notFound();
  }

  const teacher =
    rows[0];

  const classes =
    rows.filter(
      (row) =>
        row.class_id !== null
    );

  const totalClasses =
    classes.length;

  const totalStudents =
    classes.reduce(
      (
        sum,
        teacherClass
      ) =>
        sum +
        toNumber(
          teacherClass.student_count
        ),
      0
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">

        <div>
          <Link
            href="/school"
            className="text-sm font-black text-indigo-700 hover:underline"
          >
            ← العودة إلى لوحة المدرسة
          </Link>
        </div>


        <section className="rounded-3xl bg-gradient-to-l from-indigo-800 via-violet-700 to-purple-700 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-indigo-100">
            👨‍🏫 تفاصيل المعلم
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {
              teacher.teacher_name ??
              "معلم"
            }
          </h1>

          <p
            dir="ltr"
            className="mt-2 text-right text-indigo-100"
          >
            {
              teacher.teacher_email ??
              ""
            }
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">

            <Metric
              label="الفصول"
              value={totalClasses}
            />

            <Metric
              label="الطلاب"
              value={totalStudents}
            />

          </div>

        </section>


        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div>
            <p className="text-sm font-black text-indigo-700">
              🏫 الفصول
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              فصول المعلم
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              جميع الفصول التي أنشأها هذا المعلم داخل ضاديوم.
            </p>
          </div>


          {classes.length > 0 ? (

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {classes.map(
                (teacherClass) => {

                  const classId =
                    teacherClass.class_id as string;

                  const studentCount =
                    toNumber(
                      teacherClass.student_count
                    );

                  return (
                    <article
                      key={classId}
                      className="rounded-2xl border border-slate-200 p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h3 className="text-xl font-black text-slate-900">
                            {
                              teacherClass.class_name ??
                              "فصل"
                            }
                          </h3>

                          {teacherClass.class_description ? (
                            <p className="mt-2 text-sm leading-7 text-slate-500">
                              {
                                teacherClass.class_description
                              }
                            </p>
                          ) : null}

                        </div>

                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                          {
                            teacherClass.class_is_active
                              ? "نشط"
                              : "غير نشط"
                          }
                        </span>

                      </div>


                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-slate-50 p-4 text-center">

                          <div className="text-2xl font-black text-slate-900">
                            {studentCount}
                          </div>

                          <div className="mt-1 text-xs font-bold text-slate-500">
                            الطلاب
                          </div>

                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 text-center">

                          <div
                            dir="ltr"
                            className="text-lg font-black text-slate-900"
                          >
                            {
                              teacherClass.join_code ??
                              "-"
                            }
                          </div>

                          <div className="mt-1 text-xs font-bold text-slate-500">
                            كود الفصل
                          </div>

                        </div>

                      </div>


                      <div className="mt-4 space-y-1 text-sm text-slate-500">

                        {teacherClass.academic_year ? (
                          <p>
                            العام الدراسي:{" "}
                            <span className="font-bold text-slate-700">
                              {
                                teacherClass.academic_year
                              }
                            </span>
                          </p>
                        ) : null}

                        {teacherClass.class_created_at ? (
                          <p>
                            تاريخ الإنشاء:{" "}
                            <span className="font-bold text-slate-700">
                              {
                                formatDate(
                                  teacherClass.class_created_at
                                )
                              }
                            </span>
                          </p>
                        ) : null}

                      </div>


                      <Link
                        href={`/teacher/classes/${classId}`}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-700"
                      >
                        عرض الفصل
                      </Link>

                    </article>
                  );
                }
              )}

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">

              <div className="text-4xl">
                🏫
              </div>

              <h3 className="mt-3 text-lg font-black text-slate-900">
                لا توجد فصول لهذا المعلم بعد
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                ستظهر الفصول هنا تلقائيًا عندما ينشئ المعلم أول فصل.
              </p>

            </div>

          )}

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