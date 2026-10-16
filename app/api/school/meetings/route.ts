import { NextResponse } from "next/server";

import { createSchoolMeetingRecord } from "@/lib/live/create-school-meeting";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

// Client-only custom header forces an ordinary cross-origin browser request
// to preflight. No permissive CORS headers are exposed for this private route.
export async function POST(request: Request) {
  if (request.headers.get("x-dadyoom-meeting-request") !== "1") {
    return NextResponse.json(
      { ok: false, message: "طلب غير مسموح به." },
      { status: 403, headers: NO_STORE },
    );
  }
  try {
    await createSchoolMeetingRecord(await request.formData());
    return NextResponse.json(
      { ok: true, message: "تم حفظ اجتماع المعلمين بنجاح." },
      { headers: NO_STORE },
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    console.error("SCHOOL_MEETING_API_FAILURE", reason);
    const status = reason === "AUTH_REQUIRED" ? 401 :
      reason === "SCHOOL_ROLE_REQUIRED" || reason === "SCHOOL_NOT_FOUND" ? 403 :
        reason === "SCHOOL_MEETING_FIELDS_REQUIRED" || reason === "INVALID_MEETING_TIME" ? 400 : 500;
    const message = status === 401 ? "يجب تسجيل الدخول أولًا." :
      status === 403 ? "ليس لديك صلاحية إنشاء اجتماع لهذه المدرسة." :
        status === 400 ? "تحقق من عنوان الاجتماع وموعد بدايته ونهايته." :
          "تعذر حفظ الاجتماع حاليًا. حاول مرة أخرى.";
    return NextResponse.json({ ok: false, message }, { status, headers: NO_STORE });
  }
}
