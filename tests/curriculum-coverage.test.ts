import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "scripts/curriculum-coverage.mjs");
const run = (...flags: string[]) =>
  spawnSync(process.execPath, [script, ...flags], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

describe("curriculum coverage report", () => {
  it("does not mislabel pack validation as full official syllabus completion", () => {
    const output = run();
    expect(output.status).toBe(0);
    expect(output.stdout).toContain("CURRICULUM_PACK_SCHEMA_GATE=PASS");
    expect(output.stdout).toContain("OFFICIAL_SYLLABUS_MATCH=NOT_VERIFIED");
    expect(output.stdout).not.toContain("CURRICULUM_COVERAGE_GATE=PASS");
    expect(output.stdout).toMatch(/CURRICULUM_PACK_COUNTRY_COVERAGE=\d+\/22/);
  });

  it("fails strict mode when one or more countries still lack curriculum packs", () => {
    const baseline = run();
    expect(baseline.status).toBe(0);
    const match = baseline.stdout.match(/READY_COUNTRIES=(\d+)/);
    expect(match).not.toBeNull();
    const ready = Number(match?.[1]);
    const strict = run("--require-all-countries");
    if (ready === 22) {
      expect(strict.status).toBe(0);
    } else {
      expect(strict.status).toBe(1);
      expect(strict.stderr).toContain(`REQUIRED_COUNTRY_PACKS_MISSING=${22 - ready}`);
      expect(strict.stdout).toContain("CURRICULUM_COUNTRY_PACK_STATUS=PARTIAL");
    }
  });
});
