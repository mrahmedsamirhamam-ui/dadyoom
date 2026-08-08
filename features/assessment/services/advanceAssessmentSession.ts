import type {
  SupabaseClient,
} from "@supabase/supabase-js";

type AdvanceAssessmentSessionParams = {
  supabase: SupabaseClient;
  sessionId: string;
  studentId: string;
  answeredCorrectly: boolean;
};

export async function advanceAssessmentSession({
  supabase,
  sessionId,
  studentId,
  answeredCorrectly,
}: AdvanceAssessmentSessionParams) {
  const {
    data: session,
    error: sessionError,
  } = await supabase
    .from("assessment_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error(
      "لم يتم العثور على جلسة الاختبار."
    );
  }

  if (session.finished) {
    return session;
  }

  const correctAnswers =
    session.correct_answers +
    (answeredCorrectly ? 1 : 0);

  const wrongAnswers =
    session.wrong_answers +
    (answeredCorrectly ? 0 : 1);

  const answeredQuestions =
    correctAnswers + wrongAnswers;

  const score =
    Math.round(
      (
        correctAnswers /
        Math.max(answeredQuestions, 1)
      ) * 100
    );

  const finished =
    session.current_question >=
    session.total_questions;

  const currentQuestion =
    finished
      ? session.total_questions
      : session.current_question + 1;

  const difficulty =
    score >= 80
      ? "hard"
      : score >= 50
        ? "medium"
        : "easy";

  const {
    data: updatedSession,
    error: updateError,
  } = await supabase
    .from("assessment_sessions")
    .update({
      current_question:
        currentQuestion,
      correct_answers:
        correctAnswers,
      wrong_answers:
        wrongAnswers,
      difficulty,
      finished,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("student_id", studentId)
    .select("*")
    .single();

  if (
    updateError ||
    !updatedSession
  ) {
    throw new Error(
      updateError?.message ||
        "تعذر تحديث جلسة الاختبار."
    );
  }

  return updatedSession;
}