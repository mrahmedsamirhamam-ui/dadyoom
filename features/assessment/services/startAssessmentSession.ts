import type {
  SupabaseClient,
} from "@supabase/supabase-js";

type Params = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
};

export async function startAssessmentSession({
  supabase,
  studentId,
  lessonId,
}: Params) {
  const { data: existing } =
    await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .eq("finished", false)
      .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } =
    await supabase
      .from("assessment_sessions")
      .insert({
        student_id: studentId,
        lesson_id: lessonId,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}
