import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { guestLesson, guestQuestions, assessGuestAnswer } from "@/lib/growth/guest-trial";

describe("no-signup Arabic micro lesson", () => {
  it("defines one observable objective, prior knowledge and a worked example", () => {
    expect(guestLesson.objective).toContain("الفعل");
    expect(guestLesson.prerequisite.length).toBeGreaterThan(15);
    expect(guestLesson.explanation).toContain("الفعل");
    expect(guestLesson.workedExample).toContain("جملة فعلية");
  });

  it("teaches through guided practice and a distinct independent check", () => {
    expect(guestQuestions).toHaveLength(3);
    expect(guestQuestions.map((q) => q.phase)).toEqual(["practice", "practice", "check"]);
    const independent = guestQuestions[2];
    expect(independent.prompt).not.toBe(guestQuestions[1].prompt);
    expect(independent.answer).not.toBe(guestQuestions[1].answer);
    for (const question of guestQuestions) {
      expect(question.options).toContain(question.answer);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(30);
      expect(question.options.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("accepts diacritics only on an offered answer, rejecting invalid choices", () => {
    expect(assessGuestAnswer(guestQuestions[0], "يَرْكُض")).toBe(true);
    expect(assessGuestAnswer(guestQuestions[0], "كتاب")).toBe(false);
    expect(assessGuestAnswer(guestQuestions[0], "جملة غير موجودة")).toBe(false);
    expect(assessGuestAnswer(guestQuestions[2], "يكتب مازن رسالة")).toBe(true);
  });

  it("does not claim official curriculum approval", () => {
    expect(guestQuestions.map((q) => q.prompt).join(" ")).not.toMatch(/منهج معتمد|وزارة/);
  });

  it("keeps feedback and outcomes browser-local without claiming mastery", () => {
    const page = readFileSync(new URL("../app/try/page.tsx", import.meta.url), "utf8");
    expect(page).toContain("guestLesson.workedExample");
    expect(page).toContain('role="status"');
    expect(page).toContain('aria-live="polite"');
    expect(page).toContain("ليست حكمًا نهائيًا بإتقان المهارة");
    expect(page).toContain("سؤال التحقق الجديد يحتاج مراجعة");
    expect(page).not.toMatch(/localStorage|sessionStorage|fetch\(|sendBeacon\(/);
    expect(page).toContain('href="/signup"');
  });
  it("does not interrupt the first guest lesson with a global install or chat overlay", () => {
    const runtime = readFileSync(new URL("../components/runtime/DadyoomClientRuntime.tsx", import.meta.url), "utf8");
    expect(runtime).toContain('const inGuestLesson = pathname === "/try"');
    expect(runtime).toContain("!inGuestLesson ? <DadyoomInstallPrompt /> : null");
    expect(runtime).toContain("!inGuestLesson ? <DadCompanion /> : null");
    expect(runtime).toContain("<DadyoomAds />");
  });
});
