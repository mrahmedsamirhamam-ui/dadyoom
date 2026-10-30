import { describe, expect, it } from "vitest";
import { ARABIC_LIFE_UNITS, getArabicLifeUnit } from "@/lib/arabic-for-life/units";

describe("Arabic for Life original A1 pilot", () => {
  it("includes three accessible independent dialogue scenarios", () => {
    expect(ARABIC_LIFE_UNITS).toHaveLength(3);
    expect(new Set(ARABIC_LIFE_UNITS.map((unit) => unit.id)).size).toBe(3);
    for (const unit of ARABIC_LIFE_UNITS) {
      expect(unit.outcome.length).toBeGreaterThan(35);
      expect(unit.dialogue.length).toBeGreaterThanOrEqual(5);
      expect(unit.vocabulary.length).toBeGreaterThanOrEqual(3);
      expect(unit.guidedRoleplay.length).toBeGreaterThan(20);
      expect(unit.independentRoleplay.length).toBeGreaterThan(20);
      expect(unit.writingTask.length).toBeGreaterThan(20);
      expect(unit.durationMinutes).toBeGreaterThan(0);
    }
  });

  it("keeps question IDs unique with valid answer options and formative hints", () => {
    const allQuestions = ARABIC_LIFE_UNITS.flatMap((unit) => unit.questions);
    expect(allQuestions.length).toBeGreaterThanOrEqual(6);
    expect(new Set(allQuestions.map((q) => q.id)).size).toBe(allQuestions.length);
    for (const question of allQuestions) {
      expect(question.choices).toHaveLength(3);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.choices[question.correctIndex]).toBeTruthy();
      expect(question.hint.length).toBeGreaterThan(15);
      expect(question.explanation.length).toBeGreaterThan(15);
    }
  });

  it("resolves only published pilot IDs; does not invent lessons", () => {
    expect(getArabicLifeUnit("shopping")?.title).toBe("في المتجر");
    expect(getArabicLifeUnit("missing")).toBeUndefined();
  });
});
