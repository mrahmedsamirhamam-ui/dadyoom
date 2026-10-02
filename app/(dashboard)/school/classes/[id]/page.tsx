import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import { createSchoolInterventionAction } from "../../actions";

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
  completed_lessons: number | string | null;
  mastered_lessons: number | string | null;
  average_best_score: number | string | null;
  total_xp: number | string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("ar-BH", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function toNumber(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export default async function SchoolClassDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const db = supabase as unknown as SupabaseClient;

  /*
   * This RPC already verifies that the signed-in school owns the class.
   * Use it as the single source of truth instead of doing a duplicate class
   * lookup first. This keeps the route inside Cloudflare's CPU budget.
   */
  const { data, error } = await db.rpc("get_school_class_details", {
    p_class_id: id,
  });

  if (error) {
    console.error("SCHOOL_CLASS_DETAILS_RPC_FAILED:", error.message);
    notFound();
  }

  const rows = (data ?? []) as SchoolClassRow[];

  if (!rows.length) {
    notFound();
  }

  const classInfo = rows[0];
  const students = rows.filter((row) => row.student_id !== null);
  const totalStudents = students.length;

  let totalCompleted = 0;
  let totalMastered = 0;
  let totalXP = 0;
  let scoreSum = 0;

  for (const student of students) {
    totalCompleted += toNumber(student.completed_lessons);
    totalMastered += toNumber(student.mastered_lessons);
    totalXP += toNumber(student.total_xp);
    scoreSum += toNumber(student.average_best_score);
  }

  const averageScore =
    totalStudents > 0 ? Math.round(scoreSum / totalStudents) : 0;

  const classMasteryRate =
    totalCompleted > 0
      ? Math.round((totalMastered / totalCompleted) * 100)
      : 0;

  const rankedStudents = [...students].sort(
    (a, b) =>
      toNumber(b.average_best_score) -
      toNumber(a.average_best_score),
  );

  const topStudents = rankedStudents.slice(0, 3);
  const studentsNeedingSupport = rankedStudents.filter(
    (student) => toNumber(student.average_best_score) < 70,
  );
  const urgentStudents = rankedStudents.filter(
    (student) => toNumber(student.average_best_score) < 50,
  );

  const classAcademicStatus =
    totalStudents === 0
      ? "بانتظار بيانات"
      : averageScore >= 85 && classMasteryRate >= 70
        ? "أداء متميز"
        : averageScore >= 70
          ? "أداء جيد"
          : averageScore >= 50
            ? "يحتاج متابعة"
            : "يحتاج تدخل عاجل";

  const suggestedClassPriority =
    totalStudents === 0
      ? "low"
      : averageScore < 50 ||
          urgentStudents.length >= Math.ceil(totalStudents * 0.3)
        ? "high"
        : averageScore < 70 || studentsNeedingSupport.length > 0
          ? "medium"
          : "low";

  const classRecommendation =
    totalStudents === 0
      ? "لا توجد بيانات طلاب كافية حتى الآن لإصدار توصية أكاديمية."
      : averageScore >= 85 && classMasteryRate >= 70
        ? "الفصل يحقق أداءً مرتفعًا. استمر في أنشطة الإثراء مع متابعة ثبات مستوى الإتقان."
        : averageScore >= 70
          ? "أداء الفصل جيد. ركّز على الطلاب الأقل أداءً والمهارات التي لم تصل إلى مستوى الإتقان."
          : averageScore >= 50
            ? "يحتاج الفصل إلى خطة تعزيز أكاديمية مركزة ومتابعة الطلاب تحت المستوى المستهدف."
            : "تظهر البيانات حاجة إلى تدخل أكاديمي مبكر ومتابعة مكثفة للطلاب ذوي الأداء المنخفض.";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href={`/school/teachers/${classInfo.teacher_id}`}
          className="text-sm font-black text-indigo-700 hover:underline"
        >
          ← العودة إلى تفاصيل المعلم
        </Link>

        <section className="rounded-3xl bg-indigo-800 p-6 text-white shadow-sm">
          <p className="text-sm font-black text-indigo-100">
            🏫 تفاصيل الفصل
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {classInfo.class_name}
          </h1>
          <p className="mt-2 text-indigo-100">
            المعلم:{" "}
            <strong>{classInfo.teacher_name ?? "معلم"}</strong>
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="الطلاب" value={totalStudents} />
            <Metric label="الدروس المكتملة" value={totalCompleted} />
            <Metric label="الدروس المتقنة" value={totalMastered} />
            <Metric label="متوسط الدرجات" value={`${averageScore}%`} />
            <Metric label="إجمالي XP" value={totalXP} />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-violet-700">
                🧠 التحليل الأكاديمي
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                قراءة سريعة لأداء الفصل
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              {classAcademicStatus}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="نسبة الإتقان" value={`${classMasteryRate}%`} />
            <MiniMetric
              label="يحتاجون متابعة"
              value={studentsNeedingSupport.length}
            />
            <MiniMetric
              label="تدخل عاجل"
              value={urgentStudents.length}
            />
          </div>

          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {classRecommendation}
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <StudentSummary
              title="🏆 أعلى الطلاب أداءً"
              students={topStudents}
            />
            <StudentSummary
              title="⚠️ يحتاجون متابعة"
              students={studentsNeedingSupport.slice(0, 5)}
            />
          </div>

          <form
            action={createSchoolInterventionAction}
            className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5"
          >
            <input type="hidden" name="teacherId" value={classInfo.teacher_id} />
            <input type="hidden" name="classId" value={classInfo.class_id} />
            <input type="hidden" name="studentId" value="" />
            <input
              type="hidden"
              name="insightType"
              value="class_academic_follow_up"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-black text-slate-700">
                عنوان المتابعة
                <input
                  name="title"
                  required
                  defaultValue={`متابعة أكاديمية للفصل - ${classInfo.class_name}`}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
              </label>

              <label className="text-sm font-black text-slate-700">
                الأولوية
                <select
                  name="priority"
                  defaultValue={suggestedClassPriority}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </label>
            </div>

            <textarea
              name="notes"
              rows={3}
              defaultValue={classRecommendation}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 leading-7"
            />

            <button
              type="submit"
              className="mt-3 rounded-xl bg-violet-700 px-6 py-3 text-sm font-black text-white"
            >
              ➕ إنشاء متابعة للفصل
            </button>
          </form>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-black text-slate-900">
              👨‍🎓 طلاب الفصل
            </h2>

            {students.length ? (
              <div className="mt-5 grid gap-3">
                {students.map((student) => {
                  const studentId = student.student_id as string;
                  const score = Math.round(
                    toNumber(student.average_best_score),
                  );

                  return (
                    <Link
                      key={studentId}
                      href={`/school/students/${studentId}`}
                      className="grid gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-300 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <div className="font-black text-slate-900">
                          {student.student_name ?? "طالب"}
                        </div>
                        <div
                          dir="ltr"
                          className="mt-1 text-right text-xs text-slate-500"
                        >
                          {student.student_email ?? ""}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs font-black text-slate-700">
                        <span>{score}%</span>
                        <span>
                          {toNumber(student.mastered_lessons)} متقن
                        </span>
                        <span>{toNumber(student.total_xp)} XP</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
                لا يوجد طلاب في هذا الفصل بعد.
              </p>
            )}
          </article>

          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-black text-indigo-700">📋 بيانات الفصل</h2>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow
                label="الحالة"
                value={classInfo.class_is_active ? "نشط" : "غير نشط"}
              />
              <InfoRow label="كود الفصل" value={classInfo.join_code} />
              <InfoRow
                label="العام الدراسي"
                value={classInfo.academic_year ?? "-"}
              />
              <InfoRow
                label="تاريخ الإنشاء"
                value={formatDate(classInfo.class_created_at)}
              />
            </div>

            {classInfo.class_description ? (
              <p className="mt-5 border-t pt-4 text-sm leading-7 text-slate-600">
                {classInfo.class_description}
              </p>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}

function StudentSummary({
  title,
  students,
}: {
  title: string;
  students: SchoolClassRow[];
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <h3 className="font-black text-slate-900">{title}</h3>
      {students.length ? (
        <div className="mt-3 space-y-2">
          {students.map((student) => (
            <Link
              key={student.student_id}
              href={`/school/students/${student.student_id}`}
              className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200"
            >
              <span className="font-bold">
                {student.student_name ?? "طالب"}
              </span>
              <span className="font-black text-indigo-700">
                {Math.round(toNumber(student.average_best_score))}%
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">لا توجد بيانات بعد.</p>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-center">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs font-bold text-indigo-100">{label}</div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
      <div className="text-xl font-black text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
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
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words font-black text-slate-900">{value}</div>
    </div>
  );
}
