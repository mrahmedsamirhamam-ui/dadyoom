import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const generator = readFileSync(
  resolve(root, "services/ai/assessment.service.ts"), "utf8",
);

function walk(dir: string, results: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", ".git", ".cloudflare"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) results.push(full);
  }
  return results;
}

describe("legacy assessment generator private-key boundary", () => {
  it("is server-only because it creates and returns hidden answers", () => {
    expect(generator.trimStart().startsWith('import "server-only";')).toBe(true);
    expect(generator).toContain("correct_answer:");
    expect(generator).toContain("correctAnswer: row.correct_answer");
    for (const path of [
      "features/assessment/services/getAssessmentSessionAnalytics.ts",
      "features/assessment/services/saveAssessmentSessionAnswer.ts",
    ]) {
      expect(
        readFileSync(resolve(root, path), "utf8").trimStart().startsWith('import "server-only";'),
        path
      ).toBe(true);
    }
  });

  it("has no direct import from browser client components", () => {
    const offenders: string[] = [];
    for (const dir of ["app", "components", "features", "hooks", "lib", "services"]) {
      for (const file of walk(resolve(root, dir))) {
        const source = readFileSync(file, "utf8");
        if (!/^\s*["']use client["']\s*;/m.test(source.slice(0,256))) continue;
        if (/(?:services\/ai\/assessment\.service|features\/assessment\/services\/(?:getAssessmentSessionAnalytics|saveAssessmentSessionAnswer))(?:\.[cm]?[jt]s)?["']/.test(source)) {
          offenders.push(file.slice(root.length + 1));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
