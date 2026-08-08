"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { invalidateStudentCaches } from "@/features/student-progress/services/invalidate-student-caches";
import { syncLearningProfile } from "@/features/learning-profile/services/sync-profile";
import { syncLessonMasteryAction } from "@/features/lesson-mastery/actions/syncLessonMastery";

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

  const questionIds =
    questionRows.map(
      (question) =>
        question.id
    );

  let score = 100;
  let answeredQuestions = 0;
  let correctAnswers = 0;

  if (questionIds.length > 0) {
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
        `أجب عن جميع أسئلة الدرس أولًا. أجبت عن ${answeredQuestions} من ${questionIds.length}.`
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