import { describe, expect, it } from "vitest";
import { nominalVerbalSentencesDemo as lesson } from "@/features/adaptive-learning/examples/nominal-verbal-sentences-demo";
import { validateUnifiedObjective } from "@/features/adaptive-learning/services/unified-objective-contract";
import { recommendObjectivePath } from "@/features/adaptive-learning/services/recommend-objective-path";
import { assessObjectiveEvidence, type MasteryEvidence } from "@/features/adaptive-learning/services/evidence-based-mastery";

const at = "2026-11-07T10:00:00Z";
function attempt(itemId: string, isCorrect = true): MasteryEvidence {
  return {
    objectiveId: lesson.id, itemId, sessionId: "s1",
    occurredAt: at, kind: "independent", isCorrect,
    gradedBy: "server", reviewedItem: true, hintCount: 0,
  };
}

describe("nominal/verbal sentence lesson: same measurable objective", () => {
  it("provides three checked strategies and three assessments for one stable id", () => {
    expect(validateUnifiedObjective(lesson)).toEqual([]);
    expect(lesson.strategies.map(x => x.id)).toEqual(["visual","inquiry","creative"]);
    expect(lesson.assessments.map(x => x.tier)).toEqual(["support","application","challenge"]);
    expect(new Set([
      ...lesson.assessments.map(x => x.learningObjectiveId),
      ...lesson.strategies.map(x => x.learningObjectiveId),
    ])).toEqual(new Set([lesson.id]));
  });

  it("uses hints only for formative scaffolding and human review for created answers", () => {
    expect(lesson.assessments[0].formativeHint).toBeTruthy();
    expect(lesson.assessments[1].formativeHint).toBeUndefined();
    expect(lesson.assessments[2].formativeHint).toBeUndefined();
    expect(lesson.assessments[2]).toMatchObject({
      responseMode: "constructed_response", requiresHumanReview: true,
    });
  });

  it("includes the grammatical edge case: nominal sentence with verbal predicate", () => {
    const content = JSON.stringify(lesson);
    expect(content).toContain("الطلابُ يستمعونَ");
    expect(content).toContain("الجملة الفعلية");
    expect(content).toContain("الطالبُ يقرأُ");
  });

  it("routes missing evidence to scaffold, not a false mastery claim", () => {
    const outcome = assessObjectiveEvidence(lesson.id, [], at);
    const next = recommendObjectivePath(lesson, outcome);
    expect(next.assessmentTier).toBe("support");
    expect(next.strategy).toBe("visual");
    expect(next.canClaimValidatedMastery).toBe(false);
  });

  it("a perfect unspaced attempt still requires another session", () => {
    const outcome = assessObjectiveEvidence(lesson.id, [
      attempt("1"), attempt("2"), attempt("3"), attempt("4"),
      { ...attempt("5"), kind: "transfer" },
    ], at);
    expect(outcome.action).toBe("schedule_independent_check");
    expect(outcome.canClaimValidatedMastery).toBe(false);
  });

  it("students may switch explanation modality without earning higher-tier grades", () => {
    const outcome = assessObjectiveEvidence(lesson.id, [], at);
    const next = recommendObjectivePath(lesson, outcome, "creative");
    expect(next.strategy).toBe("creative");
    expect(next.assessmentTier).toBe("support");
  });

  it("never marks curriculum accreditation without a verified source", () => {
    expect(lesson.curriculumAlignments).toEqual([]);
  });
});
