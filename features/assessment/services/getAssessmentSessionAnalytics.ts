import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  analyzeAssessment,
} from "./analyzeAssessment";

type GetAssessmentSessionAnalyticsParams = {
  supabase: SupabaseClient;
  sessionId: string;
  studentId: string;
  studentEmail: string;
  lessonId: string;
};

export async function getAssessmentSessionAnalytics({
  supabase,
  sessionId,
  studentId,
  studentEmail,
  lessonId,
}: GetAssessmentSessionAnalyticsParams) {
  const {
    data: answers,
    error,
  } = await supabase
    .from("assessment_session_answers")
    .select(`
      assessment_id,
      selected_answer,
      skill
    `)
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  // Never trust persisted is_correct; until DB grants are migrated, clients
  // might mutate it. Recalculate from the stored selection and private key.
  const ids = Array.from(
    new Set((answers ?? []).map((answer) => answer.assessment_id))
  );
  const { data: keys, error: keyError } = ids.length
    ? await supabase
        .from("ai_assessments")
        .select("id,correct_answer,skill")
        .eq("student_email", studentEmail)
        .eq("lesson_id", lessonId)
        .in("id", ids)
    : { data: [], error: null };

  if (keyError) throw keyError;

  const correctByAssessment = new Map(
    (keys ?? []).map((row) => [
      row.id,
      { correctAnswer: row.correct_answer, skill: row.skill },
    ])
  );
  if (correctByAssessment.size !== ids.length) {
    throw new Error("تعذر التحقق من مفاتيح جميع أسئلة الجلسة.");
  }

  const normalizedAnswers =
    (answers ?? []).map((answer) => ({
      skill:
        typeof correctByAssessment.get(answer.assessment_id)?.skill === "string" &&
        correctByAssessment.get(answer.assessment_id)?.skill.trim()
          ? correctByAssessment.get(answer.assessment_id)!.skill.trim()
          : "الاستيعاب",
      isCorrect:
        correctByAssessment.has(answer.assessment_id) &&
        answer.selected_answer === correctByAssessment.get(answer.assessment_id)?.correctAnswer,
    }));

  const analytics =
    analyzeAssessment(
      normalizedAnswers
    );

  return {
    ...analytics,
    totalQuestions:
      normalizedAnswers.length,
    totalCorrect:
      normalizedAnswers.filter(
        (answer) =>
          answer.isCorrect
      ).length,
    totalWrong:
      normalizedAnswers.filter(
        (answer) =>
          !answer.isCorrect
      ).length,
  };
}
