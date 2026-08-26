import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

export async function getLearningProfile(
  studentId: string,
  supabaseClient?: ServerSupabaseClient
) {
  const supabase =
    supabaseClient ??
    (await createClient());

  const { data, error } =
    await supabase
      .from("student_learning_profile")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
