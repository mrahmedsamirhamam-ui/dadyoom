/**
 * Default-deny payment initiation. The public pricing page is not a security gate:
 * API routes must independently require an explicit owner activation.
 *
 * Both variables are server-only. Do not set them in a public client bundle.
 * Changing production environment values requires explicit owner approval.
 */
export function liveCheckoutApproved(): boolean {
  return process.env.DADYOOM_LIVE_BILLING_ENABLED === "true" &&
    process.env.DADYOOM_PAYMENT_OWNER_APPROVED === "true";
}
