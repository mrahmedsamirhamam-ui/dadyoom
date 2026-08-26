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
};

export async function getAssessmentSessionAnalytics({
  supabase,
  sessionId,
  studentId,
}: GetAssessmentSessionAnalyticsParams) {
  const {
    data: answers,
    error,
  } = await supabase
    .from("assessment_session_answers")
    .select(`
      skill,
      is_correct
    `)
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  const normalizedAnswers =
    (answers ?? []).map((answer) => ({
      skill:
        typeof answer.skill === "string" &&
        answer.skill.trim()
          ? answer.skill.trim()
          : "الاستيعاب",

      isCorrect:
        answer.is_correct === true,
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
