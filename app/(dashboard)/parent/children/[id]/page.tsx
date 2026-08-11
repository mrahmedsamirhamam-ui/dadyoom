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


type ParentChildRow = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  relationship: string | null;

  completed_lessons:
    | number
    | string
    | null;

  mastered_lessons:
    | number
    | string
    | null;

  average_score:
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


export default async function ParentChildPage({
  params,
}: PageProps) {

  const {
    id,
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


  const {
    data: profile,
    error: profileError,
  } =
    await supabase
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
      "تعذر تحميل بيانات ولي الأمر."
    );
  }


  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";


  if (
    role !== "parent" &&
    role !== "admin"
  ) {
    redirect("/student");
  }


  const db =
    supabase as unknown as
      SupabaseClient;


  const {
    data,
    error,
  } =
    await db.rpc(
      "get_parent_children"
    );


  if (error) {
    throw error;
  }


  const children =
    (
      data ??
      []
    ) as ParentChildRow[];


  const child =
    children.find(
      (item) =>
        item.student_id === id
    );


  if (!child) {
    notFound();
  }


  const completedLessons =
    toNumber(
      child.completed_lessons
    );


  const masteredLessons =
    toNumber(
      child.mastered_lessons
    );


  const averageScore =
    Math.round(
      toNumber(
        child.average_score
      )
    );


  const totalXP =
    toNumber(
      child.total_xp
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
            : "يحتاج دعمًا إضافيًا";


  const parentRecommendation =
    completedLessons === 0
      ? "لم يبدأ الطالب تسجيل تقدم كافٍ بعد. شجعه على بدء الدروس وإكمال أول تقييم."
      : averageScore >= 85 &&
          masteryRate >= 70
        ? "تقدم ممتاز. استمر في تشجيعه والمحافظة على انتظامه في التعلم."
        : averageScore >= 70
          ? "مستواه جيد. التشجيع على المراجعة المنتظمة سيساعده على رفع نسبة الإتقان."
          : averageScore >= 50
            ? "يحتاج إلى مزيد من المراجعة والمتابعة. شجعه على العودة إلى الدروس والمهارات الأقل إتقانًا."
            : "تظهر البيانات حاجة إلى دعم أكبر. من الأفضل متابعة تقدمه مع المعلم والتركيز على المهارات الأساسية.";


  return (

    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >

      <div className="mx-auto max-w-5xl space-y-7">


        <div>

          <Link
            href="/parent"
            className="text-sm font-black text-sky-700 hover:underline"
          >
            ← العودة إلى لوحة ولي الأمر
          </Link>

        </div>


        <section className="rounded-3xl bg-gradient-to-l from-sky-700 via-cyan-700 to-teal-600 p-7 text-white shadow-sm">

          <p className="text-sm font-black text-cyan-100">
            👨‍👩‍👧 متابعة الابن
          </p>


          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <h1 className="text-3xl font-black sm:text-4xl">
                {
                  child.full_name ??
                  "الطالب"
                }
              </h1>


              {child.email ? (

                <p
                  dir="ltr"
                  className="mt-2 text-right text-sm text-cyan-100"
                >
                  {child.email}
                </p>

              ) : null}


              {child.relationship ? (

                <span className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-black">
                  {child.relationship}
                </span>

              ) : null}

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
                        : academicStatus === "يحتاج دعمًا إضافيًا"
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
              label="متوسط الدرجات"
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

            <p className="text-sm font-black text-sky-700">
              📊 التقدم الأكاديمي
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              مستوى التقدم الحالي
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


            <div className="mt-6 grid grid-cols-2 gap-4">

              <InfoCard
                label="الدروس المكتملة"
                value={completedLessons}
              />

              <InfoCard
                label="الدروس المتقنة"
                value={masteredLessons}
              />

            </div>

          </article>


          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

            <p className="text-sm font-black text-amber-700">
              💡 توصية لولي الأمر
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              كيف يمكنك دعم تقدمه؟
            </h2>

            <p className="mt-4 leading-8 text-slate-700">
              {parentRecommendation}
            </p>


            <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-amber-100">

              <div className="text-xs font-bold text-slate-500">
                الحالة الحالية
              </div>

              <div className="mt-1 text-lg font-black text-amber-900">
                {academicStatus}
              </div>

            </div>

          </article>

        </section>


        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <h2 className="text-xl font-black text-slate-900">
            ملخص التقدم
          </h2>

          <p className="mt-2 leading-7 text-slate-500">
            هذه المؤشرات تتحدث تلقائيًا مع تقدم الطالب في الدروس والتقييمات داخل ضاديوم.
          </p>


          <Link
            href="/parent"
            className="mt-5 inline-flex rounded-xl bg-sky-700 px-6 py-3 font-black text-white transition hover:bg-sky-800"
          >
            العودة إلى جميع الأبناء
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

      <div className="mt-1 text-xs font-bold text-cyan-50">
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

        <span className="font-black text-sky-700">
          {value}%
        </span>

      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-sky-600"
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
  value:
    | number
    | string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 text-center">

      <div className="text-2xl font-black text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-slate-500">
        {label}
      </div>

    </div>
  );
}
