import { createClient } from "@/lib/supabase/server";

export async function getLessonQuestions(
  lessonId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dadyoom_student_questions")
    .select("id,lesson_id,question_order,question,question_type,options,points")
    .eq("lesson_id", lessonId)
    .order("question_order");

  if (error) {
    throw error;
  }

  return data ?? [];
}
