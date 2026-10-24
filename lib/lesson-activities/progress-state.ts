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

export type ActivityProgressRow = {
  id: string;
  status: string;
  best_score: number;
  attempts: number;
  progress_percent: number;
};

export type ActivityProgressUpdate = {
  status: string;
  best_score: number;
  last_score: number;
  attempts: number;
  progress_percent: number;
  updated_at: string;
};

/**
 * Retry an optimistic compare-and-swap whenever another student request
 * updates the same progress row. Increment attempts exactly once per
 * successfully persisted activity, even during an insert/update race.
 *
 * Database callbacks MUST enforce student/lesson ownership and use current
 * (status, attempts, best score, percent) in the UPDATE WHERE clause.
 * An empty affected-row result is a CAS miss, not proof of success.
 */
export async function commitActivityProgressWithRetry({
  initial,
  score,
  activityPercent,
  insert,
  update,
  read,
  maxAttempts = 5,
}: {
  initial: ActivityProgressRow | null;
  score: number;
  activityPercent: number;
  insert: (values: ActivityProgressUpdate) => Promise<boolean>;
  update: (
    previous: ActivityProgressRow,
    values: ActivityProgressUpdate,
  ) => Promise<boolean>;
  read: () => Promise<ActivityProgressRow | null>;
  maxAttempts?: number;
}): Promise<void> {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error("درجة التقويم غير صالحة.");
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new Error("عدد محاولات الحفظ غير صالح.");
  }

  let previous = initial;
  for (let retry = 0; retry < maxAttempts; retry++) {
    const safe = preserveGradedLessonProgress(previous, activityPercent);
    const values: ActivityProgressUpdate = {
      status: safe.status,
      progress_percent: safe.progress_percent,
      last_score: score,
      best_score: Math.max(Number(previous?.best_score ?? 0), score),
      attempts: Number(previous?.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    };

    // An initial insert may lose to a simultaneous first-lesson request.
    // DO NOTHING on conflict; never overwrite the winner's XP or status.
    const saved = previous
      ? await update(previous, values)
      : await insert(values);
    if (saved) return;

    previous = await read();
    if (!previous) {
      // Fail closed: the student row was removed/invisible during the race.
      throw new Error("تعذر قراءة حالة التقدم بعد تعارض الحفظ.");
    }
  }

  // Do not return a misleading success if concurrent writers keep winning.
  throw new Error("تعذر حفظ المحاولة بسبب تحديثات متزامنة. حاول مرة أخرى.");
}
