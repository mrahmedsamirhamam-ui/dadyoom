import type { SupabaseClient } from "@supabase/supabase-js";

type StudentMemoryRow = {
  skill: string;
  score: number;
  attempts: number;
  updated_at: string;
};

type GetStudentMemoryParams = {
  supabase: SupabaseClient;
  studentId: string;
};

export async function getStudentMemory({
  supabase,
  studentId,
}: GetStudentMemoryParams) {
  const { data, error } = await supabase
    .from("student_memory")
    .select(`
      skill,
      score,
      attempts,
      updated_at
    `)
    .eq("student_id", studentId)
    .order("score", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as StudentMemoryRow[];
}
