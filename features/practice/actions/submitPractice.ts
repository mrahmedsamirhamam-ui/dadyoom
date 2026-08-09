"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  completeAdaptiveStep,
} from "@/features/learning-plan/services/adaptive-path-lifecycle";
import {
  createClient,
} from "@/lib/supabase/server";

type PracticeAnswer = {
  questionId: string;
  optionId: string;
};

type PracticeQuestionRow = {
  id: string;
  correct_answer: string;
};

const PRACTICE_PASS_SCORE = 70;

export async function submitPracticeAction(
  lessonId: string,
  answers: PracticeAnswer[]
) {
  const normalizedLessonId =
    lessonId.trim();

  if (!normalizedLessonId) {
    throw new Error(
      "معرّف الدرس غير صالح."
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    throw new Error(
      "يجب تسجيل الدخول لإكمال التدريب."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("questions")
    .select(`
      id,
      correct_answer
    `)
    .eq(
      "lesson_id",
      normalizedLessonId
    )
    .order(
      "question_order",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  const questions =
    (data ?? []) as
      PracticeQuestionRow[];

  if (
    questions.length === 0
  ) {
    throw new Error(
      "لا توجد أسئلة متاحة لهذا التدريب."
    );
  }

  const answerMap =
    new Map<string, string>();

  for (
    const answer of
    answers
  ) {
    const questionId =
      answer.questionId?.trim();

    const optionId =
      answer.optionId?.trim();

    if (
      questionId &&
      optionId
    ) {
      answerMap.set(
        questionId,
        optionId
      );
    }
  }

  const missingAnswers =
    questions.filter(
      (question) =>
        !answerMap.has(
          question.id
        )
    );

  if (
    missingAnswers.length > 0
  ) {
    throw new Error(
      `أجب عن جميع أسئلة التدريب أولًا. المتبقي ${missingAnswers.length}.`
    );
  }

  let correctAnswers = 0;

  for (
    const question of
    questions
  ) {
    if (
      answerMap.get(
        question.id
      ) ===
      question.correct_answer
    ) {
      correctAnswers += 1;
    }
  }

  const score =
    Math.round(
      (
        correctAnswers /
        questions.length
      ) * 100
    );

  const passed =
    score >=
    PRACTICE_PASS_SCORE;

  const adaptivePath =
    passed
      ? await completeAdaptiveStep({
          supabase,
          studentId:
            user.id,
          lessonId:
            normalizedLessonId,
          stepType:
            "practice",
        })
      : null;

  /*
   * إذا كانت الخطوة السابقة لم تكتمل،
   * Lifecycle يمنع تخطي الترتيب.
   */
  if (
    adaptivePath?.reason ===
    "blocked_by_previous_step"
  ) {
    throw new Error(
      "يجب إكمال خطوة الدرس أولًا قبل إنهاء التدريب."
    );
  }

  if (passed) {
    revalidatePath(
      "/student"
    );

    revalidatePath(
      `/quiz/${normalizedLessonId}`
    );

    revalidatePath(
      `/assessment/${normalizedLessonId}`
    );
  }

  return {
    success: true,
    lessonId:
      normalizedLessonId,

    score,

    passScore:
      PRACTICE_PASS_SCORE,

    passed,

    correctAnswers,

    totalQuestions:
      questions.length,

    adaptivePath,
  };
}