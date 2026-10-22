"use server";

import { createClient } from "@/lib/supabase/server";
import { getCorrectAnswerSpec } from "@/lib/lesson-activities/grading";
import { scoreGradedActivityAttempts } from "@/features/lesson-mastery/services/score-graded-activities";

type QuestionAttemptRow = {
  question_id: string;
  is_correct: boolean;
};

type LessonActivityRow = {
  id: string;
  answer: unknown;
  is_required: boolean;
  points: number;
};

function answerRecord(
  value: unknown
): Record<string, unknown> {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

export async function syncLessonMasteryAction(
  lessonId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "يجب تسجيل الدخول لتحديث مستوى الإتقان."
    );
  }

  // DADYOOM_ACTIVITY_AWARE_MASTERY_V2
  const {
    data: activitiesData,
    error: activitiesError,
  } = await supabase
    .from("lesson_activities")
    .select("id,answer,is_required,points")
    .eq("lesson_id", lessonId)
    .eq("is_published", true);

  if (activitiesError) {
    throw activitiesError;
  }

  const activities =
    (activitiesData ?? []) as unknown as LessonActivityRow[];

  const gradableActivities =
    activities.filter(
      (activity) =>
        getCorrectAnswerSpec(
          answerRecord(activity.answer)
        ) !== null
    );


  let masteryScore = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let askedQuestions = 0;

  // Completion-only activities prove participation, not answer correctness.
  // If none are gradable, use the saved assessment questions instead.
  if (gradableActivities.length > 0) {
    const activityIds =
      gradableActivities.map(
        (activity) => activity.id
      );

    const {
      data: activityAttemptsData,
      error: activityAttemptsError,
    } = await supabase
      .from("lesson_activity_attempts")
      .select("activity_id,earned_points,is_correct,attempt_number")
      .eq("user_id", user.id)
      .in("activity_id", activityIds);

    if (activityAttemptsError) {
      throw activityAttemptsError;
    }

    // Use exactly the same weighted, best-attempt scoring as the
    // canonical completion action. Completion-only tasks are excluded.
    const result = scoreGradedActivityAttempts(
      gradableActivities,
      activityAttemptsData ?? []
    );
    askedQuestions = result.askedQuestions;
    correctAnswers = result.correctAnswers;
    wrongAnswers = result.wrongAnswers;
    masteryScore = result.score;
  } else {
    const {
      data: questions,
      error: questionsError,
    } = await supabase
      // Read only the published student-safe question projection.
      .from("dadyoom_student_questions")
      .select("id")
      .eq("lesson_id", lessonId);

    if (questionsError) {
      throw questionsError;
    }

    const questionIds =
      (questions ?? []).map(
        (question) => question.id
      );

    askedQuestions =
      questionIds.length;

    if (questionIds.length > 0) {
      const {
        data: attemptsData,
        error: attemptsError,
      } = await supabase
        .from("question_attempts")
        .select("question_id,is_correct")
        .eq("user_id", user.id)
        .in("question_id", questionIds);

      if (attemptsError) {
        throw attemptsError;
      }

      const latestByQuestion =
        new Map<string, boolean>();

      for (
        const attempt of
        (attemptsData ?? []) as unknown as QuestionAttemptRow[]
      ) {
        latestByQuestion.set(
          attempt.question_id,
          attempt.is_correct
        );
      }

      correctAnswers =
        Array.from(
          latestByQuestion.values()
        ).filter(Boolean).length;

      wrongAnswers =
        askedQuestions -
        correctAnswers;

      masteryScore =
        askedQuestions > 0
          ? Math.round(
              (
                correctAnswers /
                askedQuestions
              ) * 100
            )
          : 0;
    }
  }

  const {
    error: masteryError,
  } = await supabase
    .from("lesson_mastery")
    .upsert(
      {
        student_id: user.id,
        lesson_id: lessonId,
        mastery_score: masteryScore,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        asked_questions: askedQuestions,
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

  return {
    lessonId,
    masteryScore,
    correctAnswers,
    wrongAnswers,
    askedQuestions,
    totalQuestions:
      askedQuestions,
  };
}
