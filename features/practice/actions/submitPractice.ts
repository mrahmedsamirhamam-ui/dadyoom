"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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

  // Only a published, RLS-visible lesson can be practiced. Do not
  // authorize a draft solely because an answer record happens to exist.
  const { data: visibleLesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", normalizedLessonId)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!visibleLesson) {
    throw new Error("هذا الدرس غير متاح للتدريب.");
  }

  // Build the exact student-visible question set *before* opening the
  // privileged client. Never read correct_answer with the student's token.
  const { data: visibleQuestions, error: visibilityError } = await supabase
    .from("dadyoom_student_questions")
    .select("id")
    .eq("lesson_id", visibleLesson.id);

  if (visibilityError) throw visibilityError;

  const visibleIds = [...new Set(
    (visibleQuestions ?? []).map((question) => question.id)
  )];

  if (visibleIds.length === 0) {
    throw new Error("لا توجد أسئلة متاحة لهذا التدريب.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .select("id,correct_answer")
    .eq("lesson_id", visibleLesson.id)
    .in("id", visibleIds);

  if (error) throw error;
  const questions = (data ?? []) as PracticeQuestionRow[];

  // Fail closed when the private question set and the RLS-visible set
  // disagree, including missing or unexpected/duplicate rows.
  if (
    questions.length !== visibleIds.length ||
    new Set(questions.map((question) => question.id)).size !== visibleIds.length ||
    questions.some((question) =>
      !visibleIds.includes(question.id) ||
      typeof question.correct_answer !== "string" ||
      !question.correct_answer.trim()
    )
  ) {
    throw new Error("تعذر التحقق من أسئلة التدريب.");
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
          // Only a verified, server-computed practice score can unlock
          // the path. Persist that transition using server-only credentials.
          supabase: admin,
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
