import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BAHRAIN_SECONDARY_TRACKS, secondaryTrackTitle, secondaryTrackSlug } from "../../lib/curriculum/bahrain-secondary-track-review";

const audit = JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json", "utf8"));
const page = readFileSync("app/admin/curriculum/coverage/toc-review/secondary/[grade]/[track]/[term]/page.tsx", "utf8");
const index = readFileSync("app/admin/curriculum/coverage/toc-review/page.tsx", "utf8");

describe("Bahrain secondary TOC candidates", () => {
  it("tracks 24 unique grade/pathway/term scopes", () => {
    const books = (audit.books as Array<{ program: string; grade: number | null; track: string | null; semesterOrBookPart: number; liveSnapshotReconciliation: { curriculumName: string } }>).filter(x => x.program === "الثانوي العام/النوعي");
    expect(books).toHaveLength(24);
    expect(Object.keys(BAHRAIN_SECONDARY_TRACKS)).toHaveLength(4);
    for (const b of books) {
      const slug = secondaryTrackSlug(b.track);
      expect(slug).toBeTruthy();
      expect(secondaryTrackTitle(slug!)).toBe(b.track);
      expect([10,11,12]).toContain(b.grade);
      expect([1,2]).toContain(b.semesterOrBookPart);
      expect(b.liveSnapshotReconciliation.curriculumName).toBeTruthy();
    }
    expect(index).toContain('secondaryTrackSlug(book.track)');
  });
  it("requires exact curriculum name, grade and semester, excludes enrichment", () => {
    expect(page).toContain('row.track === track');
    expect(page).toContain("book.liveSnapshotReconciliation?.curriculumName");
    expect(page).toContain('.eq("name_ar", curriculumName)');
    expect(page).toContain('.eq("grade_number", grade)');
    expect(page).toContain('.eq("semester", term)');
    expect(page).toContain('["plan-scheduled", "official-book-unscheduled"]');
    expect(page).toContain("inspectTocMatches(evidence.data.toc_outline, candidates, term)");
  });
  it("does not certify old second-semester plans or mutate published lessons", () => {
    expect(page).toContain("خطة 2025–2026 مرجع تاريخي");
    expect(page).toContain("لا اعتماد تلقائي");
    expect(page).not.toContain('.from("lessons").update(');
    expect(audit.summary.completeBooks).toBe(0);
  });
});
