/**
 * A new activity attempt may update practice metrics, but it must never
 * revoke a lesson completion previously certified by the server mastery gate.
 *
 * Keep this policy independent of Supabase so it can be tested deterministically.
 */
export type ExistingLessonProgress = {
  status: string;
  progress_percent: number | null;
  best_score: number | null;
  attempts: number | null;
};

export type LessonActivityProgressPatch = {
  status: string;
  progress_percent: number;
  last_score: number;
  best_score: number;
  attempts: number;
  updated_at: string;
};

const terminalStatuses = new Set(["completed", "mastered"]);

function percent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

export function buildActivityProgressPatch(
  existing: ExistingLessonProgress | null,
  reportedProgressPercent: number,
  reportedScore: number,
  updatedAt: string,
): LessonActivityProgressPatch {
  const terminal = existing !== null && terminalStatuses.has(existing.status);
  const score = percent(reportedScore);

  return {
    status: terminal ? existing.status : "in_progress",
    // Never reduce the visible completed progress bar to a practice percentage.
    progress_percent: terminal ? 100 : percent(reportedProgressPercent),
    last_score: score,
    best_score: Math.max(percent(Number(existing?.best_score ?? 0)), score),
    attempts: Math.max(0, Number(existing?.attempts ?? 0)) + 1,
    updated_at: updatedAt,
  };
}
