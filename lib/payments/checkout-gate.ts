/**
 * All payment initiation defaults to paused, even when payment credentials exist.
 * The UI's pricing toggle alone must not authorize checkout or charge creation.
 *
 * These server-side values must only be enabled after owner approval and
 * a payment-provider sandbox + legal/security acceptance test.
 */
export type CheckoutProvider = "paddle" | "tap";

export function liveCheckoutApproved(provider: CheckoutProvider): boolean {
  const globalApproval =
    process.env.DADYOOM_LIVE_BILLING_ENABLED === "true" &&
    process.env.DADYOOM_PAYMENT_OWNER_APPROVED === "true";

  if (!globalApproval) return false;

  if (provider === "paddle") {
    return process.env.DADYOOM_PADDLE_LIVE_ENABLED === "true" &&
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production";
  }

  return process.env.DADYOOM_TAP_LIVE_ENABLED === "true";
}
