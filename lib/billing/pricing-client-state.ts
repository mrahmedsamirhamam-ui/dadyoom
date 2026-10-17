/**
 * Readiness check for /api/billing/status on static pricing pages.
 * This only determines which *navigation label* is safe to display.
 * It is never authorization to view a role dashboard or initiate payment.
 */
const DASHBOARDS: Record<string, { href: string; label: string }> = {
  admin: { href: "/admin", label: "لوحة الإدارة" },
  teacher: { href: "/teacher", label: "لوحة المعلم" },
  parent: { href: "/parent", label: "لوحة ولي الأمر" },
  school: { href: "/school", label: "لوحة المدرسة" },
  student: { href: "/student", label: "لوحة الطالب" },
  child: { href: "/student", label: "لوحة الطالب" },
};

export function isUsablePricingStatus(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const status = value as Record<string, unknown>;
  if (typeof status.authenticated !== "boolean" ||
      typeof status.dashboardHref !== "string" ||
      typeof status.dashboardLabel !== "string") return false;

  // The server returns HTTP 200 + degraded:true as a fail-closed fallback
  // for some intermittent auth failures. It is not a trustworthy logout.
  if (!status.authenticated) return status.degraded !== true;

  // A subscription-plan lookup can be degraded while auth still succeeded.
  // Keep that user's legitimate dashboard navigation, but never treat this
  // presentation check as a permission check.
  const role = typeof status.role === "string"
    ? status.role.trim().toLowerCase() : "student";
  const dashboard = DASHBOARDS[role] ?? DASHBOARDS.student;
  return status.dashboardHref === dashboard.href &&
    status.dashboardLabel === dashboard.label;
}
