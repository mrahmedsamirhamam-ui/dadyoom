/** Explicitly reviewed enrichment links only. Never infer an official syllabus match. */
export type CurriculumReadingLink = {
  countryCode: string;
  grade: number;
  lessonId: string;
  bookId: string;
  reviewEvidence: string;
  reviewedBy: string;
  status: "reviewed-enrichment";
};

/** Empty until lesson identifiers and human review evidence are verified. */
export const curriculumReadingLinks: readonly CurriculumReadingLink[] = [];

export function isReviewedCurriculumLink(link: CurriculumReadingLink, knownBookIds: ReadonlySet<string>): boolean {
  return /^[A-Z]{2}$/.test(link.countryCode) &&
    Number.isInteger(link.grade) && link.grade >= 1 && link.grade <= 12 &&
    Boolean(link.lessonId.trim() && link.reviewEvidence.trim() && link.reviewedBy.trim()) &&
    knownBookIds.has(link.bookId) && link.status === "reviewed-enrichment";
}
