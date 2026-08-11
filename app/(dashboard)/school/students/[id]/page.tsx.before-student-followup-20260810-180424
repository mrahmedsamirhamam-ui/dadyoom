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

type SchoolStudentRow = {
  student_id: string;
  student_name: string | null;
  student_email: string | null;
  country: string | null;

  class_id: string;
  class_name: string;
  academic_year: string | null;

  teacher_id: string;
  teacher_name: string | null;
  teacher_email: string | null;

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
    return "-";
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

export default async function SchoolStudentDetailsPage({
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
      "get_school_student_details",
      {
        p_student_id: id,
      }
    );

  if (error) {
    throw error;
  }

  const rows =
    (
      data ??
      []
    ) as SchoolStudentRow[];

  if (rows.length === 0) {
    notFound();
  }

  const student =
    rows[0];

  const completedLessons =
    toNumber(
      student.completed_lessons
    );

  const masteredLessons =
    toNumber(
      student.mastered_lessons
    );

  const averageScore =
    Math.round(
      toNumber(
        student.average_best_score
      )
    );

  const totalXP =
    toNumber(
      student.total_xp
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">

        <div className="flex flex-wrap gap-4">
          <Link
            href={`/school/classes/${student.class_id}`}
            className="text-sm font-black text-indigo-700 hover:underline"
          >
            ← العودة إلى الفصل
          </Link>

          <Link
            href="/school"
            className="text-sm font-black text-slate-600 hover:underline"
          >
            لوحة المدرسة
          </Link>
        </div>


        <section className="rounded-3xl bg-gradient-to-l from-indigo-800 via-violet-700 to-purple-700 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-indigo-100">
            👨‍🎓 ملف الطالب
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {
              student.student_name ??
              "طالب"
            }
          </h1>

          <p
            dir="ltr"
            className="mt-2 text-right text-indigo-100"
          >
            {
              student.student_email ??
              ""
            }
          </p>

          {student.country ? (
            <p className="mt-2 text-sm text-indigo-100">
              🌍 {student.country}
            </p>
          ) : null}


          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Metric
              label="الدروس المكتملة"
              value={completedLessons}
            />

            <Metric
              label="الدروس المتقنة"
              value={masteredLessons}
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
              📊 المتابعة الأكاديمية
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              ملخص تقدم الطالب
            </h2>

            <p className="mt-2 leading-7 text-slate-500">
              نظرة سريعة على أداء الطالب داخل منصة ضاديوم.
            </p>


            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <ProgressCard
                title="إنجاز الدروس"
                value={completedLessons}
                description="عدد الدروس التي أكملها الطالب."
              />

              <ProgressCard
                title="الإتقان"
                value={masteredLessons}
                description="عدد الدروس التي وصل فيها الطالب إلى مستوى الإتقان."
              />

              <ProgressCard
                title="متوسط الأداء"
                value={`${averageScore}%`}
                description="متوسط أفضل نتائج الطالب المسجلة."
              />

              <ProgressCard
                title="نقاط الخبرة"
                value={totalXP}
                description="إجمالي نقاط XP المكتسبة."
              />

            </div>

          </article>


          <aside className="space-y-5">

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

              <p className="text-sm font-black text-indigo-700">
                🏫 الفصل الحالي
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-900">
                {student.class_name}
              </h2>

              <div className="mt-5 space-y-4">

                <InfoRow
                  label="المعلم"
                  value={
                    student.teacher_name ??
                    "معلم"
                  }
                />

                <InfoRow
                  label="العام الدراسي"
                  value={
                    student.academic_year ??
                    "-"
                  }
                />

                <InfoRow
                  label="تاريخ الانضمام"
                  value={
                    formatDate(
                      student.joined_at
                    )
                  }
                />

              </div>

              <Link
                href={`/school/classes/${student.class_id}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-700"
              >
                عرض الفصل
              </Link>

            </section>


            {rows.length > 1 ? (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

                <p className="text-sm font-black text-indigo-700">
                  📚 فصول الطالب
                </p>

                <div className="mt-4 space-y-3">

                  {rows.map(
                    (row) => (
                      <Link
                        key={row.class_id}
                        href={`/school/classes/${row.class_id}`}
                        className="block rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <div className="font-black text-slate-900">
                          {row.class_name}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {
                            row.teacher_name ??
                            "معلم"
                          }
                        </div>
                      </Link>
                    )
                  )}

                </div>

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


function ProgressCard({
  title,
  value,
  description,
}: {
  title: string;
  value:
    | number
    | string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">

      <div className="text-sm font-black text-indigo-700">
        {title}
      </div>

      <div className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0">

      <div className="text-xs font-bold text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-black text-slate-900">
        {value}
      </div>

    </div>
  );
}