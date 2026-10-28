import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Item={title:string;grade:number;semester:number;countryCode:string;content:string;unitId:string;sortOrder:number;questions:Array<{question:string;correct:string;wrong:string[];explanation:string}>;vocabulary:Array<{word:string;meaning:string}>;sourceTopicEvidence:{verifiedTopicOnMinistryLearningPortal:boolean;currentEditionTOCVerified:boolean}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/ps-g1-complete-portal-topic-original-supplements-2026.json"),"utf8")) as {countryCode:string;grade:number;officialTOCVerified:boolean;lessons:Item[]};
describe("Palestinian Grade-1 independent original lesson topic completions",()=>{
 it("authors remaining 23 distinct letter lessons and two reading topics with non-copying exercises",()=>{
  expect(p.countryCode).toBe("PS");expect(p.grade).toBe(1);
  expect(p.lessons).toHaveLength(25);
  expect(p.lessons.filter(x=>x.title.startsWith("حرف "))).toHaveLength(23);
  expect(new Set(p.lessons.map(x=>x.title)).size).toBe(25);
  expect(p.lessons.flatMap(x=>x.questions)).toHaveLength(77);
  for(const l of p.lessons){
   expect(l.countryCode).toBe("PS");expect(l.grade).toBe(1);expect([1,2]).toContain(l.semester);
   expect(l.unitId).toMatch(/^[a-f0-9-]{36}$/);
   expect(l.content).toContain("مادة إثرائية أصلية");
   expect(l.sourceTopicEvidence.verifiedTopicOnMinistryLearningPortal).toBe(true);
   expect(l.sourceTopicEvidence.currentEditionTOCVerified).toBe(false);
   for(const q of l.questions){
    expect(q.question.length).toBeGreaterThan(15);
    expect(new Set([q.correct,...q.wrong]).size).toBe(3);
   }
  }
  expect(p.officialTOCVerified).toBe(false);
 });
});