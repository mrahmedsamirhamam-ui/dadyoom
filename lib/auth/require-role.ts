import "server-only";

import { createClient } from "@/lib/supabase/server";
import { hasAnyRole, normalizeAppRole, type AppRole } from "./roles";

export type RoleCheckResult =
  | { ok: true; userId: string; role: AppRole }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "unavailable" };

/**
 * Validate the current session and read the server-trusted profile role.
 * Production profiles has id and role, but no is_active column (verified).
 * Tenant/resource ownership must be checked independently for every request.
 */
export async function requireRole(
  allowedRoles: readonly AppRole[],
): Promise<RoleCheckResult> {
  const supabase = await createClient();
  const { data: identity, error: authError } = await supabase.auth.getUser();
  if (authError || !identity.user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", identity.user.id)
    .maybeSingle();

  if (profileError) return { ok: false, reason: "unavailable" };
  if (!profile) return { ok: false, reason: "forbidden" };

  const role = normalizeAppRole(profile.role);
  if (!hasAnyRole(role, allowedRoles)) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true, userId: identity.user.id, role: role! };
}
