import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isGenericLessonPlaceholder, validateCurriculumPack } from "@/lib/curriculum-packs/validate.mjs";
import {
  BACKUP_TABLES,
  readVerifiedTableBackup,
  readVerifiedCurriculumBackup,
  curriculumLessonSlug,
} from "@/lib/curriculum-packs/import-safety.mjs";

type Row = { id: string; payload?: string };
function mockReadOnlyDatabase(
  tableData: Record<string, Row[]>,
  options: { serverCap?: number; failAfter?: number; countAfter?: number } = {},
) {
  const requests: Array<{ table: string; from?: number }> = [];
  const counts = new Map<string, number>();
  const db = {
    from(table: string) {
      const data = tableData[table] ?? [];
      return {
        select(column: string, filter?: { head?: boolean; count?: string }) {
          if (column === "id" && filter?.head) {
            const call = (counts.get(table) ?? 0) + 1;
            counts.set(table, call);
            return Promise.resolve({
              count: call > 1 && options.countAfter !== undefined
                ? options.countAfter
                : data.length,
              error: null,
            });
          }
          if (column !== "*") throw new Error("Unexpected backup select");
          return {
            order(field: string) {
              if (field !== "id") throw new Error("Unordered snapshot");
              return {
                range(from: number, to: number) {
                  requests.push({ table, from });
                  if (options.failAfter !== undefined && from >= options.failAfter) {
                    return Promise.resolve({ data: null, error: { message: "private error" } });
                  }
                  return Promise.resolve({
                    data: data.slice(from, Math.min(to + 1, from + (options.serverCap ?? 1000))),
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
  return { db, requests };
}

describe("curriculum pack import integrity", () => {
  it("reads all 8,307 rows even when PostgREST caps pages at 200", async () => {
    const lessonRows = Array.from({ length: 8307 }, (_, i) => ({ id: String(i).padStart(8, "0") }));
    const { db, requests } = mockReadOnlyDatabase({ lessons: lessonRows }, { serverCap: 200 });
    const rows = await readVerifiedTableBackup(db, "lessons");
    expect(rows).toEqual(lessonRows);
    expect(requests.length).toBe(42);
    expect(requests.at(-1)).toEqual({ table: "lessons", from: 8200 });
  });

  it("refuses a partial page, changed count or duplicate IDs before import", async () => {
    const records = Array.from({ length: 601 }, (_, i) => ({ id: String(i) }));
    await expect(readVerifiedTableBackup(
      mockReadOnlyDatabase({ questions: records }, { failAfter: 500 }).db,
      "questions",
    )).rejects.toThrow("CURRICULUM_BACKUP_PAGE_FAILED:questions");

    await expect(readVerifiedTableBackup(
      mockReadOnlyDatabase({ questions: records }, { countAfter: 602 }).db,
      "questions",
    )).rejects.toThrow("CURRICULUM_BACKUP_CHANGED_DURING_EXPORT:questions");

    await expect(readVerifiedTableBackup(
      mockReadOnlyDatabase({ questions: [{ id: "same" }, { id: "same" }] }).db,
      "questions",
    )).rejects.toThrow("CURRICULUM_BACKUP_DUPLICATE_OR_MISSING_ID:questions");
  });

  it("refuses oversized or inaccessible snapshots rather than exporting an incomplete backup", async () => {
    const rows = [{ id: "a" }, { id: "b" }];
    await expect(readVerifiedTableBackup(
      mockReadOnlyDatabase({ lessons: rows }).db,
      "lessons", { maxRows: 1 },
    )).rejects.toThrow("CURRICULUM_BACKUP_MAX_ROWS_EXCEEDED:lessons");
    await expect(readVerifiedTableBackup(
      mockReadOnlyDatabase({ lessons: rows }, { failAfter: 0 }).db,
      "lessons",
    )).rejects.toThrow("CURRICULUM_BACKUP_PAGE_FAILED:lessons");
  });

  it("exports all seven backed-up tables with no mutation methods", async () => {
    const objects = Object.fromEntries(BACKUP_TABLES.map(name => [name, [{ id: name }]]));
    const { db } = mockReadOnlyDatabase(objects);
    const snapshot = await readVerifiedCurriculumBackup(db) as Record<string, Row[]>;
    for (const name of BACKUP_TABLES) {
      expect(snapshot[name]).toEqual([{ id: name }]);
    }
    expect(Object.keys(snapshot)).toHaveLength(7);
  });

  it("supports numbering that restarts in each unit but not duplicate numbers within one unit", () => {
    const sample = JSON.parse(readFileSync(
      "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json", "utf8",
    ));
    sample.units[1].lessons[0].number = sample.units[0].lessons[0].number;
    expect(validateCurriculumPack(sample).ok).toBe(true);

    sample.units[1].lessons[1].number = sample.units[1].lessons[0].number;
    const invalid = validateCurriculumPack(sample);
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.some((message: string) =>
      message.includes("duplicate lesson number within unit"))).toBe(true);
  });

  it("blocks known TOC-scrape placeholders even when longer than the minimum", () => {
    const sample = JSON.parse(readFileSync(
      "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json", "utf8",
    ));
    const boilerplate = "يتناول هذا الدرس موضوع «الدّرس الثالث». " +
      "يبدأ التعلم بتهيئة قصيرة، ثم قراءة أو مناقشة الموضوع، " +
      "واستخراج الفكرة الرئيسة، ثم تطبيقها في نشاط شفهي وكتابي مناسب لمستوى الطالب.";
    expect(boilerplate.length).toBeGreaterThan(120);
    expect(isGenericLessonPlaceholder(boilerplate)).toBe(true);
    sample.units[0].lessons[0].content = boilerplate;
    const result = validateCurriculumPack(sample);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "unit 1 lesson 1: generic source placeholder is not a teachable lesson",
    );
  });

  it("does not treat a real teaching text or mere page heading as the known boilerplate", () => {
    const sample = JSON.parse(readFileSync(
      "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json", "utf8",
    ));
    expect(isGenericLessonPlaceholder(sample.units[0].lessons[0].content)).toBe(false);
    expect(isGenericLessonPlaceholder("الدّرس الثالث")).toBe(false);
    expect(isGenericLessonPlaceholder(null)).toBe(false);
    expect(validateCurriculumPack(sample).ok).toBe(true);
  });

  it("makes new slugs unit-scoped and rejects invalid identifiers", () => {
    const key = "BH:2026:arabic:primary:1:s1";
    expect(curriculumLessonSlug(key, 1, 1))
      .toBe("bh-2026-arabic-primary-1-s1-u01-l01");
    expect(curriculumLessonSlug(key, 1, 1))
      .not.toBe(curriculumLessonSlug(key, 2, 1));
    expect(() => curriculumLessonSlug("العربية", 1, 1))
      .toThrow("INVALID_CURRICULUM_LESSON_SLUG_INPUT");
  });
});
