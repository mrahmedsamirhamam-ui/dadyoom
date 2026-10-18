import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { approvedPack, GAME_MODES } from "../../lib/games/lesson-game-pack";

const candidates = [
  ["bh-grade4-listening-love-of-country-25-original-2026.json",
   "1fb6f61f-d33d-422c-8894-dd4bcee8378e", 4],
  ["bh-grade5-listening-three-friends-25-original-2026.json",
   "223ddc19-5573-4415-94fa-cebe71c4ddeb", 5],
] as const;

describe("source-grounded listening comprehension review proposals", () => {
  for (const [filename, expectedId, grade] of candidates) {
    test(`${filename} has 25 unique correct and explained items for a real lesson`, () => {
      const proposal = JSON.parse(readFileSync(
        `data/lesson-game-proposals/${filename}`, "utf8"));
      expect(proposal.lessonId).toBe(expectedId);
      expect(proposal.country).toBe("BH");
      expect(proposal.grade).toBe(grade);
      expect(proposal.semester).toBe(1);
      expect(proposal.reviewStatus).toBe("teacher-review-required");
      expect(proposal.publishAutomatically).toBe(false);
      expect(proposal.officialTextbookMatch2026_2027).toBe(false);
      expect(proposal.provenance).toContain("NOT the ministry textbook");
      const pack = approvedPack(proposal.pack);
      expect(pack).not.toBeNull();
      const questions = GAME_MODES.flatMap(mode => pack![mode]);
      expect(questions).toHaveLength(25);
      expect(new Set(questions.map(x => x.prompt)).size).toBe(25);
      for (const item of questions) {
        expect(item.options.filter(x => x === item.answer)).toHaveLength(1);
        expect((item.explanation ?? "").length).toBeGreaterThanOrEqual(24);
      }
    });
  }

  test("both teacher-review pages are linked and retain the guarded approval flow", () => {
    const review = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/[slug]/page.tsx",
      "utf8");
    const index = readFileSync("app/admin/curriculum/coverage/assessments/page.tsx", "utf8");
    for (const slug of ["bh-grade4-listening-love-of-country","bh-grade5-listening-three-friends"]) {
      expect(review).toContain(`"${slug}":`);
      expect(index).toContain(`/admin/curriculum/coverage/assessments/proposals/${slug}`);
    }
    expect(review).toContain("ليست من نص الكتاب أو التسجيل الصوتي الوزاري");
    expect(review).toContain("فتح هذه الصفحة لا ينشر أي شيء للطلاب");
    expect(review).toContain('<ApproveProposalButton lessonId={proposal.lessonId} pack={proposal.pack} />');
    const approve = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx",
      "utf8");
    expect(approve).toContain("if (!checkedAnswers || !acknowledgedSource || saving || published) return");
    expect(approve).toContain('"x-dadyoom-approved-game-pack": "1"');
  });
});
