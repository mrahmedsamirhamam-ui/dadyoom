/**
 * TASK 03-C / Issue #117 — explicit self-signup permission policy.
 *
 * Privileged roles (teacher, school, admin) are never self-granted. Their
 * issuance requires a separately verified, audited approval workflow that is
 * NOT present in this repository. This module intentionally contains no role
 * hierarchy and no schema assumptions.
 */

export const SELF_SIGNUP_ROLES = ["student", "child", "parent"] as const;

export type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];

const KNOWN_ROLES = new Set<string>([
  ...SELF_SIGNUP_ROLES,
  "teacher",
  "school",
  "admin",
]);

const SELF_SIGNUP_ROLE_SET = new Set<string>(SELF_SIGNUP_ROLES);

export function normalizeRole(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isKnownRole(value: unknown): boolean {
  return KNOWN_ROLES.has(normalizeRole(value));
}

export function isSelfSignupRole(value: unknown): value is SelfSignupRole {
  return SELF_SIGNUP_ROLE_SET.has(normalizeRole(value));
}

/** Downgrade any untrusted role source to the least privileged account type. */
export function safeSelfSignupRole(value: unknown): SelfSignupRole {
  const role = normalizeRole(value);
  return isSelfSignupRole(role) ? role : "student";
}
