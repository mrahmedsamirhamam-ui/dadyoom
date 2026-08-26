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

import ParentLinkChildCard from "@/features/parent-link/components/ParentLinkChildCard";

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

export default async function ParentPage() {
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
    redirect(
      "/student"
    );
  }

  const parentDb =
    supabase as unknown as
      SupabaseClient;

  const {
    data,
    error,
  } =
    await parentDb.rpc(
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

  const totalChildren =
    children.length;

  const totalCompleted =
    children.reduce(
      (
        sum,
        child
      ) =>
        sum +
        toNumber(
          child.completed_lessons
        ),
      0
    );

  const totalMastered =
    children.reduce(
      (
        sum,
        child
      ) =>
        sum +
        toNumber(
          child.mastered_lessons
        ),
      0
    );

  const totalXP =
    children.reduce(
      (
        sum,
        child
      ) =>
        sum +
        toNumber(
          child.total_xp
        ),
      0
    );

  const averageScore =
    totalChildren > 0
      ? Math.round(
          children.reduce(
            (
              sum,
              child
            ) =>
              sum +
              toNumber(
                child.average_score
              ),
            0
          ) /
            totalChildren
        )
      : 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">

        <section className="rounded-3xl bg-gradient-to-l from-sky-700 via-cyan-700 to-teal-600 p-7 text-white shadow-sm">
          <p className="text-sm font-black text-cyan-100">
            لوحة ولي الأمر
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            مرحبًا{" "}
            {profile.full_name}
            {" 👋"}
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-cyan-50">
            تابع تقدم أبنائك في ضاديوم من مكان واحد.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric
              label="الأبناء"
              value={totalChildren}
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


        <ParentLinkChildCard />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <p className="text-sm font-black text-sky-700">
              👨‍👩‍👧‍👦 الأبناء
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              متابعة الأبناء
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              البيانات التالية مرتبطة مباشرة بتقدم كل طالب في ضاديوم.
            </p>
          </div>

          {children.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {children.map(
                (
                  child
                ) => {

                  const childAverage =
                    Math.round(
                      toNumber(
                        child.average_score
                      )
                    );

                  return (
                    <article
                      key={
                        child.student_id
                      }
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xl font-black text-sky-700">
                          {
                            (
                              child.full_name ??
                              "ط"
                            )
                              .trim()
                              .charAt(0)
                          }
                        </div>

                        <div>
                          <Link
  href={`/parent/children/${child.student_id}`}
  className="text-xl font-black text-slate-900 transition hover:text-sky-700 hover:underline"
>
  {
    child.full_name ??
    "الطالب"
  }
</Link>

                          <p
                            dir="ltr"
                            className="mt-1 text-right text-sm text-slate-500"
                          >
                            {
                              child.email ??
                              ""
                            }
                          </p>

                          {
                            child.relationship
                              ? (
                                <span className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                                  {
                                    child.relationship
                                  }
                                </span>
                              )
                              : null
                          }
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <SmallMetric
                          label="مكتمل"
                          value={
                            toNumber(
                              child.completed_lessons
                            )
                          }
                        />

                        <SmallMetric
                          label="متقن"
                          value={
                            toNumber(
                              child.mastered_lessons
                            )
                          }
                        />

                        <SmallMetric
                          label="المتوسط"
                          value={
                            `${childAverage}%`
                          }
                        />

                        <SmallMetric
                          label="XP"
                          value={
                            toNumber(
                              child.total_xp
                            )
                          }
                        />
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                          <span>
                            مستوى الأداء
                          </span>

                          <span>
                            {childAverage}%
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
                                    childAverage
                                  )
                                )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="text-5xl">
                👨‍👩‍👧‍👦
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-900">
                لا يوجد أبناء مرتبطون بالحساب بعد
              </h3>

              <p className="mt-2 text-slate-500">
                سنضيف في الخطوة التالية طريقة آمنة لربط حساب ولي الأمر بحساب الطالب.
              </p>
            </div>
          )}
        </section>


        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              🔐
            </div>

            <div>
              <h2 className="text-xl font-black text-amber-900">
                ربط الأبناء بالحساب
              </h2>

              <p className="mt-2 leading-7 text-amber-800">
                لن نسمح بإضافة أي طالب بمجرد معرفة بريده الإلكتروني.
                سنضيف نظام ربط آمن باستخدام كود موافقة أو دعوة من حساب الطالب أو المدرسة.
              </p>
            </div>
          </div>
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


function SmallMetric({
  label,
  value,
}: {
  label: string;
  value:
    | number
    | string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-lg font-black text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-slate-500">
        {label}
      </div>
    </div>
  );
}
