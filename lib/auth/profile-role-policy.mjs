/**
 * Fail-closed, server-only onboarding policy. This cannot replace database RLS
 * and an immutable-role trigger: clients can call PostgREST directly.
 */
export const KNOWN_ROLES = Object.freeze(["student", "child", "parent", "teacher", "school", "admin"]);
export const SELF_SIGNUP_ROLES = Object.freeze(["student", "child", "parent"]);
export const NEEDS_ADMIN_APPROVAL = Object.freeze(["teacher", "school", "admin"]);

export function normalizeProfileRole(raw) {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/**
 * Any verified role (including admin) can finish missing non-privileged fields.
 * No caller-provided role can replace an already stored role.
 */
export function checkOnboardingRole({ storedRole = null, requestedRole = null }) {
  const previous = normalizeProfileRole(storedRole);
  const requested = requestedRole == null ? "" : normalizeProfileRole(requestedRole);
  if (previous) {
    if (!KNOWN_ROLES.includes(previous)) return { ok: false, code: "UNKNOWN_STORED_ROLE" };
    if (requested && previous !== requested) return { ok: false, code: "ROLE_CHANGE_FORBIDDEN" };
    return { ok: true, role: previous, existing: true };
  }
  const role = requested || "student";
  if (!KNOWN_ROLES.includes(role)) return { ok: false, code: "INVALID_ROLE" };
  if (!SELF_SIGNUP_ROLES.includes(role)) return { ok: false, code: "APPROVAL_REQUIRED" };
  return { ok: true, role, existing: false };
}
