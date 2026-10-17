import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This is a capability declaration, not a database health probe.
// Actual attendance and message permissions are tested via /api/live/native/:id.
export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: "dadyoom-native",
    mode: "teacher-board-and-chat",
    configured: true,
    features: {
      teacherBoard: true,
      classroomChat: true,
      audio: false,
      video: false,
      screenShare: false,
    },
    livekitDisabled: true,
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
