import "server-only";

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
    data: inserted,
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
    )
    .select("id,session_id,assessment_id,student_id,lesson_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  // ignoreDuplicates intentionally never mutates an existing answer.
  // A conflict must also NEVER be mistaken for a successful scored write:
  // the submit handler would otherwise credit XP for an ignored insert.
  if (!inserted ||
      inserted.session_id !== sessionId ||
      inserted.assessment_id !== assessmentId ||
      inserted.student_id !== studentId ||
      inserted.lesson_id !== lessonId) {
    throw new Error("ASSESSMENT_ANSWER_NOT_INSERTED");
  }
}
