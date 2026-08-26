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



type TeacherClassAnalyticsRow = {
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



  const {
    data: teacherAnalyticsData,
    error: teacherAnalyticsError,
  } = await db.rpc(
    "get_school_teacher_class_analytics_v1"
  );

  if (teacherAnalyticsError) {
    throw teacherAnalyticsError;
  }

  const allTeacherClassAnalytics =
    (
      teacherAnalyticsData ??
      []
    ) as TeacherClassAnalyticsRow[];

  const teacherClassAnalytics =
    allTeacherClassAnalytics.filter(
      (row) =>
        row.teacher_id === id
    );

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



  const analyticsCompleted =
    teacherClassAnalytics.reduce(
      (sum, row) =>
        sum +
        toNumber(
          row.completed_lessons
        ),
      0
    );

  const analyticsMastered =
    teacherClassAnalytics.reduce(
      (sum, row) =>
        sum +
        toNumber(
          row.mastered_lessons
        ),
      0
    );

  const teacherTotalXP =
    teacherClassAnalytics.reduce(
      (sum, row) =>
        sum +
        toNumber(
          row.total_xp
        ),
      0
    );

  const teacherAverageScore =
    teacherClassAnalytics.length > 0
      ? Math.round(
          teacherClassAnalytics.reduce(
            (sum, row) =>
              sum +
              toNumber(
                row.average_best_score
              ),
            0
          ) /
            teacherClassAnalytics.length
        )
      : 0;

  const teacherMasteryRate =
    analyticsCompleted > 0
      ? Math.round(
          (
            analyticsMastered /
            analyticsCompleted
          ) *
            100
        )
      : 0;

  const rankedClasses =
    [...teacherClassAnalytics].sort(
      (a, b) =>
        toNumber(
          b.average_best_score
        ) -
        toNumber(
          a.average_best_score
        )
    );

  const bestClass =
    rankedClasses.length > 0
      ? rankedClasses[0]
      : null;

  const classesNeedingSupport =
    rankedClasses.filter(
      (row) =>
        toNumber(
          row.average_best_score
        ) < 70
    );

  const urgentClasses =
    rankedClasses.filter(
      (row) =>
        toNumber(
          row.average_best_score
        ) < 50
    );

  const teacherAcademicStatus =
    teacherClassAnalytics.length === 0
      ? "بانتظار بيانات"
      : teacherAverageScore >= 85 &&
          teacherMasteryRate >= 70
        ? "أداء متميز"
        : teacherAverageScore >= 70
          ? "أداء جيد"
          : teacherAverageScore >= 50
            ? "يحتاج متابعة"
            : "يحتاج تدخل عاجل";

  const suggestedTeacherPriority =
    teacherClassAnalytics.length === 0
      ? "low"
      : teacherAverageScore < 50 ||
          urgentClasses.length > 0
        ? "high"
        : teacherAverageScore < 70 ||
            classesNeedingSupport.length > 0
          ? "medium"
          : "low";

  const teacherRecommendation =
    teacherClassAnalytics.length === 0
      ? "لا توجد بيانات أكاديمية كافية لفصول المعلم حتى الآن."
      : teacherAverageScore >= 85 &&
          teacherMasteryRate >= 70
        ? "تظهر بيانات فصول المعلم مستوى أداء مرتفعًا. يوصى بالاستمرار في الممارسات الحالية وتبادل الخبرات الناجحة."
        : teacherAverageScore >= 70
          ? "أداء فصول المعلم جيد بصورة عامة، مع فرصة لتعزيز الإتقان ودعم الفصول الأقل أداءً."
          : teacherAverageScore >= 50
            ? "تظهر البيانات حاجة بعض فصول المعلم إلى متابعة أكاديمية وخطة دعم محددة."
            : "تظهر البيانات حاجة إلى تدخل أكاديمي ومتابعة مكثفة للفصول ذات النتائج المنخفضة.";
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



            {/* teacher_mastery_metric_marker */}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <TeacherMetric
                label="متوسط الأداء"
                value={`${teacherAverageScore}%`}
              />

              <TeacherMetric
                label="نسبة الإتقان"
                value={`${teacherMasteryRate}%`}
              />

              <TeacherMetric
                label="إجمالي XP"
                value={teacherTotalXP}
              />

            </div>

</div>

        </section>




        {/* teacher_intelligence_marker */}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <p className="text-sm font-black text-violet-700">
                🧠 تحليل أداء المعلم
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                قراءة أكاديمية لفصول المعلم
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                يعتمد التحليل على أداء الطلاب والإتقان والإنجاز داخل جميع فصول المعلم.
              </p>

            </div>

            <span
              className={
                "inline-flex shrink-0 rounded-full px-4 py-2 text-sm font-black " +
                (
                  teacherAcademicStatus === "أداء متميز"
                    ? "bg-emerald-100 text-emerald-700"
                    : teacherAcademicStatus === "أداء جيد"
                      ? "bg-sky-100 text-sky-700"
                      : teacherAcademicStatus === "يحتاج متابعة"
                        ? "bg-amber-100 text-amber-700"
                        : teacherAcademicStatus === "يحتاج تدخل عاجل"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                )
              }
            >
              {teacherAcademicStatus}
            </span>

          </div>


          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <TeacherInsightMetric
              label="متوسط الأداء"
              value={`${teacherAverageScore}%`}
            />

            <TeacherInsightMetric
              label="نسبة الإتقان"
              value={`${teacherMasteryRate}%`}
            />

            <TeacherInsightMetric
              label="فصول تحتاج متابعة"
              value={classesNeedingSupport.length}
            />

            <TeacherInsightMetric
              label="الأولوية"
              value={
                suggestedTeacherPriority === "high"
                  ? "عالية"
                  : suggestedTeacherPriority === "medium"
                    ? "متوسطة"
                    : "منخفضة"
              }
            />

          </div>


          <div className="mt-6 grid gap-5 lg:grid-cols-2">

            <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">

              <h3 className="font-black text-emerald-900">
                🏆 أفضل فصل
              </h3>

              {bestClass ? (

                <Link
                  href={`/school/classes/${bestClass.class_id}`}
                  className="mt-4 block rounded-xl bg-white p-5 ring-1 ring-emerald-100 transition hover:ring-emerald-300"
                >

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <div className="font-black text-slate-900">
                        {bestClass.class_name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {
                          toNumber(
                            bestClass.student_count
                          )
                        }{" "}
                        طالب
                      </div>

                    </div>

                    <div className="text-2xl font-black text-emerald-700">
                      {
                        Math.round(
                          toNumber(
                            bestClass.average_best_score
                          )
                        )
                      }%
                    </div>

                  </div>

                </Link>

              ) : (

                <p className="mt-4 text-sm text-emerald-800">
                  لا توجد بيانات فصول كافية بعد.
                </p>

              )}

            </div>


            <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">

              <h3 className="font-black text-amber-900">
                ⚠️ فصول تحتاج متابعة
              </h3>

              {classesNeedingSupport.length > 0 ? (

                <div className="mt-4 space-y-3">

                  {classesNeedingSupport.map(
                    (row) => (

                      <Link
                        key={row.class_id}
                        href={`/school/classes/${row.class_id}`}
                        className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-amber-100 transition hover:ring-amber-300"
                      >

                        <span className="font-black text-slate-900">
                          {row.class_name}
                        </span>

                        <span
                          className={
                            "font-black " +
                            (
                              toNumber(
                                row.average_best_score
                              ) < 50
                                ? "text-rose-700"
                                : "text-amber-700"
                            )
                          }
                        >
                          {
                            Math.round(
                              toNumber(
                                row.average_best_score
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
                  لا توجد فصول تحت مستوى المتابعة حاليًا.
                </p>

              )}

            </div>

          </div>


          <div className="mt-5 rounded-2xl bg-slate-50 p-5">

            <p className="text-sm font-black text-slate-900">
              التوصية
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {teacherRecommendation}
            </p>

          </div>


          {classes.length > 0 ? (

            <form
              action={createSchoolInterventionAction}
              className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5"
            >

              <input
                type="hidden"
                name="teacherId"
                value={teacher.teacher_id}
              />

              <input
                type="hidden"
                name="studentId"
                value=""
              />

              <input
                type="hidden"
                name="insightType"
                value="teacher_academic_follow_up"
              />


              <div>

                <p className="font-black text-violet-900">
                  🎯 إنشاء متابعة للمعلم
                </p>

                <p className="mt-1 text-sm leading-6 text-violet-700">
                  اختر الفصل المرتبط بالمتابعة حتى يكون الإجراء محددًا وقابلًا للقياس.
                </p>

              </div>


              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <label>

                  <span className="text-sm font-black text-slate-700">
                    الفصل
                  </span>

                  <select
                    name="classId"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500"
                  >

                    {classes.map(
                      (teacherClass) => (

                        <option
                          key={teacherClass.class_id}
                          value={
                            teacherClass.class_id ??
                            ""
                          }
                        >
                          {
                            teacherClass.class_name ??
                            "فصل"
                          }
                        </option>

                      )
                    )}

                  </select>

                </label>


                <label>

                  <span className="text-sm font-black text-slate-700">
                    الأولوية
                  </span>

                  <select
                    name="priority"
                    defaultValue={suggestedTeacherPriority}
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
                  عنوان المتابعة
                </span>

                <input
                  name="title"
                  required
                  defaultValue={`متابعة أكاديمية للمعلم - ${
                    teacher.teacher_name ??
                    "المعلم"
                  }`}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500"
                />

              </label>


              <label className="mt-4 block">

                <span className="text-sm font-black text-slate-700">
                  الملاحظات
                </span>

                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={teacherRecommendation}
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 leading-7 outline-none focus:border-violet-500"
                />

              </label>


              <button
                type="submit"
                className="mt-4 rounded-xl bg-violet-700 px-6 py-3 text-sm font-black text-white transition hover:bg-violet-800"
              >
                ➕ إنشاء متابعة
              </button>

            </form>

          ) : null}

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
                        href={`/school/classes/${classId}`}
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




function TeacherMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-5 text-center backdrop-blur">

      <div className="text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-indigo-100">
        {label}
      </div>

    </div>
  );
}


function TeacherInsightMetric({
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
