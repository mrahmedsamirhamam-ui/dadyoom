import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("Bahrain G2/G3 term-1 audit reflects later live content without claiming official TOC parity", () => {
  const audit = JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json", "utf8"));
  for (const [grade, prior, current, added] of [[2,40,44,4],[3,24,30,6]]) {
    const book = audit.books.find((row) =>
      row.program === "التعليم الأساسي" &&
      row.grade === grade &&
      row.semesterOrBookPart === 1
    );
    expect(book).toBeDefined();
    expect(book.importedItems).toBe(current);
    expect(book.scheduledItems).toBe(current);
    expect(book.liveSnapshotReconciliation.previousPublishedLessonCount).toBe(prior);
    expect(book.liveSnapshotReconciliation.currentPublishedLessonCount).toBe(current);
    expect(book.liveSnapshotReconciliation.addedLessonTitles).toHaveLength(added);
    expect(book.liveSnapshotReconciliation.tocValidated).toBe(false);
    expect(book.status).toBe("BOOK_FOUND_PENDING_TOC");
    expect(book.bookTotalTOCItems).toBeNull();
  }
  expect(audit.summary.completeBooks).toBe(0);
  expect(audit.summary.bahrainComplete).toBe(false);
});
