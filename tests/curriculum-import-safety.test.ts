import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readCompleteCurriculumBackup } from "../lib/curriculum-packs/complete-backup.mjs";

function fakeDatabase(rows: Array<{id: string}>, {
  cap = 45, changedCount = false, samePage = false, errorAt = -1,
}: { cap?: number; changedCount?: boolean; samePage?: boolean; errorAt?: number } = {}) {
  const offsets: number[] = [];
  return {
    offsets,
    from: (_table: string) => {
      const q = {
        select: (_cols: string, options: {count: string}) => {
          expect(options.count).toBe("exact");
          return q;
        },
        order: (column: string, opts: {ascending: boolean}) => {
          expect(column).toBe("id");
          expect(opts.ascending).toBe(true);
          return q;
        },
        range: (start: number, end: number) => {
          offsets.push(start);
          const sliceStart = samePage ? 0 : start;
          return Promise.resolve({
            count: changedCount && start > 0 ? rows.length + 1 : rows.length,
            data: rows.slice(sliceStart, sliceStart + Math.min(cap, end - start + 1)),
            error: start === errorAt ? {message:"database unavailable"} : null,
          });
        },
      };
      return q;
    },
  };
}

describe("curriculum importer complete pre-write backup", () => {
  it("preserves all 1205 rows even if the API caps a requested 500-row page at 45", async () => {
    const rows = Array.from({length:1205},(_,i) => ({id:String(i+1).padStart(6,"0")}));
    const db = fakeDatabase(rows);
    const full = await readCompleteCurriculumBackup(db,"questions");
    expect(full).toEqual(rows);
    expect(db.offsets).toEqual(expect.arrayContaining([0,45,90,1170]));
    expect(db.offsets.length).toBe(27);
  });

  it("detects partial or inconsistent backup instead of silently proceeding", async () => {
    const rows = Array.from({length:5},(_,i) => ({id:String(i).padStart(4,"0")}));
    await expect(readCompleteCurriculumBackup(fakeDatabase(rows,{cap:2,changedCount:true}),"lessons",{pageSize:3}))
      .rejects.toThrow("CURRICULUM_BACKUP_COUNT_CHANGED");
    await expect(readCompleteCurriculumBackup(fakeDatabase(rows,{cap:2,samePage:true}),"lessons",{pageSize:3}))
      .rejects.toThrow("CURRICULUM_BACKUP_IDS_NOT_ORDERED");
    await expect(readCompleteCurriculumBackup(fakeDatabase(rows,{cap:2,errorAt:2}),"lessons",{pageSize:3}))
      .rejects.toThrow("CURRICULUM_BACKUP_QUERY_FAILED");
    await expect(readCompleteCurriculumBackup(fakeDatabase(rows),"lessons",{maxRows:4}))
      .rejects.toThrow("CURRICULUM_BACKUP_TOO_LARGE");
  });

  it("rejects attempts to publish the existing pack without documented source review", () => {
    const script = resolve(process.cwd(),"scripts/import-curriculum-pack.mjs");
    const file = "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json";
    for (const flags of [["--apply"],["--apply","--approve-reviewed-publish"]]) {
      const run = spawnSync(process.execPath,[script,"--pack",file,...flags],{
        cwd:process.cwd(),encoding:"utf8",
      });
      expect(run.status).toBe(1);
      expect(run.stderr+run.stdout).toContain("CURRICULUM_PUBLISH_REVIEW_REQUIRED");
      expect(run.stdout).not.toContain("PACK_SCHEMA_PREFLIGHT=PASS");
    }
  });
});
