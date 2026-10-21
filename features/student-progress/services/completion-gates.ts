/**
 * Academic mastery requires assessable evidence; "no data" is not 100%.
 * Kept pure so the same conditions can be unit-tested without credentials.
 */
export function requirePositiveAssessmentPoints(totalPossible: number): void {
  if (!Number.isFinite(totalPossible) || totalPossible <= 0) {
    throw new Error(
      "لا يمكن إنهاء الدرس: الأنشطة القابلة للتصحيح لا تحمل درجات صالحة. تواصل مع المعلم."
    );
  }
}

export function requireAssessedItems(questionCount: number): void {
  if (!Number.isSafeInteger(questionCount) || questionCount < 1) {
    throw new Error(
      "لا يمكن إنهاء الدرس قبل توفر تقويم قابل للتصحيح؛ أبلغ المعلم لاستكماله."
    );
  }
}
