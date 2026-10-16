import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("data/curriculum-completeness/bahrain-extract-existing-original-objectives-20261016.sql", "utf8");

describe("Bahrain original lesson objectives: bulk structured-data safety", () => {
  test("only original, published, active Bahrain lessons with blank structured objectives qualify", () => {
    expect(sql).toContain("co.code = 'BH'");
    expect(sql).toContain("c.is_active IS TRUE");
    expect(sql).toContain("l.status = 'published'");
    expect(sql).toContain("l.learning_objectives IS NULL");
    expect(sql).toContain("l.learning_objectives = '[]'::jsonb");
    expect(sql).toContain("position('أهداف التعلم:' in l.content) > 0");
    expect(sql).toContain("ضاديوم — إثراء مستقل أصلي");
  });

  test("only extracts existing content goals; never invents or publishes textbook records", () => {
    expect(sql).toContain("split_part(split_part(l.content, 'أهداف التعلم:'");
    expect(sql).toContain("length(e.objective) BETWEEN 20 AND 240");
    expect(sql).toContain("SET learning_objectives = jsonb_build_array(e.objective)");
    expect(sql).not.toMatch(/SET\s+content\s*=/);
    expect(sql).not.toMatch(/SET\s+status\s*=/);
    expect(sql).not.toMatch(/INSERT\s+INTO\s+public\.lessons/i);
    expect(sql).not.toMatch(/source_pdf_url\s*=/);
  });
});
