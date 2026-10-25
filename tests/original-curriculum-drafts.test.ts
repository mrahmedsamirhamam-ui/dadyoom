import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validateOriginalCurriculumDrafts } from "../scripts/validate-original-curriculum-drafts.mjs";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const file = "data/curriculum-drafts/bh-g2-s1-original-learning-drafts.json";
const draft = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8"));
const deepCopy = () => JSON.parse(JSON.stringify(draft));
const grade3Draft = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-drafts/bh-g3-s1-original-learning-drafts.json"), "utf8"));
const grade4Draft = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-drafts/bh-g4-s1-original-learning-drafts.json"), "utf8"));


describe("Bahrain grade-two original curricular lesson content", () => {
  it("has six substantial original lessons with four graded questions each", () => {
    const result = validateOriginalCurriculumDrafts(draft);
    expect(result).toEqual({ ok: true, errors: [], lessons: 6, questions: 24 });
    expect(draft.lessons.every((l: {content: string}) => l.content.length >= 900)).toBe(true);
  });
  it("validates six distinct grade-three lessons without ministry alignment claims", () => {
    expect(grade3Draft.grade).toBe(3);
    expect(validateOriginalCurriculumDrafts(grade3Draft)).toEqual({
      ok: true, errors: [], lessons: 6, questions: 24,
    });
    expect(validateCurriculumPack(grade3Draft).ok).toBe(false);
    expect(grade3Draft.lessons.every((l: { alignment: {officialTocVerified: boolean}; publicationApproved: boolean }) =>
      l.alignment.officialTocVerified === false && l.publicationApproved === false)).toBe(true);
  });

  it("validates six original grade-four lessons and blocks any official syllabus claim", () => {
    expect(grade4Draft.grade).toBe(4);
    expect(validateOriginalCurriculumDrafts(grade4Draft)).toEqual({
      ok: true, errors: [], lessons: 6, questions: 24,
    });
    expect(grade4Draft.officialTocVerified).toBe(false);
    expect(validateCurriculumPack(grade4Draft).ok).toBe(false);
  });

  it("checks grade-two through grade-four packets without changing the database", () => {
    const result = spawnSync(process.execPath, [
      resolve(process.cwd(), "scripts/validate-original-curriculum-drafts.mjs"),
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("ORIGINAL_DRAFT_PACKS=3");
    expect(result.stdout).toContain("ORIGINAL_DRAFT_LESSONS=18");
    expect(result.stdout).toContain("ORIGINAL_DRAFT_QUESTIONS=72");
    expect(result.stdout).toContain("DATABASE_WRITES=NONE");
    expect(result.stdout).toContain("OFFICIAL_2026_TOC_MATCH=NOT_VERIFIED");
  });

  it("cannot masquerade as a 2026-27 official or import-ready published pack", () => {
    expect(draft.status).toBe("draft");
    expect(draft.publicationApproved).toBe(false);
    expect(draft.officialTocVerified).toBe(false);
    expect(draft.lessons.every((l: {publicationApproved: boolean; alignment: { officialTocVerified: boolean }}) =>
      l.publicationApproved === false && l.alignment.officialTocVerified === false)).toBe(true);
    expect(validateCurriculumPack(draft).ok).toBe(false);
  });
  it("rejects a 2026 ministry-title claim without a source review", () => {
    const tampered = deepCopy();
    tampered.publicationApproved = true;
    tampered.officialTocVerified = true;
    tampered.lessons[0].alignment.officialTocVerified = true;
    const result = validateOriginalCurriculumDrafts(tampered);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("DRAFT_PUBLICATION_MUST_BE_BLOCKED");
    expect(result.errors.join(" ")).toContain("MUST_REMAIN_UNPUBLISHED");
  });
  it("rejects OCR placeholder titles, thin content and forged answer keys", () => {
    const tampered = deepCopy();
    tampered.lessons[0].title = "(الوحدة) عنوان الدرس ورقمه الكتاب والصفحات";
    tampered.lessons[1].content = "نص عام";
    tampered.lessons[2].questions[0].correctAnswer = "not-an-option";
    const result = validateOriginalCurriculumDrafts(tampered);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e: string) => e.includes("PLACEHOLDER_TITLE"))).toBe(true);
    expect(result.errors.some((e: string) => e.includes("CONTENT_INCOMPLETE"))).toBe(true);
    expect(result.errors.some((e: string) => e.includes("MCQ_NOT_SERVER_GRADABLE"))).toBe(true);
  });
  it("rejects answer keys biased to a single option position", () => {
    const biased = deepCopy();
    for (const lesson of biased.lessons) {
      for (const question of lesson.questions) question.correctAnswer = "a";
    }
    const result = validateOriginalCurriculumDrafts(biased);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("DRAFT_MCQ_ANSWER_POSITIONS_PREDICTABLE");
  });

  it("keeps both original draft packs balanced without disclosing answer keys to students", () => {
    for (const pack of [draft, grade3Draft, grade4Draft]) {
      const positions = pack.lessons.flatMap((lesson: {questions: Array<{correctAnswer: string}>}) =>
        lesson.questions.map((q) => q.correctAnswer));
      const counts = ["a","b","c"].map((key) => positions.filter((v: string) => v === key).length);
      expect(counts).toEqual([8,8,8]);
      expect(pack.lessons.every((lesson: { publicationApproved: boolean }) =>
        lesson.publicationApproved === false)).toBe(true);
    }
  });

  it("does not support applying unpublished drafts through the validator", () => {
    const result = spawnSync(process.execPath, [
      resolve(process.cwd(), "scripts/validate-original-curriculum-drafts.mjs"),
      file, "--publish",
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("CURRICULUM_DRAFT_PUBLICATION_BLOCKED=YES");
  });
});
