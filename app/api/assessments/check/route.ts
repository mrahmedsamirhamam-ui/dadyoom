import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * P0/57 SECURITY STOP-GAP:
 * This legacy endpoint previously trusted items[].modelAnswer supplied by
 * browsers, then persisted AI/fallback scores to student assessments and
 * skills. An attacker could author a fake key and gain undeserved grades.
 * Until question IDs are validated against server-owned answer keys, refuse
 * grading and perform no writes. Do not restore this client-authored contract.
 *
 * Secure multiple-choice flow remains POST /api/questions/answer.
 */
export async function POST() {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول قبل التقييم." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "تعذر التحقق من جلسة الحساب." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      success: false,
      code: "SERVER_VERIFIED_ANSWER_KEY_REQUIRED",
      error: "التصحيح الكتابي غير متاح مؤقتًا لحماية الدرجات؛ يُرجى استخدام أسئلة الدرس المعتمدة حتى اكتمال التصحيح الآمن.",
    },
    { status: 409, headers: { "Cache-Control": "no-store" } },
  );
}
