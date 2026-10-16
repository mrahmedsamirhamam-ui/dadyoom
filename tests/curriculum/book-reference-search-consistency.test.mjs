import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { BOOK_REFERENCE_IDS, isBookReference, isKnownBookReferenceId } from "../../lib/curriculum/verified-book-reference";

const search = readFileSync("app/api/lessons/search/route.ts", "utf8");
const ui = readFileSync("components/search/LessonSearchClient.tsx", "utf8");

describe("Search results never turn national book cards into real lessons", () => {
  test("the 30 verified book card IDs remain book references regardless of text length", () => {
    const ids = Object.values(BOOK_REFERENCE_IDS).flat();
    expect(ids).toHaveLength(30);
    for (const id of ids) expect(isKnownBookReferenceId(id)).toBe(true);
    expect(isKnownBookReferenceId("00000000-0000-4000-8000-000000000000")).toBe(false);
  });

  test("Yemen non-empty book descriptions are classified as references, not lessons", () => {
    expect(isBookReference({
      countryCode: "YE",
      unitTitle: "اللغة العربية — حزمة الكتب الرسمية",
      lessonTitle: "النحو والصرف — الجزء الأول",
    })).toBe(true);
    expect(isBookReference({
      countryCode: "YE",
      unitTitle: "اللغة العربية — الدروس",
      lessonTitle: "النحو والصرف — الجزء الأول",
    })).toBe(false);
    expect(search).toContain("isKnownBookReferenceId(item.id)");
    expect(search).toContain("isBookReference({");
    expect(search).toContain("unitTitle: unit.title");
    expect(search).toContain("lessonTitle: item.title");
    expect(search.indexOf("isKnownBookReferenceId(item.id)")).toBeLessThan(
      search.indexOf("isCurriculumScopeRecord({ summary: item.summary, content: item.content })"));
  });

  test("student sees source reference, not a lesson or fabricated learning deficiency", () => {
    expect(ui).toContain("مرجع كتاب — ليس درسًا مستقلًا");
    expect(ui).toContain("اطّلع على مرجع الكتاب وحالة التوثيق");
    expect(ui).not.toContain("مرجع بلا نص تعليمي");
  });
});
