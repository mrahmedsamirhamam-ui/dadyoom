import { describe, expect, it } from "vitest";
import {
  checkDictation,
  DICTATION_LEVELS,
  DICTATION_TASKS,
  normalizeDictation,
} from "@/lib/arabic-lab/dictation";

describe("Arabic Smart Lab guided dictation", () => {
  it("offers original graded enrichment tasks in three levels", () => {
    expect(Object.keys(DICTATION_LEVELS)).toEqual(["foundation", "building", "challenge"]);
    for (const tasks of Object.values(DICTATION_TASKS)) {
      expect(tasks).toHaveLength(3);
      for (const task of tasks) {
        expect(task.sentence.length).toBeGreaterThan(10);
        expect(task.explanation.length).toBeGreaterThan(15);
        expect(task.hint).not.toContain(task.sentence);
      }
    }
  });

  it("ignores optional vowel marks, punctuation and spacing", () => {
    expect(normalizeDictation("  ذهبتُ  إلى المدرسة. ")).toBe("ذهبت إلى المدرسة");
    expect(checkDictation("ذهبت إلى المدرسة", "ذهبتُ إلى المدرسة.").correct).toBe(true);
  });

  it("preserves real spelling distinctions in Arabic", () => {
    expect(checkDictation("اقرأ كتابا مفيدا", "أقرأ كتابًا مفيدًا.").correct).toBe(false);
    expect(checkDictation("ذهبت إلى المدرسه", "ذهبت إلى المدرسة.").correct).toBe(false);
    expect(checkDictation("وصل الفتي إلى الحديقة", "وصل الفتى إلى الحديقة.").correct).toBe(false);
  });

  it("returns helpful word positions without assigning an official grade", () => {
    expect(checkDictation("ذهبت إلى المدرسه", "ذهبت إلى المدرسة.").differences).toEqual([
      { position: 3, expected: "المدرسة", actual: "المدرسه" },
    ]);
    expect(checkDictation("", "أقرأ كتابًا مفيدًا.").correct).toBe(false);
  });
});
