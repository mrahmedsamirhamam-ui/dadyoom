import {readFileSync} from "node:fs";import {resolve} from "node:path";import {describe,expect,it} from "vitest";
type Q={order:number;question:string;options:Array<{id:string;text:string}>;answer:string;explanation:string};
type Lesson={countryCode:string;grade:number;semester:number;unitId:string;title:string;content:string;vocabulary:unknown[];questions:Q[];sourceTopic:{listedOnOfficialLearningPortal:boolean;editionTOC2026Verified:boolean}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/ps-grade2-3-five-missing-source-topics-2026.json"),"utf8")) as {rights:string;schoolYearEditionVerified:boolean;lessons:Lesson[]};
describe("Five PS primary lesson titles absent in production before import",()=>{
 it("contains original paragraphs, 15 contextual questions and no textbook reproduction",()=>{
  expect(p.schoolYearEditionVerified).toBe(false);expect(p.lessons).toHaveLength(5);
  expect(p.lessons.filter(x=>x.grade===2)).toHaveLength(2);
  expect(p.lessons.filter(x=>x.grade===3)).toHaveLength(3);
  expect(new Set(p.lessons.map(x=>x.title)).size).toBe(5);
  expect(p.lessons.flatMap(x=>x.questions)).toHaveLength(15);
  for(const l of p.lessons){
   expect(l.countryCode).toBe("PS");expect(l.unitId).toMatch(/^[a-f0-9-]{36}$/);
   expect(l.sourceTopic.listedOnOfficialLearningPortal).toBe(true);
   expect(l.sourceTopic.editionTOC2026Verified).toBe(false);
   expect(l.content).toContain("من تأليف ضاديوم");
   expect(l.vocabulary).toHaveLength(3);
   for(const q of l.questions){
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.options.some(o=>o.id===q.answer)).toBe(true);
    expect(q.explanation.length).toBeGreaterThan(20);
   }
  }
 });
});