import { describe, expect, it } from "vitest";
import { subjectPredicateDemo } from "@/features/adaptive-learning/examples/subject-predicate-demo";
import {
  validateUnifiedObjective,
} from "@/features/adaptive-learning/services/unified-objective-contract";
import {
  recommendObjectivePath,
} from "@/features/adaptive-learning/services/recommend-objective-path";
import {
  assessObjectiveEvidence,
  type MasteryEvidence,
} from "@/features/adaptive-learning/services/evidence-based-mastery";

const objectiveId = subjectPredicateDemo.id;
const first = "2026-11-01T10:00:00.000Z";
const later = "2026-11-03T10:00:00.000Z";
const afterWeek = "2026-11-12T10:00:00.000Z";

function event(itemId: string, patch: Partial<MasteryEvidence> = {}): MasteryEvidence {
  return {
    objectiveId,
    itemId,
    sessionId: "session-1",
    occurredAt: first,
    kind: "independent",
    isCorrect: true,
    gradedBy: "server",
    reviewedItem: true,
    hintCount: 0,
    ...patch,
  };
}

function spacedEvidence(): MasteryEvidence[] {
  return [
    event("1"), event("2"), event("3"),
    event("4", { sessionId: "session-2", occurredAt: later }),
    event("5", { sessionId: "session-2", occurredAt: later, kind: "transfer" }),
  ];
}

describe("one objective, three differentiated paths", () => {
  it("validates exactly three linked explanations and assessments", () => {
    expect(validateUnifiedObjective(subjectPredicateDemo)).toEqual([]);
    expect(subjectPredicateDemo.strategies).toHaveLength(3);
    expect(subjectPredicateDemo.assessments).toHaveLength(3);
    for (const entry of [
      ...subjectPredicateDemo.strategies,
      ...subjectPredicateDemo.assessments,
    ]) {
      expect(entry.learningObjectiveId).toBe(objectiveId);
    }
  });

  it("rejects an assessment belonging to another objective", () => {
    const changed = {
      ...subjectPredicateDemo,
      assessments: [
        ...subjectPredicateDemo.assessments.slice(0, 2),
        { ...subjectPredicateDemo.assessments[2], learningObjectiveId: "other" },
      ],
    };
    expect(validateUnifiedObjective(changed)).toContain("invalid-assessment-challenge");
  });

  it("requires human evaluation for creative constructed responses", () => {
    const changed = {
      ...subjectPredicateDemo,
      assessments: subjectPredicateDemo.assessments.map(a =>
        a.tier === "challenge" ? { ...a, requiresHumanReview: false } : a),
    };
    expect(validateUnifiedObjective(changed)).toContain(
      "challenge-requires-constructed-response-human-review"
    );
  });

  it("never invents an official framework equivalence", () => {
    const changed = {
      ...subjectPredicateDemo,
      curriculumAlignments: [{
        system: "national" as const, countryCode: "BH", code: "Arabic",
        sourceVersion: "2026", verified: true,
      }],
    };
    expect(validateUnifiedObjective(changed)).toContain("alignment-needs-source-national");
  });

  it("proposes visual support when independent evidence is absent", () => {
    const evidence = assessObjectiveEvidence(objectiveId, [], later);
    const path = recommendObjectivePath(subjectPredicateDemo, evidence);
    expect(path).toMatchObject({
      learningObjectiveId: objectiveId,
      strategy: "visual",
      assessmentTier: "support",
      canClaimValidatedMastery: false,
    });
  });

  it("allows a learner to change representation without raising the score", () => {
    const evidence = assessObjectiveEvidence(objectiveId, [], later);
    const path = recommendObjectivePath(subjectPredicateDemo, evidence, "creative");
    expect(path.strategy).toBe("creative");
    expect(path.isStrategyLearnerSelected).toBe(true);
    expect(path.assessmentTier).toBe("support");
    expect(path.canClaimValidatedMastery).toBe(false);
  });

  it("requests independent application and transfer rather than easy mastery", () => {
    const evidence = assessObjectiveEvidence(objectiveId,
      [event("1"),event("2"),event("3"),event("4"),event("5")], later);
    const path = recommendObjectivePath(subjectPredicateDemo, evidence);
    expect(path.assessmentTier).toBe("application");
    expect(path.nextAction).toBe("offer_transfer_check");
  });

  it("can offer a challenge after spaced independent success without claiming lasting mastery", () => {
    const evidence = assessObjectiveEvidence(objectiveId, spacedEvidence(), "2026-11-06T10:00:00.000Z");
    const path = recommendObjectivePath(subjectPredicateDemo, evidence);
    expect(path.assessmentTier).toBe("challenge");
    expect(path.strategy).toBe("creative");
    expect(path.nextAction).toBe("wait_for_retention");
    expect(path.canClaimValidatedMastery).toBe(false);
  });

  it("failed retention returns to scaffolded help", () => {
    const evidence = assessObjectiveEvidence(objectiveId, [
      ...spacedEvidence(),
      event("retention", {
        kind: "retention", isCorrect: false,
        sessionId: "session-3", occurredAt: afterWeek,
      }),
    ], afterWeek);
    expect(recommendObjectivePath(subjectPredicateDemo, evidence).assessmentTier).toBe("support");
  });

  it("rejects an unapproved content contract", () => {
    const evidence = assessObjectiveEvidence(objectiveId, [], later);
    expect(() => recommendObjectivePath(
      { ...subjectPredicateDemo, editoriallyApproved: false }, evidence
    )).toThrow(/Unapproved objective/);
  });
});
