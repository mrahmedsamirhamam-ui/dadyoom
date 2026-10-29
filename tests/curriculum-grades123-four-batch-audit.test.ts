import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => JSON.parse(readFileSync(resolve(process.cwd(),file),"utf8"));
const pack = read("data/curriculum-drafts/grade123-short-vowels-nominal-sentence-activities-20261029.json") as {
 containsAnswerKeys: boolean;
 templates: Array<{topic:string;grade:number;order:number;type:string;prompt:string;content:{
  manualReviewRequired:boolean;items?:Array<{options:string[]}>;left?:string[];right?:string[];text?:string;
 }}>;
};
const audit = read("data/audits/grades123-22countries-after-four-batches-20261029.json") as {
 countries:Array<{country_code:string;grades:Array<{grade:number;published:number;total:number;after_four_6_to_10:number;newly_improved_lessons:number;skills:number}>}>;
 totals:{total:number;published:number;drafts:number;after_four_6_to_10:number;after_prev_6_to_10:number;before_all_6_to_10:number;skills:number;structural_candidates:number;newly_improved_lessons:number};
 nextBatchGrades456Allowed:boolean;curriculumScopeVerified:boolean;audioEndToEndVerified:boolean;roleEndToEndVerified:boolean;gradingSecurityVerified:boolean;
};
const review = read("data/review-queue/20261029-phonics-nominal-132-lessons.json") as {
 entries:Array<{lessonId:string;grade:number;countryCode:string;addedActivities:number;publishedActivities:number;writingLinked:boolean;humanReviewStatus:string}>;
 counts:{lessons:number;addedActivities:number;writingSkillLinksAdded:number};
};
describe("Dadyoom 22-country Grade1–3 source and immutable post-4-batch audit",()=>{
 it("contains eighteen original, age-graded public-safe activity definitions without scoring keys",()=>{
   expect(pack.containsAnswerKeys).toBe(false);
   expect(pack.templates).toHaveLength(18);
   expect(new Set(pack.templates.map(x=>x.topic+"/"+x.grade+"/"+x.order)).size).toBe(18);
   for(const t of pack.templates){
     expect(["الحركات القصيرة","الجملة الاسمية البسيطة"]).toContain(t.topic);
     expect([1,2,3]).toContain(t.grade);
     expect(t.prompt.length).toBeGreaterThan(40);
     expect(t.content.manualReviewRequired).toBe(true);
     expect(t.type).toBe(t.order===4?"fill_blank":t.order===5?"matching":"writing");
     if(t.order===4) {
       expect(t.content.items?.[0].options).toHaveLength(3);
       expect(new Set(t.content.items?.[0].options).size).toBe(3);
     }
     if(t.order===5) {
       expect(t.content.left).toHaveLength(2);
       expect(t.content.right).toHaveLength(2);
       expect(new Set(t.content.left).size).toBe(2);
       expect(new Set(t.content.right).size).toBe(2);
     }
     if(t.order===6) expect(t.content.text?.length).toBeGreaterThan(25);
   }
   const src=readFileSync(resolve(process.cwd(),"data/curriculum-drafts/grade123-short-vowels-nominal-sentence-activities-20261029.json"),"utf8");
   expect(src).not.toMatch(/"answer"\s*:|"correct_answer"\s*:|"model_answer"\s*:|"student_id"\s*:/u);
 });
 it("verifies 66 country-grade groups and current uncompleted gate without pretending release",()=>{
   expect(audit.countries).toHaveLength(22);
   expect(new Set(audit.countries.map(c=>c.country_code)).size).toBe(22);
   const grades=audit.countries.flatMap(c=>c.grades);
   expect(grades).toHaveLength(66);
   for(const c of audit.countries) expect(c.grades.map(g=>g.grade).sort()).toEqual([1,2,3]);
   expect(grades.every(g=>g.newly_improved_lessons===2)).toBe(true);
   expect(audit.totals).toMatchObject({total:1803,published:1746,drafts:57,before_all_6_to_10:108,after_prev_6_to_10:240,after_four_6_to_10:372,skills:1078,structural_candidates:357,newly_improved_lessons:132});
   expect(grades.some(g=>g.after_four_6_to_10<g.published)).toBe(true);
   expect(audit.nextBatchGrades456Allowed).toBe(false);
   expect(audit.curriculumScopeVerified).toBe(false);
   expect(audit.audioEndToEndVerified).toBe(false);
   expect(audit.roleEndToEndVerified).toBe(false);
   expect(audit.gradingSecurityVerified).toBe(false);
 });
 it("queues all 132 actual lesson IDs for human review without fake approval",()=>{
   expect(review.entries).toHaveLength(132);
   expect(review.counts).toMatchObject({lessons:132,addedActivities:396,writingSkillLinksAdded:130});
   expect(new Set(review.entries.map(x=>x.lessonId)).size).toBe(132);
   expect(review.entries.every(x=>x.addedActivities===3 && x.publishedActivities===6 && x.writingLinked && x.humanReviewStatus==="pending_human_review")).toBe(true);
   expect(review.entries.filter(x=>x.grade===1)).toHaveLength(44);
   expect(review.entries.filter(x=>x.grade===2)).toHaveLength(44);
   expect(review.entries.filter(x=>x.grade===3)).toHaveLength(44);
 });
});
