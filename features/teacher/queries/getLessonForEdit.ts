import { createClient } from "@/lib/supabase/server";

export async function getLessonForEdit(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}