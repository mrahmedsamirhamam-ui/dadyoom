import "server-only";

/**
 * TASK 03-E activation boundary for the review-only Issue #117 database SQL.
 *
 * Default 'off' keeps production on the already-reviewed TASK 03-C direct-write
 * path. 'on' is permitted ONLY after the reviewed SQL has been applied and
 * verified in the target disposable/staging environment and the RPC contract
 * has been proven with real local Auth + PostgREST tests. No caller may fall
 * back to a direct profile write when the RPC is missing or fails.
 */
export const ONBOARDING_COMPLETE_RPC = "task03d_complete_self_signup";

export function isOnboardingRpcEnabled(): boolean {
  return process.env.TASK03D_ONBOARDING_RPC_MODE === "on";
}
