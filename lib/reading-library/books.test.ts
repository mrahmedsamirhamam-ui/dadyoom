import { describe, expect, it } from "vitest";
import { isBookApprovable, ownerBookCandidates, type LibraryBook } from "./books";

describe("owner-authored book catalog safeguards", () => {
  it("contains unique known book IDs and does not claim unverified publication rights", () => {
    expect(ownerBookCandidates).toHaveLength(2);
    expect(new Set(ownerBookCandidates.map((book) => book.id)).size).toBe(ownerBookCandidates.length);
    for (const book of ownerBookCandidates) {
      expect(book.rightsStatus).toBe("غير متحقق منه");
      expect(book.canPublishFullText).toBe(false);
      expect(book.contentUrl).toBeNull();
      expect(book.questions).toEqual([]);
      expect(isBookApprovable(book)).toBe(false);
    }
  });
  it("requires verified rights and two or three reviewed comprehension questions", () => {
    const base = ownerBookCandidates[0];
    const reviewed = (count: number) => Array.from({ length: count }, (_, i) => ({
      id: String(i + 1), prompt: "سؤال فهم كتبه معلم", reviewedBy: "معلم",
    }));
    const candidate: LibraryBook = { ...base, rightsStatus: "موثق", questions: reviewed(2) };
    expect(isBookApprovable(candidate)).toBe(true);
    expect(isBookApprovable({ ...candidate, questions: reviewed(1) })).toBe(false);
    expect(isBookApprovable({ ...candidate, questions: reviewed(4) })).toBe(false);
    expect(isBookApprovable({ ...candidate, rightsStatus: "غير متحقق منه" })).toBe(false);
    expect(isBookApprovable({ ...candidate, questions: [{ id: "1", prompt: "سؤال", reviewedBy: "" }, reviewed(1)[0]] })).toBe(false);
    expect(isBookApprovable({ ...candidate, questions: [{ id: "1", prompt: "سؤال", reviewedBy: "معلم" }, { id: "1", prompt: "سؤال آخر", reviewedBy: "معلم" }] })).toBe(false);
    expect(isBookApprovable({ ...candidate, questions: [{ id: " ", prompt: "سؤال", reviewedBy: "معلم" }, reviewed(1)[0]] })).toBe(false);
  });
});
