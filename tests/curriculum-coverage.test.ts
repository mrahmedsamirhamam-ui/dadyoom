import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCurriculumControlCenter } from "../lib/curriculum-packs/control-center";

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

  it("separates locally authored Grade 2–4 companion lessons from publication-reviewed readiness", () => {
    const overview = getCurriculumControlCenter();
    const awaitingReview = overview.packs.filter(pack =>
      /bh-2026-27-arabic-primary-g[234]-s1/.test(pack.fileName));
    expect(awaitingReview).toHaveLength(3);
    expect(awaitingReview.every(pack =>
      pack.shapeOk && pack.verified &&
      !pack.officialTocVerified && !pack.publicationReviewed)).toBe(true);
    expect(awaitingReview.reduce((n, pack) => n + pack.lessonCount, 0)).toBe(38);
    expect(overview.authoredPacks).toBeGreaterThanOrEqual(3);
    expect(overview.pendingReviewPacks).toBeGreaterThanOrEqual(3);
    expect(overview.authoredLessons).toBeGreaterThanOrEqual(38);
    expect(overview.totalLessons).toBeLessThan(overview.authoredLessons);

    const output = run();
    expect(output.status).toBe(0);
    expect(output.stdout).toContain("TOTAL_AUTHORED_PACK_LESSONS=");
    expect(output.stdout).toContain("TOTAL_READY_PACK_LESSONS=");
    expect(output.stdout).toContain("PUBLICATION_REVIEWED_PACKS=");
    expect(output.stdout).toContain("PACK_AUTHORING_VALID_PENDING_REVIEW=bh-2026-27-arabic-primary-g3-s1.json");
    expect(output.stdout).toContain("PACK_AUTHORING_VALID_PENDING_REVIEW=bh-2026-27-arabic-primary-g4-s1.json");
    expect(output.stdout).not.toContain("PACK_READY=bh-2026-27-arabic-primary-g3-s1.json");
    expect(output.stdout).not.toContain("PACK_READY=bh-2026-27-arabic-primary-g4-s1.json");
    expect(output.stdout).toContain("OFFICIAL_SYLLABUS_MATCH=NOT_VERIFIED");
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
