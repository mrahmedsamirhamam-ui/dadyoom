import type {
  SupabaseClient,
} from "@supabase/supabase-js";

type AdvanceAssessmentSessionParams = {
  supabase: SupabaseClient;
  sessionId: string;
  studentId: string;
  assessmentId: string;
};

export async function advanceAssessmentSession({
  supabase,
  sessionId,
  studentId,
  assessmentId,
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

  // The browser cannot declare its answer correct. Only a verified, saved
  // answer belonging to this student and session may advance the assessment.
  const { data: savedAnswer, error: answerError } = await supabase
    .from("assessment_session_answers")
    .select("assessment_id, lesson_id, is_correct")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .eq("assessment_id", assessmentId)
    .maybeSingle();

  if (
    answerError ||
    !savedAnswer ||
    savedAnswer.lesson_id !== session.lesson_id ||
    typeof savedAnswer.is_correct !== "boolean"
  ) {
    throw new Error("لا يمكن الانتقال قبل حفظ إجابة مصححة على الخادم.");
  }

  const { count: savedAnswerCount, error: countError } = await supabase
    .from("assessment_session_answers")
    .select("assessment_id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("student_id", studentId);

  const previousCount = session.correct_answers + session.wrong_answers;

  // Prevent replay of the same answer and skipping ahead using other saved answers.
  if (countError || savedAnswerCount !== previousCount + 1) {
    throw new Error("حالة التقييم غير متزامنة. حدّث الصفحة ثم حاول مجددًا.");
  }

  const answeredCorrectly = savedAnswer.is_correct;

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
    .eq("current_question", session.current_question)
    .eq("correct_answers", session.correct_answers)
    .eq("wrong_answers", session.wrong_answers)
    .select("*")
    .maybeSingle();

  if (
    updateError ||
    !updatedSession
  ) {
    throw new Error(
      updateError?.message ||
        "تعذر تحديث جلسة الاختبار؛ ربما تم الانتقال بالفعل."
    );
  }

  return updatedSession;
}
