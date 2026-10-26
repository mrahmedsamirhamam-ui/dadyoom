import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const path = "data/curriculum-packs/bh-2026-27-arabic-primary-g2-s1.json";
const pack = JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const official = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bahrain-2026-s1-ministry-plan-index.json"), "utf8"));
const lessons = pack.units.flatMap((u: { lessons: unknown[] }) => u.lessons) as Array<{
  number: number; title: string; content: string; objectives: string[];
  source: { url: string; pageStart: number; pageEnd: number; label: string };
  vocabulary: unknown[]; questions: Array<{
    question: string; options: Array<{ id: string; text: string }>;
    correctAnswer: string; explanation: string;
  }>;
}>;
const normalize = (value: string) => value.normalize("NFKD")
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
  .replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

describe("Bahrain Grade 2 2026-27 semester-1 original reading curriculum pack", () => {
  it("covers all twelve official plan reading titles in the correct order", () => {
    const listed = official.readingLessons.filter((l: { grade: number }) => l.grade === 2);
    expect(listed).toHaveLength(12);
    expect(lessons).toHaveLength(12);
    expect(lessons.map(l => l.number)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(lessons.map(l => normalize(l.title))).toEqual(listed.map(
      (l: { title: string }) => normalize(l.title),
    ));
    expect(pack.units.map((u: { lessons: unknown[] }) => u.lessons.length)).toEqual([4,4,4]);
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.semester).toBe(1);
    expect(pack.country.code).toBe("BH");
    expect(pack.grade.number).toBe(2);
  });

  it("requires verified source provenance, genuine explanations and 48 safe multiple-choice questions", () => {
    expect(validateCurriculumPack(pack)).toEqual({ ok: true, errors: [] });
    expect(lessons.reduce((n, l) => n + l.questions.length, 0)).toBe(48);
    const positions = { a: 0, b: 0, c: 0 };
    for (const lesson of lessons) {
      expect(lesson.content.length).toBeGreaterThanOrEqual(900);
      expect(lesson.content).toContain("نص تدريبي أصلي من تأليف ضاديوم");
      expect(lesson.content).toContain("قبل القراءة");
      expect(lesson.content).toContain("بعد القراءة");
      expect(lesson.content).toContain("فروق فردية");
      expect(lesson.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(lesson.objectives).toHaveLength(4);
      expect(lesson.vocabulary.length).toBeGreaterThanOrEqual(3);
      expect(lesson.source.url).toBe(pack.rights.sourceUrl);
      expect(lesson.source.url).toBe(
        "https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf",
      );
      expect(lesson.source.label).toContain("صفحات كتاب");
      expect(lesson.source.pageStart).toBeGreaterThan(0);
      expect(lesson.source.pageEnd).toBeGreaterThanOrEqual(lesson.source.pageStart);
      expect(lesson.questions).toHaveLength(4);
      expect(new Set(lesson.questions.map(q => normalize(q.question))).size).toBe(4);
      for (const q of lesson.questions) {
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options.map(x => x.text)).size).toBe(3);
        expect(q.options.map(x => x.id)).toEqual(["a","b","c"]);
        expect(q.options.some(x => x.id === q.correctAnswer)).toBe(true);
        expect(q.explanation.trim().length).toBeGreaterThan(18);
        positions[q.correctAnswer as keyof typeof positions]++;
      }
    }
    expect(Object.values(positions).every(n => n >= 10 && n <= 20)).toBe(true);
  });

  it("cannot publish without a separate textbook-alignment and editorial signoff", () => {
    expect(pack.rights.contentOwner).toBe("dadyoom");
    expect(pack.rights.verified).toBe(true); // original authored material rights
    expect(pack.rights.officialTocVerified).toBe(false);
    expect(pack.rights.publicationReview).toBe(
      "pending-teacher-textbook-side-by-side-review",
    );
    const trial = spawnSync(process.execPath, [
      "scripts/import-curriculum-pack.mjs", "--pack", path,
      "--apply", "--approve-reviewed-publish",
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(trial.status).not.toBe(0);
    expect(trial.stderr).toContain("CURRICULUM_PUBLISH_REVIEW_REQUIRED");
  });
});
