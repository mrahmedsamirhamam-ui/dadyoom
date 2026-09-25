import { NextResponse } from "next/server";

/*
 * Payments are intentionally paused for the current zero-cost MVP.
 * Keep the Tap integration code in lib/payments for later activation,
 * but do not create charges from a public route until payments are
 * explicitly enabled as a product decision.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "PAYMENTS_PAUSED",
      message:
        "الدفع غير مفعّل حاليًا في ضاديوم.",
    },
    {
      status: 503,
      headers: {
        "Retry-After": "86400",
      },
    },
  );
}
