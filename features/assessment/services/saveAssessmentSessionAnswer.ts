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
  const {
    error,
  } = await supabase
    .from("assessment_session_answers")
    .upsert(
      {
        session_id:
          sessionId,
        assessment_id:
          assessmentId,
        student_id:
          studentId,
        lesson_id:
          lessonId,
        skill:
          skill.trim() ||
          "الاستيعاب",
        selected_answer:
          selectedAnswer,
        correct_answer:
          correctAnswer,
        is_correct:
          isCorrect,
      },
      {
        onConflict:
          "session_id,assessment_id",
        ignoreDuplicates: true,
      }
    );

  if (error) {
    throw error;
  }
}