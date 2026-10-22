"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCorrectAnswerSpec } from "@/lib/lesson-activities/grading";
import { invalidateStudentCaches } from "@/features/student-progress/services/invalidate-student-caches";
import { syncLearningProfile } from "@/features/learning-profile/services/sync-profile";
import { syncLessonMasteryAction } from "@/features/lesson-mastery/actions/syncLessonMastery";
import { scoreGradedActivityAttempts } from "@/features/lesson-mastery/services/score-graded-activities";
import { completeAdaptiveStep } from "@/features/learning-plan/services/adaptive-path-lifecycle";

import { completeLesson } from "../services/progress";
import { calculateLevel } from "../services/level";
import { calculateBadges } from "../services/badges";
import { calculateAchievements } from "../services/achievements";
import {
  requireAssessedItems,
  requirePositiveAssessmentPoints,
} from "../services/completion-gates";


type QuestionRow = {
  id: string;
};

type AttemptRow = {
  question_id: string;
  is_correct: boolean;
};

type ProgressGamificationRow = {
  id: string;
  status: string;
  xp: number | null;
};

const REQUIRED_MASTERY_SCORE = 90;

function createGamificationSnapshot(
  rows: ProgressGamificationRow[]
) {
  const totalXP =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.xp ?? 0),
      0
    );

  const completed =
    rows.filter(
      (row) =>
        row.status === "completed" ||
        row.status === "mastered"
    ).length;

  const mastered =
    rows.filter(
      (row) =>
        row.status === "mastered"
    ).length;

  const level =
    calculateLevel(totalXP);

  const badges =
    calculateBadges({
      totalXP,
      completed,
      mastered,
    });

  const achievements =
    calculateAchievements({
      lessons: rows.length,
      completed,
      mastered,
      totalXP,
    });

  return {
    totalXP,
    completed,
    mastered,
    level,
    badges,
    achievements,
  };
}

