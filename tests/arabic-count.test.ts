import { describe, expect, it } from "vitest";
import { formatArabicCount } from "../lib/i18n/arabic-count";

describe("Arabic cardinal number agreement across all role dashboards", () => {
  it.each([
    [0, "grade", "0 صفوف"],
    [1, "grade", "صف واحد"],
    [2, "grade", "صفان"],
    [3, "lesson", "3 دروس"],
    [10, "skill", "10 مهارات"],
    [11, "lesson", "11 درسًا"],
    [12, "grade", "12 صفًا"],
    [21, "skill", "21 مهارةً"],
    [99, "student", "99 طالبًا"],
    [100, "grade", "100 صف"],
    [101, "grade", "101 صف"],
    [103, "grade", "103 صفوف"],
    [110, "lesson", "110 دروس"],
    [112, "lesson", "112 درسًا"],
    [3, "teacher", "3 معلمين"],
    [10, "teacher", "10 معلمين"],
    [20, "teacher", "20 معلمًا"],
    [3, "school", "3 مدارس"],
  ] as const)("renders %i %s => %s", (count, noun, expected) => {
    expect(formatArabicCount(count, noun)).toBe(expected);
  });

  it("fails loudly on fractional, negative or unsafe input", () => {
    for (const invalid of [-1, 3.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => formatArabicCount(invalid, "lesson")).toThrow(RangeError);
    }
  });
});
