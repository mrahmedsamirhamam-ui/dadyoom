import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getLatestLearningPlan } from "@/services/ai/get-learning-plan.service";
import { getLatestRecommendation } from "@/services/ai/get-latest-recommendation";

import type {
  ContinueLessonData,
  JourneyLessonData,
  LatestAssessment,
  StudentDashboardData,
  StudentMistake,
  StudentSkill,
} from "@/types/student-dashboard";

const FALLBACK_TOTAL_LESSONS = 20;

type SkillRow = {
  skill: string | null;
  score: number | null;
  attempts: number | null;
  correct_attempts: number | null;
};

type MistakeRow = {
  category: string | null;
  mistake_count: number | null;
};

type AssessmentRow = {
  score: number | null;
  correct: boolean | null;
  feedback: string | null;
  teacher_comment: string | null;
  recommendation: string | null;
  skill: string | null;
  created_at: string | null;
};

type ProgressRow = {
  lesson_id: string | null;
  completed: boolean | null;
  earned_points: number | null;
};

type LessonRow = {
  id: string;
  title: string | null;
  summary: string | null;
  points: number | null;
  lesson_order: number | null;
  created_at: string | null;
  is_published: boolean | null;
};

type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function clampScore(
  value: number | null | undefined
): number {
  return Math.max(
    0,
    Math.min(100, Math.round(value ?? 0))
  );
}

function logDashboardWarning(
  section: string,
  error: SupabaseErrorLike | null
): void {
  if (!error) {
    return;
  }

  console.warn(`DASHBOARD_${section}_WARNING`, {
    message: error.message ?? "رسالة الخطأ غير متاحة",
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
  });
}

function buildAiMessage(
  skills: StudentSkill[],
  mistakes: StudentMistake[],
  latestAssessment: LatestAssessment | null
): string {
  const weakestSkill = [...skills].sort(
    (firstSkill, secondSkill) =>
      firstSkill.score - secondSkill.score
  )[0];

  const mostFrequentMistake = mistakes[0];

  if (latestAssessment?.recommendation) {
    return latestAssessment.recommendation;
  }

  if (mostFrequentMistake) {
    return `ركّز اليوم على مراجعة «${mostFrequentMistake.category}»؛ فهو أكثر الأخطاء تكرارًا لديك.`;
  }

  if (weakestSkill) {
    return `خصص عشر دقائق اليوم لتطوير مهارة ${weakestSkill.name}.`;
  }

  return "ابدأ أول تقييم لك، وسأبني لك خطة تعلم شخصية تناسب مستواك.";
}

function getLessonTitle(
  lesson: LessonRow,
  index: number
): string {
  return lesson.title ?? `الدرس ${index + 1}`;
}

function getLessonDescription(
  lesson: LessonRow
): string {
  return (
    lesson.summary ??
    "تدريب جديد لتطوير مهاراتك في اللغة العربية."
  );
}

