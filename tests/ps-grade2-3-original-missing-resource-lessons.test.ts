import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Q={question:string;correct:string;wrong:string[];explanation:string};
type L={countryCode:string;grade:number;semester:number;unitId:string;title:string;content:string;sourceUrl:string;questions:Q[]};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/ps-grade2-3-original-missing-resource-lessons-2026.json"),"utf8")) as {ministryEditionTOCVerified:boolean;lessons:L[]};
describe("9 genuine missing Palestinian topic lessons with original exercises",()=>{
 it("contains five grade-two and four grade-three source linked texts",()=>{
  expect(p.lessons).toHaveLength(9);
  expect(p.lessons.filter(l=>l.grade===2)).toHaveLength(5);
  expect(p.lessons.filter(l=>l.grade===3)).toHaveLength(4);
  expect(new Set(p.lessons.map(l=>l.grade+":"+l.semester+":"+l.title)).size).toBe(9);
  for(const l of p.lessons){
   expect(l.countryCode).toBe("PS");expect(l.unitId).toMatch(/^[a-f0-9-]{36}$/i);
   expect(l.sourceUrl).toMatch(/^https:\/\/elearn\.edu\.ps\/c[23]\/$/);
   expect(l.content).toContain("مادة إثرائية أصلية");
   expect(l.questions).toHaveLength(3);
   for(const q of l.questions){expect(new Set([q.correct,...q.wrong]).size).toBe(3);expect(q.explanation.length).toBeGreaterThan(14);}
  }
 });
 it("does not claim verified textbook editions",()=>expect(p.ministryEditionTOCVerified).toBe(false));
});