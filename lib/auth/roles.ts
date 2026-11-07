/** Canonical application roles. Never trust a role submitted by the browser. */
export const APP_ROLES = [
  "STUDENT",
  "TEACHER",
  "PARENT",
  "SCHOOL_ADMIN",
  "SUPER_ADMIN",
  "MINISTRY_ADMIN",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.some((role) => role === value);
}

/** Read-only compatibility for historical lowercase role values.
 * Do not use this as a substitute for authorization or a DB migration.
 */
export function normalizeAppRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toUpperCase();
  if (candidate === "ADMIN") return null; // legacy admin requires explicit migration
  return isAppRole(candidate) ? candidate : null;
}

export function hasAnyRole(
  verifiedRole: AppRole | null,
  permittedRoles: readonly AppRole[],
): boolean {
  return verifiedRole !== null && permittedRoles.includes(verifiedRole);
}
