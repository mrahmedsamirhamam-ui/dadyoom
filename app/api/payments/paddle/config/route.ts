import { NextResponse } from "next/server";

/*
 * Paid Plus checkout is intentionally disabled for the current MVP.
 * This route must fail closed even if Paddle credentials happen to be
 * present in the deployment environment.
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
