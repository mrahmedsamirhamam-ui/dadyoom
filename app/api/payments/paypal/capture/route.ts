import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "PayPal غير مستخدم في ضاديوم.",
    },
    { status: 410 },
  );
}
