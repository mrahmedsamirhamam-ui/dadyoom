import Link from "next/link";

import type {
  LearningPlanRow,
} from "@/services/ai/get-learning-plan.service";

type LearningPlanCardProps = {
  plan: LearningPlanRow;
};

function getActivityLabel(
  practiceType: LearningPlanRow["practice_type"]
) {
  if (practiceType === "reading") {
    return "نشاط قراءة";
  }

  if (practiceType === "lesson") {
    return "درس تعليمي";
  }

  return "اختبار قصير";
}

function getActivityHref(
  plan: LearningPlanRow
) {
  if (
    plan.practice_type === "lesson" &&
    plan.recommended_lesson
  ) {
    return `/lessons/${plan.recommended_lesson}`;
  }

  if (plan.practice_type === "reading") {
    return "/student/reading";
  }

  return "/student/quizzes";
}

export function LearningPlanCard({
  plan,
}: LearningPlanCardProps) {
  const activityLabel =
    getActivityLabel(plan.practice_type);

  const activityHref =
    getActivityHref(plan);

  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5">
        <p className="text-sm font-semibold text-emerald-700">
          🎯 خطة اليوم
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {plan.title}
        </h2>

        <p className="mt-2 leading-7 text-slate-600">
          {plan.message}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            المهارة
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {plan.focus_skill || "تطوير اللغة العربية"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            هدف اليوم
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {plan.daily_goal || "15 دقيقة"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            النشاط
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {activityLabel}
          </p>
        </div>
      </div>

      {plan.motivation && (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 leading-7 text-amber-900">
          {plan.motivation}
        </p>
      )}

      <Link
        href={activityHref}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
      >
        ابدأ الآن
      </Link>
    </section>
  );
}