import { describe, expect, it } from "vitest";

import {
  buildFeedbackDraft,
  FEEDBACK_SKILLS,
} from "@/features/teacher-feedback/feedback-plan";

const base = {
  skill: "reading-comprehension" as const,
  stage: "4-6" as const,
  evidence: "",
  reviewDays: 14,
};

describe("evidence-based teacher feedback", () => {
  it("fails closed without actual student-performance evidence", () => {
    const draft = buildFeedbackDraft(base);
    expect(draft.ready).toBe(false);
    expect(draft.exportText).toBe("");
    expect(draft.issue).toContain("بلا دليل");
  });

  it("accepts written observation without inventing a numerical grade", () => {
    const draft = buildFeedbackDraft({
      ...base,
      evidence: "حدد الفكرة الرئيسة، لكنه لم يستدل من النص.",
    });
    expect(draft.ready).toBe(true);
    expect(draft.observation).toContain("حدد الفكرة الرئيسة");
    expect(draft.exportText).not.toContain("أصاب في");
    expect(draft.exportText).toContain("4 من 5 فرص جديدة");
  });

  it("reports only valid teacher-supplied scored opportunities", () => {
    const draft = buildFeedbackDraft({
      ...base,
      correct: 2,
      total: 5,
    });
    expect(draft.ready).toBe(true);
    expect(draft.observation).toContain("2 من 5 فرص موثقة");
    expect(draft.observation).not.toContain("أداء متميز");
  });

  it("rejects impossible and partial scores as evidence", () => {
    expect(buildFeedbackDraft({ ...base, correct: 6, total: 5 }).ready).toBe(false);
    expect(buildFeedbackDraft({ ...base, correct: 1 }).ready).toBe(false);
    expect(buildFeedbackDraft({ ...base, correct: -1, total: 5 }).ready).toBe(false);
    expect(buildFeedbackDraft({ ...base, correct: 1, total: 0 }).ready).toBe(false);
  });

  it("bounds the follow-up interval and includes a transfer task", () => {
    const draft = buildFeedbackDraft({
      ...base,
      evidence: "استدل من النص في النشاط العملي اليوم.",
      reviewDays: 90,
    });
    expect(draft.measurement).toContain("30 يومًا");
    expect(draft.measurement).toContain("مهمة انتقال");
  });

  it("provides a unique practice and measure for each supported skill", () => {
    const practices = FEEDBACK_SKILLS.map((skill) => skill.practice);
    expect(FEEDBACK_SKILLS).toHaveLength(18);
    expect(new Set(practices).size).toBe(9);
    for (const skill of FEEDBACK_SKILLS) {
      const draft = buildFeedbackDraft({
        ...base,
        skill: skill.id,
        correct: 4,
        total: 5,
      });
      expect(draft.intervention).toContain(skill.practice);
      expect(draft.measurement).toContain(skill.criterion);
      expect(draft.measurement).toContain(skill.transfer);
    }
  });
});
