import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { validateReviewedProposal } from "../../lib/games/proposal-review";

const p=JSON.parse(readFileSync("data/lesson-game-proposals/bh-grade4-types-of-verbs-25-original-2026.json","utf8"));

describe("manual teacher repairs before game publication", () => {
  test("validates the 25 authored exercises and accepts corrected answers", () => {
    const updated=structuredClone(p.pack);
    updated.maze[0].options[1]="تعبير غير صحيح";
    updated.maze[0].answer="تعبير غير صحيح";
    const checked=validateReviewedProposal(updated);
    expect(checked).not.toBeNull();
    expect(checked!.maze[0].answer).toBe("تعبير غير صحيح");
  });
  test("rejects duplicate questions across games, invalid answers and short explanations", () => {
    const repeated=structuredClone(p.pack);
    repeated.runner[0].prompt=repeated.maze[0].prompt;
    expect(validateReviewedProposal(repeated)).toBeNull();
    const mismatch=structuredClone(p.pack);
    mismatch.maze[0].answer="إجابة غير موجودة";
    expect(validateReviewedProposal(mismatch)).toBeNull();
    const noReason=structuredClone(p.pack);
    noReason.maze[0].explanation="قصير";
    expect(validateReviewedProposal(noReason)).toBeNull();
  });
  test("edits are kept local until explicit authenticated PUT and require re-review", () => {
    const client=readFileSync(
      "app/admin/curriculum/coverage/assessments/proposals/bahrain-grade4-verbs/ApproveProposalButton.tsx","utf8");
    expect(client).toContain("const [draftPack, setDraftPack] = useState<GamePack>");
    expect(client).toContain("setCheckedAnswers(false)");
    expect(client).toContain("validateReviewedProposal(draftPack)");
    expect(client).toContain("pack: checkedPack");
    expect(client).toContain("onChange={event => revise(mode,index,{explanation:event.target.value})}");
    expect(client).toContain("onChange={event => revise(mode,index,{answer:event.target.value})}");
    expect(client).toContain('method: "PUT"');
    expect(client).toContain('credentials: "same-origin"');
    expect(client).toContain("لا يتم اعتماد أي شيء تلقائيًا");
  });
});
