import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const filename = "data/curriculum-packs/bh-2026-27-arabic-primary-g4-s1.json";
const pack = JSON.parse(readFileSync(resolve(process.cwd(), filename), "utf8"));
const official = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bahrain-2026-s1-ministry-plan-index.json"), "utf8"));
const g4 = official.readingLessons.filter((l: { grade: number }) => l.grade === 4);
const lessons = pack.units.flatMap((u: { lessons: unknown[] }) => u.lessons) as Array<{
  number: number; title: string; content: string; objectives: string[];
  vocabulary: unknown[];
  source: { label: string; url: string; pageStart: number; pageEnd: number };
  questions: Array<{ question: string; correctAnswer: string; explanation: string; options: Array<{ id: string; text: string }> }>;
}>;
const normalized = (v: string) => v.normalize("NFKD")
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
  .replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

describe("Bahrain Grade 4 official-plan-aligned original companion reading pack", () => {
  it("follows all 14 authentic 2026-27 titles and precisely records PDF-plan page provenance", () => {
    expect(pack.academicYear).toBe("2026-2027");
    expect(pack.country.code).toBe("BH");
    expect(pack.grade.number).toBe(4);
    expect(pack.semester).toBe(1);
    expect(g4).toHaveLength(14);
    expect(lessons).toHaveLength(14);
    expect(pack.units.map((u: { lessons: unknown[] }) => u.lessons.length)).toEqual([3,4,4,3]);
    expect(lessons.map(l => l.number)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    expect(lessons.map(l => normalized(l.title))).toEqual(g4.map(
      (l: { title: string }) => normalized(l.title),
    ));
    for (let i = 0; i < lessons.length; i++) {
      expect(lessons[i].source.url).toBe(
        "https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf",
      );
      expect(lessons[i].source.pageStart).toBe(g4[i].sourcePdfPage);
      expect(lessons[i].source.pageEnd).toBe(g4[i].sourcePdfPage);
      expect(lessons[i].source.label).toContain("ليست صفحة كتاب الطالب");
    }
  });

  it("contains 14 full original passages, higher-order tasks and a valid 56-MCQ bank", () => {
    expect(validateCurriculumPack(pack)).toEqual({ ok: true, errors: [] });
    expect(lessons.reduce((n, l) => n + l.questions.length, 0)).toBe(56);
    const keys = { a: 0, b: 0, c: 0 };
    for (const lesson of lessons) {
      expect(lesson.content.length).toBeGreaterThanOrEqual(1400);
      expect(lesson.content).toContain("مادة قراءة وتفكير أصيلة من ضاديوم");
      expect(lesson.content).toContain("التفكير الأولي");
      expect(lesson.content).toContain("فهم المفردات والأدلة");
      expect(lesson.content).toContain("الفروق الفردية");
      expect(lesson.content).toContain("مهارات القرن الحادي والعشرين");
      expect(lesson.content).toContain("صفحة الخطة ليست صفحة الكتاب");
      expect(lesson.content).not.toContain("يتناول هذا الدرس موضوع");
      expect(lesson.objectives).toHaveLength(4);
      expect(lesson.vocabulary).toHaveLength(3);
      expect(lesson.questions).toHaveLength(4);
      expect(new Set(lesson.questions.map(q => normalized(q.question))).size).toBe(4);
      for (const q of lesson.questions) {
        expect(q.options.map(o => o.id)).toEqual(["a","b","c"]);
        expect(new Set(q.options.map(o => normalized(o.text))).size).toBe(3);
        expect(q.options.some(o => o.id === q.correctAnswer)).toBe(true);
        expect(q.explanation.length).toBeGreaterThan(75);
        keys[q.correctAnswer as keyof typeof keys]++;
      }
    }
    expect(Object.values(keys).every(count => count >= 15 && count <= 21)).toBe(true);
  });

  it("explicitly does not replace the Quran, Hadith, Ministry poetry or existing school lessons", () => {
    for (const index of [0,1,5,13]) {
      expect(lessons[index].content).toContain("ليست نصًا مدرسيًا أو آية قرآنية أو حديثًا أو قصيدة");
    }
    expect(pack.units.every((unit: { description: string }) =>
      unit.description.includes("وليس اسم وحدة وزارية"))).toBe(true);
    expect(pack.rights.contentOwner).toBe("dadyoom");
    expect(pack.rights.officialTocVerified).toBe(false);
    expect(pack.rights.publicationReview).toBe(
      "pending-teacher-textbook-side-by-side-review",
    );
    const trial = spawnSync(process.execPath, [
      "scripts/import-curriculum-pack.mjs", "--pack", filename,
      "--apply", "--approve-reviewed-publish",
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(trial.status).not.toBe(0);
    expect(trial.stderr).toContain("CURRICULUM_PUBLISH_REVIEW_REQUIRED");
  });
});