export async function completeLessonAction(
  progressId: string
) {
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "يجب تسجيل الدخول لإكمال الدرس."
    );
  }

  const {
    data: progress,
    error: progressError,
  } = await supabase
    .from("student_lesson_progress")
    .select(`
      id,
      student_id,
      lesson_id,
      best_score
    `)
    .eq("id", progressId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (progressError) {
    throw progressError;
  }

  if (!progress) {
    throw new Error(
      "لم يتم العثور على تقدم هذا الدرس."
    );
  }


  /*
   * The current lessons table does not require a skill column.
   * Until curriculum skill metadata is added explicitly,
   * adaptive completion uses a safe general focus.
   */
  const adaptiveFocusSkill =
    "general";


  /*
   * نحفظ حالة Gamification قبل الإنهاء،
   * حتى نعرف ما الذي كسبه الطالب فعلًا الآن.
   */
  const {
    data: beforeProgressData,
    error: beforeProgressError,
  } = await supabase
    .from("student_lesson_progress")
    .select(`
      id,
      status,
      xp
    `)
    .eq(
      "student_id",
      user.id
    );

  if (beforeProgressError) {
    throw beforeProgressError;
  }

  const beforeSnapshot =
    createGamificationSnapshot(
      (
        beforeProgressData ??
        []
      ) as ProgressGamificationRow[]
    );


  /*
   * Interactive activities are the primary assessment
   * when a lesson has gradable lesson_activities.
   *
   * Older lessons without activities keep using questions.
   */

  const {
    data: activityRows,
    error: activitiesError,
  } = await supabase
    .from("lesson_activities")
    .select(`
      id,
      answer,
      points,
      is_required
    `)
    .eq(
      "lesson_id",
      progress.lesson_id
    )
    .eq(
      "is_published",
      true
    );

  if (activitiesError) {
    throw activitiesError;
  }

  // DADYOOM_CANONICAL_ACTIVITY_GRADING_V2
  const answerRecord = (
    value: unknown
  ): Record<string, unknown> => {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      return value as Record<string, unknown>;
    }

    return {};
  };

  const gradableActivities =
    (activityRows ?? []).filter(
      (activity) =>
        getCorrectAnswerSpec(
          answerRecord(activity.answer)
        ) !== null
    );

  const requiredCompletionActivities =
    (activityRows ?? []).filter(
      (activity) =>
        activity.is_required === true &&
        getCorrectAnswerSpec(
          answerRecord(activity.answer)
        ) === null
    );

  // DADYOOM_REQUIRED_COMPLETION_ACTIVITY_GATE
  if (requiredCompletionActivities.length > 0) {
    const requiredIds =
      requiredCompletionActivities.map(
        (activity) => activity.id
      );

    const {
      data: requiredAttempts,
      error: requiredAttemptsError,
    } = await supabase
      .from("lesson_activity_attempts")
      .select("activity_id,is_correct")
      .eq("user_id", user.id)
      .eq("is_correct", true)
      .in("activity_id", requiredIds);

    if (requiredAttemptsError) {
      throw requiredAttemptsError;
    }

    const completedRequired =
      new Set(
        (requiredAttempts ?? []).map(
          (attempt) => attempt.activity_id
        )
      ).size;

    if (
      completedRequired <
      requiredCompletionActivities.length
    ) {
      throw new Error(
        "أكمل أنشطة التقويم المطلوبة أولًا. " +
        completedRequired +
        " / " +
        requiredCompletionActivities.length
      );
    }
  }

  // DADYOOM_FAIL_CLOSED_MASTERY: never assume a perfect score without evidence.
  let score = 0;
  let answeredQuestions = 0;
  let correctAnswers = 0;
  let totalQuestions = 0;

  /*
   * This variable is deliberately kept because the
   * existing mastery guard below uses questionIds.length.
   * For activity lessons it contains activity IDs.
   */
  let questionIds: string[] = [];

  if (
    gradableActivities.length > 0
  ) {

    const activityIds =
      gradableActivities.map(
        (activity) =>
          activity.id
      );

    questionIds =
      activityIds;

    totalQuestions =
      gradableActivities.length;

    const {
      data: activityAttempts,
      error: activityAttemptsError,
    } = await supabase
      .from("lesson_activity_attempts")
      .select(`
        activity_id,
        earned_points,
        max_points,
        is_correct,
        attempt_number
      `)
      .eq(
        "user_id",
        user.id
      )
      .in(
        "activity_id",
        activityIds
      );

    if (activityAttemptsError) {
      throw activityAttemptsError;
    }

    const graded = scoreGradedActivityAttempts(
      gradableActivities,
      activityAttempts ?? []
    );

    answeredQuestions = graded.answeredQuestions;

    if (
      answeredQuestions <
      totalQuestions
    ) {
      throw new Error(
        "\u0623\u0643\u0645\u0644 \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0635\u062d\u064a\u062d \u0623\u0648\u0644\u0627\u064b. " +
        answeredQuestions +
        " / " +
        totalQuestions
      );
    }

    correctAnswers = graded.correctAnswers;
    requirePositiveAssessmentPoints(graded.totalPossible);
    score = graded.score;

  } else {

    /*
     * Legacy questions fallback.
     */

    const {
      data: questions,
      error: questionsError,
    } = await supabase
      // Read only the published student-safe question projection.
      .from("dadyoom_student_questions")
      .select("id")
      .eq(
        "lesson_id",
        progress.lesson_id
      );

    if (questionsError) {
      throw questionsError;
    }

    const questionRows =
      (questions ?? []) as QuestionRow[];

    questionIds =
      questionRows.map(
        (question) =>
          question.id
      );

    totalQuestions =
      questionIds.length;

    if (
      questionIds.length > 0
    ) {

      const {
        data: attempts,
        error: attemptsError,
      } = await supabase
        .from("question_attempts")
        .select(`
          question_id,
          is_correct
        `)
        .eq(
          "user_id",
          user.id
        )
        .in(
          "question_id",
          questionIds
        );

      if (attemptsError) {
        throw attemptsError;
      }

      const attemptRows =
        (attempts ?? []) as AttemptRow[];

      const latestAttempts =
        new Map<string, boolean>();

      for (
        const attempt of
        attemptRows
      ) {
        latestAttempts.set(
          attempt.question_id,
          attempt.is_correct
        );
      }

      answeredQuestions =
        latestAttempts.size;

      if (
        answeredQuestions <
        questionIds.length
      ) {
        throw new Error(
          "\u0623\u062c\u0628 \u0639\u0646 \u062c\u0645\u064a\u0639 \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u062f\u0631\u0633 \u0623\u0648\u0644\u0627\u064b."
        );
      }

      correctAnswers =
        Array.from(
          latestAttempts.values()
        ).filter(Boolean).length;

      score =
        Math.round(
          (
            correctAnswers /
            questionIds.length
          ) * 100
        );
    }
  }
  // Neither completion-only activities nor an empty question bank can
  // certify >=90% academic mastery. Do not convert "no evidence" into 100%.
  requireAssessedItems(questionIds.length);

  await syncLessonMasteryAction(
    progress.lesson_id
  );

  if (score < REQUIRED_MASTERY_SCORE) {
    const wrongAnswers =
      questionIds.length -
      correctAnswers;

    throw new Error(
      `مستوى إتقانك الحالي ${score}%. المطلوب ${REQUIRED_MASTERY_SCORE}% على الأقل لإنهاء الدرس. لديك ${wrongAnswers} من الأسئلة تحتاج إلى مراجعة. صحّحها ثم حاول إنهاء الدرس مرة أخرى.`
    );
  }

  const result =
    await completeLesson(
      progressId,
      score,
      Number(
        progress.best_score ??
        0
      )
    );

  /*
   * بعد نجاح إكمال الدرس الحقيقي،
   * نغلق خطوة lesson في المسار التكيفي
   * ونفتح الخطوة التالية تلقائيًا.
   *
   * العملية idempotent داخل Lifecycle،
   * لذلك إعادة المحاولة لا تعيد إكمال
   * الخطوة إذا كانت مكتملة بالفعل.
   */
  const adaptiveLessonStep =
    await completeAdaptiveStep({
      supabase,
      studentId:
        user.id,
      lessonId:
        progress.lesson_id,
      stepType:
        "lesson",

      focusSkill:
        adaptiveFocusSkill,
    });

  /*
   * نقرأ الحالة بعد الإنهاء،
   * ثم نقارنها بما قبل الإنهاء.
   */
  const {
    data: afterProgressData,
    error: afterProgressError,
  } = await supabase
    .from("student_lesson_progress")
    .select(`
      id,
      status,
      xp
    `)
    .eq(
      "student_id",
      user.id
    );

  if (afterProgressError) {
    throw afterProgressError;
  }

  const afterSnapshot =
    createGamificationSnapshot(
      (
        afterProgressData ??
        []
      ) as ProgressGamificationRow[]
    );

  const xpGained =
    Math.max(
      0,
      afterSnapshot.totalXP -
      beforeSnapshot.totalXP
    );

  const beforeBadgeIds =
    new Set(
      beforeSnapshot.badges
        .filter(
          (badge) =>
            badge.unlocked
        )
        .map(
          (badge) =>
            badge.id
        )
    );

  const unlockedBadges =
    afterSnapshot.badges.filter(
      (badge) =>
        badge.unlocked &&
        !beforeBadgeIds.has(
          badge.id
        )
    );

  const beforeAchievementIds =
    new Set(
      beforeSnapshot.achievements
        .filter(
          (achievement) =>
            achievement.completed
        )
        .map(
          (achievement) =>
            achievement.id
        )
    );

  const completedAchievements =
    afterSnapshot.achievements.filter(
      (achievement) =>
        achievement.completed &&
        !beforeAchievementIds.has(
          achievement.id
        )
    );

  const levelUp =
    afterSnapshot.level.level >
    beforeSnapshot.level.level
      ? {
          from:
            beforeSnapshot.level
              .level,
          to:
            afterSnapshot.level
              .level,
        }
      : null;

  await syncLearningProfile(
    user.id
  );

  await invalidateStudentCaches({
    studentId: user.id,
    studentEmail: user.email,
    supabase,
  });

  revalidatePath("/student");
  revalidatePath("/lessons");

  revalidatePath(
    `/lessons/${progress.lesson_id}`
  );

  return {
    progress: result,

    lessonId:
      progress.lesson_id,

    adaptivePath: {
      updated:
        adaptiveLessonStep.updated,

      reason:
        adaptiveLessonStep.reason,

      pathCompleted:
        adaptiveLessonStep.pathCompleted,

      currentStep:
        adaptiveLessonStep.currentStep,

      nextStep:
        adaptiveLessonStep.nextStep,
    },

    score,

    /*
     * xp = ما اكتسبه الطالب في هذه العملية فقط.
     */
    xp:
      xpGained,

    lessonXP:
      Number(
        result?.xp ??
        0
      ),

    totalXP:
      afterSnapshot.totalXP,

    level:
      afterSnapshot.level.level,

    levelUp,

    unlockedBadges,

    completedAchievements,

    correctAnswers,

    answeredQuestions,

    totalQuestions:
      questionIds.length,

    masteryRequired:
      REQUIRED_MASTERY_SCORE,
  };
}
