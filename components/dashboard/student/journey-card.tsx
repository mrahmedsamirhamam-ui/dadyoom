import Link from "next/link";
import {
  Check,
  Lock,
  Play,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

import type {
  JourneyLessonData,
} from "../../../types/student-dashboard";

type JourneyCardProps = {
  lessons: JourneyLessonData[];
};

type LessonStatus =
  | "completed"
  | "current"
  | "locked";

function getFirstIncompleteLessonIndex(
  lessons: JourneyLessonData[]
): number {
  return lessons.findIndex(
    (lesson) => !lesson.completed
  );
}

function getLessonStatus(
  lesson: JourneyLessonData,
  lessonIndex: number,
  firstIncompleteIndex: number
): LessonStatus {
  if (lesson.completed) {
    return "completed";
  }

  if (lessonIndex === firstIncompleteIndex) {
    return "current";
  }

  return "locked";
}

function LessonIcon({
  status,
  isAssessment,
}: {
  status: LessonStatus;
  isAssessment: boolean;
}) {
  if (status === "completed") {
    return <Check className="h-6 w-6" />;
  }

  if (status === "locked") {
    return <Lock className="h-5 w-5" />;
  }

  if (isAssessment) {
    return <Sparkles className="h-6 w-6" />;
  }

  return <Play className="h-6 w-6" />;
}

export function JourneyCard({
  lessons,
}: JourneyCardProps) {
  const completedLessons = lessons.filter(
    (lesson) => lesson.completed
  ).length;

  const totalLessons = lessons.length;

  const firstIncompleteIndex =
    getFirstIncompleteLessonIndex(lessons);

  const journeyCompleted =
    totalLessons > 0 &&
    completedLessons === totalLessons;

  if (totalLessons === 0) {
    return (
      <section
        dir="rtl"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Trophy className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              رحلة التعلم
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              لم تتم إضافة دروس إلى المنصة بعد.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Trophy className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              رحلة التعلم
            </h2>

            <p className="text-sm text-slate-500">
              واصل التقدم وافتح الدروس الجديدة
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
          <p className="text-xs font-medium text-slate-500">
            تقدمك في الرحلة
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {completedLessons} من {totalLessons}
          </p>
        </div>
      </div>

      {journeyCompleted && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Star className="h-7 w-7 fill-amber-400 text-amber-500" />

          <div>
            <p className="font-bold text-amber-900">
              أحسنت! أكملت رحلة التعلم
            </p>

            <p className="text-sm text-amber-700">
              لقد أنهيت جميع الدروس وحصلت على وسام التميز.
            </p>
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-3xl">
        <div className="absolute bottom-5 right-7 top-5 w-1 rounded-full bg-slate-100 sm:right-1/2 sm:translate-x-1/2" />

        <div className="relative space-y-6">
          {lessons.map((lesson, index) => {
            const status = getLessonStatus(
              lesson,
              index,
              firstIncompleteIndex
            );

            const isAssessment =
              lesson.title.includes("اختبار") ||
              lesson.title.includes("تقييم");

            const isLeft = index % 2 === 0;

            const nodeClasses =
              status === "completed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : status === "current"
                  ? "border-teal-300 bg-teal-700 text-white shadow-lg shadow-teal-200"
                  : "border-slate-200 bg-slate-100 text-slate-400";

            const cardClasses =
              status === "completed"
                ? "border-emerald-200 bg-emerald-50/60"
                : status === "current"
                  ? "border-teal-300 bg-teal-50"
                  : "border-slate-200 bg-slate-50 opacity-70";

            return (
              <div
                key={lesson.id}
                className={`relative flex items-center gap-4 ${
                  isLeft
                    ? "sm:flex-row"
                    : "sm:flex-row-reverse"
                }`}
              >
                <div className="hidden flex-1 sm:block" />

                <div
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 transition ${nodeClasses}`}
                >
                  <LessonIcon
                    status={status}
                    isAssessment={isAssessment}
                  />

                  {status === "current" && (
                    <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950">
                      !
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div
                    className={`rounded-2xl border p-4 transition duration-200 ${cardClasses}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {lesson.title}
                      </h3>

                      {isAssessment && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          اختبار
                        </span>
                      )}

                      {status === "current" && (
                        <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700">
                          الدرس الحالي
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {lesson.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                        <Star className="h-4 w-4 fill-amber-400" />

                        <span>
                          {lesson.points} نقطة
                        </span>
                      </div>

                      {status === "completed" && (
                        <Link
                          href={`/lessons/${lesson.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <Check className="h-4 w-4" />
                          مراجعة الدرس
                        </Link>
                      )}

                      {status === "current" && (
                        <Link
                          href={`/lessons/${lesson.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
                        >
                          <Play className="h-4 w-4" />
                          ابدأ الدرس
                        </Link>
                      )}

                      {status === "locked" && (
                        <span className="flex items-center gap-1 text-sm font-medium text-slate-400">
                          <Lock className="h-4 w-4" />
                          أكمل الدرس السابق
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}