import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  requireAssessedItems,
  requirePositiveAssessmentPoints,
} from "../../features/student-progress/services/completion-gates";

describe("lesson completion evidence gates", () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects assessment with %s possible points",
    (points) => {
      expect(() => requirePositiveAssessmentPoints(points)).toThrow(
        "لا يمكن إنهاء الدرس"
      );
    }
  );

  it("allows assessment with genuine positive points", () => {
    expect(() => requirePositiveAssessmentPoints(1)).not.toThrow();
    expect(() => requirePositiveAssessmentPoints(20)).not.toThrow();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects missing or invalid number of assessed items: %s",
    (count) => {
      expect(() => requireAssessedItems(count)).toThrow(
        "لا يمكن إنهاء الدرس"
      );
    }
  );

  it("accepts at least one assessed item, without overriding the 90% rule", () => {
    expect(() => requireAssessedItems(1)).not.toThrow();
    expect(() => requireAssessedItems(3)).not.toThrow();
  });

  it("canonical server action actually invokes both fail-closed checks", () => {
    const code = readFileSync(
      resolve(process.cwd(), "features/student-progress/actions/completeLesson.ts"),
      "utf8"
    );
    expect(code).toContain("requirePositiveAssessmentPoints(totalPossible)");
    expect(code).toContain("requireAssessedItems(questionIds.length)");
    expect(code).toMatch(/REQUIRED_MASTERY_SCORE\s*=\s*90/);
    expect(code).toContain("score < REQUIRED_MASTERY_SCORE");
    expect(code).toMatch(/\.eq\(["']is_correct["']\s*,\s*true\)/);
    expect(code).not.toContain("let score = 100");
  });
});
