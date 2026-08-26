import { createClient } from "@/lib/supabase/server";

export async function getLessonQuestions(
  lessonId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("question_order");

  if (error) {
    throw error;
  }

  return data ?? [];
}
