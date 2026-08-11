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
} from "../../actions";

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

  

  const classMasteryRate =
    totalCompleted > 0
      ? Math.round(
          (
            totalMastered /
            totalCompleted
          ) *
            100
        )
      : 0;


  const rankedStudents =
    [...students].sort(
      (a, b) =>
        toNumber(
          b.average_best_score
        ) -
        toNumber(
          a.average_best_score
        )
    );


  const topStudents =
    rankedStudents.slice(
      0,
      3
    );


  const studentsNeedingSupport =
    rankedStudents.filter(
      (student) =>
        toNumber(
          student.average_best_score
        ) < 70
    );


  const urgentStudents =
    rankedStudents.filter(
      (student) =>
        toNumber(
          student.average_best_score
        ) < 50
    );


  const classAcademicStatus =
    totalStudents === 0
      ? "بانتظار بيانات"
      : averageScore >= 85 &&
          classMasteryRate >= 70
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
          urgentStudents.length >=
            Math.ceil(
              totalStudents * 0.3
            )
        ? "high"
        : averageScore < 70 ||
            studentsNeedingSupport.length > 0
          ? "medium"
          : "low";


  const classRecommendation =
    totalStudents === 0
      ? "لا توجد بيانات طلاب كافية حتى الآن لإصدار توصية أكاديمية."
      : averageScore >= 85 &&
          classMasteryRate >= 70
        ? "الفصل يحقق أداءً مرتفعًا. يوصى بالاستمرار في أنشطة الإثراء ودعم الطلاب للحفاظ على مستوى الإتقان."
        : averageScore >= 70
          ? "أداء الفصل جيد بصورة عامة، مع أهمية متابعة الطلاب الأقل أداءً وتعزيز المهارات التي لم تصل بعد إلى مستوى الإتقان."
          : averageScore >= 50
            ? "يحتاج الفصل إلى خطة تعزيز أكاديمية مركزة مع متابعة الطلاب الذين تقل نتائجهم عن المستوى المستهدف."
            : "تظهر بيانات الفصل حاجة إلى تدخل أكاديمي مبكر وخطة متابعة مكثفة للطلاب ذوي الأداء المنخفض.";
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


        

        {/* class_intelligence_marker */}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <p className="text-sm font-black text-violet-700">
                🧠 التحليل الأكاديمي للفصل
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                قراءة ذكية لأداء الفصل
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                تحليل يعتمد على متوسط النتائج ونسبة الإتقان وأداء الطلاب المسجل داخل المنصة.
              </p>

            </div>

            <span
              className={
                "inline-flex shrink-0 rounded-full px-4 py-2 text-sm font-black " +
                (
                  classAcademicStatus === "أداء متميز"
                    ? "bg-emerald-100 text-emerald-700"
                    : classAcademicStatus === "أداء جيد"
                      ? "bg-sky-100 text-sky-700"
                      : classAcademicStatus === "يحتاج متابعة"
                        ? "bg-amber-100 text-amber-700"
                        : classAcademicStatus === "يحتاج تدخل عاجل"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                )
              }
            >
              {classAcademicStatus}
            </span>

          </div>


          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <ClassInsightMetric
              label="نسبة الإتقان"
              value={`${classMasteryRate}%`}
            />

            <ClassInsightMetric
              label="يحتاجون متابعة"
              value={studentsNeedingSupport.length}
            />

            <ClassInsightMetric
              label="تدخل عاجل"
              value={urgentStudents.length}
            />

            <ClassInsightMetric
              label="الأولوية"
              value={
                suggestedClassPriority === "high"
                  ? "عالية"
                  : suggestedClassPriority === "medium"
                    ? "متوسطة"
                    : "منخفضة"
              }
            />

          </div>


          <div className="mt-6 grid gap-5 lg:grid-cols-2">

            <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">

              <h3 className="font-black text-emerald-900">
                🏆 أعلى الطلاب أداءً
              </h3>

              {topStudents.length > 0 ? (

                <div className="mt-4 space-y-3">

                  {topStudents.map(
                    (student, index) => (

                      <Link
                        key={
                          student.student_id ??
                          index
                        }
                        href={`/school/students/${student.student_id}`}
                        className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-emerald-100 transition hover:ring-emerald-300"
                      >

                        <div className="min-w-0">

                          <div className="font-black text-slate-900">
                            {index + 1}.{" "}
                            {
                              student.student_name ??
                              "طالب"
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {
                              toNumber(
                                student.mastered_lessons
                              )
                            }{" "}
                            درس متقن
                          </div>

                        </div>

                        <div className="text-xl font-black text-emerald-700">
                          {
                            Math.round(
                              toNumber(
                                student.average_best_score
                              )
                            )
                          }%
                        </div>

                      </Link>

                    )
                  )}

                </div>

              ) : (

                <p className="mt-4 text-sm text-emerald-800">
                  لا توجد بيانات طلاب بعد.
                </p>

              )}

            </div>


            <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">

              <h3 className="font-black text-amber-900">
                ⚠️ الطلاب الذين يحتاجون متابعة
              </h3>

              {studentsNeedingSupport.length > 0 ? (

                <div className="mt-4 space-y-3">

                  {studentsNeedingSupport
                    .slice(0, 5)
                    .map(
                      (student) => (

                        <Link
                          key={student.student_id}
                          href={`/school/students/${student.student_id}`}
                          className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-amber-100 transition hover:ring-amber-300"
                        >

                          <span className="font-black text-slate-900">
                            {
                              student.student_name ??
                              "طالب"
                            }
                          </span>

                          <span
                            className={
                              "font-black " +
                              (
                                toNumber(
                                  student.average_best_score
                                ) < 50
                                  ? "text-rose-700"
                                  : "text-amber-700"
                              )
                            }
                          >
                            {
                              Math.round(
                                toNumber(
                                  student.average_best_score
                                )
                              )
                            }%
                          </span>

                        </Link>

                      )
                    )}

                </div>

              ) : (

                <p className="mt-4 text-sm text-emerald-700">
                  لا يوجد طلاب تحت مستوى المتابعة حاليًا.
                </p>

              )}

            </div>

          </div>


          <div className="mt-5 rounded-2xl bg-slate-50 p-5">

            <p className="text-sm font-black text-slate-900">
              التوصية الأكاديمية
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {classRecommendation}
            </p>

          </div>


          <form
            action={createSchoolInterventionAction}
            className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5"
          >

            <input
              type="hidden"
              name="teacherId"
              value={classInfo.teacher_id}
            />

            <input
              type="hidden"
              name="classId"
              value={classInfo.class_id}
            />

            <input
              type="hidden"
              name="studentId"
              value=""
            />

            <input
              type="hidden"
              name="insightType"
              value="class_academic_follow_up"
            />


            <div className="flex flex-col gap-2">

              <p className="font-black text-violet-900">
                🎯 إنشاء إجراء متابعة للفصل
              </p>

              <p className="text-sm leading-6 text-violet-700">
                سيظهر الإجراء مباشرة في قسم متابعة القرارات والإجراءات في لوحة المدرسة.
              </p>

            </div>


            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <label>

                <span className="text-sm font-black text-slate-700">
                  عنوان المتابعة
                </span>

                <input
                  name="title"
                  required
                  defaultValue={`متابعة أكاديمية للفصل - ${classInfo.class_name}`}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500"
                />

              </label>


              <label>

                <span className="text-sm font-black text-slate-700">
                  الأولوية
                </span>

                <select
                  name="priority"
                  defaultValue={suggestedClassPriority}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500"
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


            <label className="mt-4 block">

              <span className="text-sm font-black text-slate-700">
                ملاحظات المتابعة
              </span>

              <textarea
                name="notes"
                rows={4}
                defaultValue={classRecommendation}
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 leading-7 outline-none focus:border-violet-500"
              />

            </label>


            <button
              type="submit"
              className="mt-4 rounded-xl bg-violet-700 px-6 py-3 text-sm font-black text-white transition hover:bg-violet-800"
            >
              ➕ إنشاء متابعة للفصل
            </button>

          </form>

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

                      
                        <Link
                          href={`/school/students/${studentId}`}
                          className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700 transition hover:bg-indigo-100"
                        >
                          عرض تفاصيل الطالب
                        </Link>
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




function ClassInsightMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200">

      <div className="text-2xl font-black text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-slate-500">
        {label}
      </div>

    </div>
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