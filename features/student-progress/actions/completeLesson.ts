"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { invalidateStudentCaches } from "@/features/student-progress/services/invalidate-student-caches";
import { syncLearningProfile } from "@/features/learning-profile/services/sync-profile";
import { syncLessonMasteryAction } from "@/features/lesson-mastery/actions/syncLessonMastery";
import { completeAdaptiveStep } from "@/features/learning-plan/services/adaptive-path-lifecycle";

import { completeLesson } from "../services/progress";
import { calculateLevel } from "../services/level";
import { calculateBadges } from "../services/badges";
import { calculateAchievements } from "../services/achievements";

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
      points
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

  const gradableActivities =
    (activityRows ?? []).filter(
      (activity) => {
        if (
          typeof activity.answer !== "object" ||
          activity.answer === null ||
          Array.isArray(activity.answer)
        ) {
          return false;
        }

        return (
          Object.keys(
            activity.answer as object
          ).length > 0
        );
      }
    );

  let score = 100;
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

    const bestByActivity =
      new Map<
        string,
        {
          earned: number;
          max: number;
          correct: boolean;
        }
      >();

    for (
      const attempt of
      activityAttempts ?? []
    ) {

      const earned =
        Number(
          attempt.earned_points ??
          0
        );

      const max =
        Number(
          attempt.max_points ??
          0
        );

      const previous =
        bestByActivity.get(
          attempt.activity_id
        );

      /*
       * Keep the best attempt for every activity.
       */
      if (
        !previous ||
        earned > previous.earned
      ) {
        bestByActivity.set(
          attempt.activity_id,
          {
            earned,
            max,
            correct:
              Boolean(
                attempt.is_correct
              ),
          }
        );
      }
    }

    answeredQuestions =
      bestByActivity.size;

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

    const totalPossible =
      gradableActivities.reduce(
        (
          total,
          activity
        ) =>
          total +
          Number(
            activity.points ??
            0
          ),
        0
      );

    const totalEarned =
      gradableActivities.reduce(
        (
          total,
          activity
        ) =>
          total +
          (
            bestByActivity.get(
              activity.id
            )?.earned ??
            0
          ),
        0
      );

    correctAnswers =
      Array.from(
        bestByActivity.values()
      ).filter(
        (attempt) =>
          attempt.correct
      ).length;

    score =
      totalPossible > 0
        ? Math.round(
            (
              totalEarned /
              totalPossible
            ) * 100
          )
        : 100;

  } else {

    /*
     * Legacy questions fallback.
     */

    const {
      data: questions,
      error: questionsError,
    } = await supabase
      .from("questions")
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
  await syncLessonMasteryAction(
    progress.lesson_id
  );

  if (
    questionIds.length > 0 &&
    score < REQUIRED_MASTERY_SCORE
  ) {
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
