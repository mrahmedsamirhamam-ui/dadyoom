import {
  NextResponse,
} from "next/server";

import {
  cinematicVideoRuntimeHealth,
} from "@/lib/video/cinematic-avatar-agent";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const health =
      await cinematicVideoRuntimeHealth();

    return NextResponse.json(
      {
        ok:
          health.ready,
        configuredCount:
          health.configuredCount,
        coolingCount:
          health.coolingCount,
        freeFirst:
          health.freeFirst,
        paidEnabled:
          health.paidEnabled,
      },
      {
        status:
          health.ready
            ? 200
            : 503,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "VIDEO_HEALTH_ERROR",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        ok: false,
        configuredCount: 0,
        coolingCount: 0,
        freeFirst: true,
        paidEnabled: false,
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  }
}
