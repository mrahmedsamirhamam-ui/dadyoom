import { readFileSync } from "node:fs";
import { describe,expect,test } from "vitest";

const audit=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-source-provenance-20261011.json","utf8"));
describe("Bahrain published-lesson source-year snapshot",()=>{
  const sum=(name)=>audit.grades.reduce((n,row)=>n+row[name],0);
  test("all source categories reconcile to every published Bahrain lesson",()=>{
    expect(audit.countryCode).toBe("BH");
    expect(audit.academicYear).toBe("2026-2027");
    expect(audit.grades).toHaveLength(13);
    expect(sum("total")).toBe(1755);
    expect(sum("current_plan")).toBe(927);
    expect(sum("historical_plan")).toBe(589);
    expect(sum("without_source")).toBe(216);
    expect(sum("ebook_viewer")).toBe(18);
    expect(sum("other_source")).toBe(5);
    for(const row of audit.grades){
      expect(row.total).toBe(row.current_plan+row.historical_plan+row.without_source+row.ebook_viewer+row.other_source);
      expect(row.dadyoom_core_unsourced).toBe(row.without_source);
    }
  });
  test("the 12 secondary pathway name groups reconcile per grade",()=>{
    for(const grade of [10,11,12]){
      const tracks=audit.secondaryTracks.filter(x=>x.grade_number===grade);
      const summary=audit.grades.find(x=>x.grade_number===grade);
      expect(tracks.length).toBeGreaterThanOrEqual(8);
      expect(tracks.reduce((n,t)=>n+t.total,0)).toBe(summary.total);
      expect(tracks.reduce((n,t)=>n+t.historical_plan,0)).toBe(summary.historical_plan);
    }
  });
  test("actionable review samples are unique published lesson IDs with real HTTPS sources",()=>{
    expect(audit.reviewExamples.length).toBeGreaterThanOrEqual(20);
    expect(new Set(audit.reviewExamples.map(x=>x.id)).size).toBe(audit.reviewExamples.length);
    for(const sample of audit.reviewExamples){
      expect(sample.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(sample.title.trim().length).toBeGreaterThan(1);
      expect(sample.source_pdf_url).toMatch(/^https:\/\//);
    }
  });
  test("admin page is read-only, links to proof and never claims textbook parity",()=>{
    const page=readFileSync("app/admin/curriculum/coverage/sources/page.tsx","utf8");
    expect(page).toContain("audit.reviewExamples.map");
    expect(page).toContain("audit.secondaryTracks.map");
    expect(page).toContain("ليس استعلامًا حيًا");
    expect(page).not.toContain(".insert(");
    expect(page).not.toContain(".update(");
    expect(page).not.toContain("COMPLETE_BOOK");
  });
});
