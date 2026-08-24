import { redirect } from "next/navigation";
import StudentGamificationHub from "@/features/gamification/components/StudentGamificationHub";
import SkillsProgressCard from "@/components/dashboard/student/skills-progress-card";
import Link from "next/link";

import { buildAdaptiveLearningPlan } from "@/features/learning-plan/services/buildAdaptiveLearningPlan";
import { getAdaptiveLearningSteps } from "@/features/learning-plan/services/getAdaptiveLearningSteps";
import { createClient } from "@/lib/supabase/server";
import { getStudentDashboardCached } from "@/services/dashboard/get-student-dashboard-cached";

// استيراد خدمات الملف الشخصي للتعلم (Learning Profile Services)
import { getLearningProfileCached } from "@/features/learning-profile/services/profile-cached";
import { syncLearningProfileCached } from "@/features/learning-profile/services/sync-profile-cached";

// استيراد خدمة خطة التعلم بالذكاء الاصطناعي
import { generateStudentLearningPlan } from "@/services/ai/learning-plan.service";

// استيراد خدمات تقدم الطالب (Services)
import { getRecommendedLessonsWithFallback } from "@/features/student-progress/services/recommendations-with-fallback";
import { getStudentProgressBundleCached } from "@/features/student-progress/services/progress-bundle-cached";
import { getStudentMasteryCached } from "@/features/student-progress/services/mastery-cached";
import { getStudentLearningRhythm } from "@/features/student-progress/services/learning-rhythm";

import { getLatestAssessmentAnalyticsCached } from "@/features/assessment/services/getLatestAssessmentAnalyticsCached";

// استيراد المكونات (Components)
import LearningProfileCard from "@/features/learning-profile/components/LearningProfileCard";
import StudentStatisticsCard from "@/features/student-progress/components/StudentStatisticsCard";
import StudentLevelCard from "@/features/student-progress/components/StudentLevelCard";
import BadgesCard from "@/features/student-progress/components/BadgesCard";
import ContinueLearningCard from "@/features/student-progress/components/ContinueLearningCard";
import AchievementsCard from "@/features/student-progress/components/AchievementsCard";
import RecommendedLessons from "@/features/student-progress/components/RecommendedLessons";
import MasteryMapCard from "@/features/student-progress/components/MasteryMapCard";
import LearningRhythmCard from "@/features/student-progress/components/LearningRhythmCard";

import StudentParentLinkCard from "@/features/parent-link/components/StudentParentLinkCard";
import { getActiveParentLinkCode, type ActiveParentLinkCode } from "@/features/parent-link/services/student-parent-link";

import StudentClassroomCard from "@/features/student-classroom/components/StudentClassroomCard";
import {
  getMyTeacherClasses,
  type StudentTeacherClass,
} from "@/features/student-classroom/services/student-classes";

type ContinueLessonRelation =
  | {
      title: string | null;
    }
  | {
      title: string | null;
    }[]
  | null;

type RecommendedLesson = {
  id: string;
  title: string;
  lesson_number: number;
};

type MasterySkill = {
  skill: string;
  score: number;
};

type AdaptiveStepRow = {
  id?: string;
  lesson_id?: string | null;
  focus_skill?: string;
  step_order: number;
  step_type:
    | "lesson"
    | "practice"
    | "assessment";
  title: string;
  status?:
    | "not_started"
    | "in_progress"
    | "completed";
  started_at?: string | null;
  completed_at?: string | null;
};

type DisplayAdaptiveStep = {
  id?: string;
  order: number;
  type:
    | "lesson"
    | "practice"
    | "assessment";
  title: string;
  description: string;
  targetId?: string;
  status:
    | "not_started"
    | "in_progress"
    | "completed";
};

type StudentPageProps = {
  searchParams: Promise<{
    classroomSuccess?: string;
    classroomError?: string;
  }>;
};

