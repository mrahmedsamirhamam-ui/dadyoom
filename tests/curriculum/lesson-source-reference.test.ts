import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { describeLessonSourceReference } from "../../lib/curriculum/lesson-source-reference";

describe("Bahrain lesson source labels must not confuse plans with textbooks", () => {
  test("2026/27 term-one ministry plan is labelled as a plan, NOT original textbook", () => {
    const result = describeLessonSourceReference("https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf");
    expect(result.kind).toBe("current-plan");
    expect(result.linkLabel).toContain("خطة توزيع");
    expect(result.editionYear).toBe("2026-2027");
    expect(result.detail).toContain("ليس صفحات الكتاب");
    expect(result.caution).toBe(false);
  });
  test("2025/26 semester-two plan is clearly labelled historical without removing the lesson", () => {
    const result = describeLessonSourceReference("https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf");
    expect(result.kind).toBe("historical-plan");
    expect(result.linkLabel).toContain("الفصل الثاني");
    expect(result.editionYear).toBe("2025-2026");
    expect(result.detail).toContain("2026-2027");
    expect(result.caution).toBe(true);
  });
  test("catalog, ebook viewer, and unrelated links are never called certified textbook page", () => {
    expect(describeLessonSourceReference("https://edunet.bh/manual/books2026/books1.pdf").kind).toBe("book-catalog");
    expect(describeLessonSourceReference("https://www.edunet.bh/e_content/a/b/e_books/Baraem/index.html").kind).toBe("ebook-viewer");
    expect(describeLessonSourceReference("https://other.example/manual/plans1-2026-2027/Arabic/Plan1.pdf").kind).toBe("other");
    expect(describeLessonSourceReference("javascript:alert(1)").kind).toBe("other");
  });
  test("rendered lesson links use source-specific label, external link safety, and provenance text", () => {
    const page=readFileSync("app/lessons/[id]/page.tsx","utf8");
    expect(page).toContain("describeLessonSourceReference(lesson.source_pdf_url)");
    expect(page).toContain("sourceReference.linkLabel");
    expect(page).toContain("sourceReference.detail");
    expect(page).toContain('rel="noopener noreferrer"');
    expect(page).not.toContain("فتح صفحات الدرس في الكتاب الأصلي");
  });
});
