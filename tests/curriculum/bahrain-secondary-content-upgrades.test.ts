import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const grammar = JSON.parse(readFileSync(
  "data/curriculum-content/bahrain-secondary-12-grammar-lessons-20261019.json",
  "utf8",
));
const writing = JSON.parse(readFileSync(
  "data/curriculum-content/bahrain-secondary-9-writing-lessons-20261019.json",
  "utf8",
));

describe("published Bahrain secondary lessons have distinct, backed-up original content", () => {
  test("21 independently authored lessons across grades 10, 11 and 12", () => {
    expect(grammar.updates).toHaveLength(12);
    expect(writing.updates).toHaveLength(9);
    const all = [...grammar.updates, ...writing.updates];
    expect(new Set(all.map((x: { id: string }) => x.id)).size).toBe(21);
    expect(all.filter((x: { grade: number }) => x.grade === 10)).toHaveLength(6);
    expect(all.filter((x: { grade: number }) => x.grade === 11)).toHaveLength(8);
    expect(all.filter((x: { grade: number }) => x.grade === 12)).toHaveLength(7);
    expect(new Set(all.map((x: { newContent: string }) => x.newContent)).size).toBe(21);
  });

  test("previous content is retained and explanations include actual pedagogy, not boilerplate", () => {
    for (const entry of grammar.updates) {
      expect(entry.previousContent.length).toBeGreaterThan(500);
      expect(entry.newContent.length).toBeGreaterThan(2300);
      expect(entry.newContent).toContain(entry.title);
      expect(entry.newContent).toContain("تنبيه أمانة علمية");
      expect(entry.newContent).toContain("أمثلة محللة");
      expect(entry.newContent).toContain("تطبيق متدرج مع مفاتيح الإجابة");
      expect(entry.newContent).toContain("خطأ شائع");
      expect(entry.newContent).toContain("مسار التحدي");
      expect(entry.newContent).toContain("مهمة إنتاج حقيقية");
      expect(entry.newContent).not.toBe(entry.previousContent);
    }
    for (const entry of writing.updates) {
      expect(entry.previousContent.length).toBeGreaterThan(500);
      expect(entry.newContent.length).toBeGreaterThan(2400);
      expect(entry.newContent).toContain(entry.title);
      expect(entry.newContent).toContain("تنبيه المصدر");
      expect(entry.newContent).toContain("نموذج كتابي أصلي");
      expect(entry.newContent).toContain("مفاتيح الإجابات");
      expect(entry.newContent).toContain("المسارات المتدرجة");
      expect(entry.newContent).toContain("مهمة إنتاج لاكتساب المهارة");
      expect(entry.newContent).not.toBe(entry.previousContent);
    }
  });

  test("every lesson openly distinguishes Dadyoom teaching content from a ministry textbook", () => {
    expect(grammar.country).toBe("BH");
    expect(writing.country).toBe("BH");
    for (const entry of [...grammar.updates, ...writing.updates]) {
      expect(entry.id).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
      expect([10, 11, 12]).toContain(entry.grade);
      expect(entry.newContent).toContain("ضاديوم");
      expect(entry.newContent).toMatch(/الكتاب الوزاري|نص الكتاب/);
      expect(entry.newContent).toMatch(/لا يثبت مطابقة|لا تثبت مطابقة|لا اعتماد رسمي/);
    }
  });
});
