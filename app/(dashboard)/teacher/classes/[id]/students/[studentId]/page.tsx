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
    studentId: string;
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


export default async function TeacherStudentPage({
  params,
}: PageProps) {

  const {
    id,
    studentId,
  } =
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
    redirect("/login");
  }


  const db =
    supabase as unknown as
      SupabaseClient;


  const {
    data: classData,
    error: classError,
  } =
    await db
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
    await db.rpc(
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


  const student =
    roster.find(
      (row) =>
        row.student_id ===
        studentId
    );


  if (!student) {
    notFound();
  }


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


  const academicStatus =
    completedLessons === 0
      ? "بانتظار بيانات"
      : averageScore >= 85 &&
          masteryRate >= 70
        ? "أداء متميز"
        : averageScore >= 70
          ? "أداء جيد"
          : averageScore >= 50
            ? "يحتاج متابعة"
            : "يحتاج تدخل عاجل";


  const recommendation =
    completedLessons === 0
      ? "لم يسجل الطالب بيانات تعلم كافية حتى الآن. شجعه على بدء الدروس وإكمال أول تقييم."
      : averageScore >= 85 &&
          masteryRate >= 70
        ? "الطالب يحقق مستوى مرتفعًا. يوصى بالاستمرار مع أنشطة إثرائية تحافظ على تقدمه."
        : averageScore >= 70
          ? "أداء الطالب جيد، مع فرصة لتعزيز المهارات التي لم تصل بعد إلى مستوى الإتقان."
          : averageScore >= 50
            ? "يحتاج الطالب إلى متابعة أكاديمية مركزة ومراجعة المهارات الأقل أداءً."
            : "يحتاج الطالب إلى تدخل مبكر وخطة دعم واضحة مع متابعة تقدمه بصورة منتظمة.";


  return (

    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >

      <div className="mx-auto max-w-5xl space-y-7">


        <div className="flex flex-wrap items-center justify-between gap-3">

          <Link
            href={`/teacher/classes/${teacherClass.id}`}
            className="text-sm font-black text-emerald-700 hover:underline"
          >
            ← العودة إلى الفصل
          </Link>

          <Link
            href="/teacher"
            className="text-sm font-black text-slate-600 hover:underline"
          >
            لوحة المعلم
          </Link>

        </div>


        <section className="rounded-3xl bg-gradient-to-l from-emerald-700 via-teal-700 to-teal-600 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-emerald-100">
            👨‍🎓 ملف الطالب
          </p>

          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <h1 className="text-3xl font-black sm:text-4xl">
                {
                  student.full_name ??
                  "طالب"
                }
              </h1>

              {student.email ? (

                <p
                  dir="ltr"
                  className="mt-2 text-right text-sm text-emerald-100"
                >
                  {student.email}
                </p>

              ) : null}


              <p className="mt-4 text-emerald-50">
                الفصل: {teacherClass.name}
              </p>

            </div>


            <span
              className={
                "inline-flex self-start rounded-full px-4 py-2 text-sm font-black " +
                (
                  academicStatus === "أداء متميز"
                    ? "bg-emerald-100 text-emerald-800"
                    : academicStatus === "أداء جيد"
                      ? "bg-sky-100 text-sky-800"
                      : academicStatus === "يحتاج متابعة"
                        ? "bg-amber-100 text-amber-800"
                        : academicStatus === "يحتاج تدخل عاجل"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-white/20 text-white"
                )
              }
            >
              {academicStatus}
            </span>

          </div>


          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <Metric
              label="الدروس المكتملة"
              value={completedLessons}
            />

            <Metric
              label="الدروس المتقنة"
              value={masteredLessons}
            />

            <Metric
              label="متوسط الدرجة"
              value={`${averageScore}%`}
            />

            <Metric
              label="XP"
              value={totalXP}
            />

          </div>

        </section>


        <section className="grid gap-5 lg:grid-cols-2">


          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <p className="text-sm font-black text-indigo-700">
              📊 التحليل الأكاديمي
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              مستوى الطالب الحالي
            </h2>


            <div className="mt-6 space-y-5">

              <ProgressItem
                label="متوسط الأداء"
                value={averageScore}
              />

              <ProgressItem
                label="نسبة الإتقان"
                value={masteryRate}
              />

            </div>


            <div className="mt-6 rounded-2xl bg-slate-50 p-5">

              <p className="text-sm font-black text-slate-900">
                تاريخ الانضمام
              </p>

              <p className="mt-2 text-slate-600">
                {
                  formatDate(
                    student.joined_at
                  )
                }
              </p>

            </div>

          </article>


          <article className="rounded-3xl border border-violet-200 bg-violet-50 p-6">

            <p className="text-sm font-black text-violet-700">
              🧠 توصية للمعلم
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              الإجراء المقترح
            </h2>

            <p className="mt-4 leading-8 text-slate-700">
              {recommendation}
            </p>


            <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-violet-100">

              <p className="text-sm font-black text-slate-700">
                الحالة
              </p>

              <p className="mt-2 text-lg font-black text-violet-800">
                {academicStatus}
              </p>

            </div>

          </article>

        </section>


        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <h2 className="text-xl font-black text-slate-900">
            معلومات الفصل
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <InfoCard
              label="الفصل"
              value={teacherClass.name}
            />

            <InfoCard
              label="العام الدراسي"
              value={
                teacherClass.academic_year ??
                "-"
              }
            />

          </div>


          <Link
            href={`/teacher/classes/${teacherClass.id}`}
            className="mt-5 inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-black text-white transition hover:bg-emerald-700"
          >
            العودة إلى جميع طلاب الفصل
          </Link>

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


function ProgressItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>

      <div className="flex items-center justify-between gap-4">

        <span className="font-bold text-slate-700">
          {label}
        </span>

        <span className="font-black text-indigo-700">
          {value}%
        </span>

      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-indigo-600"
          style={{
            width:
              `${Math.min(
                100,
                Math.max(
                  0,
                  value
                )
              )}%`,
          }}
        />

      </div>

    </div>
  );
}


function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">

      <div className="text-xs font-bold text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-black text-slate-900">
        {value}
      </div>

    </div>
  );
}
