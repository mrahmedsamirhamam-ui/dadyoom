import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "PayPal غير مستخدم في ضاديوم. الدفع متاح عبر Visa وMastercard فقط.",
    },
    { status: 410 },
  );
}
