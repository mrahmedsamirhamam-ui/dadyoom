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

import {
  createSchoolInterventionAction,
  updateSchoolInterventionStatusAction,
  deleteSchoolInterventionAction,
} from "../../actions";



type StudentInterventionRow = {
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
  created_at: string | null;
  resolved_at: string | null;
};

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

  

  const {
    data: studentInterventionsData,
    error: studentInterventionsError,
  } = await db.rpc(
    "get_school_interventions_v1"
  );

  if (studentInterventionsError) {
    throw studentInterventionsError;
  }

  const studentInterventions =
    (
      (
        studentInterventionsData ??
        []
      ) as StudentInterventionRow[]
    ).filter(
      (item) =>
        item.student_id === id
    );

  const openStudentInterventions =
    studentInterventions.filter(
      (item) =>
        item.status === "open"
    );

  const inProgressStudentInterventions =
    studentInterventions.filter(
      (item) =>
        item.status === "in_progress"
    );

  const resolvedStudentInterventions =
    studentInterventions.filter(
      (item) =>
        item.status === "resolved"
    );

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

  const studentAcademicStatus =
    completedLessons === 0
      ? "بانتظار بيانات كافية"
      : averageScore >= 85 &&
          masteryRate >= 70
        ? "أداء ممتاز"
        : averageScore >= 70
          ? "أداء جيد"
          : averageScore >= 50
            ? "يحتاج متابعة"
            : "يحتاج تدخل عاجل";

  const suggestedPriority =
    completedLessons === 0
      ? "low"
      : averageScore < 50
        ? "high"
        : averageScore < 70
          ? "medium"
          : "low";

  const academicAssessment =
    completedLessons === 0
      ? "لا توجد بيانات تعلم كافية حتى الآن لإصدار تقييم أكاديمي دقيق."
      : averageScore >= 85 &&
          masteryRate >= 70
        ? "الطالب يحقق مستوى مرتفعًا في الأداء والإتقان، ويوصى بالاستمرار مع تقديم أنشطة إثرائية مناسبة."
        : averageScore >= 70
          ? "أداء الطالب جيد، مع إمكانية تحسين مستوى الإتقان من خلال متابعة المهارات التي تحتاج إلى تعزيز."
          : averageScore >= 50
            ? "تظهر البيانات حاجة الطالب إلى متابعة أكاديمية وخطة تعزيز مركزة."
            : "تظهر البيانات حاجة الطالب إلى تدخل أكاديمي مبكر ومتابعة أكثر كثافة.";
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

          

            {/* student_intervention_form_marker */}

            <section className="mt-7 rounded-3xl border border-violet-200 bg-violet-50/60 p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <p className="text-sm font-black text-violet-700">
                    🎯 التقييم الأكاديمي الذكي
                  </p>

                  <h3 className="mt-1 text-xl font-black text-slate-900">
                    متابعة الطالب واتخاذ إجراء
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    تحليل أولي يعتمد على بيانات الإنجاز والإتقان ومتوسط النتائج المسجلة للطالب.
                  </p>

                </div>

                <span
                  className={
                    "inline-flex shrink-0 rounded-full px-4 py-2 text-sm font-black " +
                    (
                      studentAcademicStatus === "أداء ممتاز"
                        ? "bg-emerald-100 text-emerald-700"
                        : studentAcademicStatus === "أداء جيد"
                          ? "bg-sky-100 text-sky-700"
                          : studentAcademicStatus === "يحتاج متابعة"
                            ? "bg-amber-100 text-amber-700"
                            : studentAcademicStatus === "يحتاج تدخل عاجل"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-700"
                    )
                  }
                >
                  {studentAcademicStatus}
                </span>

              </div>


              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <div className="rounded-2xl bg-white p-4 ring-1 ring-violet-100">
                  <div className="text-xs font-bold text-slate-500">
                    متوسط الأداء
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {averageScore}%
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-violet-100">
                  <div className="text-xs font-bold text-slate-500">
                    نسبة الإتقان
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {masteryRate}%
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-violet-100">
                  <div className="text-xs font-bold text-slate-500">
                    الأولوية المقترحة
                  </div>
                  <div className="mt-1 font-black text-slate-900">
                    {
                      suggestedPriority === "high"
                        ? "عالية"
                        : suggestedPriority === "medium"
                          ? "متوسطة"
                          : "منخفضة"
                    }
                  </div>
                </div>

              </div>


              <div className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-violet-100">

                <p className="text-sm font-black text-slate-900">
                  التوصية
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {academicAssessment}
                </p>

              </div>


              <form
                action={createSchoolInterventionAction}
                className="mt-6 space-y-4"
              >

                <input
                  type="hidden"
                  name="studentId"
                  value={student.student_id}
                />

                <input
                  type="hidden"
                  name="teacherId"
                  value={student.teacher_id}
                />

                <input
                  type="hidden"
                  name="classId"
                  value={student.class_id}
                />

                <input
                  type="hidden"
                  name="insightType"
                  value="student_academic_follow_up"
                />


                <div className="grid gap-4 sm:grid-cols-2">

                  <label className="block">

                    <span className="text-sm font-black text-slate-700">
                      عنوان المتابعة
                    </span>

                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={`متابعة أكاديمية - ${
                        student.student_name ??
                        "الطالب"
                      }`}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />

                  </label>


                  <label className="block">

                    <span className="text-sm font-black text-slate-700">
                      الأولوية
                    </span>

                    <select
                      name="priority"
                      defaultValue={suggestedPriority}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="low">
                        منخفضة
                      </option>

                      <option value="medium">
                        متوسطة
                      </option>

                      <option value="high">
                        عالية
                      </option>
                    </select>

                  </label>

                </div>


                <label className="block">

                  <span className="text-sm font-black text-slate-700">
                    ملاحظات المدرسة
                  </span>

                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={academicAssessment}
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />

                </label>


                <div className="flex flex-wrap items-center gap-3">

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-violet-700 px-6 py-3 text-sm font-black text-white transition hover:bg-violet-800"
                  >
                    ➕ إنشاء متابعة لهذا الطالب
                  </button>

                  <Link
                    href="/school"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100"
                  >
                    عرض جميع المتابعات
                  </Link>

                </div>

              </form>

            </section>

