/** Preserve a completed/mastered lesson when reviewing an activity again.
 * The scoring route can record a new attempt, but only the canonical
 * completion action is allowed to confer or revoke lesson mastery.
 * This function never awards XP.
 */
export function activityProgressState(
  existingStatus: string | null | undefined,
  attemptedProgressPercent: number
): { status: string; progressPercent: number } {
  if (
    existingStatus === "completed" ||
    existingStatus === "mastered"
  ) {
    return {
      status: existingStatus,
      progressPercent: 100,
    };
  }

  return {
    status: "in_progress",
    progressPercent: Math.max(
      0,
      Math.min(100, Math.round(attemptedProgressPercent))
    ),
  };
}
