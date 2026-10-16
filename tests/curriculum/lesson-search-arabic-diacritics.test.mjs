import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { lessonTitleSearchPattern } from "../../lib/curriculum/arabic-title-search";

const route = readFileSync("app/api/lessons/search/route.ts", "utf8");
const ui = readFileSync("components/search/LessonSearchClient.tsx", "utf8");

describe("The student search lens matches vowelled and unvowelled Arabic titles", () => {
  test("plain Arabic matches title vowel marks anywhere between letters", () => {
    const pattern = lessonTitleSearchPattern("القراءة");
    expect(pattern).toBeTruthy();
    expect(new RegExp(pattern, "iu").test("الدّرس الأوّل أُراجِّعُ القِّراءَةَ")).toBe(true);
    expect(new RegExp(pattern, "iu").test("القراءة: النص")).toBe(true);
    expect(new RegExp(pattern, "iu").test("الكتابة")).toBe(false);
  });

  test("student can search a phrase with marks, spaces and punctuation", () => {
    const pattern = lessonTitleSearchPattern("  أَقْسَامُ  الكلام  ");
    expect(pattern).toBeTruthy();
    expect(new RegExp(pattern, "iu").test("أقسامُ الكلامِ")).toBe(true);
    expect(new RegExp(lessonTitleSearchPattern("حرف (ب)")!, "iu").test("حرف (ب)")).toBe(true);
  });

  test("regex syntax is escaped, oversized and wildcard queries are rejected", () => {
    const metacharacters = lessonTitleSearchPattern("درس .+");
    expect(metacharacters).toContain("\\.");
    expect(metacharacters).toContain("\\+");
    expect(new RegExp(metacharacters!, "iu").test("درس .+")).toBe(true);
    expect(new RegExp(metacharacters!, "iu").test("درس عظيم")).toBe(false);
    expect(lessonTitleSearchPattern("َُ")).toBeNull();
    expect(lessonTitleSearchPattern("دروس%")).toBeNull();
    expect(lessonTitleSearchPattern("ت".repeat(81))).toBeNull();
  });

  test("real published lessons and grade/country/RLS restrictions remain", () => {
    expect(route).toContain('.from("lessons")');
    expect(route).toContain('.eq("status", "published")');
    expect(route).toContain('.filter("title", "imatch", titlePattern)');
    expect(route).toContain("units.grades.curricula.countries.code");
    expect(route).toContain("units.grades.grade_number");
    expect(route).toContain("hasMore: rows.length > pageSize");
    expect(ui).toContain("لا تحتاج إلى كتابة التشكيل");
    expect(route).not.toContain("service_role");
  });
});
