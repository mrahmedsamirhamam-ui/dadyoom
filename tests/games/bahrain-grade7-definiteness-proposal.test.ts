import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { approvedPack, GAME_MODES } from "../../lib/games/lesson-game-pack";

const proposalPath = "data/lesson-game-proposals/bh-grade7-definiteness-25-original-2026.json";

describe("Bahrain grade 7 original definiteness games", () => {
  test("offers 25 distinct explainable, playable questions without auto-publishing", () => {
    const content = JSON.parse(readFileSync(proposalPath, "utf8"));
    expect(content.lessonId).toBe("9a0ddf12-c362-49f4-aab4-a5087672b854");
    expect(content.country).toBe("BH");
    expect(content.grade).toBe(7);
    expect(content.semester).toBe(1);
    expect(content.importedPlanReferenceYear).toBe("2026-2027");
    expect(content.reviewStatus).toBe("teacher-review-required");
    expect(content.officialTextbookMatch2026_2027).toBe(false);
    expect(content.publishAutomatically).toBe(false);
    const pack = approvedPack(content.pack);
    expect(pack).not.toBeNull();
    const items = GAME_MODES.flatMap(mode => pack![mode]);
    expect(items).toHaveLength(25);
    expect(new Set(items.map(item => item.prompt)).size).toBe(25);
    for (const question of items) {
      expect(question.options).toHaveLength(3);
      expect(new Set(question.options).size).toBe(3);
      expect(question.options.filter(v => v === question.answer)).toHaveLength(1);
      expect(question.explanation?.length).toBeGreaterThanOrEqual(24);
    }
  });

  test("allows admin review but keeps publication behind explicit authorization", () => {
    const page = readFileSync("app/admin/curriculum/coverage/assessments/proposals/[slug]/page.tsx", "utf8");
    const dashboard = readFileSync("app/admin/curriculum/coverage/assessments/page.tsx", "utf8");
    const action = readFileSync("app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx", "utf8");
    const api = readFileSync("app/api/lessons/games/route.ts", "utf8");
    expect(page).toContain('"bh-grade7-definiteness": definiteness');
    expect(page).toContain("فتح هذه الصفحة لا ينشر أي شيء للطلاب");
    expect(dashboard).toContain("/proposals/bh-grade7-definiteness");
    expect(action).toContain("checkedAnswers");
    expect(action).toContain("acknowledgedSource");
    expect(api).toContain('profile.data?.role !== "admin"');
  });
});
