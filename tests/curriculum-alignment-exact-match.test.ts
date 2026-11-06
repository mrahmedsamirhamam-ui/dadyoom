import { describe, expect, it } from "vitest";
import { subjectPredicateDemo } from "@/features/adaptive-learning/examples/subject-predicate-demo";
import { resolveCurriculumAlignment } from "@/features/adaptive-learning/services/resolve-curriculum-alignment";
import type { CurriculumAlignment } from "@/features/adaptive-learning/services/unified-objective-contract";

const verified: CurriculumAlignment = {
  system: "national", code: "AR-TEST-001", countryCode: "BH",
  sourceVersion: "sample-year-1",
  sourceUrl: "https://example.invalid/mock-official-reference",
  verified: true,
};
const reviewed = { ...subjectPredicateDemo, curriculumAlignments: [verified] };

describe("multi-curriculum guard against invented equivalence", () => {
  it("never guesses mappings from a lesson title or grade", () => {
    const result = resolveCurriculumAlignment(subjectPredicateDemo, {
      system: "national", code: "AR-TEST-001", countryCode: "BH",
      sourceVersion: "sample-year-1",
    });
    expect(result).toEqual({ available: false, reason: "no_exact_verified_alignment" });
  });
  it("matches only reviewed country, syllabus code and exact year", () => {
    const wanted = {
      system: "national" as const, code: "AR-TEST-001",
      countryCode: "BH", sourceVersion: "sample-year-1",
    };
    expect(resolveCurriculumAlignment(reviewed, wanted)).toEqual({
      available: true, learningObjectiveId: subjectPredicateDemo.id,
      lessonId: subjectPredicateDemo.lessonId, alignment: verified,
    });
    for (const fail of [
      { ...wanted, countryCode: "AE" },
      { ...wanted, sourceVersion: "different-year" },
      { ...wanted, code: "ANOTHER" },
      { ...wanted, system: "cambridge" as const },
    ]) {
      expect(resolveCurriculumAlignment(reviewed, fail).available).toBe(false);
    }
  });
  it("unverified and unapproved mappings never pass", () => {
    expect(resolveCurriculumAlignment({
      ...subjectPredicateDemo, editoriallyApproved: false,
      curriculumAlignments: [verified],
    }, { system: "national", code: "AR-TEST-001", countryCode: "BH", sourceVersion: "sample-year-1" }))
      .toEqual({ available: false, reason: "not_reviewed" });
    expect(resolveCurriculumAlignment({
      ...subjectPredicateDemo,
      curriculumAlignments: [{ ...verified, verified: false }],
    }, { system: "national", code: "AR-TEST-001", countryCode: "BH", sourceVersion: "sample-year-1" }).available)
      .toBe(false);
  });
});
