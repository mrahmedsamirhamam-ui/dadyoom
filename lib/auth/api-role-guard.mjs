/**
 * Server-only namespace policy for API route groups.
 * The client must NEVER provide the required role or the effective role.
 *
 * A proxy check is defense-in-depth, not the database authorization layer:
 * every handler must also validate auth.getUser() + row/tenant ownership.
 */
export const API_ROLE_ROUTES = Object.freeze([
  Object.freeze({ namespace: "/api/admin", allowed: Object.freeze(["admin"]) }),
  Object.freeze({ namespace: "/api/teacher", allowed: Object.freeze(["teacher", "admin"]) }),
  Object.freeze({ namespace: "/api/parent", allowed: Object.freeze(["parent", "admin"]) }),
  Object.freeze({ namespace: "/api/school", allowed: Object.freeze(["school", "admin"]) }),
  Object.freeze({ namespace: "/api/student", allowed: Object.freeze(["student", "child", "admin"]) }),
  Object.freeze({ namespace: "/api/child", allowed: Object.freeze(["child", "admin"]) }),
]);

/** @returns {readonly string[] | undefined} */
export function rolesForProtectedApiPath(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/api/")) return undefined;
  for (const { namespace, allowed } of API_ROLE_ROUTES) {
    if (pathname === namespace || pathname.startsWith(namespace + "/")) return allowed;
  }
  return undefined;
}
