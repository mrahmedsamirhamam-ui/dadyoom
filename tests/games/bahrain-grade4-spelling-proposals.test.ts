import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { approvedPack, GAME_MODES } from "../../lib/games/lesson-game-pack";

const proposalPaths = [
  ["data/lesson-game-proposals/bh-grade4-final-hamza-after-damma-25-original-2026.json",
    "ae61f418-aa13-4867-9d63-ca31b9241d71"],
  ["data/lesson-game-proposals/bh-grade4-letter-dad-25-original-2026.json",
    "b4883304-e93a-4f78-b800-c91ea8e0550c"],
] as const;

describe("original Bahrain spelling packs awaiting a teacher's approval", () => {
  for (const [path, lessonId] of proposalPaths) {
    test(`${path} contains 25 structurally playable non-repeating educational items`, () => {
      const input = JSON.parse(readFileSync(path, "utf8"));
      expect(input.lessonId).toBe(lessonId);
      expect(input.country).toBe("BH");
      expect(input.grade).toBe(4);
      expect(input.semester).toBe(2);
      expect(input.reviewStatus).toBe("teacher-review-required");
      expect(input.publishAutomatically).toBe(false);
      expect(input.officialTextbookMatch2026_2027).toBe(false);
      expect(input.importedPlanReferenceYear).toBe("2025-2026");

      const pack = approvedPack(input.pack);
      expect(pack).not.toBeNull();
      const all = GAME_MODES.flatMap(mode => pack![mode]);
      expect(all).toHaveLength(25);
      expect(new Set(all.map(item => item.prompt)).size).toBe(25);
      for (const item of all) {
        expect(item.options.filter(option => option === item.answer)).toHaveLength(1);
        expect(item.explanation?.length).toBeGreaterThanOrEqual(24);
      }
    });
  }

  test("admin-only page exposes all questions with teacher review and no auto-publishing", () => {
    const route = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/[slug]/page.tsx", "utf8");
    const directory = readFileSync(
      "app/admin/curriculum/coverage/assessments/page.tsx", "utf8");
    expect(route).toContain('if (!proposal) notFound()');
    expect(route).toContain("proposal.pack");
    expect(route).toContain("question.explanation");
    expect(route).toContain('import ApproveProposalButton from "../bahrain-grade4-verbs/ApproveProposalButton"');
    expect(route).toContain("فتح هذه الصفحة لا ينشر أي شيء للطلاب");
    expect(directory).toContain("/admin/curriculum/coverage/assessments/proposals/bh-grade4-final-hamza");
    expect(directory).toContain("/admin/curriculum/coverage/assessments/proposals/bh-grade4-letter-dad");

    const action = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx",
      "utf8");
    expect(action).toContain("if (!checkedAnswers || !acknowledgedSource || saving || published) return");
    expect(action).toContain('method: "PUT"');
    expect(action).toContain('approved: true');
    const api = readFileSync("app/api/lessons/games/route.ts", "utf8");
    expect(api).toContain('profile.data?.role !== "admin"');
  });
});
