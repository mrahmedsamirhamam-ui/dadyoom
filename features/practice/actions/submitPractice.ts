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
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeStudyPlay, type StudyPlayRow } from "@/features/study-play/services/grade-study-play";

type PracticeAnswer = {
  questionId: string;
  optionId: string;
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

  // The student-safe authenticated client proves visibility of the published
  // lesson before any elevated answer-key read. Browser roles must not require
  // SELECT on questions.correct_answer.
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", normalizedLessonId)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError || !lesson) {
    throw new Error("الدرس غير متاح للتدريب.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .select("id,question_type,options,correct_answer")
    .eq("lesson_id", normalizedLessonId)
    .order("question_order", { ascending: true })
    .limit(101);

  if (error) {
    throw new Error("تعذر قراءة الأسئلة للتصحيح.");
  }

  const result = gradeStudyPlay(
    (data ?? []) as StudyPlayRow[],
    answers.map((answer) => ({
      questionId: answer.questionId,
      optionId: answer.optionId,
    }))
  );
  const { correctAnswers, totalQuestions, score, passed } = result;

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
      totalQuestions,

    adaptivePath,
  };
}
