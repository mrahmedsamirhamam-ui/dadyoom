import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RequestedPrivilegedRole = "teacher" | "school";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export function isApprovalRequired(role: unknown): role is RequestedPrivilegedRole {
  return role === "teacher" || role === "school";
}

/**
 * Privileged requests are applications, never authorization. This only
 * creates a pending row; it cannot assign profiles.role to teacher or school.
 * An INSERT conflict does not reset an existing rejection or approval.
 */
export async function ensurePendingRoleRequest(
  admin: SupabaseClient,
  userId: string,
  requestedRole: RequestedPrivilegedRole,
): Promise<{
  ok: boolean;
  status?: ApprovalStatus;
  requestedRole?: RequestedPrivilegedRole;
}> {
  const { error: insertError } = await admin.from("profile_role_requests").insert({
    user_id: userId,
    requested_role: requestedRole,
  });
  // 23505 = unique_violation (an earlier application already exists).
  if (insertError && insertError.code !== "23505") return { ok: false };

  const { data, error } = await admin.from("profile_role_requests")
    .select("requested_role,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || !isApprovalRequired(data.requested_role) ||
      data.requested_role !== requestedRole ||
      !["pending","approved","rejected"].includes(data.status)) {
    return { ok: false };
  }

  return {
    ok: true,
    status: data.status as ApprovalStatus,
    requestedRole: data.requested_role,
  };
}


/**
 * A stored teacher/school role alone is not authorization. Approval must be
 * present in the separately controlled role-request table, with audit fields.
 * Old privileged profiles need individual verification; database failures
 * and missing approval rows always fail closed.
 */
export async function hasVerifiedPrivilegedRole(
  client: SupabaseClient,
  userId: string,
  role: string,
): Promise<boolean> {
  if (!["teacher","school","admin"].includes(role)) return true;
  if (!userId) return false;
  try {
    const { data, error } = await client.from("profile_role_requests")
      .select("requested_role,status,reviewed_by,reviewed_at")
      .eq("user_id", userId)
      .maybeSingle();
    return !error &&
      data?.requested_role === role &&
      data.status === "approved" &&
      typeof data.reviewed_by === "string" &&
      data.reviewed_by.length > 0 &&
      typeof data.reviewed_at === "string" &&
      data.reviewed_at.length > 0;
  } catch {
    return false;
  }
}
