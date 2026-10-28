/**
 * Server-only attempt sequencing for lesson activity grading.
 *
 * Requires the UNIQUE (user_id, activity_id, attempt_number) constraint to
 * be installed and verified before claiming concurrency-safe numbering.
 * PostgREST does not make read-max + insert atomic by itself.
 */
export const ACTIVITY_ATTEMPT_NUMBER_CONSTRAINT =
  "lesson_activity_attempts_user_activity_attempt_number_key";

type InsertFailure = { code?: string; message?: string; constraint?: string };

export function isAttemptNumberConflict(
  error: InsertFailure | null | undefined,
): boolean {
  return error?.code === "23505" && (
    error.constraint === ACTIVITY_ATTEMPT_NUMBER_CONSTRAINT ||
    typeof error.message === "string" &&
      error.message.includes(ACTIVITY_ATTEMPT_NUMBER_CONSTRAINT)
  );
}

export async function insertSequencedActivityAttempt({
  readLast,
  insert,
  maxRetries = 5,
}: {
  readLast: () => Promise<number>;
  insert: (attemptNumber: number) => Promise<{ error: InsertFailure | null }>;
  maxRetries?: number;
}): Promise<number> {
  if (!Number.isInteger(maxRetries) || maxRetries < 1 || maxRetries > 10) {
    throw new Error("عدد محاولات الترقيم غير صالح.");
  }
  for (let i = 0; i < maxRetries; i++) {
    const last = await readLast();
    if (!Number.isSafeInteger(last) || last < 0 || last >= Number.MAX_SAFE_INTEGER) {
      throw new Error("رقم المحاولة المحفوظ غير صالح.");
    }

    const next = last + 1;
    const { error } = await insert(next);
    if (!error) return next;
    if (!isAttemptNumberConflict(error)) {
      // Authorization, missing table/index, or unrelated unique violation:
      // NEVER loop or pretend the activity attempt was recorded.
      throw error;
    }
  }
  throw new Error("تعذر ترقيم محاولة النشاط بسبب طلبات متزامنة. حاول مرة أخرى.");
}
