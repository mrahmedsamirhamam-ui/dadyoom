export type StoredProfileRole = "student" | "child" | "teacher" | "parent" | "school" | "admin";
export type SelfSignupRole = Exclude<StoredProfileRole, "admin">;
export const USER_ROLE_DESTINATIONS: Readonly<Record<StoredProfileRole, string>>;
export const SELF_SIGNUP_ROLES: readonly SelfSignupRole[];
export function destinationForStoredRole(role: unknown): string;
export function isSelfSignupRole(role: unknown): role is SelfSignupRole;
