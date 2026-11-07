import "server-only";

import { createClient } from "@/lib/supabase/server";
import { hasAnyRole, normalizeAppRole, type AppRole } from "./roles";

export type RoleCheckResult =
  | { ok: true; userId: string; role: AppRole }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "unavailable" };

/**
 * Server-only role check using the authenticated user's own profile under RLS.
 * Fail closed: absent/unknown roles and query errors never grant access.
 * School/ministry tenant scope must be checked separately on each resource.
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
    .select("role, is_active")
    .eq("id", identity.user.id)
    .maybeSingle();

  if (profileError) return { ok: false, reason: "unavailable" };
  if (!profile || profile.is_active !== true) {
    return { ok: false, reason: "forbidden" };
  }

  const role = normalizeAppRole(profile.role);
  if (!hasAnyRole(role, allowedRoles)) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true, userId: identity.user.id, role: role! };
}
