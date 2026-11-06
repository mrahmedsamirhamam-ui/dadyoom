/**
 * Dashboard destination is derived ONLY from a role persisted in profiles.
 * User-editable auth.user_metadata must never be used for authorisation or
 * to send users to private role dashboards.
 */
export const USER_ROLE_DESTINATIONS = Object.freeze({
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
});
export const SELF_SIGNUP_ROLES = Object.freeze([
  "student", "child", "teacher", "parent", "school",
]);
export function destinationForStoredRole(role) {
  const key = typeof role === "string" ? role.trim().toLowerCase() : "";
  return Object.prototype.hasOwnProperty.call(USER_ROLE_DESTINATIONS, key)
    ? USER_ROLE_DESTINATIONS[key]
    : "/onboarding";
}
export function isSelfSignupRole(role) {
  return typeof role === "string" && SELF_SIGNUP_ROLES.includes(role.trim().toLowerCase());
}
