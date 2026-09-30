import {
  NextResponse,
} from "next/server";

import {
  isVideoAiGenerationEnabled,
  VIDEO_AI_SOON_MESSAGE,
} from "@/lib/video/release-state";

import {
  cinematicVideoRuntimeHealth,
} from "@/lib/video/cinematic-avatar-agent";
import {
  batchVideoRuntimeHealth,
} from "@/lib/video/batch-fallback";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

export async function GET() {
  if (!isVideoAiGenerationEnabled()) {
    return NextResponse.json(
      {
        ok: true,
        enabled: false,
        status: "soon",
        message: VIDEO_AI_SOON_MESSAGE,
        cloudReady: false,
        configuredCount: 0,
        coolingCount: 0,
        freeFirst: true,
        paidEnabled: false,
        batchQueueReady: false,
        batchWorkerObservedRecently: false,
        batchQueued: 0,
        batchCompleted: 0,
        batchFailed: 0,
        degraded: false,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }

  try {
    const [
      health,
      batch,
    ] =
      await Promise.all([
        cinematicVideoRuntimeHealth(),
        batchVideoRuntimeHealth(),
      ]);

    const ready =
      health.ready ||
      batch.queueReady;

    return NextResponse.json(
      {
        ok:
          ready,
        cloudReady:
          health.ready,
        configuredCount:
          health.configuredCount,
        coolingCount:
          health.coolingCount,
        freeFirst:
          health.freeFirst,
        paidEnabled:
          health.paidEnabled,
        batchQueueReady:
          batch.queueReady,
        batchWorkerObservedRecently:
          batch.workerObservedRecently,
        batchQueued:
          batch.queued,
        batchCompleted:
          batch.completed,
        batchFailed:
          batch.failed,
        degraded:
          !health.ready &&
          batch.queueReady,
      },
      {
        status:
          ready
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
        batchQueueReady: false,
        batchWorkerObservedRecently: false,
        batchQueued: 0,
        batchCompleted: 0,
        batchFailed: 0,
        degraded: false,
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
