import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const file = "data/curriculum-packs/bh-2026-27-arabic-primary-g3-s1.json";
const pack = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8"));
const index = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bahrain-2026-s1-ministry-plan-index.json"), "utf8"));
const official = index.readingLessons.filter((record: { grade: number }) => record.grade === 3);
const lessons = pack.units.flatMap((unit: { lessons: unknown[] }) => unit.lessons) as Array<{
  number: number; title: string; content: string; summary: string;
  objectives: string[]; vocabulary: Array<{ word: string; meaning: string }>;
  source: { url: string; pageStart: number; pageEnd: number; label: string };
  questions: Array<{
    question: string; correctAnswer: string; explanation: string;
    options: Array<{ id: string; text: string }>;
  }>;
}>;
const norm = (s: string) => s.normalize("NFKD")
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
  .replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

describe("Bahrain 2026–27 grade-three original reading companion lessons", () => {
  it("links exactly 12 original lessons to the pre-verified Ministry 2026-27 titles and PDF page numbers", () => {
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.country.code).toBe("BH");
    expect(pack.grade.number).toBe(3);
    expect(pack.semester).toBe(1);
    expect(official).toHaveLength(12);
    expect(lessons).toHaveLength(12);
    expect(pack.units.map((u: { lessons: unknown[] }) => u.lessons.length)).toEqual([4,4,4]);
    expect(pack.units.map((u: { title: string }) => norm(u.title)))
      .toEqual(["قيم ومبادئ", "ألعاب وهوايات", "مواقف وعبر"].map(norm));
    expect(lessons.map(l => l.number)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(lessons.map(l => norm(l.title))).toEqual(official.map(
      (x: { title: string }) => norm(x.title),
    ));
    expect(index.sourceDocuments[0].sha256).toBe(
      "ec7191b7e450f356b2e59bcf676f81f42668be60f68637925d97b75c16cf1daf",
    );
    for (let j = 0; j < lessons.length; j++) {
      expect(lessons[j].source.url).toBe(
        "https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf",
      );
      expect(lessons[j].source.pageStart).toBe(official[j].sourcePdfPage);
      expect(lessons[j].source.pageEnd).toBe(official[j].sourcePdfPage);
      expect(lessons[j].source.label).toContain("لا من كتاب الطالب");
    }
  });

  it("provides substantial original reading, differentiated practice and a balanced 48-question bank", () => {
    expect(validateCurriculumPack(pack)).toEqual({ ok: true, errors: [] });
    const keys = { a: 0, b: 0, c: 0 };
    expect(lessons.reduce((n, l) => n + l.questions.length, 0)).toBe(48);
    for (const l of lessons) {
      expect(l.content.length).toBeGreaterThanOrEqual(1200);
      expect(l.content).toContain("نص قرائي إثرائي");
      expect(l.content).toContain("أتهيأ للقراءة");
      expect(l.content).toContain("أثناء القراءة");
      expect(l.content).toContain("بعد القراءة");
      expect(l.content).toContain("تعلم متمايز");
      expect(l.content).toContain("تقويم تكويني");
      expect(l.content).toContain("ليست صفحة النص بكتاب الطالب");
      expect(l.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(l.summary).toContain("وليس النص الرسمي");
      expect(l.objectives).toHaveLength(4);
      expect(l.vocabulary).toHaveLength(3);
      expect(l.questions).toHaveLength(4);
      for (const q of l.questions) {
        expect(q.options.map(option => option.id)).toEqual(["a", "b", "c"]);
        expect(new Set(q.options.map(option => norm(option.text))).size).toBe(3);
        expect(q.explanation.length).toBeGreaterThan(50);
        expect(q.options.some(option => option.id === q.correctAnswer)).toBe(true);
        keys[q.correctAnswer as keyof typeof keys]++;
      }
      expect(new Set(l.questions.map(q => norm(q.question))).size).toBe(4);
    }
    expect(keys).toEqual({ a: 16, b: 16, c: 16 });
  });

  it("does not publish, auto-merge or modify the 12 matching existing published lessons", () => {
    expect(pack.rights.contentOwner).toBe("dadyoom");
    expect(pack.rights.verified).toBe(true); // authorial rights, not ministry text review
    expect(pack.rights.officialTocVerified).toBe(false);
    expect(pack.rights.publicationReview)
      .toBe("pending-teacher-textbook-side-by-side-review");
    const trial = spawnSync(process.execPath, [
      "scripts/import-curriculum-pack.mjs", "--pack", file,
      "--apply", "--approve-reviewed-publish",
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(trial.status).not.toBe(0);
    expect(trial.stderr).toContain("CURRICULUM_PUBLISH_REVIEW_REQUIRED");
  });
});
