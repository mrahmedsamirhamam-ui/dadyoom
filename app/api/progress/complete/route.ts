import { NextResponse } from "next/server";

/*
 * Legacy compatibility bridge.
 *
 * Completion must pass the canonical Dadyoom gate:
 * activities/questions -> >= 90% mastery -> progress -> XP/streak.
 * Do not write student_progress directly from this route.
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
