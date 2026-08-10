import SchoolTeacherLinkCard from "@/features/school-link/components/SchoolTeacherLinkCard";
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
  createSchoolAction,
} from "./actions";

type SchoolDashboardRow = {
  school_id: string;
  school_name: string;

  teacher_count:
    | number
    | string
    | null;

  class_count:
    | number
    | string
    | null;

  student_count:
    | number
    | string
    | null;
};

type SchoolPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
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

export default async function SchoolPage({
  searchParams,
}: SchoolPageProps) {
  const {
    success,
    error: errorMessage,
  } = await searchParams;

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

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "full_name,role,country"
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
      "تعذر تحميل بيانات حساب المدرسة."
    );
  }

  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    role !== "school" &&
    role !== "admin"
  ) {
    redirect("/student");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const {
    data,
    error,
  } =
    await db.rpc(
      "get_school_dashboard"
    );

  if (error) {
    throw error;
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  const dashboard =
    row
      ? (
          row as SchoolDashboardRow
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
                  defaultValue={
                    profile.country ??
                    ""
                  }
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


  const teacherCount =
    toNumber(
      dashboard.teacher_count
    );

  const classCount =
    toNumber(
      dashboard.class_count
    );

  const studentCount =
    toNumber(
      dashboard.student_count
    );


  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">

        <section className="rounded-3xl bg-gradient-to-l from-indigo-800 via-violet-700 to-purple-700 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-indigo-100">
            🏫 لوحة المدرسة
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {
              dashboard.school_name
            }
          </h1>

          <p className="mt-3 text-indigo-100">
            إدارة المدرسة التعليمية في ضاديوم
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


        <section className="grid gap-5 md:grid-cols-3">

          <DashboardCard
            icon="👨‍🏫"
            title="المعلمون"
            description="إضافة المعلمين وربط حساباتهم بالمدرسة."
            count={teacherCount}
          />

          <DashboardCard
            icon="🏫"
            title="الفصول"
            description="متابعة الفصول التي أنشأها معلمو المدرسة."
            count={classCount}
          />

          <DashboardCard
            icon="👨‍🎓"
            title="الطلاب"
            description="متابعة الطلاب المنضمين إلى فصول المدرسة."
            count={studentCount}
          />

        </section>


        <SchoolTeacherLinkCard successMessage={success} errorMessage={errorMessage} />

        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">

          <h2 className="text-xl font-black text-indigo-900">
            الخطوة التالية
          </h2>

          <p className="mt-2 leading-7 text-indigo-800">
            سنضيف الآن نظام ربط المعلمين بالمدرسة،
            وبعده ستظهر الفصول والطلاب تلقائيًا من النظام الحالي.
          </p>

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


function DashboardCard({
  icon,
  title,
  description,
  count,
}: {
  icon: string;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

      <div className="text-4xl">
        {icon}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">

        <h2 className="text-xl font-black text-slate-900">
          {title}
        </h2>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-black text-indigo-700">
          {count}
        </span>

      </div>

      <p className="mt-3 leading-7 text-slate-500">
        {description}
      </p>

    </article>
  );
}