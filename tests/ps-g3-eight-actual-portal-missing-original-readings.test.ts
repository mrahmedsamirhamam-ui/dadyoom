import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Q={question:string;questionType:string;options:Array<{id:string;text:string}>;correctAnswer:string;explanation:string;level:string};
type L={countryCode:string;grade:number;semester:number;title:string;unitId:string;content:string;vocabulary:Array<{word:string;meaning:string;example:string}>;questions:Q[];teacherReview:string;officialTocVerified:boolean};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/ps-g3-eight-actual-portal-missing-original-readings-2026.json"),"utf8")) as {
 countryCode:string;grade:number;sourceState:{historicalBookYear:number;academicYear2026EditionVerified:boolean;officialReadingTextReproduced:boolean};rights:{teacherReview:string;officialTextbookEditionMapped:boolean};lessons:L[]};
describe("Eight Palestinian grade-three missing reading topics with original Dadyoom material",()=>{
 it("has 8 unique lesson titles, 32 contextual vocabulary items, 32 specific MCQs",()=>{
  expect(p.countryCode).toBe("PS");expect(p.grade).toBe(3);
  expect(p.lessons).toHaveLength(8);
  expect(new Set(p.lessons.map(l=>l.title)).size).toBe(8);
  expect(p.lessons.flatMap(l=>l.vocabulary)).toHaveLength(32);
  expect(p.lessons.flatMap(l=>l.questions)).toHaveLength(32);
  const levels=["remember","understand","analyze","apply"];
  for(const l of p.lessons){
   expect(l.countryCode).toBe("PS");expect(l.grade).toBe(3);
   expect([1,2]).toContain(l.semester);
   expect(l.unitId).toMatch(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
   expect(l.content).toContain("مادة إثرائية أصلية من ضاديوم");
   expect(l.content).toContain("ليس نص الكتاب الوزاري");
   expect(l.teacherReview).toBe("pending");expect(l.officialTocVerified).toBe(false);
   expect(l.questions.map(q=>q.level)).toEqual(levels);
   for(const q of l.questions){
    expect(q.questionType).toBe("multiple_choice");
    expect(q.options.map(o=>o.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(o=>o.text)).size).toBe(3);
    expect(q.options.some(o=>o.id===q.correctAnswer)).toBe(true);
    expect(q.explanation.length).toBeGreaterThan(17);
   }
  }
 });
 it("never claims a current ministry edition or copies a public text",()=>{
  expect(p.sourceState).toMatchObject({historicalBookYear:2024,academicYear2026EditionVerified:false,officialReadingTextReproduced:false});
  expect(p.rights).toMatchObject({teacherReview:"pending",officialTextbookEditionMapped:false});
 });
});