import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getCorrectAnswerSpec } from "@/lib/lesson-activities/grading";
import { invalidateStudentCaches } from "@/features/student-progress/services/invalidate-student-caches";
import { syncLearningProfile } from "@/features/learning-profile/services/sync-profile";
import { completeAdaptiveStep } from "@/features/learning-plan/services/adaptive-path-lifecycle";

import { updateStreak } from "@/services/gamification/streak";

import { completeLesson } from "./progress";
import { calculateLevel } from "./level";
import { calculateBadges } from "./badges";
import { calculateAchievements } from "./achievements";

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

async function getCanonicalTotalXP(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
) {
  const { data, error } =
    await supabase.rpc(
      "edu_total_xp",
      {
        p_student: studentId,
      }
    );

  if (error) {
    throw error;
  }

  const total = Number(data ?? 0);

  return Number.isFinite(total)
    ? Math.max(0, total)
    : 0;
}

function createGamificationSnapshot(
  rows: ProgressGamificationRow[],
  unifiedTotalXP?: number
) {
  const lessonXP =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.xp ?? 0),
      0
    );

  const totalXP =
    unifiedTotalXP ??
    lessonXP;

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

export async function completeLessonCore(
  progressId: string,
  options: { legacyHttpCompatibility?: boolean } = {}
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
   * DADYOOM_CANONICAL_PARALLEL_READS_V1
   *
   * Three independent, read-only queries share the same authenticated
   * context. Fetch concurrently to reduce completion latency on the
   * Cloudflare Worker, without relaxing mastery, ownership or XP rules.
   * Keep the original checks and fail closed on every database error.
   */
  // The compatibility HTTP response only needs the current progress row.
  // Keep the same authenticated Supabase client and ownership filters.
  const studentProgressQuery = supabase
    .from("student_lesson_progress")
    .select("id,status,xp")
    .eq("student_id", user.id);

  const boundedProgressQuery = options.legacyHttpCompatibility
    ? studentProgressQuery.eq("id", progressId)
    : studentProgressQuery;

  const [
    beforeProgressResult,
    beforeUnifiedXP,
    activityResult,
  ] = await Promise.all([
    boundedProgressQuery,

    getCanonicalTotalXP(
      supabase,
      user.id
    ),

    supabase
      .from("lesson_activities")
      .select(`
        id,
        answer,
        points,
        is_required
      `)
      .eq("lesson_id", progress.lesson_id)
      .eq("is_published", true),
  ]);

  const {
    data: beforeProgressData,
    error: beforeProgressError,
  } = beforeProgressResult;

  if (beforeProgressError) {
    throw beforeProgressError;
  }

  const beforeSnapshot =
    createGamificationSnapshot(
      (beforeProgressData ?? []) as ProgressGamificationRow[],
      beforeUnifiedXP
    );

  const {
    data: activityRows,
    error: activitiesError,
  } = activityResult;

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
      .select("activity_id")
      .eq("user_id", user.id)
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
  /*
   * DADYOOM_CANONICAL_MASTERY_FAST_PATH_V1
   *
   * completeLessonAction already loaded and graded the canonical
   * activity/question attempts above. Re-fetching the same lesson
   * through syncLessonMasteryAction() repeated auth + activities +
   * attempts queries and could exhaust the production Worker budget
   * before the canonical completion response was returned.
   *
   * Persist the already-calculated canonical mastery directly.
   * This remains fail-closed: if the mastery row cannot be stored,
   * lesson completion is not committed.
   */
  const {
    error: masteryError,
  } = await supabase
    .from("lesson_mastery")
    .upsert(
      {
        student_id: user.id,
        lesson_id:
          progress.lesson_id,
        mastery_score:
          score,
        correct_answers:
          correctAnswers,
        wrong_answers:
          Math.max(
            0,
            totalQuestions -
              correctAnswers
          ),
        asked_questions:
          totalQuestions,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "student_id,lesson_id",
      }
    );

  if (masteryError) {
    throw masteryError;
  }

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
   * DADYOOM_LEGACY_HTTP_FAST_COMMIT_ACK_V1
   *
   * The compatibility API needs only acknowledgement of the already
   * authenticated, graded and durably committed canonical completion.
   * The production Role QA proved mastery=100 and progress=mastered,
   * then saw an empty 500 from the Worker after this write. Preserve
   * all ownership, required-activity, >=90% and XP persistence gates
   * above, but do not run optional after()/cache/reward work inside
   * this legacy HTTP request. The modern Server Action retains the
   * full gamification, adaptive, streak and cache integrations.
   */
  if (options.legacyHttpCompatibility) {
    const previousLessonXP =
      Number((beforeProgressData ?? []).find(
        (row) => row.id === progress.id
      )?.xp ?? 0);

    const savedLessonXP = Number(result?.xp ?? 0);
    const xpGained = Math.max(0, savedLessonXP - previousLessonXP);
    const totalXP = Math.max(0, beforeUnifiedXP + xpGained);

    return {
      progress: result,
      lessonId: progress.lesson_id,
      adaptivePath: {
        updated: false,
        reason: "legacy_http_compat_core_committed",
        pathCompleted: false,
        currentStep: null,
        nextStep: null,
      },
      score,
      xp: xpGained,
      lessonXP: savedLessonXP,
      totalXP,
      level: calculateLevel(totalXP).level,
      levelUp: null,
      unlockedBadges: [],
      completedAchievements: [],
      correctAnswers,
      answeredQuestions,
      totalQuestions: questionIds.length,
      masteryRequired: REQUIRED_MASTERY_SCORE,
    };
  }

  /*
   * DADYOOM_POST_COMPLETION_RESILIENCE_V1
   *
   * From this point onward the canonical lesson progress is already
   * committed. Post-completion integrations must not convert that
   * durable success into HTTP 500.
   *
   * We also avoid two extra readbacks by deriving the immediate
   * after-snapshot from the row we just wrote.
   */
  const previousLessonRow =
    (
      beforeProgressData ??
      []
    ).find(
      (row) =>
        row.id === progress.id
    );

  const resultStatus =
    String(
      result?.status ??
        previousLessonRow?.status ??
        "completed"
    );

  const resultXP =
    Number(
      result?.xp ??
        previousLessonRow?.xp ??
        0
    );

  const previousLessonXP =
    Number(
      previousLessonRow?.xp ??
        0
    );

  const afterProgressData =
    (
      beforeProgressData ??
      []
    ).map(
      (row) =>
        row.id === progress.id
          ? {
              ...row,
              status:
                resultStatus,
              xp:
                resultXP,
            }
          : row
    );

  const afterUnifiedXP =
    Math.max(
      0,
      beforeUnifiedXP +
        Math.max(
          0,
          resultXP -
            previousLessonXP
        )
    );

  const afterSnapshot =
    createGamificationSnapshot(
      afterProgressData as ProgressGamificationRow[],
      afterUnifiedXP
    );

  const fallbackAdaptiveStep = {
    updated: false,
    reason:
      "post_completion_side_effect_pending" as const,
    currentStep: null,
    nextStep: null,
    pathCompleted: false,
  };

  after(async () => {
    const postCompletionTasks = [
      user.email?.trim()
        ? updateStreak({
            supabase,
            studentEmail:
              user.email.trim(),
            activityDate:
              new Date(),
          })
        : Promise.resolve(null),

      completeAdaptiveStep({
        supabase,
        studentId:
          user.id,
        lessonId:
          progress.lesson_id,
        stepType:
          "lesson",
        focusSkill:
          adaptiveFocusSkill,
      }),

      syncLearningProfile(
        user.id,
        supabase
      ),

      invalidateStudentCaches({
        studentId:
          user.id,
        studentEmail:
          user.email,
        supabase,
      }),
    ] as const;

    const postCompletionResults =
      await Promise.allSettled(
        postCompletionTasks
      );

    const names = [
      "streak",
      "adaptive",
      "learning_profile",
      "cache",
    ] as const;

    postCompletionResults.forEach(
      (
        sideEffect,
        index,
      ) => {
        if (
          sideEffect.status ===
          "rejected"
        ) {
          console.warn(
            "DADYOOM_POST_COMPLETION_SIDE_EFFECT_WARNING",
            {
              name:
                names[index] ??
                "unknown",
              lessonId:
                progress.lesson_id,
              studentId:
                user.id,
              message:
                sideEffect.reason instanceof
                Error
                  ? sideEffect.reason
                      .message
                  : String(
                      sideEffect.reason ??
                        "unknown"
                    ),
            }
          );
        }
      }
    );
  });

  const adaptiveLessonStep =
    fallbackAdaptiveStep;

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

  /*
   * Do not run the full reward snapshot synchronously here.
   * That snapshot fans out to several XP/reward sources and
   * can exhaust Worker request/subrequest budget after the
   * canonical completion has already succeeded.
   *
   * The newly unlocked lesson badges/achievements are already
   * calculated above from the before/after snapshots and the
   * Rewards surface computes the full cross-feature snapshot
   * when it is opened.
   */
  revalidatePath("/student");
  revalidatePath("/rewards");
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
