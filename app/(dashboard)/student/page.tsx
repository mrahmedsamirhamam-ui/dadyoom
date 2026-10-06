import Link from "next/link";
import { redirect } from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  advanceGradeForAcademicYear,
  currentAcademicYear,
} from "@/lib/student/academic-year";
import { createClient } from "@/lib/supabase/server";

type LessonRow = {
  id: string;
  title: string | null;
  estimated_minutes: number | null;
  lesson_number: number | null;
  total_count?: number | string | null;
};

type ProgressRow = {
  lesson_id: string;
  status: string | null;
  progress_percent: number | null;
  updated_at: string | null;
};

export default async function StudentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const loadStudentProfile = () =>
    supabase
      .from("profiles")
      .select(
        "full_name,role,grade_number,onboarding_completed,country,interests,learning_goal,preferred_learning_style,grade_academic_year",
      )
      .eq("id", user.id)
      .maybeSingle();

  let studentProfileResult =
    await loadStudentProfile();

  if (
    studentProfileResult.error ||
    !studentProfileResult.data
  ) {
    console.warn(
      "STUDENT_PROFILE_LOAD_RETRY",
      studentProfileResult.error?.message ??
        "profile-not-returned",
    );

    studentProfileResult =
      await loadStudentProfile();
  }

  const studentProfile =
    studentProfileResult.data;

  if (
    studentProfileResult.error ||
    !studentProfile
  ) {
    console.error(
      "STUDENT_PROFILE_LOAD_FAILED",
      studentProfileResult.error?.message ??
        "profile-not-returned",
    );

    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 px-4 py-8"
      >
        <section className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">
            تعذر تحميل لوحة الطالب مؤقتًا
          </h1>
          <p className="mt-3 leading-8 text-slate-600">
            حسابك ما زال محفوظًا. أعد المحاولة لفتح اللوحة من جديد.
          </p>
          <Link
            href="/student"
            prefetch={false}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-700 px-6 font-black text-white"
          >
            إعادة المحاولة
          </Link>
        </section>
      </main>
    );
  }

  const studentRole =
    studentProfile.role?.trim().toLowerCase() ?? "";

  const advancedGrade =
    studentRole === "student"
      ? advanceGradeForAcademicYear(
          studentProfile.grade_number,
          studentProfile.grade_academic_year,
        )
      : null;

  if (
    studentRole === "student" &&
    advancedGrade &&
    advancedGrade !== Number(studentProfile.grade_number)
  ) {
    await supabase
      .from("profiles")
      .update({
        grade_number: advancedGrade,
        grade_academic_year: currentAcademicYear(),
        onboarding_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    studentProfile.grade_number = advancedGrade;
    studentProfile.grade_academic_year = currentAcademicYear();
  }

  const interests = Array.isArray(studentProfile.interests)
    ? studentProfile.interests.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      )
    : [];

  if (
    studentRole === "student" &&
    (studentProfile.onboarding_completed !== true ||
      !Number.isInteger(Number(studentProfile.grade_number)) ||
      Number(studentProfile.grade_number) < 1 ||
      Number(studentProfile.grade_number) > 12 ||
      interests.length === 0 ||
      !studentProfile.learning_goal?.trim() ||
      !studentProfile.preferred_learning_style?.trim())
  ) {
    redirect("/onboarding");
  }

  if (studentRole !== "student" && studentRole !== "admin") {
    if (studentRole === "teacher") redirect("/teacher");
    if (studentRole === "parent") redirect("/parent");
    if (studentRole === "school") redirect("/school");
    redirect("/");
  }

  const gradeNumber = Number(studentProfile.grade_number);
  const countryCode =
    studentProfile.country?.trim().toUpperCase() || "BH";

  const dashboardDb =
    supabase as unknown as SupabaseClient;

  const hasStudentScope =
    studentRole === "student" &&
    Number.isInteger(gradeNumber) &&
    gradeNumber >= 1 &&
    gradeNumber <= 12;

  const lessonsRequest =
    hasStudentScope
      ? dashboardDb.rpc(
          "get_student_dashboard_lessons",
          {
            p_country_code:
              countryCode,
            p_grade_number:
              gradeNumber,
            p_limit: 8,
          },
        )
      : dashboardDb
          .from("lessons")
          .select(
            "id,title,estimated_minutes,lesson_number",
            {
              count:
                "estimated",
            },
          )
          .eq(
            "status",
            "published",
          )
          .order(
            "lesson_number",
            {
              ascending:
                true,
            },
          )
          .limit(8);

  const [
    lessonsResult,
    completedCountResult,
  ] = await Promise.all([
    lessonsRequest,
    supabase
      .from("student_lesson_progress")
      .select("lesson_id", {
        count: "exact",
        head: true,
      })
      .eq("student_id", user.id)
      .in("status", ["completed", "mastered"]),
  ]);

  if (lessonsResult.error) {
    console.warn(
      "STUDENT_FAST_DASHBOARD_LESSONS_WARNING",
      lessonsResult.error.message,
    );
  }

  if (completedCountResult.error) {
    console.warn(
      "STUDENT_FAST_DASHBOARD_COUNT_WARNING",
      completedCountResult.error.message,
    );
  }

  const lessons = (lessonsResult.data ?? []) as unknown as LessonRow[];
  const lessonIds = lessons.map((lesson) => lesson.id);

  const progressResult =
    lessonIds.length > 0
      ? await supabase
          .from("student_lesson_progress")
          .select("lesson_id,status,progress_percent,updated_at")
          .eq("student_id", user.id)
          .in("lesson_id", lessonIds)
      : {
          data: [],
          error: null,
        };

  if (progressResult.error) {
    console.warn(
      "STUDENT_FAST_DASHBOARD_PROGRESS_WARNING",
      progressResult.error.message,
    );
  }

  const progress = (progressResult.data ?? []) as ProgressRow[];

  const progressByLesson = new Map<string, ProgressRow>();
  for (const row of progress) {
    progressByLesson.set(row.lesson_id, row);
  }

  const lessonCards = lessons.map((lesson) => {
    const row = progressByLesson.get(lesson.id);
    const status = row?.status ?? "not_started";
    const completed =
      status === "completed" || status === "mastered";

    return {
      id: lesson.id,
      title: lesson.title ?? "درس بدون عنوان",
      lessonNumber: Number(lesson.lesson_number ?? 0),
      estimatedMinutes: Number(lesson.estimated_minutes ?? 10),
      progressPercent: Number(row?.progress_percent ?? 0),
      status,
      completed,
    };
  });

  const completedCount =
    Number(completedCountResult.count ?? 0);

  const totalLessons =
    hasStudentScope
      ? Number(
          lessons[0]
            ?.total_count ??
            lessonCards.length,
        )
      : Number(
          lessonsResult.count ??
            lessonCards.length,
        );
  const progressPercent =
    totalLessons > 0
      ? Math.min(
          100,
          Math.round((completedCount / totalLessons) * 100),
        )
      : 0;

  const continueLesson =
    lessonCards.find((lesson) => lesson.status === "in_progress") ??
    lessonCards.find((lesson) => !lesson.completed) ??
    null;

  const studentName =
    studentProfile.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "طالب ضاديوم";

  return (
    <main
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-slate-50 px-3 py-5 sm:px-5 lg:px-7"
    >
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#cdb778] bg-[#123f39] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-teal-100">
                لوحة الطالب
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                مرحبًا {studentName} 👋
              </h1>
              <p className="mt-3 max-w-2xl leading-8 text-teal-50">
                تم تحسين لوحة الطالب لتفتح بسرعة على Cloudflare.
                الأدوات الذكية المتقدمة ما زالت متاحة من روابطها
                وتُحمّل عند الحاجة بدل تشغيلها كلها أثناء تسجيل الدخول.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  prefetch={false}
                  href={
                    continueLesson
                      ? `/lessons/${continueLesson.id}`
                      : "/courses"
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white transition hover:bg-emerald-700"
                >
                  {continueLesson ? "واصل التعلم" : "استعرض الدروس"}
                </Link>

                <Link
                  href="/ask"
                  prefetch={false}
                  className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/20"
                >
                  اسأل ضاد
                </Link>

                <Link
                  href="/pricing"
                  prefetch={false}
                  className="rounded-xl border border-[#f4d58a]/60 bg-[#f4d58a]/10 px-5 py-3 font-black text-[#f8e6b0] transition hover:bg-[#f4d58a]/20"
                >
                  ضاديوم Plus
                </Link>
              </div>
            </div>

            <div className="grid min-w-[280px] grid-cols-2 gap-3">
              <Stat label="الدروس المكتملة" value={completedCount} />
              <Stat label="إجمالي الدروس" value={totalLessons} />
              <Stat label="التقدم" value={`${progressPercent}%`} />
              <Stat
                label="الصف"
                value={
                  Number.isFinite(gradeNumber) && gradeNumber > 0
                    ? gradeNumber
                    : "—"
                }
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink
            href="/courses"
            title="المناهج والدروس"
            description="افتح منهجك واستكمل التعلم."
          />
          <QuickLink
            href="/skills/adaptive"
            title="التدريب التكيفي"
            description="تدرّب على المهارة التي تحتاجها الآن."
          />
          <QuickLink
            href="/assessment"
            title="الاختبارات"
            description="ابدأ اختبارًا وتابع مستواك."
          />
          <QuickLink
            href="/reading-challenge"
            title="تحدي القراءة"
            description="واصل القراءة والإنجازات."
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                مسار التعلم
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                نعرض أول 8 دروس هنا لتبقى الصفحة سريعة جدًا. بقية الدروس
                موجودة في صفحة المناهج.
              </p>
            </div>

            <Link
              href="/courses"
              prefetch={false}
              className="rounded-xl bg-teal-700 px-4 py-2 font-black text-white"
            >
              عرض كل الدروس
            </Link>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3">
            {lessonCards.map((lesson, index) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                prefetch={false}
                className={[
                  "flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center",
                  lesson.completed
                    ? "border-emerald-200 bg-emerald-50"
                    : lesson.status === "in_progress"
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-200",
                ].join(" ")}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-700">
                  {lesson.completed ? "✓" : index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-900">
                    {lesson.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {lesson.estimatedMinutes} دقيقة
                    {lesson.status === "in_progress"
                      ? ` • ${lesson.progressPercent}%`
                      : ""}
                  </p>
                </div>

                <span className="shrink-0 rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
                  {lesson.completed
                    ? "مراجعة"
                    : lesson.status === "in_progress"
                      ? "واصل"
                      : "ابدأ"}
                </span>
              </Link>
            ))}

            {lessonCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                لا توجد دروس منشورة لهذا الصف حاليًا.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs font-semibold text-teal-100">
        {label}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
    >
      <h2 className="font-black text-[#123f39]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </Link>
  );
}