</article>


          

          {/* student_intervention_history_marker */}

          <section className="mt-7 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

              <div>

                <p className="text-sm font-black text-indigo-700">
                  📋 سجل المتابعات
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  تاريخ متابعة الطالب
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  جميع إجراءات المتابعة الأكاديمية المرتبطة بهذا الطالب.
                </p>

              </div>


              <div className="flex flex-wrap gap-2">

                <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                  {openStudentInterventions.length} مفتوح
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                  {inProgressStudentInterventions.length} قيد المتابعة
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  {resolvedStudentInterventions.length} تم الحل
                </span>

              </div>

            </div>


            {studentInterventions.length > 0 ? (

              <div className="mt-6 space-y-4">

                {studentInterventions.map(
                  (item) => {

                    const statusLabel =
                      item.status === "open"
                        ? "مفتوح"
                        : item.status === "in_progress"
                          ? "قيد المتابعة"
                          : "تم الحل";

                    const statusClass =
                      item.status === "open"
                        ? "bg-rose-100 text-rose-700"
                        : item.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700";

                    const priorityLabel =
                      item.priority === "high"
                        ? "عالية"
                        : item.priority === "medium"
                          ? "متوسطة"
                          : "منخفضة";

                    return (

                      <article
                        key={item.intervention_id}
                        className="rounded-2xl border border-slate-200 p-5"
                      >

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}
                              >
                                {statusLabel}
                              </span>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                أولوية {priorityLabel}
                              </span>

                            </div>


                            <h4 className="mt-3 text-lg font-black text-slate-900">
                              {item.title}
                            </h4>


                            {item.notes ? (

                              <p className="mt-2 text-sm leading-7 text-slate-600">
                                {item.notes}
                              </p>

                            ) : null}


                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

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

                              {item.created_at ? (
                                <span>
                                  أُنشئت: {formatDate(item.created_at)}
                                </span>
                              ) : null}

                              {item.resolved_at ? (
                                <span>
                                  تم الحل: {formatDate(item.resolved_at)}
                                </span>
                              ) : null}

                            </div>

                          </div>


                          <div className="flex shrink-0 flex-wrap gap-2">

                            {item.status === "open" ? (

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
                                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600"
                                >
                                  ▶ بدء المتابعة
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
                                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                                >
                                  ✅ تم الحل
                                </button>

                              </form>

                            ) : null}


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
                                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-black text-white hover:bg-sky-700"
                                >
                                  ↩ إعادة فتح
                                </button>

                              </form>

                            ) : null}


                            <details className="relative">

                              <summary className="cursor-pointer list-none rounded-xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 hover:bg-rose-100">
                                🗑 حذف
                              </summary>

                              <div className="absolute left-0 z-40 mt-2 w-64 rounded-2xl border border-rose-200 bg-white p-4 shadow-xl">

                                <p className="text-sm font-black text-slate-900">
                                  حذف هذه المتابعة؟
                                </p>

                                <p className="mt-1 text-xs leading-6 text-slate-500">
                                  سيتم حذفها نهائيًا من سجل الطالب والمدرسة.
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
                                    className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700"
                                  >
                                    تأكيد الحذف
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

                <h4 className="mt-3 font-black text-slate-900">
                  لا توجد متابعات لهذا الطالب بعد
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  يمكن إنشاء أول متابعة من نموذج التقييم الأكاديمي أعلاه.
                </p>

              </div>

            )}

          </section>

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