import { describe, expect, it } from "vitest";
import { labelSourceType, validateEvidence, type SourceEvidence } from "./evidence";

const source: SourceEvidence = { id: "lesson-1", title: "درس مراجَع", excerpt: "نص الدرس", sourceType: "dadyoom_enrichment", permitted: true };

describe("Dad Expert offline evidence gate", () => {
  it("rejects unsupported answers without citations", () => {
    expect(validateEvidence({ text: "إجابة", sourceIds: [] }, [source])).toEqual({ ok: false, reason: "missing_citation" });
  });
  it("rejects unknown and unauthorized citations", () => {
    expect(validateEvidence({ text: "إجابة", sourceIds: ["other"] }, [source])).toEqual({ ok: false, reason: "unknown_source" });
    expect(validateEvidence({ text: "إجابة", sourceIds: ["lesson-1"] }, [{ ...source, permitted: false }])).toEqual({ ok: false, reason: "unpermitted_source" });
  });
  it("accepts structurally valid cited sources without claiming factual verification", () => {
    const result = validateEvidence({ text: "إجابة", sourceIds: ["lesson-1"] }, [source]);
    expect(result.ok).toBe(true);
    expect(labelSourceType(source.sourceType)).toBe("إثراء أصلي من ضاديوم");
  });
});
