import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { approvedPack, GAME_MODES } from "../../lib/games/lesson-game-pack";

const proposal = JSON.parse(readFileSync(
  "data/lesson-game-proposals/bh-grade4-types-of-verbs-25-original-2026.json",
  "utf8",
)) as {
  lessonId: string;
  title: string;
  country: string;
  grade: number;
  semester: number;
  reviewStatus: string;
  publishAutomatically: boolean;
  officialTextbookMatch2026_2027: boolean;
  importedPlanReferenceYear: string;
  pack: unknown;
};

describe("Bahrain grade-4 original verb exercises", () => {
  test("points to the actual published enrichment lesson but never claims textbook approval", () => {
    expect(proposal.lessonId).toBe("4ca47d03-f084-4af9-8d32-de66fefd08e8");
    expect(proposal.title).toBe("أنواع الفعل");
    expect(proposal.country).toBe("BH");
    expect(proposal.grade).toBe(4);
    expect(proposal.semester).toBe(2);
    expect(proposal.importedPlanReferenceYear).toBe("2025-2026");
    expect(proposal.reviewStatus).toBe("teacher-review-required");
    expect(proposal.officialTextbookMatch2026_2027).toBe(false);
    expect(proposal.publishAutomatically).toBe(false);
  });

  test("all five arcade modes have five playable, non-repeated and explained questions", () => {
    const validated = approvedPack(proposal.pack);
    expect(validated).not.toBeNull();
    const questions = GAME_MODES.flatMap(mode => validated![mode]);
    expect(questions).toHaveLength(25);
    expect(new Set(questions.map(q => q.prompt)).size).toBe(25);
    expect(questions.every(q => q.options.filter(a => a === q.answer).length === 1)).toBe(true);
    expect(questions.every(q => (q.explanation?.length ?? 0) >= 25)).toBe(true);
  });

  test("the teacher-review screen shows answers but cannot approve or publish autonomously", () => {
    const reviewer = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/page.tsx",
      "utf8",
    );
    const assessments = readFileSync("app/admin/curriculum/coverage/assessments/page.tsx", "utf8");
    expect(reviewer).toContain("proposal.pack");
    expect(reviewer).toContain("question.answer");
    expect(reviewer).toContain("question.explanation");
    expect(reviewer).toContain("مراجعة تربوية مطلوبة");
    expect(reviewer).not.toContain('action={');
    expect(reviewer).toContain('<ApproveProposalButton lessonId={proposal.lessonId} pack={proposal.pack} />');
    expect(assessments).toContain("/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs");
  });
  test("manual approval requires two confirmations, admin API check and source disclosure", () => {
    const action = readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx",
      "utf8",
    );
    expect(action).toContain("if (!checkedAnswers || !acknowledgedSource || saving || published) return");
    expect(action).toContain('disabled={!checkedAnswers || !acknowledgedSource || saving || published}');
    expect(action).toContain('method: "PUT"');
    expect(action).toContain('"x-dadyoom-approved-game-pack": "1"');
    expect(action).toContain("approved: true");
    expect(action).toContain("aiAssisted: true");
    expect(action).toContain('credentials: "same-origin"');
    expect(action).toContain("راجعت الأسئلة الخمسة والعشرين");
    expect(action).toContain("ليست أسئلة معتمدة من كتاب وزارة التربية");
    expect(action).toContain("لا يتم اعتماد أي شيء تلقائيًا");
  });

});
