import { NextResponse } from "next/server";
import { isCheckoutApproved } from "@/lib/payments/readiness";

/** Reject before auth, request parsing, provider calls or payment record writes. */
export function checkoutPausedResponse(): NextResponse | null {
  if (isCheckoutApproved()) return null;
  return NextResponse.json(
    { error: "PAYMENTS_PAUSED" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
