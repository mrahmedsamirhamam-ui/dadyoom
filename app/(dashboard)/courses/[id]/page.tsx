import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CoursePageProps = {
  params: Promise<{ id: string }>;
};

type UnitRow = {
  id: string;
  title: string;
  description: string | null;
  unit_order: number;
};

type LessonRow = {
  id: string;
  unit_id: string;
  title: string;
  summary: string | null;
  skill: string;
  estimated_minutes: number;
  points: number;
  lesson_order: number;
  created_at: string;
};

export default async function CoursePage({
  params,
}: CoursePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, level, published")
    .eq("id", id)
    .maybeSingle();

  if (courseError) {
    console.error("COURSE_LOAD_ERROR:", courseError);
  }

  if (!course) {
    notFound();
  }

  const { data: unitsData, error: unitsError } = await supabase
    .from("units")
    .select("id, title, description, unit_order")
    .eq("course_id", id)
    .eq("is_published", true)
    .order("unit_order", { ascending: true });

  if (unitsError) {
    console.error("UNITS_LOAD_ERROR:", unitsError);
  }

  const units = (unitsData ?? []) as UnitRow[];
  const unitIds = units.map((unit) => unit.id);

  let lessons: LessonRow[] = [];

  if (unitIds.length > 0) {
    const { data, error } = await supabase
      .from("lessons")
      .select(
        "id, unit_id, title, summary, skill, estimated_minutes, points, lesson_order, created_at"
      )
      .in("unit_id", unitIds)
      .eq("is_published", true)
      .order("lesson_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("LESSONS_LOAD_ERROR:", error);
    }

    lessons = (data ?? []) as LessonRow[];
  }

  let completedLessonIds: string[] = [];

  if (user?.email) {
    const { data, error } = await supabase
      .from("student_progress")
      .select("lesson_id")
      .eq("student_email", user.email)
      .eq("completed", true);

    if (error) {
      console.error("PROGRESS_LOAD_ERROR:", error);
    }

    completedLessonIds =
      data
        ?.map((item) => item.lesson_id)
        .filter((lessonId): lessonId is string => Boolean(lessonId)) ?? [];
  }

  let globalLessonIndex = 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-4 py-10 sm:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl bg-white p-7 shadow-sm sm:p-10">
          <span className="rounded-full bg-teal-100 px-4 py-2 text-sm font-bold text-teal-800">
            {course.level || "دورة تعليمية"}
          </span>

          <h1 className="mt-5 text-4xl font-black text-teal-700">
            {course.title}
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            {course.description || "لا يوجد وصف لهذه الدورة بعد."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
            <span className="rounded-xl bg-slate-100 px-4 py-2">
              {units.length} وحدة
            </span>

            <span className="rounded-xl bg-slate-100 px-4 py-2">
              {lessons.length} درس
            </span>

            <span className="rounded-xl bg-slate-100 px-4 py-2">
              {completedLessonIds.length} درس مكتمل
            </span>
          </div>
        </header>

        <div className="mt-8 space-y-8">
          {units.length > 0 ? (
            units.map((unit) => {
              const unitLessons = lessons.filter(
                (lesson) => lesson.unit_id === unit.id
              );

              return (
                <section
                  key={unit.id}
                  className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="border-b pb-5">
                    <p className="text-sm font-bold text-teal-700">
                      الوحدة {unit.unit_order}
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      {unit.title}
                    </h2>

                    {unit.description ? (
                      <p className="mt-2 text-slate-600">
                        {unit.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 space-y-4">
                    {unitLessons.length > 0 ? (
                      unitLessons.map((lesson) => {
                        const currentIndex = globalLessonIndex;
                        globalLessonIndex += 1;

                        const completed =
                          completedLessonIds.includes(lesson.id);

                        const previousLesson =
                          currentIndex > 0
                            ? lessons[currentIndex - 1]
                            : null;

                        const unlocked =
                          currentIndex === 0 ||
                          completed ||
                          Boolean(
                            previousLesson &&
                              completedLessonIds.includes(
                                previousLesson.id
                              )
                          );

                        return (
                          <article
                            key={lesson.id}
                            className="flex flex-col gap-5 rounded-2xl border bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-black">
                                  {lesson.title}
                                </h3>

                                {completed ? (
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                                    ✅ مكتمل
                                  </span>
                                ) : unlocked ? (
                                  <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                                    ▶ متاح
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-600">
                                    🔒 مغلق
                                  </span>
                                )}
                              </div>

                              {lesson.summary ? (
                                <p className="mt-2 text-slate-600">
                                  {lesson.summary}
                                </p>
                              ) : null}

                              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                                <span>
                                  ⏱️ {lesson.estimated_minutes} دقيقة
                                </span>
                                <span>⭐ {lesson.points} نقطة</span>
                              </div>
                            </div>

                            {unlocked ? (
                              <Link
                                href={`/lessons/${lesson.id}`}
                                className="rounded-xl bg-teal-700 px-6 py-3 text-center font-bold text-white transition hover:bg-teal-800"
                              >
                                {completed ? "مراجعة الدرس" : "ابدأ الدرس"}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="cursor-not-allowed rounded-xl bg-slate-300 px-6 py-3 font-bold text-slate-600"
                              >
                                أكمل الدرس السابق
                              </button>
                            )}
                          </article>
                        );
                      })
                    ) : (
                      <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-600">
                        لا توجد دروس منشورة داخل هذه الوحدة.
                      </p>
                    )}
                  </div>
                </section>
              );
            })
          ) : (
            <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">📚</div>
              <h2 className="mt-4 text-2xl font-black">
                لا توجد وحدات منشورة
              </h2>
              <p className="mt-2 text-slate-600">
                يجب إضافة وحدة وربطها بالدورة ثم نشرها.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}