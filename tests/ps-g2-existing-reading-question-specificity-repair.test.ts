import {readFileSync} from "node:fs";import {resolve} from "node:path";import {describe,expect,it} from "vitest";
type Item={title:string;order:number;oldText:string;question:string;options:Array<{id:string;text:string}>;correctAnswer:string;explanation:string};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-audits/ps-g2-existing-reading-question-specificity-repair-2026.json"),"utf8")) as {countryCode:string;grade:number;questions:Item[];oldQuestionAttemptPreflight:number;studentAnswerPreflight:number};
describe("G2 Palestine: replace stale generic study-skills quizzes by actual source-text comprehension",()=>{
 it("has 15 targeted statements with 3 different option keys and unchanged lesson identities",()=>{
  expect(p.countryCode).toBe("PS");expect(p.grade).toBe(2);expect(p.questions).toHaveLength(15);
  expect(p.oldQuestionAttemptPreflight).toBe(0);expect(p.studentAnswerPreflight).toBe(0);
  expect(new Set(p.questions.map(q=>q.title)).size).toBe(5);
  for(const x of p.questions){
   expect(x.order).toBeGreaterThan(0);expect(x.order).toBeLessThanOrEqual(3);
   expect(x.question.length).toBeGreaterThan(15);
   expect(x.question).not.toMatch(/أفضل بداية لدراسة|دليل أقوى على أنك أتقنت|كيف تستخدم ضاد/);
   expect(x.options.map(o=>o.id)).toEqual(["a","b","c"]);
   expect(new Set(x.options.map(o=>o.text)).size).toBe(3);
   expect(x.options.some(o=>o.id===x.correctAnswer)).toBe(true);
   expect(x.explanation.length).toBeGreaterThan(18);
  }
 });
});