import { describe, expect, it } from "vitest";
import {
  assessObjectiveEvidence,
  type MasteryEvidence,
} from "@/features/adaptive-learning/services/evidence-based-mastery";

const objective = "bh-grade7-arabic-haal";
const t1 = "2026-11-01T10:00:00.000Z";
const t2 = "2026-11-03T10:00:00.000Z";
const t3 = "2026-11-11T10:00:00.000Z";
const now = "2026-11-06T10:00:00.000Z";

function event(
  itemId: string,
  overrides: Partial<MasteryEvidence> = {},
): MasteryEvidence {
  return {
    objectiveId: objective,
    itemId,
    sessionId: "session-1",
    occurredAt: t1,
    kind: "independent",
    isCorrect: true,
    gradedBy: "server",
    reviewedItem: true,
    hintCount: 0,
    ...overrides,
  };
}

function qualified() {
  return [
    event("item-1"),
    event("item-2"),
    event("item-3"),
    event("item-4", { sessionId: "session-2", occurredAt: t2 }),
    event("transfer-1", {
      sessionId: "session-2", occurredAt: t2, kind: "transfer",
    }),
  ] satisfies MasteryEvidence[];
}

describe("Dadyoom evidence policy alpha (not psychometrically validated)", () => {
  it("does not call a perfect single response mastery", () => {
    const x = assessObjectiveEvidence(objective, [event("only")], now);
    expect(x.status).toBe("insufficient_evidence");
    expect(x.canClaimValidatedMastery).toBe(false);
    expect(x.pilotEvidenceMet).toBe(false);
  });

  it("does not count guided, unreviewed, unverified or assisted attempts", () => {
    const samples = [
      event("guided", { kind: "guided" }),
      event("hint", { hintCount: 1 }),
      event("unverified", { gradedBy: "unverified" }),
      event("unreviewed", { reviewedItem: false }),
      event("future", { occurredAt: "2026-12-01T10:00:00.000Z" }),
      event("wrong-objective", { objectiveId: "another-objective" }),
    ];
    const x = assessObjectiveEvidence(objective, samples, now);
    expect(x.initialIndependentCount).toBe(0);
    expect(x.ignoredEvents).toBe(samples.length);
  });

  it("ignores retries of the same item across sessions", () => {
    const x = assessObjectiveEvidence(objective, [
      event("same", { isCorrect: false }),
      event("same", { sessionId: "session-2", occurredAt: t2, isCorrect: true }),
      event("item-2"),
    ], now);
    expect(x.initialIndependentCount).toBe(2);
    expect(x.distinctInitialSessions).toBe(1);
  });

  it("requires distinct spaced sessions even with 100 percent score", () => {
    const onlyOneSession = qualified().map((e) => ({
      ...e, sessionId: "session-1", occurredAt: t1,
    }));
    const x = assessObjectiveEvidence(objective, onlyOneSession, now);
    expect(x.status).toBe("insufficient_evidence");
    expect(x.action).toBe("schedule_independent_check");
    expect(x.initialIndependentCount).toBe(5);
  });

  it("requires a correct transfer task rather than repeating the drill", () => {
    const x = assessObjectiveEvidence(objective, qualified().map((e) =>
      e.kind === "transfer" ? { ...e, isCorrect: false } : e
    ), now);
    expect(x.independentAccuracy).toBe(80);
    expect(x.action).toBe("offer_transfer_check");
  });

  it("recommends a guided revision when independent score is low", () => {
    const samples = qualified().map((e, i) => ({ ...e, isCorrect: i < 3 }));
    const x = assessObjectiveEvidence(objective, samples, now);
    expect(x.action).toBe("guided_practice");
    expect(x.status).toBe("needs_support");
    expect(x.pilotEvidenceMet).toBe(false);
  });

  it("distinguishes demonstrated understanding from long-term retention", () => {
    const x = assessObjectiveEvidence(objective, qualified(), now);
    expect(x.status).toBe("demonstrated_not_retained");
    expect(x.pilotEvidenceMet).toBe(false);
    expect(x.nextReviewAt).toBe("2026-11-10T10:00:00.000Z");
    expect(x.canClaimValidatedMastery).toBe(false);
  });

  it("offers a new review when seven days have passed", () => {
    const x = assessObjectiveEvidence(
      objective, qualified(), "2026-11-11T10:00:00.000Z"
    );
    expect(x.status).toBe("retention_review_due");
    expect(x.action).toBe("run_retention_check");
  });

  it("a new, distinct, delayed retention item can confirm pilot evidence", () => {
    const x = assessObjectiveEvidence(objective, [
      ...qualified(),
      event("retention-1", {
        kind: "retention", sessionId: "session-3", occurredAt: t3,
      }),
    ], t3);
    expect(x.status).toBe("retained_on_check");
    expect(x.pilotEvidenceMet).toBe(true);
    expect(x.canClaimValidatedMastery).toBe(false);
    expect(x.eligibleRetentionChecks).toBe(1);
  });

  it("a failed delayed review sends learner back for support", () => {
    const x = assessObjectiveEvidence(objective, [
      ...qualified(),
      event("retention-1", {
        kind: "retention", sessionId: "session-3",
        occurredAt: t3, isCorrect: false,
      }),
    ], t3);
    expect(x.status).toBe("needs_retention_repair");
    expect(x.action).toBe("repair_then_recheck");
  });

  it("refuses false claims based on a repeated retention question", () => {
    const x = assessObjectiveEvidence(objective, [
      ...qualified(),
      event("transfer-1", {
        kind: "retention", sessionId: "session-3", occurredAt: t3,
      }),
    ], t3);
    expect(x.status).toBe("retention_review_due");
  });

  it("rejects missing objective and invalid observation time", () => {
    expect(() => assessObjectiveEvidence("", [], now)).toThrow(TypeError);
    expect(() => assessObjectiveEvidence(objective, [], "invalid")).toThrow(TypeError);
  });

  it("does not expose student PII or persist any data", () => {
    const x = assessObjectiveEvidence(objective, qualified(), now);
    expect(JSON.stringify(x)).not.toMatch(/userId|email|fullName|studentId/);
  });
});
