import Link from "next/link";
import { redirect } from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import SchoolTeacherLinkCard from "@/features/school-link/components/SchoolTeacherLinkCard";
import { createClient } from "@/lib/supabase/server";

import {
  createSchoolAction,
  deleteSchoolInterventionAction,
  updateSchoolInterventionStatusAction,
} from "./actions";

type SchoolDashboardRow = {
  school_id: string;
  school_name: string;
  teacher_count: number | string | null;
  class_count: number | string | null;
  student_count: number | string | null;
};

type SchoolTeacherRow = {
  teacher_id: string;
  teacher_name: string | null;
  teacher_email: string | null;
  joined_at: string | null;
  class_count: number | string | null;
  student_count: number | string | null;
};

type SchoolInterventionRow = {
  intervention_id: string;
  status: string;
  priority: string;
  title: string;
  notes: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
  class_id: string | null;
  class_name: string | null;
  student_id: string | null;
  student_name: string | null;
};

type SchoolPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

function toNumber(
  value: number | string | null | undefined,
) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function priorityLabel(value: string) {
  if (value === "high") return "عالية";
  if (value === "low") return "منخفضة";
  return "متوسطة";
}

function statusLabel(value: string) {
  if (value === "resolved") return "تم الحل";
  if (value === "in_progress") return "قيد المتابعة";
  return "مفتوحة";
}

