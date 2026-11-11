import { describe, expect, it } from "vitest";
import { curriculumReadingLinks, isReviewedCurriculumLink, type CurriculumReadingLink } from "./curriculum-links";
import { ownerBookCandidates } from "./books";

describe("curriculum reading link evidence gate", () => {
  const ids = new Set(ownerBookCandidates.map((book) => book.id));
  const valid: CurriculumReadingLink = {
    countryCode: "BH", grade: 3, lessonId: "reviewed-lesson",
    bookId: ownerBookCandidates[0].id, reviewEvidence: "manual review record",
    reviewedBy: "teacher", status: "reviewed-enrichment",
  };
  it("does not publish invented lesson mappings", () => {
    expect(curriculumReadingLinks).toEqual([]);
  });
  it("requires known books, country, grade and human review evidence", () => {
    expect(isReviewedCurriculumLink(valid, ids)).toBe(true);
    expect(isReviewedCurriculumLink({ ...valid, bookId: "unknown" }, ids)).toBe(false);
    expect(isReviewedCurriculumLink({ ...valid, reviewEvidence: " " }, ids)).toBe(false);
    expect(isReviewedCurriculumLink({ ...valid, reviewedBy: "" }, ids)).toBe(false);
    expect(isReviewedCurriculumLink({ ...valid, lessonId: "" }, ids)).toBe(false);
    expect(isReviewedCurriculumLink({ ...valid, grade: 13 }, ids)).toBe(false);
    expect(isReviewedCurriculumLink({ ...valid, countryCode: "Bahrain" }, ids)).toBe(false);
  });
});
