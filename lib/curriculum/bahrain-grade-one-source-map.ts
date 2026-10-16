/**
 * Audited 2026 Bahrain Grade-1 image directories already committed in /public.
 * These are page spans of a particular textbook edition, NOT "lesson_number"
 * in the database: unit-local lesson_number can repeat across multiple units.
 *
 * Only allow exact range matches. Never auto-attach another lesson's images.
 */
const pageFolders = [
  [2, 22, 34], [3, 35, 48], [4, 49, 61], [5, 62, 65],
  [6, 66, 67], [7, 68, 81], [8, 82, 96], [9, 97, 109],
  [10, 110, 123], [11, 124, 129], [12, 130, 131],
  [13, 132, 144], [14, 145, 156], [15, 157, 168],
  [16, 169, 181], [17, 182, 186], [18, 187, 190],
] as const;

export function resolveBahrainGradeOneSource(input: {
  countryCode: string | null | undefined;
  gradeNumber: number | null | undefined;
  sourcePageStart: number | null | undefined;
  sourcePageEnd: number | null | undefined;
}): string | null {
  if (input.countryCode?.toUpperCase() !== "BH" ||
      input.gradeNumber !== 1 ||
      !Number.isInteger(input.sourcePageStart) ||
      !Number.isInteger(input.sourcePageEnd)) {
    return null;
  }
  const folder = pageFolders.find(([, start, end]) =>
    start === input.sourcePageStart && end === input.sourcePageEnd);
  return folder
    ? `/curriculum/bahrain/grade-01/lesson-${String(folder[0]).padStart(2, "0")}`
    : null;
}
