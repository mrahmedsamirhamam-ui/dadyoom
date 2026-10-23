/** Preserve accepted completion/mastery after answering additional activities. */
export function preserveGradedLessonProgress(
  previous: { status?: string | null; progress_percent?: number | null } | null,
  nextActivityPercent: number
): { status: string; progress_percent: number } {
  const percent = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.min(100, Math.round(value)))
      : 0;

  const updated = percent(nextActivityPercent);
  if (previous?.status === "completed" || previous?.status === "mastered") {
    return {
      status: previous.status,
      progress_percent: Math.max(percent(previous.progress_percent), updated),
    };
  }
  return { status: "in_progress", progress_percent: updated };
}
