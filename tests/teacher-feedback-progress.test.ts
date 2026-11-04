import { describe, expect, it } from "vitest";

import {
  evaluateFeedbackRecheck,
  type FeedbackRecheck,
} from "@/features/teacher-feedback/feedback-progress";

const baseline: FeedbackRecheck = {
  baselineCorrect: 2,
  baselineTotal: 5,
  recheckCorrect: 4,
  recheckTotal: 5,
  recheckEvidence: "أجاب عن أربعة أسئلة جديدة واستشهد بجملة من النص.",
  comparable: true,
};

describe("formative recheck without unverified mastery claims", () => {
  it("computes percentage-point change only with comparable tasks and real evidence", () => {
    const result = evaluateFeedbackRecheck(baseline);
    expect(result.ready).toBe(true);
    expect(result.state).toBe("improved");
    expect(result.gainPercentagePoints).toBe(40);
    expect(result.summary).toContain("نقطة مئوية");
    expect(result.summary).toContain("ليست دليلًا منفردًا على إتقان دائم");
    expect(result.exportText).toContain("استمر في التدريب");
  });

  it("rejects unequal criteria without teacher confirmation", () => {
    const result = evaluateFeedbackRecheck({ ...baseline, comparable: false });
    expect(result.state).toBe("not-comparable");
    expect(result.ready).toBe(false);
    expect(result.gainPercentagePoints).toBeNull();
    expect(result.exportText).toBe("");
  });

  it("refuses false improvement if after-evidence is absent", () => {
    const result = evaluateFeedbackRecheck({ ...baseline, recheckEvidence: "" });
    expect(result.state).toBe("missing");
    expect(result.ready).toBe(false);
    expect(result.gainPercentagePoints).toBeNull();
  });

  it("refuses impossible, negative, fractional and partial scores", () => {
    for (const override of [
      { recheckCorrect: 6, recheckTotal: 5 },
      { baselineCorrect: -1 },
      { recheckCorrect: 1.5 },
      { baselineTotal: 0 },
      { recheckTotal: null },
      { baselineCorrect: null },
    ]) {
      const result = evaluateFeedbackRecheck({ ...baseline, ...override });
      expect(result.ready).toBe(false);
      expect(result.exportText).toBe("");
    }
  });

  it("does not confuse a decline or unchanged result with progress", () => {
    const decline = evaluateFeedbackRecheck({ ...baseline, recheckCorrect: 1 });
    expect(decline.state).toBe("lower");
    expect(decline.gainPercentagePoints).toBe(-20);
    expect(decline.nextAction).toContain("راجع تكافؤ المهمتين");

    const unchanged = evaluateFeedbackRecheck({ ...baseline, recheckCorrect: 2 });
    expect(unchanged.state).toBe("unchanged");
    expect(unchanged.gainPercentagePoints).toBe(0);
  });

  it("expresses normalized percentage-point gain when counts differ", () => {
    const result = evaluateFeedbackRecheck({
      ...baseline, baselineCorrect: 1, baselineTotal: 4, recheckCorrect: 2, recheckTotal: 4,
    });
    expect(result.ready).toBe(true);
    expect(result.gainPercentagePoints).toBe(25);
  });
});
