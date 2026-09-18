import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "التحويل البنكي المباشر غير متاح للمستخدمين. استخدم Visa أو Mastercard.",
    },
    { status: 410 },
  );
}
