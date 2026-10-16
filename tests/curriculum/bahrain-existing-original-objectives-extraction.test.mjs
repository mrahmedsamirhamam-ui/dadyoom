import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("data/curriculum-completeness/bahrain-extract-existing-original-objectives-20261016.sql", "utf8");

describe("Bahrain: lossless extraction of original lesson goals", () => {
  test("keeps the scope to active, published, original lessons with empty structured goals", () => {
    for (const phrase of ["co.code='BH'", "c.is_active IS TRUE", "l.status='published'",
      "l.learning_objectives IS NULL", "l.learning_objectives='[]'::jsonb",
      "ضاديوم — إثراء مستقل أصلي", "ضاديوم — درس إثرائي أصلي"]) {
      expect(sql).toContain(phrase);
    }
    expect(sql).not.toContain("l.content LIKE 'هذا عنصر من كتاب");
  });

  test("recognizes nine explicit original-content goal markers without inventing textbook objectives", () => {
    for (const label of [
      "أهداف التعلم:", "أهداف التعليم:", "الأهداف التعليمية:",
      "أهداف تعلم قابلة للقياس:", "هدف تعلم واضح:", "هدف التعلم:",
      "المهارة المستهدفة:", "الأهداف:", "الهدف الأول:", "الهدف الثاني:", "الهدف الثالث:"
    ]) expect(sql).toContain(label);
    expect(sql).toContain("jsonb_array_elements_text(e.objectives)");
    expect(sql).toContain("length(btrim(item.goal)) NOT BETWEEN 20 AND 240");
  });

  test("a rerun cannot overwrite published content, statuses, book sources or student activity", () => {
    expect(sql).toContain("SET learning_objectives=e.objectives");
    expect(sql).not.toMatch(/SET\s+content\s*=/);
    expect(sql).not.toMatch(/SET\s+status\s*=/);
    expect(sql).not.toMatch(/source_pdf_url\s*=/);
    expect(sql).not.toMatch(/INSERT\s+INTO\s+public\.lessons/i);
    expect(sql).not.toContain("student_lesson_progress");
  });
});