export default async function SchoolPage({
  searchParams,
}: SchoolPageProps) {
  const {
    success,
    error: errorMessage,
  } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("full_name,role,country")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(
      "تعذر تحميل بيانات حساب المدرسة.",
    );
  }

  const role = String(profile.role ?? "")
    .trim()
    .toLowerCase();

  if (
    role !== "school" &&
    role !== "admin"
  ) {
    redirect("/student");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const dashboardResult =
    await db.rpc(
      "get_school_dashboard",
    );

  if (dashboardResult.error) {
    throw dashboardResult.error;
  }

  const dashboardRaw =
    Array.isArray(
      dashboardResult.data,
    )
      ? dashboardResult.data[0]
      : dashboardResult.data;

  const dashboard =
    dashboardRaw
      ? (
          dashboardRaw as SchoolDashboardRow
        )
      : null;

  if (!dashboard) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 px-4 py-10"
      >
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-black text-indigo-700">
              🏫 إعداد المدرسة
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              مرحبًا بك في ضاديوم للمدارس
            </h1>

            <p className="mt-3 leading-7 text-slate-500">
              أكمل بيانات المدرسة الأساسية لبدء إدارة المعلمين والفصول والطلاب.
            </p>

            {success ? (
              <div className="mt-5 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-700">
                ✓ {success}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-5 rounded-xl bg-rose-50 p-3 font-bold text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <form
              action={createSchoolAction}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  اسم المدرسة
                </span>
                <input
                  name="name"
                  required
                  placeholder="مثال: مدرسة ضاديوم الدولية"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  الدولة
                </span>
                <input
                  name="country"
                  defaultValue={profile.country ?? ""}
                  placeholder="البحرين"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  العام الدراسي
                </span>
                <input
                  name="academicYear"
                  placeholder="2026–2027"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-black text-white transition hover:bg-indigo-700"
              >
                إنشاء ملف المدرسة
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const [
    teachersResult,
    interventionsResult,
  ] = await Promise.all([
    db.rpc(
      "get_school_teachers",
    ),
    db.rpc(
      "get_school_interventions_v1",
    ),
  ]);

  if (teachersResult.error) {
    throw teachersResult.error;
  }

  if (interventionsResult.error) {
    throw interventionsResult.error;
  }

  const schoolTeachers =
    (
      teachersResult.data ??
      []
    ) as SchoolTeacherRow[];

  const schoolInterventions =
    (
      interventionsResult.data ??
      []
    ) as SchoolInterventionRow[];

  const recentInterventions =
    schoolInterventions.slice(0, 6);

  const teacherCount =
    toNumber(
      dashboard.teacher_count,
    );

  const classCount =
    toNumber(
      dashboard.class_count,
    );

  const studentCount =
    toNumber(
      dashboard.student_count,
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            prefetch={false}
            href="/school/meetings"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-800"
          >
            🎥 اجتماعات المعلمين
          </Link>

          <Link
            prefetch={false}
            href="/school/reports"
            className="inline-flex items-center justify-center rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-800"
          >
            📊 التقارير والتحليلات
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-l from-indigo-800 via-violet-700 to-purple-700 p-7 text-white shadow-sm">
          <p className="text-sm font-black text-indigo-100">
            🏫 لوحة المدرسة
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {dashboard.school_name}
          </h1>

          <p className="mt-3 text-indigo-100">
            إدارة يومية خفيفة وسريعة، مع نقل التحليلات التفصيلية إلى صفحة التقارير.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <Metric
              label="المعلمون"
              value={teacherCount}
            />
            <Metric
              label="الفصول"
              value={classCount}
            />
            <Metric
              label="الطلاب"
              value={studentCount}
            />
          </div>
        </section>

        {success ? (
          <div className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">
            ✓ {success}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl bg-rose-50 p-4 font-bold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <SchoolTeacherLinkCard
          successMessage={success}
          errorMessage={errorMessage}
        />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-indigo-700">
                👨‍🏫 المعلمون
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                معلمو المدرسة
              </h2>
            </div>

            <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">
              {schoolTeachers.length} مرتبط
            </span>
          </div>

          {schoolTeachers.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {schoolTeachers
                .slice(0, 20)
                .map(
                  (
                    teacher,
                  ) => (
                    <Link
                      key={
                        teacher.teacher_id
                      }
                      prefetch={false}
                      href={
                        `/school/teachers/${teacher.teacher_id}`
                      }
                      className="rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <div className="font-black text-slate-900">
                        {teacher.teacher_name ?? "معلم"}
                      </div>

                      <div
                        dir="ltr"
                        className="mt-1 text-right text-xs text-slate-500"
                      >
                        {teacher.teacher_email ?? ""}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                        <span>
                          {toNumber(
                            teacher.class_count,
                          )} فصل
                        </span>
                        <span>
                          {toNumber(
                            teacher.student_count,
                          )} طالب
                        </span>
                      </div>
                    </Link>
                  ),
                )}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              لا يوجد معلمون مرتبطون بالمدرسة بعد.
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-violet-700">
                🎯 المتابعات
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                أحدث إجراءات المتابعة
              </h2>
            </div>

            <Link
              prefetch={false}
              href="/school/reports"
              className="rounded-xl bg-violet-50 px-4 py-2 text-sm font-black text-violet-700"
            >
              عرض التحليلات والتفاصيل
            </Link>
          </div>

          {recentInterventions.length ? (
            <div className="mt-5 space-y-3">
              {recentInterventions.map(
                (
                  item,
                ) => (
                  <article
                    key={
                      item.intervention_id
                    }
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="font-black text-slate-900">
                          {item.title}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                          <span>
                            الحالة: {statusLabel(item.status)}
                          </span>
                          <span>
                            الأولوية: {priorityLabel(item.priority)}
                          </span>
                          {item.teacher_name ? (
                            <span>
                              المعلم: {item.teacher_name}
                            </span>
                          ) : null}
                          {item.class_name ? (
                            <span>
                              الفصل: {item.class_name}
                            </span>
                          ) : null}
                          {item.student_name ? (
                            <span>
                              الطالب: {item.student_name}
                            </span>
                          ) : null}
                        </div>

                        {item.notes ? (
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <form
                          action={
                            updateSchoolInterventionStatusAction
                          }
                        >
                          <input
                            type="hidden"
                            name="interventionId"
                            value={
                              item.intervention_id
                            }
                          />
                          <select
                            name="status"
                            defaultValue={
                              item.status
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="open">
                              مفتوحة
                            </option>
                            <option value="in_progress">
                              قيد المتابعة
                            </option>
                            <option value="resolved">
                              تم الحل
                            </option>
                          </select>
                          <button
                            type="submit"
                            className="ms-2 rounded-xl bg-indigo-700 px-3 py-2 text-sm font-black text-white"
                          >
                            حفظ
                          </button>
                        </form>

                        <form
                          action={
                            deleteSchoolInterventionAction
                          }
                        >
                          <input
                            type="hidden"
                            name="interventionId"
                            value={
                              item.intervention_id
                            }
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700"
                          >
                            حذف
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              لا توجد متابعات حالية. يمكن إنشاء متابعة من تفاصيل المعلم أو الفصل.
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
