import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const page = readFileSync("app/admin/curriculum/page.tsx", "utf8");
const match = page.match(/const weakCoveragePattern =\s*\/\(([^)]+)\)\/iu;/u);
if (!match) throw new Error("National secondary coverage guard missing");
const weak = new RegExp(match[1], "iu");
const qualifies = (labels) =>
  labels.length > 0 && labels.every((label) =>
    label.includes("detailed") && !weak.test(label));

describe("22-country curriculum status must not claim complete from partial scope", () => {
  test("Bahrain's verified term-one detail and current-book term-two remain pending", () => {
    expect(qualifies([
      "detailed-current-s1-plus-current-book-s2",
      "detailed-current-s1-nonstandard-levels",
    ])).toBe(false);
  });
  test("book bundle, unverified and generic grade-level material stay pending", () => {
    for (const status of [
      "partial-detailed-grade-scoped",
      "generic-book-bundle-grade-scoped",
      "book-level-current-grade-scoped",
      "mixed-detailed-current-semester-1",
      "awaiting-current-official-detail",
    ]) expect(qualifies([status])).toBe(false);
  });
  test("mixed statuses cannot be promoted when one track is incomplete", () => {
    expect(qualifies(["detailed", "partial-detailed-grade-scoped"])).toBe(false);
  });
  test("shows live per-term source scopes for all countries without reporting empty queries as zero", () => {
    expect(page).toContain('.from("secondary_track_terms")');
    expect(page).toContain('.eq("academic_year", "2026-2027")');
    expect(page).toContain('.eq("secondary_tracks.is_active", true)');
    expect(page).toContain("const termReadFailed = Boolean(secondaryTermsResult.error)");
    expect(page).toContain("تعذرت قراءة أدلة الفصول الحية");
    expect(page).toContain("countriesWithTermRecords");
    expect(page).toContain("لم يسجل نطاق فصلي مستقل بعد");
    expect(page).toContain("غياب سجل فصل يعني أنه ينتظر توثيقًا منفصلًا");
    expect(page).toContain("دون إعادة استخدام خطط قديمة");
  });
  test("interface explicitly refuses to equate registered curricula with completed books", () => {
    expect(page).toContain("«مدعوم» لا يعني «مكتمل»");
    expect(page).toContain("ليس شهادة مطابقة للكتب");
    expect(page).toContain("جزئي أو غير مثبت");
  });
});
