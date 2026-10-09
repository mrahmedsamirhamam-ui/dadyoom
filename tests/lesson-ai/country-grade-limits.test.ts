import { describe, expect, it } from "vitest";
import {
  isValidGradeForCountry,
  maxGradeForCountry,
  thirteenthGradeArabicLabel,
} from "../../lib/student/country-grade-limits";

describe("country grade limits", () => {
  it("allows school grade 13 for both Tunisia and Mauritania", () => {
    expect(maxGradeForCountry("TN")).toBe(13);
    expect(maxGradeForCountry("MR")).toBe(13);
    expect(isValidGradeForCountry(13, "TN")).toBe(true);
    expect(isValidGradeForCountry(13, "MR")).toBe(true);
  });
  it("preserves 12-grade limits elsewhere and rejects malformed grades", () => {
    expect(maxGradeForCountry("BH")).toBe(12);
    expect(maxGradeForCountry("EG")).toBe(12);
    expect(isValidGradeForCountry(13, "BH")).toBe(false);
    expect(isValidGradeForCountry(0, "TN")).toBe(false);
    expect(isValidGradeForCountry(13.5, "TN")).toBe(false);
    expect(isValidGradeForCountry(Number.NaN, "TN")).toBe(false);
  });
  it("uses the correct secondary-year label for each country", () => {
    expect(thirteenthGradeArabicLabel("TN")).toContain("تونس");
    expect(thirteenthGradeArabicLabel("MR")).toContain("موريتانيا");
  });
});
