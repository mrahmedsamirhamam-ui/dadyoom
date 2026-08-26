import type {
  SupabaseClient,
} from "@supabase/supabase-js";

export type StudentTeacherClass = {
  class_id: string;
  class_name: string;
  teacher_name: string;
  academic_year: string | null;
  joined_at: string;
};

export async function getMyTeacherClasses(
  supabase: SupabaseClient
): Promise<StudentTeacherClass[]> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_my_teacher_classes"
  );

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as StudentTeacherClass[];
}
