import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

type Authorization =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; error: string };

// Use the verified session identity and the stored role, never request metadata.
export async function authorizeSession(
  client: SupabaseClient,
  roles?: readonly string[],
): Promise<Authorization> {
  let user: User;

  try {
    const result = await client.auth.getUser();
    if (result.error || !result.data.user) {
      return { ok: false, status: 401, error: "UNAUTHORIZED" };
    }
    user = result.data.user;
  } catch {
    return { ok: false, status: 401, error: "UNAUTHORIZED" };
  }

  if (roles) {
    try {
      const { data: profile, error } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = typeof profile?.role === "string"
        ? profile.role.trim().toLowerCase()
        : "";

      if (error || !roles.includes(role)) {
        return { ok: false, status: 403, error: "FORBIDDEN" };
      }
    } catch {
      return { ok: false, status: 403, error: "FORBIDDEN" };
    }
  }

  return { ok: true, user };
}