function getLessonOrder(
  lesson: LessonRow,
  index: number
): number {
  return lesson.lesson_order ?? index + 1;
}

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    redirect("/login");
  }

  const studentEmail = user.email;

  const [
    profileResult,
    progressResult,
    lessonsResult,
    skillsResult,
    mistakesResult,
    assessmentResult,
    aiRecommendation,
    learningPlan,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("student_progress")
      .select(
        "lesson_id, completed, earned_points"
      )
      .eq("student_email", studentEmail)
      .eq("completed", true),

    supabase
      .from("lessons")
      .select(
        `
          id,
          title,
          summary,
          points,
          lesson_order,
          created_at,
          is_published
        `
      )
      .eq("is_published", true)
      .order("lesson_order", { ascending: true })
      .order("created_at", { ascending: true }),

    supabase
      .from("student_skills")
      .select(
        "skill, score, attempts, correct_attempts"
      )
      .eq("student_email", studentEmail)
      .order("score", {
        ascending: false,
      }),

    supabase
      .from("student_mistakes")
      .select(
        "category, mistake_count"
      )
      .eq("student_email", studentEmail)
      .order("mistake_count", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("student_assessments")
      .select(
        `
          score,
          correct,
          feedback,
          teacher_comment,
          recommendation,
          skill,
          created_at
        `
      )
      .eq("student_email", studentEmail)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    getLatestRecommendation(
      supabase,
      studentEmail
    ),

    getLatestLearningPlan(
      supabase,
      studentEmail
    ),
  ]);

  logDashboardWarning(
    "PROFILE",
    profileResult.error
  );

  logDashboardWarning(
    "PROGRESS",
    progressResult.error
  );

  logDashboardWarning(
    "LESSONS",
    lessonsResult.error
  );

  logDashboardWarning(
    "SKILLS",
    skillsResult.error
  );

  logDashboardWarning(
    "MISTAKES",
    mistakesResult.error
  );

  logDashboardWarning(
    "ASSESSMENT",
    assessmentResult.error
  );

  const studentName =
    profileResult.data?.full_name ||
    user.user_metadata?.full_name ||
    studentEmail.split("@")[0] ||
    "بطل ضاديوم";

  const progressRows =
    (progressResult.data ?? []) as ProgressRow[];

  const completedLessonIds = new Set(
    progressRows
      .filter(
        (row) =>
          row.completed === true &&
          Boolean(row.lesson_id)
      )
      .map(
        (row) => row.lesson_id as string
      )
  );

  const lessonRows =
    (lessonsResult.data ?? []) as LessonRow[];

  const journeyLessons: JourneyLessonData[] =
    lessonRows
      .filter(
        (lesson) =>
          Boolean(lesson.id) &&
          lesson.is_published === true
      )
      .map((lesson, index) => ({
        id: lesson.id,
        title: getLessonTitle(
          lesson,
          index
        ),
        description:
          getLessonDescription(lesson),
        points: lesson.points ?? 10,
        order: getLessonOrder(
          lesson,
          index
        ),
        completed:
          completedLessonIds.has(
            lesson.id
          ),
      }))
      .sort(
        (
          firstLesson,
          secondLesson
        ) => {
          if (
            firstLesson.order !==
            secondLesson.order
          ) {
            return (
              firstLesson.order -
              secondLesson.order
            );
          }

          return firstLesson.title.localeCompare(
            secondLesson.title,
            "ar"
          );
        }
      );

  const nextJourneyLesson =
    journeyLessons.find(
      (lesson) => !lesson.completed
    ) ?? null;

  const continueLesson:
    | ContinueLessonData
    | null =
    nextJourneyLesson
      ? {
          id: nextJourneyLesson.id,
          title:
            nextJourneyLesson.title,
          description:
            nextJourneyLesson.description,
          points:
            nextJourneyLesson.points,
          order:
            nextJourneyLesson.order,
        }
      : null;

  const completedLessons =
    journeyLessons.length > 0
      ? journeyLessons.filter(
          (lesson) => lesson.completed
        ).length
      : completedLessonIds.size;

  const totalLessons =
    journeyLessons.length > 0
      ? journeyLessons.length
      : FALLBACK_TOTAL_LESSONS;

  const progress =
    totalLessons > 0
      ? Math.min(
          Math.round(
            (completedLessons /
              totalLessons) *
              100
          ),
          100
        )
      : 0;

  const savedPoints =
    progressRows.reduce(
      (total, row) =>
        total +
        (row.earned_points ?? 0),
      0
    );

  const points =
    savedPoints > 0
      ? savedPoints
      : journeyLessons
          .filter(
            (lesson) =>
              lesson.completed
          )
          .reduce(
            (total, lesson) =>
              total + lesson.points,
            0
          );

  const skillRows =
    (skillsResult.data ?? []) as SkillRow[];

  const skills: StudentSkill[] =
    skillRows
      .filter(
        (row) =>
          Boolean(row.skill)
      )
      .map((row) => ({
        name:
          row.skill ??
          "مهارة عامة",
        score:
          clampScore(row.score),
        attempts:
          row.attempts ?? 0,
        correctAttempts:
          row.correct_attempts ?? 0,
      }));

  const mistakeRows =
    (mistakesResult.data ??
      []) as MistakeRow[];

  const mistakes: StudentMistake[] =
    mistakeRows
      .filter(
        (row) =>
          Boolean(row.category)
      )
      .map((row) => ({
        category:
          row.category ??
          "غير مصنف",
        count:
          row.mistake_count ?? 0,
      }));

  const assessmentRow =
    assessmentResult.data as
      | AssessmentRow
      | null;

  const latestAssessment:
    | LatestAssessment
    | null =
    assessmentRow
      ? {
          score: clampScore(
            assessmentRow.score
          ),
          correct: Boolean(
            assessmentRow.correct
          ),
          feedback:
            assessmentRow.feedback ??
            "لا توجد ملاحظات بعد.",
          teacherComment:
            assessmentRow.teacher_comment ??
            "واصل التدريب والتقدم.",
          recommendation:
            assessmentRow.recommendation ??
            "راجع المهارة ثم جرّب تدريبًا جديدًا.",
          skill:
            assessmentRow.skill ??
            "مهارة عامة",
          createdAt:
            assessmentRow.created_at,
        }
      : null;

  const overallScore =
    skills.length > 0
      ? Math.round(
          skills.reduce(
            (
              totalScore,
              skill
            ) =>
              totalScore +
              skill.score,
            0
          ) / skills.length
        )
      : latestAssessment?.score ?? 0;

  return {
    studentName,
    completedLessons,
    totalLessons,
    progress,
    points,
    badges:
      Math.floor(
        completedLessons / 3
      ),
    streakDays:
      Math.min(
        completedLessons,
        7
      ),
    overallScore,
    skills,
    mistakes,
    latestAssessment,
    journeyLessons,
    continueLesson,
    aiRecommendation,
    learningPlan,
    aiMessage:
      aiRecommendation?.message ??
      buildAiMessage(
        skills,
        mistakes,
        latestAssessment
      ),
  };
}