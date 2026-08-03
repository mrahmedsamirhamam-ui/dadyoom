import type { SupabaseClient } from "@supabase/supabase-js";

export async function getProfile(
  supabase: SupabaseClient,
  email: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;

  return data;
}