export default async function StudentPage({
  searchParams,
}: StudentPageProps) {
  const {
    classroomSuccess,
    classroomError,
  } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  
  /*
   * STUDENT_ROLE_GUARD
   * صفحة الطالب متاحة للطالب أو مدير النظام فقط.
   */
  if (!user) {
    redirect("/login");
  }

  const {
    data: studentProfile,
    error: studentProfileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    studentProfileError ||
    !studentProfile
  ) {
    throw new Error(
      "تعذر تحميل بيانات حساب الطالب."
    );
  }

  const studentRole =
    studentProfile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    studentRole !== "student" &&
    studentRole !== "admin"
  ) {
    if (studentRole === "teacher") {
      redirect("/teacher");
    }

    if (studentRole === "parent") {
      redirect("/parent");
    }

    if (studentRole === "school") {
      redirect("/school");
    }

    redirect("/");
  }
let completedLessonsCount = 0;
  let stats = null;
  let continueLesson = null;
  let recommendedLessons: RecommendedLesson[] = [];
  let learningProfile = null;
  let learningPlan = null;
  let latestAssessmentAnalytics = null;
  let adaptiveSteps: AdaptiveStepRow[] = [];
  let masterySkills: MasterySkill[] = [];

let parentLinkCode: ActiveParentLinkCode | null = null;

