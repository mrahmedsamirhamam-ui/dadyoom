import type {
  SupabaseClient,
} from "@supabase/supabase-js";

export type ActiveParentLinkCode = {
  code: string;
  expires_at: string;
};

export async function getActiveParentLinkCode(
  supabase: SupabaseClient
): Promise<ActiveParentLinkCode | null> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "get_active_parent_link_code"
  );

  if (error) {
    throw error;
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  return row
    ? (row as ActiveParentLinkCode)
    : null;
}
