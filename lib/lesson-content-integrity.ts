/**
 * 2026-10-24 read-only live audit found 59 published Bahrain lesson records
 * containing this exact generic template with no real lesson explanation.
 * These are not proofs of teaching, even when status="published".
 *
 * A narrow fingerprint protects authentic content which merely quotes an
 * introductory sentence; do NOT classify all short lessons as invalid.
 */
export function isKnownNonTeachingLessonPlaceholder(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const text = value.trim();
  return (
    text.length < 400 &&
    text.startsWith("يتناول هذا الدرس موضوع «") &&
    text.includes("يبدأ التعلم بتهيئة قصيرة") &&
    text.includes("واستخراج الفكرة الرئيسة")
  );
}
