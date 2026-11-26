import { describe, expect, it } from "vitest";
import { alignLearningEvidence, meaningfulLearningTerms } from "../../lib/lesson-learning/goal-evidence";

describe("lesson goal to evidence guard", () => {
  it("normalizes Arabic diacritics and common inflections", () => {
    const terms = meaningfulLearningTerms("أن يحلّل الطالب صورتين فنيتين في القصيدة");
    expect(terms).toContain("صور");
    expect(terms).toContain("فني");
    expect(terms).toContain("قصيد");
  });

  it("matches questions to the correct goal irrespective of input order", () => {
    const goals = [
      "أن يستنتج الطالب الفكرة العامة للقصيدة",
      "أن يحلل الطالب الصور الفنية في قصيدة المخترع",
    ];
    const questions = [
      "ما دلالة الصور الفنية في قصيدة المخترع؟",
      "ما الفكرة العامة للقصيدة؟",
    ];
    expect(alignLearningEvidence(goals, questions)).toEqual([1, 0]);
  });

  it("never presents an unrelated grammar question as poetry mastery evidence", () => {
    expect(alignLearningEvidence(
      ["أن يستنتج الطالب الفكرة العامة للقصيدة"],
      ["ما علامة رفع الفعل المضارع المعتل الآخر؟"],
    )).toEqual([null]);
  });

  it("does not reuse a single question for multiple goals", () => {
    expect(alignLearningEvidence(
      ["أن يحدد الطالب الفكرة العامة للقصيدة", "أن يستنتج الطالب الفكرة العامة للقصيدة"],
      ["ما الفكرة العامة للقصيدة؟"],
    )).toEqual([0, null]);
  });

  it("fails closed for vague matches and empty content", () => {
    expect(alignLearningEvidence(["أن يصنف الطالب الأفعال المتعدية"], ["صنف الأفعال"])).toEqual([null]);
    expect(alignLearningEvidence(["", "أن يعرف الدرس"], ["", ""])).toEqual([null, null]);
  });

  it("never validates curricular source, grades, or saves personal data", () => {
    const noEvidence = alignLearningEvidence(["أن يكتب الطالب فقرة سردية"], []);
    expect(noEvidence).toEqual([null]);
  });
});
