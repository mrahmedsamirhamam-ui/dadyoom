import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
import {compareVerifiedToc,normalizeArabicLessonTitle} from "../scripts/compare-official-arabic-toc.mjs";
const packs=[1,2,3].map(grade=>JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-audits/arab-22-grade-"+grade+"-lesson-review-2026-10-27.json"),"utf8")));
describe("66 country-grade source-aware title comparisons",()=>{
 it("records 1746 actual unique lesson titles and keeps official certification false",()=>{
  expect(packs.map(x=>x.grade)).toEqual([1,2,3]);
  expect(packs.reduce((n,p)=>n+p.lessonCount,0)).toBe(1746);
  const rows=packs.flatMap(p=>p.lessonRecords);
  expect(new Set(rows.map(x=>x.lessonId)).size).toBe(1746);
  expect(rows.filter(x=>x.isGenericSkillPack)).toHaveLength(1188);
  for(const p of packs){
   expect(p.countryCount).toBe(22);
   expect(p.officialTitleMatchCertified).toBe(false);
   for(const l of p.lessonRecords){
    expect(l.grade).toBe(p.grade);
    expect(l.officialTextbookTitleMatched).toBe(false);
    expect(l.reviewStatus).toBe("requires-official-book-toc-evidence");
    expect(l.lessonId).toMatch(/^[a-f0-9-]{36}$/i);
    expect(l.title.trim().length).toBeGreaterThan(0);
   }
  }
 });
 it("marks exact, unscheduled, missing and generic-title candidates without auto-approval",()=>{
  const catalog={grade:1,officialTitleMatchCertified:false,lessonRecords:[
   {countryCode:"JO",status:"published",title:"الوحدة الأولى",semester:1,lessonId:"x",isGenericSkillPack:true},
   {countryCode:"JO",status:"published",title:"نحن نتعلم",semester:1,lessonId:"a",isGenericSkillPack:false,questionCount:4,activityCount:2,reviewStatus:"requires-official-book-toc-evidence"},
   {countryCode:"JO",status:"published",title:"إكرام الضيف",semester:null,lessonId:"b",isGenericSkillPack:false,questionCount:4,activityCount:2,reviewStatus:"requires-official-book-toc-evidence"}
  ]};
  const toc={grade:1,countryCode:"JO",semester:1,academicYear:"2026-2027",sourceAuthority:"official-ministry-or-authorized-curriculum-agency",editionVerified:true,tableOfContentsReviewed:true,sourceUrl:"https://nccd.gov.jo/reviewed.pdf",editionLabel:"2026-2027",lessons:[{title:"الوحدة الأولى",tocPage:5},{title:"نحن نتعلم",tocPage:6},{title:"إكرام الضيف",tocPage:7},{title:"مفقود",tocPage:8}]};
  const output=compareVerifiedToc(catalog,toc);
  expect(output.results.map(x=>x.status)).toEqual(["verified-official-title-missing-in-catalog","title-only-match-content-and-questions-pending","title-match-but-term-unverified","verified-official-title-missing-in-catalog"]);
  expect(output.counts).toMatchObject({officialHeadings:4,exactTitleAndSemester:1,titleMatchButTermUnknown:1,missingTitle:2});
  expect(normalizeArabicLessonTitle(" السَّلام  ")).toBe("السلام");
 });
 it("rejects arbitrary lesson lists without source edition, page, term and official authority",()=>{
  const c={grade:1,officialTitleMatchCertified:false,lessonRecords:[]};
  expect(()=>compareVerifiedToc(c,{grade:1,countryCode:"JO",semester:1,academicYear:"2026-2027",lessons:[{title:"درس",tocPage:2}]})).toThrow();
  expect(()=>compareVerifiedToc(c,{grade:1,countryCode:"JO",semester:1,academicYear:"2026-2027",sourceAuthority:"official-ministry-or-authorized-curriculum-agency",editionVerified:true,tableOfContentsReviewed:true,sourceUrl:"https://nccd.gov.jo/x",editionLabel:"2026-2027",lessons:[{title:"درس",tocPage:0}]})).toThrow();
 });
});