import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const filename = resolve(process.cwd(), "data/curriculum-sources/bahrain-2026-s1-ministry-plan-index.json");
const index = JSON.parse(readFileSync(filename,"utf8"));
const lessons: Array<{grade:number;semester:number;lessonNumber:number;title:string;sourceFile:string;sourceSha256:string;sourcePdfPage:number;officialPageOfTextbook:null;publicationStatus:string}> = index.readingLessons;
const titleMatchAudit = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-sources/bahrain-2026-s1-reading-title-audit.json"),"utf8"));

describe("uploaded Bahrain 2026-27 Ministry Arabic study plan provenance", () => {
  it("registers all seven distinct official PDF files with immutable SHA-256 identifiers", () => {
    expect(index.academicYear).toBe("2026-2027");
    expect(index.semester).toBe(1);
    expect(index.sourceDocuments).toHaveLength(7);
    expect(index.sourceDocuments.map((p: {name:string})=>p.name)).toEqual(
      Array.from({length:7},(_,i)=>`Plan${i+1}.pdf`),
    );
    expect(index.sourceDocuments.every((p: {sha256:string;pages:number}) =>
      /^[a-f0-9]{64}$/.test(p.sha256) && Number.isInteger(p.pages) && p.pages>=3)).toBe(true);
  });

  it("anchors 12 named reading lessons per grade to real source PDF pages, without invented book pages", () => {
    expect(lessons).toHaveLength(24);
    expect(lessons.filter(l=>l.grade===2)).toHaveLength(12);
    expect(lessons.filter(l=>l.grade===3)).toHaveLength(12);
    for(const grade of [2,3]){
      expect(lessons.filter(l=>l.grade===grade).map(l=>l.lessonNumber))
        .toEqual(Array.from({length:12},(_,i)=>i+1));
    }
    const firstPlan=index.sourceDocuments[0];
    for(const lesson of lessons) {
      expect(lesson.semester).toBe(1);
      expect(lesson.title.trim().length).toBeGreaterThan(3);
      expect(lesson.sourceFile).toBe("Plan1.pdf");
      expect(lesson.sourceSha256).toBe(firstPlan.sha256);
      expect(lesson.sourcePdfPage).toBeGreaterThanOrEqual(lesson.grade===2?10:14);
      expect(lesson.sourcePdfPage).toBeLessThanOrEqual(lesson.grade===2?13:16);
      expect(lesson.officialPageOfTextbook).toBeNull();
      expect(lesson.publicationStatus).toBe("index_only_not_a_lesson");
    }
  });

  it("recognizes the photographer lesson as officially scheduled without publishing prior supplemental fiction", () => {
    expect(lessons.find(l=>l.grade===2&&l.lessonNumber===5)).toMatchObject({
      title:"المصور الصغير",sourcePdfPage:12,
    });
    const supplement=JSON.parse(readFileSync(resolve(process.cwd(),
      "data/curriculum-drafts/bh-g2-s1-original-learning-drafts.json"),"utf8"));
    expect(supplement.officialTocVerified).toBe(false);
    expect(supplement.publicationApproved).toBe(false);
    expect(supplement.lessons.every((l:{publicationApproved:boolean})=>l.publicationApproved===false)).toBe(true);
  });

  it("keeps title-only production matches separate from textbook-content approval", () => {
    const snapshot = titleMatchAudit;
    expect(snapshot.rows).toHaveLength(lessons.length);
    const ids = new Set(lessons.map(l=>`${l.grade}:${l.lessonNumber}`));
    expect(new Set(snapshot.rows.map((r:{grade:number;lessonNumber:number})=>
      `${r.grade}:${r.lessonNumber}`))).toEqual(ids);
    expect(snapshot.summary.itemsWithAtLeastOnePublishedTitle).toBe(24);
    expect(snapshot.summary.itemsWithNoPublishedTitle).toBe(0);
    expect(snapshot.summary.itemsWithMultiplePublishedTitleMatches).toBe(14);
    expect(snapshot.summary.qualityAndTextbookMatch).toBe("NOT_VERIFIED");
    expect(snapshot.summary.approvedToPublish).toBe(false);
    expect(snapshot.rows.every((r:{publishedTitleMatches:number})=>
      r.publishedTitleMatches>=1)).toBe(true);
  });

  it("records page ranges for all core basic education grades without assuming full subject alignment", () => {
    expect(index.primaryGradePageRanges.map((p: {grade:number})=>p.grade))
      .toEqual([1,2,3,4,5,6,7,8,9]);
    expect(index.scope).toContain("reading titles only");
    expect(index.warning).toContain("separate verifications");
  });
});
