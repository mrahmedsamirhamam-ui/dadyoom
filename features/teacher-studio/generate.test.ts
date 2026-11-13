import { describe, expect, it } from "vitest";
import { generateStudioDraft, studioDraftAsText, type StudioInput } from "./generate";

const valid: StudioInput = {
  title: "الأفعال الخمسة",
  grade: "السابع",
  country: "البحرين",
  durationMinutes: 55,
  objectiveOne: "يتعرف الأفعال الخمسة في النص",
  objectiveTwo: "يعرب فعلًا من الأفعال الخمسة",
  sourceText: "الأفعال الخمسة أفعال مضارعة اتصلت بألف الاثنين أو واو الجماعة أو ياء المخاطبة. ترفع بثبوت النون وتنصب وتجزم بحذف النون. يستخدمها المتعلم في أمثلة من واقعه اليومي."
};

describe("teacher studio local draft", () => {
  it("allocates the exact lesson duration from 30 to 90 minutes", () => {
    for (let duration = 30; duration <= 90; duration += 1) {
      const draft = generateStudioDraft({ ...valid, durationMinutes: duration });
      expect(draft.stages.reduce((sum, stage) => sum + stage.minutes, 0)).toBe(duration);
      expect(draft.stages.every((stage) => stage.minutes > 0)).toBe(true);
    }
  });

  it("rejects missing content, duplicate objectives and invalid durations", () => {
    expect(() => generateStudioDraft({ ...valid, sourceText: "قصير" })).toThrow();
    expect(() => generateStudioDraft({ ...valid, objectiveTwo: valid.objectiveOne })).toThrow();
    expect(() => generateStudioDraft({ ...valid, durationMinutes: 15 })).toThrow();
  });

  it("clearly identifies unverified source and human-review requirement", () => {
    const draft = generateStudioDraft(valid);
    expect(draft.sourceStatus).toBe("unverified-teacher-supplied");
    expect(draft.reviewChecklist.length).toBeGreaterThan(2);
    expect(studioDraftAsText(valid, draft)).toContain("دون ذكاء اصطناعي");
  });
});
