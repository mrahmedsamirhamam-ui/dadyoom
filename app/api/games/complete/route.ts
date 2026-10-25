import { NextResponse } from "next/server";

/**
 * Legacy arcade pack answers were previously delivered to the browser.
 * No browser-supplied score may be persisted or exchanged for XP.
 * Secure scored play uses submitStudyPlay with server-validated stored MCQs.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      xp: 0,
      code: "UNVERIFIED_ARCADE_SCORE",
      error: "هذه لعبة مفردات للتدريب فقط؛ نقاطها غير معتمدة. لتسجيل نتيجة موثوقة افتح «ذاكر والعب» من الدرس.",
    },
    { status: 409, headers: { "Cache-Control": "no-store" } },
  );
}
