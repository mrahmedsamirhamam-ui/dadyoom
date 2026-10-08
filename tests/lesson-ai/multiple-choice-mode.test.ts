import { describe, it, expect } from "vitest";
import { allowsMultipleSelection } from "@/lib/lesson-activities/multiple-choice-mode";
describe("adult learning single-answer exercises", () => {
  it("uses single-answer selection for adult literacy", () => {
    expect(allowsMultipleSelection({origin:"DADYOOM_BH_CONTINUING_LITERACY1_MCQ_V1"},4)).toBe(false);
    expect(allowsMultipleSelection({origin:"DADYOOM_BH_CONTINUING_LITERACY2_MCQ_V1"},4)).toBe(false);
  });
  it("uses single-answer selection for adult follow-up", () => {
    expect(allowsMultipleSelection({origin:"DADYOOM_BH_FOLLOWUP1_MCQ_V1"},4)).toBe(false);
    expect(allowsMultipleSelection({origin:"DADYOOM_BH_FOLLOWUP2_MCQ_V1"},4)).toBe(false);
  });
  it("retains explicit and legacy modes", () => {
    expect(allowsMultipleSelection({selection_mode:"multiple"},4)).toBe(true);
    expect(allowsMultipleSelection({selection_mode:"single"},5)).toBe(false);
    expect(allowsMultipleSelection({origin:"DADYOOM_CORE_22_ACTIVITY_V1"},4)).toBe(true);
  });
});
