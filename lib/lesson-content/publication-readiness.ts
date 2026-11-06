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

/**
 * Known author/editor disclosures already embedded in published lesson BODY.
 * These specifically say that the story, worksheet or poem is original
 * Dadyoom enrichment rather than the Ministry textbook's source text.
 * A text not matching the phrases is NEVER certified by this predicate.
 */
const explicitNonMinistryDisclosures = [
  /ليست?\s+نص\s+الكتاب\s+الرسمي/u,
  /لا\s+يمثل(?:ان)?\s+قصيد[هة]\s+الكتاب\s+الوزاري/u,
  /ليس\s+نقلا\s+من\s+كتاب\s+الوزار[هة]/u,
  /هذا\s+اثراء\s+تعليمي\s+اصلي\s+من\s+ضاديوم/u,
  /ليست?\s+من\s+نص\s+الكتاب\s+الرسمي/u,
];

function normalizedArabicText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/ـ/gu, "")
    .replace(/[إأآٱ]/gu, "ا")
    .replace(/ى/gu, "ي");
}

export function hasExplicitNonMinistryContentNotice(content: unknown): boolean {
  if (typeof content !== "string" || content.length === 0) return false;
  const normalized = normalizedArabicText(content);
  return explicitNonMinistryDisclosures.some((pattern) => pattern.test(normalized));
}

export function needsSourcePublicationReview(
  instructions: unknown,
  content?: unknown,
): boolean {
  const flagInInstructions = Array.isArray(instructions) && instructions.some((entry) => {
    const value = record(entry);
    return value?.kind === "dadyoom_source" && value.source_publication_ready === false;
  });
  return flagInInstructions || hasExplicitNonMinistryContentNotice(content);
}

export function publicLessonDescription(
  summary: string | null | undefined,
  instructions: unknown,
  content?: unknown,
): string {
  if (needsSourcePublicationReview(instructions, content)) return REVIEW_REQUIRED_DESCRIPTION;
  return summary?.trim() ?? "";
}
