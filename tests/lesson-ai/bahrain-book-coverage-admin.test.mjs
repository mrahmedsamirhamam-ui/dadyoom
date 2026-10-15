import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const src = p => readFileSync(new URL("../../" + p, import.meta.url), "utf8");
const report = JSON.parse(src("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json"));
test("Bahrain evidence dashboard keeps unverified textbooks pending", () => {
  expect(report.country.code).toBe("BH");
  expect(report.academicYear).toBe("2026-2027");
  expect(report.books).toHaveLength(56);
  expect(report.books.filter(b => b.status === "COMPLETE_BOOK")).toHaveLength(0);
  expect(report.books.filter(b => b.status === "BOOK_FOUND_PENDING_TOC")).toHaveLength(54);
  expect(report.books.filter(b => b.status === "OFFICIAL_BOOK_NOT_FOUND")).toHaveLength(2);
});
test("book coverage audit is visible to admins and has per-book evidence", () => {
  expect(src("app/admin/layout.tsx")).toContain("/admin/curriculum/coverage");
  expect(src("app/admin/page.tsx")).toContain("/admin/curriculum/coverage");
  const route = src("app/admin/curriculum/coverage/page.tsx");
  expect(route).toContain("audit.books");
  expect(route).toContain("row.bookTotalTOCItems");
  expect(route).toContain("row.currentPlanPublished");
  expect(route).toContain("row.currentBookCatalogSource");
  expect(route).toContain("changedScopes.map");
  expect(route).toContain("liveSnapshotReconciliation.deltaPublishedVsPreviousImported");
  expect(route).toContain("ليست عدد دروس مفقودة");
  expect(route).toContain("فرق الصف السابع في الفصل الثاني (-37)");

});

test("nine reconciliation differences are inspection priorities, not missing official chapters", () => {
  const discrepancies = report.books.filter(book =>
    (book.liveSnapshotReconciliation?.deltaPublishedVsPreviousImported ?? 0) !== 0);
  expect(discrepancies).toHaveLength(9);
  const gradeSevenTermTwo = discrepancies.find(book =>
    book.program === "التعليم الأساسي" &&
    book.grade === 7 && book.semesterOrBookPart === 2);
  expect(gradeSevenTermTwo?.liveSnapshotReconciliation.deltaPublishedVsPreviousImported).toBe(-37);
  expect(report.summary.completeBooks).toBe(0);
});
