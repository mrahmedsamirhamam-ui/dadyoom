import "server-only";
import { NextResponse } from "next/server";
import {
  getPublicHaalPilotQuestions,
  gradeHaalPilotRequest,
} from "@/lib/adaptive-goal-paths/haal-service.mjs";

/**
 * Public, no-storage, illustrative pilot. NO SCHOOL GRADES / NO STUDENT RECORDS.
 * Real assessment needs authenticated sessions, server-side attempt tracking,
 * replay limits and teacher-authorized learner scope before any promotion.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store, private",
  "X-Content-Type-Options": "nosniff",
};
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });

export async function GET() {
  return reply(getPublicHaalPilotQuestions());
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return reply({ ok: false, error: "JSON_REQUIRED" }, 415);
  }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return reply({ ok: false, error: "CROSS_ORIGIN_BLOCKED" }, 403);
      }
    } catch {
      return reply({ ok: false, error: "INVALID_ORIGIN" }, 403);
    }
  }
  const length = request.headers.get("content-length");
  if (length && (!/^\d{1,5}$/.test(length) || Number(length) > 4096)) {
    return reply({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return reply({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 413);
    body = JSON.parse(raw);
  } catch {
    return reply({ ok: false, error: "INVALID_JSON" }, 400);
  }
  const graded = gradeHaalPilotRequest(body);
  return reply(graded, graded.status);
}
