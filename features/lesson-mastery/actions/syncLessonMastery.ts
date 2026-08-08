"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AttemptRow = {
  question_id: string;
  is_correct: boolean;
};

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

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select("id")
    .eq("lesson_id", lessonId);

  if (questionsError) {
    throw questionsError;
  }

  const questionIds =
    (questions ?? []).map(
      (question) => question.id
    );

  const totalQuestions =
    questionIds.length;

  let attempts: AttemptRow[] = [];

  if (questionIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("question_attempts")
      .select(`
        question_id,
        is_correct
      `)
      .eq("user_id", user.id)
      .in(
        "question_id",
        questionIds
      );

    if (error) {
      throw error;
    }

    attempts =
      (data ?? []) as AttemptRow[];
  }

  const latestByQuestion =
    new Map<string, boolean>();

  for (const attempt of attempts) {
    latestByQuestion.set(
      attempt.question_id,
      attempt.is_correct
    );
  }

  const currentAttempts =
    Array.from(
      latestByQuestion.entries()
    );

  const correctAnswers =
    currentAttempts.filter(
      ([, isCorrect]) =>
        isCorrect
    ).length;

  const wrongAnswers =
    currentAttempts.filter(
      ([, isCorrect]) =>
        !isCorrect
    ).length;

  const askedQuestions =
    currentAttempts.length;

  const masteryScore =
    totalQuestions > 0
      ? Math.round(
          (
            correctAnswers /
            totalQuestions
          ) * 100
        )
      : 0;

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

  revalidatePath(
    `/lessons/${lessonId}`
  );

  return {
    lessonId,
    masteryScore,
    correctAnswers,
    wrongAnswers,
    askedQuestions,
    totalQuestions,
  };
}