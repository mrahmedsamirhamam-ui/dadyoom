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
