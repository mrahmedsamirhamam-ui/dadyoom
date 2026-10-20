import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { approvedPack, GAME_MODES } from "../../lib/games/lesson-game-pack";

const cases = [
  { slug: "bh-grade7-subject-predicate", path: "data/lesson-game-proposals/bh-grade7-subject-predicate-25-original-2026.json",
    id: "55ac803d-58f9-4b8d-8303-fc6252829111", grade: 7 },
  { slug: "bh-grade7-present-verb-building", path: "data/lesson-game-proposals/bh-grade7-present-verb-building-25-original-2026.json",
    id: "a8e42d33-ae77-4e30-a0e6-fe937a9270f7", grade: 7 },
  { slug: "bh-grade6-listening-dream", path: "data/lesson-game-proposals/bh-grade6-listening-dream-25-original-2026.json",
    id: "030d9679-248e-4d9a-98cd-450fae0e897d", grade: 6 },
  { slug: "bh-grade7-pronouns", path: "data/lesson-game-proposals/bh-grade7-pronouns-25-original-2026.json",
    id: "c6870718-d76a-4d5e-b5c1-4e1fb70eca88", grade: 7 },
  { slug: "bh-grade7-demonstratives", path: "data/lesson-game-proposals/bh-grade7-demonstratives-25-original-2026.json",
    id: "8cf258f2-5a43-458f-bdf7-c0ba65b7f7ad", grade: 7 },
  { slug: "bh-grade7-past-verb-building", path: "data/lesson-game-proposals/bh-grade7-past-verb-building-25-original-2026.json",
    id: "2cea693b-4e3a-4081-8c05-effa345f34bf", grade: 7 },
] as const;

describe("six Bahrain curriculum-support lesson packages", () => {
  for (const candidate of cases) {
    test(candidate.slug + " has a review-only 25-item game pack", () => {
      const proposal = JSON.parse(readFileSync(candidate.path, "utf8"));
      expect(proposal.lessonId).toBe(candidate.id);
      expect(proposal.grade).toBe(candidate.grade);
      expect(proposal.country).toBe("BH");
      expect(proposal.semester).toBe(1);
      expect(proposal.importedPlanReferenceYear).toBe("2026-2027");
      expect(proposal.officialTextbookMatch2026_2027).toBe(false);
      expect(proposal.reviewStatus).toBe("teacher-review-required");
      expect(proposal.publishAutomatically).toBe(false);
      const pack = approvedPack(proposal.pack);
      expect(pack).not.toBeNull();
      const all = GAME_MODES.flatMap(mode => pack![mode]);
      expect(all).toHaveLength(25);
      expect(new Set(all.map(item => item.prompt)).size).toBe(25);
      for (const item of all) {
        expect(item.options).toHaveLength(3);
        expect(new Set(item.options).size).toBe(3);
        expect(item.options.filter(option => option === item.answer)).toHaveLength(1);
        expect(item.explanation?.length).toBeGreaterThanOrEqual(24);
      }
    });

    test(candidate.slug + " includes assessable objectives, a timed lesson and differentiation", () => {
      const proposal = JSON.parse(readFileSync(candidate.path, "utf8"));
      const plan = proposal.teachingPlan;
      expect(plan.durationMinutes).toBe(50);
      expect(plan.learningObjectives).toHaveLength(3);
      for (const item of plan.learningObjectives) {
        expect(item.objective.length).toBeGreaterThan(15);
        expect(item.assessment.length).toBeGreaterThan(15);
      }
      expect(plan.lessonFlow).toHaveLength(5);
      expect(plan.lessonFlow.reduce((sum: number, stage: { minutes: number }) => sum + stage.minutes, 0)).toBe(50);
      expect(plan.miniLesson.length).toBeGreaterThan(200);
      for (const level of ["support", "core", "challenge"]) {
        expect(plan.differentiation[level].length).toBeGreaterThan(30);
      }
      expect(plan.exitTicket.expected.length).toBeGreaterThan(20);
      expect(plan.exitTicket.masteryRule.length).toBeGreaterThan(15);
      expect(plan.teacherReviewNote.length).toBeGreaterThan(20);
    });
  }

  test("teacher previews exist, no automatic publication is wired", () => {
    const route = readFileSync("app/admin/curriculum/coverage/assessments/proposals/[slug]/page.tsx", "utf8");
    const dashboard = readFileSync("app/admin/curriculum/coverage/assessments/page.tsx", "utf8");
    const approve = readFileSync("app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx", "utf8");
    const api = readFileSync("app/api/lessons/games/route.ts", "utf8");
    for (const candidate of cases) {
      expect(route).toContain('"' + candidate.slug + '"');
      expect(dashboard).toContain("/proposals/" + candidate.slug);
    }
    expect(route).toContain('const teachingPlan = "teachingPlan" in proposal');
    expect(route).toContain("teachingPlan.learningObjectives");
    expect(route).toContain("teachingPlan.lessonFlow");
    expect(route).toContain("teachingPlan.exitTicket");
    expect(route).toContain("فتح هذه الصفحة لا ينشر أي شيء للطلاب");
    expect(approve).toContain("if (!checkedAnswers || !acknowledgedSource || saving || published) return");
    expect(api).toContain('profile.data?.role !== "admin"');
  });
});
