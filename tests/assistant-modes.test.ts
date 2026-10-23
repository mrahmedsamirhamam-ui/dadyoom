import { describe, expect, it } from "vitest";
import { ASSISTANT_MODES, ASSISTANT_MODE_GUIDANCE, normalizeAssistantMode } from "../lib/ai/assistant-modes";

describe("Dadyoom assistant teaching modes", () => {
  it("offers a stable choice of independent educational strategies", () => {
    expect(ASSISTANT_MODES.map((mode) => mode.id)).toEqual([
      "explain", "practice", "writing", "learning-needs",
    ]);
    expect(ASSISTANT_MODES.every((mode) => mode.example.length > 15)).toBe(true);
  });

  it("rejects unsupported or forged mode names by safe default", () => {
    expect(normalizeAssistantMode("practice")).toBe("practice");
    expect(normalizeAssistantMode("learning-needs")).toBe("learning-needs");
    expect(normalizeAssistantMode("admin")).toBe("explain");
    expect(normalizeAssistantMode({ role: "admin" })).toBe("explain");
    expect(normalizeAssistantMode(null)).toBe("explain");
  });

  it("protects students against mental health profiling and fake scores", () => {
    expect(ASSISTANT_MODE_GUIDANCE["learning-needs"]).toContain("لا تصنّف طالبًا بعينه");
    expect(ASSISTANT_MODE_GUIDANCE.practice).toContain("لا تُعلن إكمال درس");
    expect(ASSISTANT_MODE_GUIDANCE.writing).toContain("لا تختلق اقتباسات");
  });
});
