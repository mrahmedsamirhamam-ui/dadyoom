import { getActiveSchoolTeacherLinkCode, type ActiveSchoolTeacherLinkCode } from "@/features/school-link/services/teacher-school-link";
import TeacherSchoolLinkCard from "@/features/school-link/components/TeacherSchoolLinkCard";

import Link from "next/link";
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
  createTeacherClassAction,
} from "@/features/teacher/actions/createClass";

type TeacherClassRow = {
  id: string;
  name: string;
  description: string | null;
  academic_year: string | null;
  join_code: string;
  is_active: boolean;
  created_at: string;
};

type ClassStudentRow = {
  class_id: string;
  is_active: boolean;
};

type LessonRow = {
  id: string;
  title: string;
  lesson_number: number | null;
  lesson_type: string;
  status: string;
  estimated_minutes: number | null;
};

export default async function TeacherPage() {
let schoolLinkCode: ActiveSchoolTeacherLinkCode | null = null;
  const supabase =
    await createClient();

  schoolLinkCode = await getActiveSchoolTeacherLinkCode(
    supabase as unknown as SupabaseClient
  );

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

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "full_name,role"
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
      "تعذر تحميل بيانات المعلم."
    );
  }

  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    role !== "teacher" &&
    role !== "admin"
  ) {
    redirect(
      "/student"
    );
  }

  /*
   * جداول Classroom أضيفت بعد آخر
   * توليد لأنواع Supabase.
   */
  const classroomDb =
    supabase as unknown as
      SupabaseClient;

  const [
    classesResult,
    lessonsResult,
  ] =
    await Promise.all([
      classroomDb
        .from(
          "teacher_classes"
        )
        .select(`
          id,
          name,
          description,
          academic_year,
          join_code,
          is_active,
          created_at
        `)
        .eq(
          "teacher_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),

      supabase
        .from("lessons")
        .select(`
          id,
          title,
          lesson_number,
          lesson_type,
          status,
          estimated_minutes
        `)
        .order(
          "lesson_number"
        ),
    ]);

  if (
    classesResult.error
  ) {
    throw classesResult.error;
  }

  if (
    lessonsResult.error
  ) {
    throw lessonsResult.error;
  }

  const classes =
    (
      classesResult.data ??
      []
    ) as TeacherClassRow[];

  const lessons =
    (
      lessonsResult.data ??
      []
    ) as LessonRow[];

  const classIds =
    classes.map(
      (item) =>
        item.id
    );

  let memberships:
    ClassStudentRow[] = [];

  if (
    classIds.length > 0
  ) {
    const {
      data,
      error,
    } = await classroomDb
      .from(
        "teacher_class_students"
      )
      .select(
        "class_id,is_active"
      )
      .in(
        "class_id",
        classIds
      );

    if (error) {
      throw error;
    }

    memberships =
      (
        data ??
        []
      ) as ClassStudentRow[];
  }

  const studentCountByClass =
    new Map<
      string,
      number
    >();

  for (
    const membership of
    memberships
  ) {
    if (
      !membership.is_active
    ) {
      continue;
    }

    studentCountByClass.set(
      membership.class_id,
      (
        studentCountByClass.get(
          membership.class_id
        ) ??
        0
      ) + 1
    );
  }

  const totalStudents =
    memberships.filter(
      (membership) =>
        membership.is_active
    ).length;

  const activeClasses =
    classes.filter(
      (item) =>
        item.is_active
    ).length;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-8">

        <section className="rounded-3xl bg-gradient-to-l from-emerald-700 to-teal-600 p-7 text-white shadow-sm">
          <p className="text-sm font-black text-emerald-100">
            لوحة المعلم
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            مرحبًا{" "}
            {profile.full_name}
            {" 👋"}
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-emerald-50">
            أدر فصولك وطلابك ومحتواك التعليمي من مكان واحد.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Metric
              label="الفصول النشطة"
              value={activeClasses}
            />

            <Metric
              label="الطلاب"
              value={totalStudents}
            />

            <Metric
              label="الدروس"
              value={lessons.length}
            />
          </div>
        </section>


        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">

          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-black text-emerald-700">
              ➕ فصل جديد
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              إنشاء فصل
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              بعد الإنشاء سيحصل الفصل تلقائيًا على كود يستطيع الطلاب استخدامه للانضمام.
            </p>

            <form
              action={
                createTeacherClassAction
              }
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="class_name"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  اسم الفصل
                </label>

                <input
                  id="class_name"
                  name="name"
                  required
                  placeholder="مثال: الصف الرابع - أ"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="academic_year"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  العام الدراسي
                </label>

                <input
                  id="academic_year"
                  name="academic_year"
                  placeholder="2026–2027"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  وصف اختياري
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="ملاحظات عن الفصل..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-black text-white transition hover:bg-emerald-700"
              >
                إنشاء الفصل
              </button>
            </form>
          </aside>


          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-teal-700">
                  🏫 فصولي
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  الفصول الدراسية
                </h2>
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
                {classes.length} فصل
              </div>
            </div>

            {classes.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {classes.map(
                  (teacherClass) => {
                    const studentCount =
                      studentCountByClass.get(
                        teacherClass.id
                      ) ??
                      0;

                    return (
                      <article
                        key={
                          teacherClass.id
                        }
                        className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">
                              {
                                teacherClass.name
                              }
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {
                                teacherClass.academic_year ??
                                "العام الدراسي غير محدد"
                              }
                            </p>
                          </div>

                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-black",
                              teacherClass.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500",
                            ].join(
                              " "
                            )}
                          >
                            {
                              teacherClass.is_active
                                ? "نشط"
                                : "متوقف"
                            }
                          </span>
                        </div>

                        {
                          teacherClass.description
                            ? (
                              <p className="mt-4 text-sm leading-6 text-slate-600">
                                {
                                  teacherClass.description
                                }
                              </p>
                            )
                            : null
                        }

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <div className="text-xl font-black text-slate-900">
                              {
                                studentCount
                              }
                            </div>

                            <div className="text-xs font-bold text-slate-500">
                              طالب
                            </div>
                          </div>

                          <div className="rounded-xl bg-emerald-50 p-3 text-center">
                            <div
                              dir="ltr"
                              className="font-black tracking-widest text-emerald-800"
                            >
                              {
                                teacherClass.join_code
                              }
                            </div>

                            <div className="mt-1 text-xs font-bold text-emerald-600">
                              كود الانضمام
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/teacher/classes/${teacherClass.id}`}
                          className="mt-5 inline-flex font-black text-emerald-700"
                        >
                          إدارة الفصل ←
                        </Link>
                      </article>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <div className="text-5xl">
                  🏫
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-900">
                  لم تنشئ فصلًا بعد
                </h3>

                <p className="mt-2 text-slate-500">
                  أنشئ أول فصل وسيظهر كود الانضمام هنا مباشرة.
                </p>
              </div>
            )}
          </section>
        </section>


        <TeacherSchoolLinkCard code={schoolLinkCode} />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-indigo-700">
                📚 المحتوى
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                الدروس
              </h2>
            </div>

            <Link
              href="/teacher/new"
              className="rounded-xl bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-700"
            >
              + إضافة درس
            </Link>
          </div>

          {lessons.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="p-4 text-right">
                      #
                    </th>

                    <th className="p-4 text-right">
                      عنوان الدرس
                    </th>

                    <th className="p-4 text-right">
                      النوع
                    </th>

                    <th className="p-4 text-right">
                      المدة
                    </th>

                    <th className="p-4 text-right">
                      الحالة
                    </th>

                    <th className="p-4 text-right">
                      إدارة
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lessons.map(
                    (
                      lesson,
                      index
                    ) => (
                      <tr
                        key={
                          lesson.id
                        }
                        className="border-b border-slate-100"
                      >
                        <td className="p-4">
                          {
                            lesson.lesson_number ??
                            index + 1
                          }
                        </td>

                        <td className="p-4 font-bold text-slate-900">
                          {
                            lesson.title
                          }
                        </td>

                        <td className="p-4 text-slate-600">
                          {
                            lesson.lesson_type
                          }
                        </td>

                        <td className="p-4 text-slate-600">
                          {
                            lesson.estimated_minutes ??
                            0
                          }{" "}
                          دقيقة
                        </td>

                        <td className="p-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            {
                              lesson.status
                            }
                          </span>
                        </td>

                        <td className="p-4">
                          <Link
                            href={`/teacher/${lesson.id}`}
                            className="font-black text-emerald-700"
                          >
                            تعديل
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-slate-500">
              لا توجد دروس حتى الآن.
            </p>
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
    <div className="rounded-2xl bg-white/15 p-4 text-center">
      <div className="text-3xl font-black">
        {value}
      </div>

      <div className="mt-1 text-sm font-bold text-emerald-50">
        {label}
      </div>
    </div>
  );
}