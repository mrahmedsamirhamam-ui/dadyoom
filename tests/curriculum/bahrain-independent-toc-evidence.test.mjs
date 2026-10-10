import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { independentTocValidation } from "../../scripts/lib/independent-toc-evidence.mjs";

const lesson1 = "e8f6a2ca-14bd-4663-b496-f31f13742f1f";
const lesson2 = "e8f6a2ca-14bd-4663-b496-f31f13742f20";
const validRow = () => ({
  currentBookCatalogVerified: true,
  bookTotalTOCItems: 2,
  matchedTOCItems: 2,
  missingItems: 0,
  independentTocEvidence: {
    academicYear: "2026-2027",
    reviewedAt: "2026-10-10",
    reviewedBy: "Qualified reviewer",
    scopeBookTitlesVerified: true,
    scopeBookTitles: ["Book part 1"],
    books: [{
      title: "Book part 1",
      editionYear: "2026-2027",
      tocSourceUrl: "https://www.edunet.bh/e_content/official/book/index.html",
      sourceSha256: "a".repeat(64),
      reviewedBy: "Qualified reviewer",
      reviewedAt: "2026-10-10",
      items: [
        {tocKey:"unit1-p10",title:"Lesson one",page:10,matchedLessonId:lesson1,matchedLessonTitle:"Lesson one",matchReviewedBy:"Reviewer",matchReviewedAt:"2026-10-10"},
        {tocKey:"unit1-p12",title:"Lesson two",page:12,matchedLessonId:lesson2,matchedLessonTitle:"Lesson two",matchReviewedBy:"Reviewer",matchReviewedAt:"2026-10-10"}
      ]
    }]
  }
});
test("full structured evidence can qualify; aggregate counts alone can never qualify", () => {
  expect(independentTocValidation(validRow()).valid).toBe(true);
  const noToc=validRow();
  delete noToc.independentTocEvidence;
  expect(independentTocValidation(noToc).valid).toBe(false);
});
test("duplicate mapping, spoofed plan source, and unverifiable book edition are blocked", () => {
  const dup=validRow();
  dup.independentTocEvidence.books[0].items[1].matchedLessonId=lesson1;
  expect(independentTocValidation(dup).valid).toBe(false);
  const plan=validRow();
  plan.independentTocEvidence.books[0].tocSourceUrl="https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf";
  expect(independentTocValidation(plan).valid).toBe(false);
  const catalog=validRow();
  catalog.independentTocEvidence.books[0].tocSourceUrl="https://edunet.bh/manual/books2026/books1.pdf";
  expect(independentTocValidation(catalog).valid).toBe(false);
  const wrongYear=validRow();
  wrongYear.independentTocEvidence.books[0].editionYear="2025-2026";
  expect(independentTocValidation(wrongYear).valid).toBe(false);
  const noReviewer=validRow();
  noReviewer.independentTocEvidence.books[0].items[0].matchReviewedBy="";
  expect(independentTocValidation(noReviewer).valid).toBe(false);
});
test("all 56 live audit scopes stay unverified, never promoted by count alone", () => {
  const data=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json","utf8"));
  expect(data.books).toHaveLength(56);
  expect(data.books.filter(row=>row.status==="COMPLETE_BOOK")).toHaveLength(0);
  expect(data.books.filter(row=>independentTocValidation(row,data.academicYear).valid)).toHaveLength(0);
});
