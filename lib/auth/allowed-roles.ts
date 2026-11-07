import type { AppRole } from "./roles";

/**
 * Typed equivalent of NestJS @Roles(...roles) for the Next.js codebase.
 * Route handlers must call requireRole(...) on the server before accessing data.
 * This is policy metadata, not an authentication or authorization bypass.
 */
export function allowedRoles<const T extends readonly AppRole[]>(
  ...roles: T
): T {
  return roles;
}
