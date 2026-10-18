import { readFileSync } from "node:fs";
import { describe, test, expect } from "vitest";
import { approvedPack, GAME_MODES } from "../../lib/games/lesson-game-pack";

const newPacks = [
  ["white-dove", "37838a57-d122-43d2-9703-c2cee899bc0c"],
  ["dream-achieved", "5c7dedde-588b-4b86-9789-dc0876817593"],
  ["scientist-mind", "24696d82-67bb-4e70-a344-80ca566d54b9"],
  ["konar-tree", "d5de3780-700a-47b4-bc27-d0ecfd837197"],
] as const;

describe("100 original Bahrain listening questions — four source-grounded lessons", () => {
  for (const [slug, lessonId] of newPacks) {
    test(`${slug}: five game modes each have five distinct correct, explained items`, () => {
      const p = JSON.parse(readFileSync(
        `data/lesson-game-proposals/bh-grade4-listening-${slug}-25-original-2026.json`,
        "utf8",
      ));
      expect(p.lessonId).toBe(lessonId);
      expect(p.country).toBe("BH");
      expect(p.grade).toBe(4);
      expect(p.semester).toBe(1);
      expect(p.reviewStatus).toBe("teacher-review-required");
      expect(p.publishAutomatically).toBe(false);
      expect(p.officialTextbookMatch2026_2027).toBe(false);
      expect(p.provenance).toMatch(/not the official textbook/i);
      const valid = approvedPack(p.pack);
      expect(valid).not.toBeNull();
      const questions = GAME_MODES.flatMap(mode => valid![mode]);
      expect(questions).toHaveLength(25);
      expect(new Set(questions.map(q => q.prompt)).size).toBe(25);
      for (const q of questions) {
        expect(q.options).toHaveLength(3);
        expect(q.options.filter(o => o === q.answer)).toHaveLength(1);
        expect((q.explanation ?? "").length).toBeGreaterThanOrEqual(24);
      }
    });
  }
  test("all source texts are reachable only through the existing editor-review flow", () => {
    const editor = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/[slug]/page.tsx", "utf8");
    const queue = readFileSync("app/admin/curriculum/coverage/assessments/page.tsx", "utf8");
    for (const [suffix] of newPacks) {
      const slug = `bh-grade4-listening-${suffix}`;
      expect(editor).toContain(`"${slug}":`);
      expect(queue).toContain(`/admin/curriculum/coverage/assessments/proposals/${slug}`);
    }
    expect(editor).toContain("ليست من نص الكتاب أو التسجيل الصوتي الوزاري");
    expect(editor).toContain('<ApproveProposalButton lessonId={proposal.lessonId} pack={proposal.pack} />');
    const action = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx",
      "utf8",
    );
    expect(action).toContain("if (!checkedAnswers || !acknowledgedSource || saving || published) return");
    expect(action).toContain('method: "PUT"');
    expect(action).toContain('credentials: "same-origin"');
    const api = readFileSync("app/api/lessons/games/route.ts","utf8");
    expect(api).toContain('profile.data?.role !== "admin"');
  });
});
