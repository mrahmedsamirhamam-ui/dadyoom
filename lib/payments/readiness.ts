/**
 * Fail-closed checkout switch.
 *
 * The legacy flag controls the marketing price display, not payment authorization.
 * New charges require a second, explicit owner-controlled server-side approval.
 * Neither flag must be put in NEXT_PUBLIC_ variables.
 *
 * This does not gate signed provider webhooks for charges that already exist.
 */
export function isCheckoutApproved(): boolean {
  return (
    process.env.DADYOOM_LIVE_BILLING_ENABLED === "true" &&
    process.env.DADYOOM_PAYMENT_ACTIVATION_APPROVED === "true"
  );
}
