import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
const studio = readFileSync("app/(dashboard)/teacher/studio/TeacherLessonPackClient.tsx", "utf8");

describe("Dadyoom Teacher Studio owns the final teaching decision", () => {
  test("suggestions require teacher opt-in and can be edited", () => {
    expect(studio).toContain("approvedSuggestionIds");
    expect(studio).toContain("suggestionEdits");
    expect(studio).toContain("اعتماد التحسين");
    expect(studio).toContain("إلغاء الاعتماد");
    expect(studio).toContain("onChange={event => setSuggestionEdits");
    expect(studio).toContain("التحسينات التي اعتمدها المعلم للحزمة المطبوعة");
  });
  test("regeneration clears prior approvals and never updates official content", () => {
    expect(studio).toContain("setApprovedSuggestionIds([])");
    expect(studio).toContain("setSuggestionEdits({})");
    expect(studio).not.toContain('.from("lessons").update(');
  });
});
