import type { SupabaseClient } from "@supabase/supabase-js";

export type ActiveSchoolTeacherLinkCode = {
  code: string;
  expires_at: string;
};

export async function getActiveSchoolTeacherLinkCode(
  supabase: SupabaseClient
): Promise<ActiveSchoolTeacherLinkCode | null> {
  const { data, error } =
    await supabase.rpc(
      "get_active_school_teacher_link_code"
    );

  if (error) {
    throw error;
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  return row
    ? row as ActiveSchoolTeacherLinkCode
    : null;
}
