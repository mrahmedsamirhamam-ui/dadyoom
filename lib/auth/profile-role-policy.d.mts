export type DadyoomRole = "student" | "child" | "parent" | "teacher" | "school" | "admin";
export const KNOWN_ROLES: ReadonlyArray<DadyoomRole>;
export const SELF_SIGNUP_ROLES: ReadonlyArray<DadyoomRole>;
export const NEEDS_ADMIN_APPROVAL: ReadonlyArray<DadyoomRole>;
export function normalizeProfileRole(raw: unknown): string;
export function checkOnboardingRole(args: { storedRole?: unknown; requestedRole?: unknown }): { ok: true; role: DadyoomRole; existing: boolean } | { ok: false; code: string };
