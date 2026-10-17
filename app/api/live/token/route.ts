import { NextResponse } from "next/server";

// Legacy token path. The LiveKit provider is retired: never issue external
// media tokens even when its old secrets remain configured in the environment.
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    error: "EXTERNAL_LIVE_VIDEO_RETIRED",
    message: "خدمة الفيديو القديمة متوقفة. استخدم غرفة ضاديوم التعليمية للنقاش والسبورة. الصوت والصورة قيد التطوير.",
    classroomUrl: "/live",
    videoAvailable: false,
  }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
