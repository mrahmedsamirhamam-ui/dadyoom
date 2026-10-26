import { describe, expect, it } from "vitest";
import {
  buildCrossCurricularDraft,
  DEFAULT_FOCUS,
  type StudioInput,
} from "@/lib/teacher-studio/cross-curricular";

const base: StudioInput = {
  lessonTitle: "بناء الفعل الماضي",
  learningOutcome: "أن يوظف المتعلم الفعل الماضي توظيفًا صحيحًا.",
  country: "البحرين",
  grade: 6,
  skill: "grammar",
  focus: { ...DEFAULT_FOCUS },
};

describe("Cross-curricular teacher studio", () => {
  it("keeps Arabic outcome primary and preserves the 55-minute lesson structure", () => {
    const result = buildCrossCurricularDraft(base);
    expect(result).toContain(base.learningOutcome);
    for (const part of ["5 دقائق", "15 دقيقة", "12 دقيقة", "8 دقائق"]) {
      expect(result).toContain(part);
    }
    expect(result).toContain("اللغة العربية هي الهدف التعليمي الرئيس");
    expect(result).toContain("غير منشور");
  });

  it("adds local/global citizenship and green learning when selected", () => {
    const result = buildCrossCurricularDraft(base);
    expect(result).toContain("التعليم الأخضر");
    expect(result).toContain("المواطنة المحلية (البحرين)");
    expect(result).toContain("المواطنة العالمية");
    expect(result).not.toContain("الربط بالتربية الإسلامية (اختياري)");
  });

  it("includes Islamic studies only when the teacher opts in and requires source verification", () => {
    const result = buildCrossCurricularDraft({
      ...base,
      focus: { ...base.focus, islamicStudies: true },
    });
    expect(result).toContain("الربط بالتربية الإسلامية (اختياري)");
    expect(result).toContain("التحقق من النص والمصدر");
    expect(result).not.toMatch(/قال رسول الله|قال تعالى|سورة البقرة/);
  });

  it("does not force any integration if all options are disabled", () => {
    const result = buildCrossCurricularDraft({
      ...base,
      focus: {
        sustainability: false,
        localCitizenship: false,
        globalCitizenship: false,
        islamicStudies: false,
      },
    });
    expect(result).toContain("لم تُحدَّد مجالات تكامل");
    expect(result).not.toContain("• التعليم الأخضر");
  });

  it("adapts the task by language skill and grade", () => {
    const result = buildCrossCurricularDraft({ ...base, grade: 2, skill: "reading" });
    expect(result).toContain("الصفوف الأولى");
    expect(result).toContain("يقرأ المتعلم نصًا");
  });

  it("rejects incomplete or out-of-range teacher inputs", () => {
    expect(() => buildCrossCurricularDraft({ ...base, grade: 13 })).toThrow();
    expect(() => buildCrossCurricularDraft({ ...base, lessonTitle: " " })).toThrow();
  });
});
