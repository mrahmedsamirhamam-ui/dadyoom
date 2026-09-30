import { NextResponse } from "next/server";

import {
  isVideoAiGenerationEnabled,
  VIDEO_AI_SOON_MESSAGE,
} from "@/lib/video/release-state";

import {
  avatarEngineStatus,
} from "@/lib/video/avatar-engine";

export const runtime = "nodejs";

export async function GET() {
  if (!isVideoAiGenerationEnabled()) {
    return NextResponse.json(
      {
        ok: true,
        enabled: false,
        status: "soon",
        message: VIDEO_AI_SOON_MESSAGE,
        configured: false,
        ready: false,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  return NextResponse.json(avatarEngineStatus());
}
