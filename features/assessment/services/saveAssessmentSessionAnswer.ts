import type {
  SupabaseClient,
} from "@supabase/supabase-js";

type SaveAssessmentSessionAnswerParams = {
  supabase: SupabaseClient;
  sessionId: string;
  assessmentId: string;
  studentId: string;
  lessonId: string;
  skill: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
};

export async function saveAssessmentSessionAnswer({
  supabase,
  sessionId,
  assessmentId,
  studentId,
  lessonId,
  skill,
  selectedAnswer,
  correctAnswer,
  isCorrect,
}: SaveAssessmentSessionAnswerParams): Promise<void> {
  // An already-recorded answer is a conflict, not a successful no-op.
  // This avoids running downstream XP/mastery updates after a silent duplicate.
  const { error } = await supabase
    .from("assessment_session_answers")
    .insert({
      session_id: sessionId,
      assessment_id: assessmentId,
      student_id: studentId,
      lesson_id: lessonId,
      skill: skill.trim() || "الاستيعاب",
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
    });

  if (error) {
    throw error;
  }
}
