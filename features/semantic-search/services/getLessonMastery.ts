import type { SupabaseClient } from "@supabase/supabase-js";

type GetLessonMasteryParams = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
};

export async function getLessonMastery({
  supabase,
  studentId,
  lessonId,
}: GetLessonMasteryParams) {
  const { data, error } = await supabase
    .from("lesson_mastery")
    .select("*")
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    data ?? {
      mastery_score: 0,
      correct_answers: 0,
      wrong_answers: 0,
      asked_questions: 0,
      last_question: null,
      last_answer: null,
      updated_at: null,
    }
  );
}
