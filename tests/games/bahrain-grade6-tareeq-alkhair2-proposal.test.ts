import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { approvedPack, GAME_MODES } from "../../lib/games/lesson-game-pack";

const proposal = JSON.parse(readFileSync("data/lesson-game-proposals/bh-grade6-tareeq-alkhair2-25-original-2026.json", "utf8"));

describe("Bahrain grade 6: Tareeq Alkhair 2 original comprehension proposal", () => {
  test("links to the confirmed published lesson but requires human review", () => {
    expect(proposal.lessonId).toBe("69115ad5-dfdd-4d97-b2fc-f9b54bdce448");
    expect(proposal.country).toBe("BH");
    expect(proposal.grade).toBe(6);
    expect(proposal.semester).toBe(1);
    expect(proposal.reviewStatus).toBe("teacher-review-required");
    expect(proposal.publishAutomatically).toBe(false);
    expect(proposal.officialTextbookMatch2026_2027).toBe(false);
    expect(proposal.provenance).toContain("NOT the ministry book passage");
  });
  test("has 25 distinct, well-formed explained answers across five game types", () => {
    const parsed = approvedPack(proposal.pack);
    expect(parsed).not.toBeNull();
    const items = GAME_MODES.flatMap(mode => parsed![mode]);
    expect(items).toHaveLength(25);
    expect(new Set(items.map(q => q.prompt)).size).toBe(25);
    for (const q of items) {
      expect(q.options).toHaveLength(3);
      expect(new Set(q.options).size).toBe(3);
      expect(q.options.filter(choice => choice === q.answer)).toHaveLength(1);
      expect(q.explanation?.length).toBeGreaterThanOrEqual(24);
    }
  });
  test("measures three objectives within the requested 55-minute differentiated lesson", () => {
    const plan = proposal.teachingPlan;
    expect(plan.durationMinutes).toBe(55);
    expect(plan.learningObjectives).toHaveLength(3);
    expect(plan.lessonFlow).toHaveLength(5);
    expect(plan.lessonFlow.reduce((sum: number, stage: {minutes: number}) => sum + stage.minutes, 0)).toBe(55);
    for (const x of plan.learningObjectives) {
      expect(x.objective.length).toBeGreaterThan(20);
      expect(x.assessment.length).toBeGreaterThan(20);
    }
    expect(plan.miniLesson.length).toBeGreaterThan(200);
    for(const level of ["support","core","challenge"]){ expect(plan.differentiation[level].length).toBeGreaterThan(30); }
    expect(plan.exitTicket.masteryRule.length).toBeGreaterThan(30);
  });
  test("preview and dashboard register the same review-only slug", () => {
    const route = readFileSync("app/admin/curriculum/coverage/assessments/proposals/[slug]/page.tsx", "utf8");
    const index = readFileSync("app/admin/curriculum/coverage/assessments/page.tsx", "utf8");
    const approval = readFileSync("app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx", "utf8");
    expect(route).toContain('"bh-grade6-tareeq-alkhair2"');
    expect(index).toContain("/proposals/bh-grade6-tareeq-alkhair2");
    expect(approval).toContain("acknowledgedSource");
    expect(route).toContain("فتح هذه الصفحة لا ينشر أي شيء للطلاب");
  });
});
