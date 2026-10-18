import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
const review = readFileSync("app/admin/curriculum/coverage/toc-review/page.tsx", "utf8");

describe("Bahrain official textbook and lesson-plan lookup sources", () => {
  test("teacher reviewers can open both government education portal guides", () => {
    expect(review).toContain("https://www.edunet.bh/Econtent/BooksGuide");
    expect(review).toContain("https://www.edunet.bh/Econtent/LessonsGuide");
    expect(review).toContain('target="_blank" rel="noopener noreferrer"');
  });
  test("links do not change the independent official-book TOC approval rules", () => {
    expect(review).toContain("لا يثبتان نص الكتاب أو فهرسه تلقائيًا");
    expect(review).toContain("فحص عناوين فهرسه وصفحاته بنفسك قبل الاعتماد");
    expect(review).toContain("submitBookTocEvidence");
    expect(review).toContain("رابط خطة التدريس أو دليل أسماء الكتب لا يكفي وحده");
  });
});
