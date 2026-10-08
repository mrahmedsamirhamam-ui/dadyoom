import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

describe("Teacher reward production role QA", () => {
  const script = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  const rewardFlow = script.slice(
    script.indexOf("async function teacherRewardFlow("),
    script.indexOf("async function teacherRewardFlow(") + 6000,
  );
  test("retries transient classroom failures but fails persistently missing UI", () => {
    expect(rewardFlow).toContain("attempt <= 3");
    expect(rewardFlow).toContain("E2E_TEACHER_REWARD_FORM_DIAGNOSTIC");
    expect(rewardFlow).toContain('input[name="title"]');
    expect(rewardFlow).toContain('gate(rewardFormReady, "E2E_TEACHER_REWARD_FORM_UNAVAILABLE")');
    expect(rewardFlow).not.toContain("page.waitForTimeout(30000)");
  });
  test("does not log form values or credentials", () => {
    const diag = rewardFlow.slice(rewardFlow.indexOf('"E2E_TEACHER_REWARD_FORM_DIAGNOSTIC"'),rewardFlow.indexOf('"E2E_TEACHER_REWARD_FORM_DIAGNOSTIC"')+430);
    expect(diag).not.toContain(".inputValue()");
    expect(diag).not.toContain("password");
    expect(diag).not.toContain("token");
  });
});