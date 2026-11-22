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
import { gradeStoredMcq, type StoredMcq } from "@/features/questions/services/grade-stored-mcq";

type PracticeAnswer = {
  questionId: string;
  optionId: string;
};

type PracticeQuestionRow = StoredMcq & { id: string };

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

  if (!Array.isArray(answers) || answers.length === 0 || answers.length > 1000) {
    throw new Error("قائمة الإجابات غير صالحة.");
  }

  // The caller must see the published lesson through its own RLS-bound
  // session before the trusted server reads any answer keys.
  const { data: visible, error: visibilityError } = await supabase
    .from("dadyoom_student_questions")
    .select("id")
    .eq("lesson_id", normalizedLessonId)
    .order("question_order", { ascending: true });
  if (visibilityError) throw visibilityError;
  if (!visible?.length) throw new Error("لا توجد أسئلة متاحة لهذا التدريب.");

  const questionIds = visible.map(question => question.id);
  const allowed = new Set(questionIds);
  const answerMap = new Map<string, string>();
  for (const entry of answers) {
    if (!entry || typeof entry !== "object" ||
        typeof entry.questionId !== "string" || typeof entry.optionId !== "string") {
      throw new Error("إحدى الإجابات غير صالحة.");
    }
    const questionId = entry.questionId.trim();
    const optionId = entry.optionId.trim();
    if (!allowed.has(questionId) || answerMap.has(questionId) || !optionId) {
      throw new Error("توجد إجابة مكررة أو سؤال غير متاح في هذا التدريب.");
    }
    answerMap.set(questionId, optionId);
  }
  const missing = questionIds.filter(id => !answerMap.has(id));
  if (missing.length) throw new Error(`أجب عن جميع أسئلة التدريب أولًا. المتبقي ${missing.length}.`);

  const admin = createAdminClient();
  const { data: stored, error: storedError } = await admin
    .from("questions")
    .select("id,question_type,options,correct_answer")
    .eq("lesson_id", normalizedLessonId)
    .in("id", questionIds);
  if (storedError) throw storedError;
  const questions = (stored ?? []) as PracticeQuestionRow[];
  const keys = new Map(questions.map(question => [question.id, question]));
  if (keys.size !== questionIds.length || questions.length !== questionIds.length) {
    throw new Error("تغيّرت أسئلة التدريب. حدّث الصفحة وحاول مجددًا.");
  }
  let correctAnswers = 0;
  for (const id of questionIds) {
    const question = keys.get(id);
    if (!question) throw new Error("تعذر تحميل سؤال التدريب.");
    const grade = gradeStoredMcq(question, answerMap.get(id));
    if (!grade.valid) throw new Error("الإجابة أو إعداد السؤال غير صالح للتصحيح.");
    if (grade.isCorrect) correctAnswers++;
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
