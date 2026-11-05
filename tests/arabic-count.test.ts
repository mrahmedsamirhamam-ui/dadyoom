import { describe, expect, it } from "vitest";
import { formatArabicCount } from "@/lib/i18n/arabic-count";

describe("Arabic count labels", () => {
  it("uses the requested Arabic forms", () => {
    expect(formatArabicCount(12, "grade")).toBe("12 صفًّا");
    expect(formatArabicCount(13, "grade")).toBe("13 صفًّا");
    expect(formatArabicCount(3, "lesson")).toBe("3 دروس");
    expect(formatArabicCount(11, "lesson")).toBe("11 درسًا");
  });
  it("handles zero, one and two without awkward literal number+noun", () => {
    expect(formatArabicCount(0, "lesson")).toBe("لا دروس");
    expect(formatArabicCount(1, "lesson")).toBe("درس واحد");
    expect(formatArabicCount(2, "lesson")).toBe("درسان");
    expect(formatArabicCount(7, "day")).toBe("7 أيام");
  });
  it("rejects invalid count inputs", () => {
    expect(() => formatArabicCount(-1, "grade")).toThrow();
    expect(() => formatArabicCount(1.5, "lesson")).toThrow();
  });
});
