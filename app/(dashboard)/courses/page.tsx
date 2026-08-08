import Link from "next/link";
import { getPublishedUnits } from "@/services/lessons/catalog";

const difficultyLabels = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
} as const;

export default async function CoursesPage() {
  const units = await getPublishedUnits();

  const totalLessons = units.reduce(
    (total, unit) => total + unit.lessons.length,
    0
  );

  const completedLessons = units.reduce(
    (total, unit) =>
      total + unit.lessons.filter((lesson) => lesson.completed).length,
    0
  );

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl bg-gradient-to-l from-teal-700 to-emerald-500 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-bold text-teal-100">مكتبة التعلم</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            دروس اللغة العربية
          </h1>
          <p className="mt-3 max-w-2xl leading-8 text-teal-50">
            تعلّم خطوة بخطوة من خلال وحدات منظمة ودروس قصيرة وأنشطة تفاعلية.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
            <span className="rounded-xl bg-white/15 px-4 py-2">
              {units.length} وحدات
            </span>
            <span className="rounded-xl bg-white/15 px-4 py-2">
              {totalLessons} دروس
            </span>
            <span className="rounded-xl bg-white/15 px-4 py-2">
              {completedLessons} مكتملة
            </span>
          </div>
        </section>

        <section className="mt-8 space-y-7">
          {units.map((unit) => (
            <article
              key={unit.id}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl">
                      {unit.subject.icon ?? "📚"}
                    </div>
                    <div>
                      <p className="text-sm font-black text-teal-700">
                        {unit.subject.name}
                      </p>
                      <h2 className="text-xl font-black text-slate-950">
                        {unit.title}
                      </h2>
                    </div>
                  </div>

                  {unit.description ? (
                    <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                      {unit.description}
                    </p>
                  ) : null}
                </div>

                <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
                  {unit.lessons.length} دروس
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {unit.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl font-black ${
                          lesson.completed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {lesson.completed ? "✓" : lesson.order}
                      </div>

                      <span className="text-xs font-black text-slate-500">
                        {difficultyLabels[lesson.difficulty]}
                      </span>
                    </div>

                    <h3 className="mt-4 font-black text-slate-950 group-hover:text-teal-700">
                      {lesson.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {lesson.objective ?? "درس جديد في اللغة العربية."}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{lesson.estimatedMinutes} دقيقة</span>
                      <span>{lesson.points} نقطة</span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{
                          width: `${
                            lesson.completed
                              ? 100
                              : lesson.progressPercent
                          }%`,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          ))}

          {units.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="text-5xl">📭</div>
              <h2 className="mt-4 text-xl font-black text-slate-900">
                لا توجد دروس منشورة
              </h2>
              <p className="mt-2 text-slate-500">
                أضف محتوى من لوحة الإدارة ليظهر هنا.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
