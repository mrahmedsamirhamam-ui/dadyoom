/**
 * The stored "published" status alone is NOT evidence of textbook matching.
 * A trusted import explicitly marks some records source_publication_ready=false.
 * Keep those accessible for learning/review but never market them as certified.
 *
 * Do not infer certification from the absence of the flag.
 */
export const REVIEW_REQUIRED_DESCRIPTION =
  "مادة إثرائية أصلية من ضاديوم قيد المراجعة التحريرية ومطابقة المصدر؛ ليست نقلًا معتمدًا من كتاب الوزارة.";

type SourceRecord = Record<string, unknown>;

function record(value: unknown): SourceRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as SourceRecord)
    : null;
}

export function needsSourcePublicationReview(instructions: unknown): boolean {
  if (!Array.isArray(instructions)) return false;
  return instructions.some((entry) => {
    const value = record(entry);
    return value?.kind === "dadyoom_source" && value.source_publication_ready === false;
  });
}

export function publicLessonDescription(
  summary: string | null | undefined,
  instructions: unknown,
): string {
  if (needsSourcePublicationReview(instructions)) return REVIEW_REQUIRED_DESCRIPTION;
  return summary?.trim() ?? "";
}
