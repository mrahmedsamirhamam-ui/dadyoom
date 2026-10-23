import { describe, expect, it } from "vitest";
import { buildResearchOutline, formatReferenceDraft } from "../../lib/research-academy/outline";

describe("research academy", () => {
  it("creates a scaffold only from user supplied facts", () => {
    const result = buildResearchOutline({
      topic: "التعلم النشط في العربية",
      problem: "تفاوت المشاركة",
      objective: "دراسة المشاركة",
      questions: "كيف تتغير المشاركة؟\nما العوائق؟",
      method: "mixed",
      population: "طلاب الصف التاسع",
    });
    expect(result.title).toBe("التعلم النشط في العربية");
    expect(result.sections.find((section) => section.title.includes("أسئلة"))?.draft)
      .toContain("2. ما العوائق؟");
    expect(result.sections.find((section) => section.title.includes("النتائج"))?.draft)
      .toContain("بعد إجراء البحث");
  });

  it("does not fabricate an author or reference", () => {
    const result = formatReferenceDraft({ type: "article", author: "", year: "2024", title: "بحث", publisher: "مجلة", url: "" });
    expect(result.errors).toContain("أدخل المؤلف أو المؤسسة المسؤولة.");
    expect(result.text).toBe("");
  });

  it("rejects invalid links and year and accepts real entered metadata", () => {
    const base = { type: "article" as const, author: "الباحث", year: "2020", title: "عنوان", publisher: "المجلة" };
    expect(formatReferenceDraft({ ...base, url: "javascript:alert(1)" }).errors.length).toBeGreaterThan(0);
    expect(formatReferenceDraft({ ...base, year: "3020", url: "" }).errors.length).toBeGreaterThan(0);
    const formatted = formatReferenceDraft({ ...base, url: "https://example.org/article" });
    expect(formatted.errors).toEqual([]);
    expect(formatted.text).toContain("https://example.org/article");
  });
});
