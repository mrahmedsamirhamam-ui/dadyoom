import { NextResponse } from "next/server";

import {
  livekitConfigured,
} from "@/lib/livekit/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured =
    livekitConfigured();

  return NextResponse.json(
    {
      ok: configured,
      provider: "livekit",
      configured,
    },
    {
      status:
        configured
          ? 200
          : 503,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
