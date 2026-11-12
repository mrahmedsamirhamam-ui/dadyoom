export const PASSPORT_SIZE = 10;
export const PASSPORT_COUNT = 5;
export const CHALLENGE_TOTAL = PASSPORT_SIZE * PASSPORT_COUNT;

export type ReadingRecord = {
  bookId: string;
  approved: boolean;
};

/** Counts only distinct approved books; caller must authorize records server-side. */
export function getReadingProgress(records: readonly ReadingRecord[]) {
  const completed = Math.min(
    CHALLENGE_TOTAL,
    new Set(records.filter((record) => record.approved && record.bookId.trim()).map((record) => record.bookId)).size,
  );
  const passports = Array.from({ length: PASSPORT_COUNT }, (_, index) => {
    const start = index * PASSPORT_SIZE;
    const count = Math.max(0, Math.min(PASSPORT_SIZE, completed - start));
    return { stage: index + 1, completed: count, target: PASSPORT_SIZE, unlocked: index === 0 || completed >= start, finished: count === PASSPORT_SIZE };
  });
  return { completed, target: CHALLENGE_TOTAL, passports };
}
