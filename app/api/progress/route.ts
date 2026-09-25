import { NextResponse } from "next/server";

/*
 * Legacy compatibility bridge.
 *
 * Lesson completion has one authoritative path:
 * POST /api/lessons/complete
 *
 * A 307 redirect preserves the POST method, JSON body, cookies,
 * and authenticated session while preventing this legacy endpoint
 * from writing directly to student_progress.
 */
export async function POST(
  request: Request,
) {
  return NextResponse.redirect(
    new URL(
      "/api/lessons/complete",
      request.url,
    ),
    307,
  );
}