let teacherClasses:
StudentTeacherClass[] = [];
  let learningRhythm:
    Awaited<
      ReturnType<
        typeof getStudentLearningRhythm
      >
    >
    | null = null;

  let dashboard:
    Awaited<ReturnType<typeof getStudentDashboardCached>>
    | null = null;

  if (user) {
    // مزامنة وجلب الملف الشخصي للتعلم

    await syncLearningProfileCached(
      user.id,
      supabase
    );



    const [
  learningProfileData,
  learningPlanData,
  dashboardData,
  masterySkillsResult,
  learningRhythmData,
  teacherClassesData,
] = await Promise.all([
      getLearningProfileCached(
        user.id,
        supabase
      ),

      generateStudentLearningPlan(
        supabase,
        user.id,
        user.email!
      ),

      getStudentDashboardCached(
        supabase,
        user
      ),

      getStudentMasteryCached(
        user.email!,
        supabase
      ),

      getStudentLearningRhythm(
        supabase,
        user.id
      ),
    
  getMyTeacherClasses(
    supabase
  ),]);

    learningProfile =
      learningProfileData;

    learningPlan =
      learningPlanData;

    dashboard =
      dashboardData;


    teacherClasses =

      teacherClassesData;

    parentLinkCode = await getActiveParentLinkCode(supabase);

    learningRhythm =
      learningRhythmData;

const {
      data: masterySkillRows,
      error: masterySkillsError,
    } = masterySkillsResult;
if (masterySkillsError) {
      console.warn(
        "STUDENT_MASTERY_SKILLS_WARNING",
        masterySkillsError
      );
    } else {
      masterySkills =
        (masterySkillRows ?? [])
          .filter(
            (
              item
            ): item is {
              skill: string;
              score: number;
            } =>
              typeof item.skill ===
                "string" &&
              typeof item.score ===
                "number"
          )
          .map((item) => ({
            skill:
              item.skill.trim(),
            score:
              Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    item.score
                  )
                )
              ),
          }));
    }


    latestAssessmentAnalytics =
      await getLatestAssessmentAnalyticsCached({
        supabase,
        studentId: user.id,
      });


    // جلب الإحصائيات، درس المتابعة، والدروس المقترحة بالتوازي لتحسين الأداء

    const [
      progressBundle,
      recommendedLessonsData,
    ] = await Promise.all([
      getStudentProgressBundleCached(
        user.id,
        supabase
      ),

      getRecommendedLessonsWithFallback(
        user.id,
        learningPlan?.focusSkill ?? undefined,
        supabase
      ),
    ]);


    stats =
      progressBundle.stats;

    continueLesson =
      progressBundle.continueLesson;

    recommendedLessons =
      recommendedLessonsData;

    completedLessonsCount =
      progressBundle.completedLessonsCount;
  }


  if (!dashboard) {
    dashboard =
      await getStudentDashboardCached(
        supabase,
        user
      );
  }

  const relatedLesson = continueLesson?.lessons as ContinueLessonRelation;
  const continueLessonTitle = Array.isArray(relatedLesson)
    ? relatedLesson[0]?.title ?? "تابع الدرس"
    : relatedLesson?.title ?? "تابع الدرس";

  const recommendedLessonValue = learningPlan?.recommendedLesson?.trim();

  const recommendedLessonIsId = Boolean(
    recommendedLessonValue &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        recommendedLessonValue
      )
  );

  const trainingLessonId = recommendedLessonIsId
    ? recommendedLessonValue
    : latestAssessmentAnalytics?.lessonId ??
      continueLesson?.lesson_id ??
      dashboard.lessons[0]?.id ??
      null;

  if (user) {
    adaptiveSteps = await getAdaptiveLearningSteps(
      supabase,
      user.id,
      trainingLessonId ?? undefined
    );
  }

  const trainingHref = trainingLessonId
    ? `/lessons/${trainingLessonId}`
    : "/courses";

  const adaptivePlan = learningPlan?.focusSkill
    ? buildAdaptiveLearningPlan(
        learningPlan.focusSkill,
        trainingLessonId ?? undefined
      )
    : null;

  const displayedAdaptiveSteps: DisplayAdaptiveStep[] =
    adaptiveSteps.length > 0
      ? adaptiveSteps.map((step) => ({
          id: step.id,
          order: step.step_order,
          type: step.step_type,
          title: step.title,
          description:
            step.step_type === "lesson"
              ? "ابدأ بمراجعة شرح المهارة."
              : step.step_type === "practice"
              ? "أجب عن مجموعة من الأسئلة القصيرة."
              : "أعد الاختبار للتأكد من تحسن مستواك.",
          targetId: step.lesson_id ?? trainingLessonId ?? undefined,
          status: step.status ?? "not_started",
        }))
      : (adaptivePlan?.steps.map((step) => ({
          id: undefined,
          order: step.order,
          type: step.type,
          title: step.title,
          description: step.description,
          targetId: step.targetId,
          status: "not_started" as const,
        })) ?? []);

  // إضافة المتغيرات الخاصة بالدرس المقترح لخطة التعلم
  const recommendedLesson = learningPlan?.recommendedLesson
    ? dashboard.lessons.find(
        (lesson) => lesson.id === learningPlan.recommendedLesson
      )
    : null;

  const recommendedLessonTitle =
    recommendedLesson?.title ?? "ابدأ الدرس المقترح";

  // Unified Gamification source
  const unlockedBadges =
    stats?.badges.filter(
      (badge) => badge.unlocked
    ) ?? [];

  const latestUnlockedBadge =
    unlockedBadges.length > 0
      ? unlockedBadges[
          unlockedBadges.length - 1
        ]
      : null;

  const gamificationXP =
    stats?.totalXP ??
    dashboard.points;


  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Banner Section */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-teal-700 via-teal-600 to-emerald-500 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-teal-100">لوحة الطالب</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                مرحبًا {dashboard.studentName} 👋
              </h1>
              <p className="mt-3 max-w-2xl leading-8 text-teal-50">
                تابع تقدمك، وواصل الدرس التالي، واجعل العربية جزءًا ممتعًا من يومك.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={                     dashboard.continueLesson                       ? `/lessons/${dashboard.continueLesson.id}`                       : dashboard.lessons[0]                       ? `/lessons/${dashboard.lessons[0].id}`                       : "/courses"                   }
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
                >
                  {dashboard.completedLessons > 0
                    ? "واصل التعلم"
                    : "ابدأ أول درس"}
                </Link>

                <Link
                  href="/ask"
                  className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-black text-white backdrop-blur transition hover:bg-white/20"
                >
                  اسأل ضاد
                </Link>
              </div>
            </div>

            <div className="grid min-w-[280px] grid-cols-2 gap-3">
              <Stat label="النقاط" value={dashboard.points.toLocaleString("ar")} icon="🏆" />
              <Stat label="التقدم" value={`${dashboard.progressPercent}%`} icon="📈" />
              <Stat label="الدروس المكتملة" value={`${dashboard.completedLessons}`} icon="📚" />
              <Stat label="متوسط الدرجات" value={`${dashboard.averageScore}%`} icon="⭐" />
            </div>
          </div>
        </section>

        <StudentParentLinkCard code={parentLinkCode} />

        <StudentClassroomCard
          classes={teacherClasses}
          successMessage={
            classroomSuccess
          }
          errorMessage={
            classroomError
          }
        />

        {/* Completed Lessons Progress Banner */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-500">
            عدد الدروس المكتملة
          </p>

          <p className="mt-3 text-4xl font-bold text-emerald-700">
            {completedLessonsCount}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            واصل التعلم وأكمل المزيد من الدروس
          </p>
        </section>

        {/* Skills Progress */}
        <div className="mt-6">
          <SkillsProgressCard />

          <div className="mt-4">
            <Link
              href="/skills/adaptive"
              className="inline-flex rounded-2xl bg-violet-700 px-6 py-3 font-black text-white transition hover:bg-violet-800"
            >
              🧠 اسأل ضاد: ماذا أتدرب الآن؟
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">مسار التعلم</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {dashboard.completedLessons} من {dashboard.totalLessons} دروس مكتملة
                </p>
              </div>
              <Link href="/courses" className="text-sm font-black text-teal-700 hover:underline">
                عرض الكل
              </Link>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{ width: `${dashboard.progressPercent}%` }}
              />
            </div>
            {/* LEARNING_MAP_V3 */}
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="text-emerald-600">✓</span>
                  مكتمل
                </span>

                <span className="inline-flex items-center gap-1">
                  <span className="text-teal-600">▶</span>
                  جارٍ الآن
                </span>

                <span className="inline-flex items-center gap-1">
                  <span className="text-slate-400">○</span>
                  لم يبدأ
                </span>
              </div>

              <div className="grid gap-3">
                {dashboard.lessons.map(
                  (lesson, index) => {
                    const isCurrent =
                      lesson.status ===
                      "in_progress";

                    const isCompleted =
                      lesson.completed;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className={[
                          "group flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center",
                          isCompleted
                            ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
                            : isCurrent
                            ? "border-teal-300 bg-teal-50 ring-2 ring-teal-100 hover:border-teal-400"
                            : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black",
                            isCompleted
                              ? "bg-emerald-600 text-white"
                              : isCurrent
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700",
                          ].join(" ")}
                        >
                          {isCompleted
                            ? "✓"
                            : isCurrent
                            ? "▶"
                            : index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-900">
                              {lesson.title}
                            </h3>

                            {isCompleted ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                                مكتمل
                              </span>
                            ) : isCurrent ? (
                              <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-black text-teal-700">
                                الدرس الحالي
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                                لم يبدأ
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {isCompleted
                              ? `حصلت على ${lesson.points} XP`
                              : isCurrent
                              ? `التقدم الحالي ${lesson.progressPercent}%`
                              : `${lesson.estimatedMinutes} دقيقة`}
                          </p>

                          {isCurrent ? (
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-100">
                              <div
                                className="h-full rounded-full bg-teal-600"
                                style={{
                                  width: `${lesson.progressPercent}%`,
                                }}
                              />
                            </div>
                          ) : null}
                        </div>

                        <div
                          className={[
                            "shrink-0 rounded-xl px-4 py-2 text-sm font-black",
                            isCompleted
                              ? "bg-white text-emerald-700"
                              : isCurrent
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-700 group-hover:bg-teal-600 group-hover:text-white",
                          ].join(" ")}
                        >
                          {isCompleted
                            ? "مراجعة الدرس"
                            : isCurrent
                            ? "واصل الدرس"
                            : "ابدأ الدرس"}
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>

              {dashboard.lessons.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                  لا توجد دروس منشورة حاليًا.
                </div>
              ) : null}
            </div>

            {/* بطاقات الإحصائيات والمستوى والإنجازات والدروس الموصى بها */}
            {stats && (
              <div className="mt-6 space-y-6">
                <StudentStatisticsCard stats={stats} />
                <StudentLevelCard level={stats.level} />
                <BadgesCard badges={stats.badges} />
                <AchievementsCard achievements={stats.achievements} />
                {continueLesson ? (
                  <ContinueLearningCard
                    lessonId={continueLesson.lesson_id}
                    title={continueLessonTitle}
                  />
                ) : null}
                <RecommendedLessons lessons={recommendedLessons} />
              </div>
            )}

            {learningRhythm ? (
              <div className="mt-6">
                <LearningRhythmCard
                  rhythm={learningRhythm}
                />
              </div>
            ) : null}

            {/* خريطة إتقان المهارات والملف الشخصي */}
            <div className="mt-6 space-y-6">
              <MasteryMapCard
                skills={masterySkills}
              />

              {learningProfile ? (
                <LearningProfileCard
                  profile={learningProfile}
                />
              ) : null}
            </div>
            {/* بطاقة خطة اليوم الذكية */}
            {learningPlan ? (
              <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="text-xl font-black text-emerald-800">
                  🎯 خطة اليوم
                </h2>

                <p className="mt-4 font-bold">
                  المهارة: {learningPlan.focusSkill}
                </p>

                <p className="mt-2">{learningPlan.message}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-slate-500">الأولوية</div>
                    <div className="font-black">{learningPlan.priority}</div>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-slate-500">الهدف اليومي</div>
                    <div className="font-black">{learningPlan.dailyGoal}</div>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-slate-500">نوع التدريب</div>
                    <div className="font-black">{learningPlan.practiceType}</div>
                  </div>
                </div>

                <p className="mt-5 rounded-xl bg-white p-4 text-sm">
                  💡 {learningPlan.motivation}
                </p>

                {/* إضافة جزء الدرس المقترح لخطة التعلم */}
                {learningPlan?.recommendedLesson ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm text-emerald-700">
                      الدرس المقترح اليوم
                    </p>

                    <h3 className="mt-2 text-lg font-black text-emerald-900">
                      {recommendedLessonTitle}
                    </h3>

                    <Link
                      href={`/lessons/${learningPlan.recommendedLesson}`}
                      className="mt-4 inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
                    >
                      ابدأ الدرس الآن
                    </Link>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={trainingHref}
                    className="inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-black text-white transition hover:bg-emerald-700"
                  >
                    ابدأ تدريب اليوم
                  </Link>

                  {learningPlan.focusSkill ? (
                    <Link
                      href={`/ask?skill=${encodeURIComponent(
                        learningPlan.focusSkill
                      )}`}
                      className="inline-flex rounded-xl border border-emerald-300 bg-white px-6 py-3 font-black text-emerald-700 transition hover:bg-emerald-100"
                    >
                      اطلب شرح المهارة من ضاد
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* مسار التعلم التكيفي */}
            {adaptivePlan ? (
              <section className="mt-6 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
                <div>
                  <p className="text-sm font-bold text-violet-700">
                    مسارك التكيفي
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    خطوات التعلم اليوم
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    سنركز على مهارة{" "}
                    <span className="font-black text-violet-700">
                      {adaptivePlan.focusSkill}
                    </span>{" "}
                    بالترتيب المناسب لك.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {displayedAdaptiveSteps.map((step) => {
                    const href =
                      step.type === "assessment"
                        ? step.targetId
                          ? `/assessment/${step.targetId}`
                          : "/courses"
                        : step.type === "practice"
                        ? step.targetId
                          ? `/ask?lessonId=${encodeURIComponent(
                              step.targetId
                            )}&skill=${encodeURIComponent(
                              adaptivePlan.focusSkill
                            )}`
                          : `/ask?skill=${encodeURIComponent(
                              adaptivePlan.focusSkill
                            )}`
                        : step.targetId
                        ? `/lessons/${step.targetId}`
                        : "/courses";

                    return (
                      <div
                        key={`${step.order}-${step.type}`}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl font-black text-violet-700">
                          {step.order}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-900">
                            {step.title}
                          </p>
                          <p className="mt-1 text-sm leading-7 text-slate-600">
                            {step.description}
                          </p>
                        </div>

                        <Link
                          href={href}
                          className="inline-flex justify-center rounded-xl bg-violet-600 px-5 py-3 font-black text-white transition hover:bg-violet-700"
                        >
                          {step.type === "assessment"
                            ? "ابدأ الاختبار"
                            : step.type === "practice"
                            ? "ابدأ التدريب"
                            : "راجع الدرس"}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* تحليل آخر اختبار */}
            {latestAssessmentAnalytics ? (
              <section className="mt-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-indigo-700">
                      تحليل آخر اختبار
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                      مستوى مهاراتك
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      نتيجة الاختبار الأخيرة مبنية على إجاباتك الفعلية.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-indigo-600 px-5 py-4 text-center text-white">
                    <p className="text-3xl font-black">
                      {latestAssessmentAnalytics.overallPercentage}%
                    </p>
                    <p className="mt-1 text-xs font-bold text-indigo-100">
                      النتيجة العامة
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {Object.entries(latestAssessmentAnalytics.skills).map(
                    ([skill, skillResult]) => (
                      <div
                        key={skill}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-bold text-slate-800">{skill}</p>
                          <p className="font-black text-indigo-700">
                            {skillResult.percentage}%
                          </p>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{
                              width: `${skillResult.percentage}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {skillResult.correct} صحيحة من {skillResult.total}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="font-black text-emerald-900">نقاط القوة</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {latestAssessmentAnalytics.strengths.length > 0
                        ? latestAssessmentAnalytics.strengths.join("، ")
                        : "استمر في التدريب لتحديد نقاط قوتك."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="font-black text-amber-900">
                      تحتاج إلى تحسين
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {latestAssessmentAnalytics.weaknesses.length > 0
                        ? latestAssessmentAnalytics.weaknesses.join("، ")
                        : "رائع، لا توجد مهارة ضعيفة في الاختبار الأخير."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/assessment/${latestAssessmentAnalytics.lessonId}`}
                    className="rounded-xl bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-700"
                  >
                    أعد الاختبار
                  </Link>
                  <Link
                    href={`/lessons/${latestAssessmentAnalytics.lessonId}`}
                    className="rounded-xl border border-indigo-200 bg-white px-5 py-3 font-black text-indigo-700 transition hover:bg-indigo-50"
                  >
                    راجع الدرس
                  </Link>
                </div>
              </section>
            ) : (
              <section className="mt-6 rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6">
                <h2 className="text-xl font-black text-slate-900">
                  تحليل مهاراتك
                </h2>
                <p className="mt-2 leading-7 text-slate-600">
                  أكمل اختبارًا ذكيًا ليعرض ضاديوم نقاط قوتك والمهارات التي تحتاج إلى تطوير.
                </p>
              </section>
            )}

            {/* قائمة الدروس */}
            <div className="mt-6 space-y-3">
              {dashboard.lessons.map((lesson, index) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl font-black ${
                      lesson.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {lesson.completed
                      ? "✓"
                      : lesson.status === "in_progress"
                      ? "▶"
                      : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-black text-slate-900">
                      {lesson.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {lesson.completed
                        ? `مكتمل ✓ • ${lesson.points} XP`
                        : lesson.status === "in_progress"
                        ? `قيد التعلم ▶ • ${lesson.progressPercent}%`
                        : `${lesson.estimatedMinutes} دقيقة • لم يبدأ بعد`}
                    </p>
                  </div>
                  <span className="text-slate-400">←</span>
                </Link>
              ))}

              {dashboard.lessons.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  لا توجد دروس منشورة حتى الآن.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <StudentGamificationHub
              level={stats?.level}
            />

            <aside className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-sm">
              <div className="text-5xl">🤖</div>
              <h2 className="mt-4 text-2xl font-black">ضاد معك دائمًا</h2>
              <p className="mt-3 text-sm leading-7 text-indigo-50">
                اسأل عن كلمة، قاعدة، أو اطلب تدريبًا يناسب مستواك.
              </p>
              <Link
                href="/ask"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-black text-indigo-700"
              >
                ابدأ المحادثة
              </Link>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
      <div className="mt-1 text-xs font-semibold text-teal-100">{label}</div>
    </div>
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
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <div className="text-2xl font-black text-teal-700">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
}



