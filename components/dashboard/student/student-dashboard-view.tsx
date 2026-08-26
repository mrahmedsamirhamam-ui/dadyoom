import SkillsProgressCard from "@/components/dashboard/student/skills-progress-card";
import Link from "next/link";

import type {
  DashboardLearningPlan,
  StudentDashboardData,
} from "@/types/student-dashboard";

import { InsightsCard } from "./insights-card";
import { JourneyCard } from "./journey-card";
import { SkillsCard } from "./skills-card";
import { StatCard } from "./stat-card";

type StudentDashboardViewProps = {
  data: StudentDashboardData;
};

function getLearningPlanActivityLabel(
  practiceType: DashboardLearningPlan["practice_type"]
): string {
  if (practiceType === "reading") {
    return "📖 قراءة";
  }

  if (practiceType === "quiz") {
    return "📝 اختبار قصير";
  }

  if (practiceType === "lesson") {
    return "🎓 درس تعليمي";
  }

  return "📚 تدريب مناسب";
}

function getLearningPlanHref(
  plan: DashboardLearningPlan,
  fallbackHref: string
): string {
  if (
    plan.practice_type === "lesson" &&
    plan.recommended_lesson
  ) {
    return `/lessons/${plan.recommended_lesson}`;
  }

  if (plan.practice_type === "reading") {
    return "/courses";
  }

  if (plan.practice_type === "quiz") {
    return "/courses";
  }

  return fallbackHref;
}

export function StudentDashboardView({
  data,
}: StudentDashboardViewProps) {
  const continueHref = data.continueLesson
    ? `/lessons/${data.continueLesson.id}`
    : "/courses";

  const aiRecommendationHref =
    data.aiRecommendation?.lessonId
      ? `/lessons/${data.aiRecommendation.lessonId}`
      : continueHref;

  const learningPlanHref = data.learningPlan
    ? getLearningPlanHref(
        data.learningPlan,
        continueHref
      )
    : aiRecommendationHref;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7faf9] px-4 py-6 text-slate-800 sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-l from-teal-800 to-teal-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-2 text-sm text-teal-100">
                بيت العربية الرقمي
              </p>

              <h1 className="text-3xl font-bold sm:text-4xl">
                مرحبًا، {data.studentName} 👋
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50 sm:text-base">
                خطوتك الصغيرة اليوم تقرّبك من إتقان العربية. تابع رحلتك وحقق
                إنجازًا جديدًا.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm text-teal-50">
                سلسلة الإنجاز
              </p>

              <p className="mt-1 text-2xl font-bold">
                🔥 {data.streakDays} أيام
              </p>
            </div>
          </div>
        </header>

        <ContinueLearningCard
          lesson={data.continueLesson}
          href={continueHref}
          dashboardProgress={data.progress}
        />

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-teal-700">
                {data.learningPlan
                  ? "🎯 خطة ضاديوم الذكية"
                  : "🤖 معلم ضاديوم الذكي"}
              </p>

              {data.learningPlan ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    data.learningPlan.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : data.learningPlan.priority === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {data.learningPlan.priority === "high"
                    ? "أولوية مرتفعة"
                    : data.learningPlan.priority === "medium"
                      ? "خطة اليوم"
                      : "تطوير مستمر"}
                </span>
              ) : data.aiRecommendation ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    data.aiRecommendation.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : data.aiRecommendation.priority === "low"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {data.aiRecommendation.priority === "high"
                    ? "أولوية مرتفعة"
                    : data.aiRecommendation.priority === "low"
                      ? "اقتراح إضافي"
                      : "خطة اليوم"}
                </span>
              ) : null}
            </div>

            <h2 className="mt-2 text-2xl font-bold">
              {data.learningPlan?.title ??
                data.aiRecommendation?.title ??
                "توصيتك اليوم"}
            </h2>

            <p className="mt-3 leading-8 text-slate-600">
              {data.learningPlan?.message ??
                data.aiRecommendation?.message ??
                data.aiMessage}
            </p>

            {data.learningPlan ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      المهارة
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {data.learningPlan.focus_skill ??
                        "تطوير اللغة العربية"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      هدف اليوم
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {data.learningPlan.daily_goal ??
                        "15 دقيقة"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      النشاط
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {getLearningPlanActivityLabel(
                        data.learningPlan.practice_type
                      )}
                    </p>
                  </div>
                </div>

                {data.learningPlan.motivation ? (
                  <p className="mt-5 rounded-2xl bg-amber-50 p-4 leading-7 text-amber-900">
                    💬 {data.learningPlan.motivation}
                  </p>
                ) : null}
              </>
            ) : null}

            <Link
              href={learningPlanHref}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-teal-700 px-6 font-bold text-white transition hover:bg-teal-800"
            >
              {data.learningPlan
                ? "🚀 ابدأ خطة اليوم"
                : data.aiRecommendation?.lessonId
                  ? "ابدأ الدرس المقترح"
                  : data.continueLesson
                    ? "ابدأ التدريب المقترح"
                    : "استعرض الدورات"}
            </Link>
          </div>

          <div className="rounded-3xl border border-teal-100 bg-teal-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-teal-700">
              المستوى العام
            </p>

            <p className="mt-3 text-5xl font-black text-teal-950">
              {data.overallScore}%
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-teal-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.max(data.overallScore, 0),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="📚"
            label="الدروس المكتملة"
            value={String(data.completedLessons)}
          />

          <StatCard
            icon="⭐"
            label="النقاط"
            value={String(data.points)}
          />

          <StatCard
            icon="🏅"
            label="الشارات"
            value={String(data.badges)}
          />

          <StatCard
            icon="📈"
            label="نسبة التقدم"
            value={`${data.progress}%`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <SkillsCard skills={data.skills} />

          <InsightsCard
            mistakes={data.mistakes}
            latestAssessment={data.latestAssessment}
          />
        </section>

        <section className="rounded-3xl border border-violet-200 bg-gradient-to-l from-violet-50 via-white to-teal-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black text-violet-700">
                🧭 رحلة اليوم الذكية
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                درس + مهارة + تقييم في مسار واحد
              </h2>

              <p className="mt-3 max-w-2xl leading-8 text-slate-600">
                دع ضاد يرتب لك ما تفعله الآن بناءً على تقدمك الحقيقي.
              </p>
            </div>

            <Link
              href="/journey/daily"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-violet-700 px-7 font-black text-white transition hover:bg-violet-800"
            >
              ابدأ رحلة اليوم ←
            </Link>
          </div>
        </section>

        <JourneyCard lessons={data.journeyLessons} />

        <section className="grid gap-6 lg:grid-cols-2">
          <ActionCard
            eyebrow="📘 اسأل ضاد"
            title="ما الذي تريد فهمه اليوم؟"
            description="اسأل عن معنى كلمة، أو قاعدة نحوية، أو اطلب شرحًا مبسطًا."
            href="/ask"
            action="اطرح سؤالك"
          />

          <ActionCard
            eyebrow="📖 واصل رحلتك"
            title={
              data.continueLesson
                ? data.continueLesson.title
                : "لقد أنهيت جميع الدروس"
            }
            description={
              data.continueLesson
                ? data.continueLesson.description
                : "أحسنت! لقد أكملت جميع الدروس المتاحة حاليًا."
            }
            href={continueHref}
            action={
              data.continueLesson
                ? "متابعة الدرس"
                : "استعراض الدورات"
            }
            dark
          />
        </section>
      </div>

      <div className="mt-6">
        <SkillsProgressCard />
      </div>
</main>
  );
}

