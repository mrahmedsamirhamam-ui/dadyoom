import { NextResponse } from "next/server";
import { createTeacherLiveSessionRecord } from "@/lib/live/create-teacher-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (request.headers.get("x-dadyoom-teacher-live-request") !== "1") {
    return NextResponse.json({ ok: false, message: "طلب غير مسموح به." }, { status: 403, headers });
  }
  try {
    await createTeacherLiveSessionRecord(await request.formData());
    return NextResponse.json({ ok: true, message: "تم إنشاء الحصة المباشرة." }, { headers });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    console.error("TEACHER_LIVE_API_ERROR", reason);
    const status = reason === "AUTH_REQUIRED" ? 401 :
      ["COURSE_NOT_OWNED_BY_TEACHER", "CLASS_NOT_OWNED_BY_TEACHER"].includes(reason) ? 403 :
      ["LIVE_SESSION_FIELDS_REQUIRED", "INVALID_START_TIME", "INVALID_END_TIME"].includes(reason) ? 400 : 500;
    const message = status === 401 ? "يجب تسجيل الدخول." :
      status === 403 ? "لا تملك صلاحية الفصل أو الكورس." :
      status === 400 ? "تحقق من العنوان والموعد وربط الفصل أو الكورس." :
      "تعذر إنشاء الحصة حاليًا، ولم يُؤكد الحفظ.";
    return NextResponse.json({ ok: false, message }, { status, headers });
  }
}