type ContinueLearningCardProps = {
  lesson: StudentDashboardData["continueLesson"];
  href: string;
  dashboardProgress: number;
};

function ContinueLearningCard({
  lesson,
  href,
  dashboardProgress,
}: ContinueLearningCardProps) {
  const safeProgress = Math.min(
    Math.max(dashboardProgress, 0),
    100
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-l from-amber-50 via-white to-teal-50 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-amber-700">
            📖 أكمل من حيث توقفت
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {lesson
              ? lesson.title
              : "لقد أكملت جميع الدروس المتاحة"}
          </h2>

          <p className="mt-3 leading-8 text-slate-600">
            {lesson
              ? lesson.description
              : "إنجاز رائع! يمكنك الآن استعراض الدورات والبحث عن رحلة تعليمية جديدة."}
          </p>

          {lesson ? (
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                الدرس رقم {lesson.order}
              </span>

              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                ⭐ {lesson.points} نقطة
              </span>
            </div>
          ) : null}
        </div>

        <div className="w-full lg:max-w-sm">
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between text-sm font-bold text-slate-700">
              <span>تقدم الرحلة</span>
              <span>{safeProgress}%</span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{ width: `${safeProgress}%` }}
              />
            </div>
          </div>

          <Link
            href={href}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-6 font-bold text-white transition hover:bg-slate-700"
          >
            {lesson
              ? "▶ متابعة الدرس"
              : "استعراض الدورات"}
          </Link>
        </div>
      </div>
    </section>
  );
}

type ActionCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  dark?: boolean;
};

function ActionCard({
  eyebrow,
  title,
  description,
  href,
  action,
  dark = false,
}: ActionCardProps) {
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-teal-700">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-7 text-slate-500">
        {description}
      </p>

      <Link
        href={href}
        className={`mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl px-6 font-bold transition ${
          dark
            ? "bg-slate-900 text-white hover:bg-slate-700"
            : "border border-teal-700 text-teal-700 hover:bg-teal-50"
        }`}
      >
        {action}
      </Link>
    </article>
  );
}
