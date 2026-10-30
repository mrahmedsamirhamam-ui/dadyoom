import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read=(p:string)=>JSON.parse(readFileSync(resolve(process.cwd(),p),"utf8"));
const source=read("data/curriculum-drafts/grades123-original-nominal-12-question-templates-20261029.json") as {
 hasPrivateAnswerKeys:boolean;questions:Array<{grade:number;order:number;question:string;options:string[]}>;
};
const audit=read("data/audits/grades123-22countries-nominal-254-question-repair-20261029.json") as {
 lessonCount:number;countries:number;questionsTotal:number;replacedGenericQuestions:number;preservedOriginalQuestions:number;remainingGenericQuestions:number;invalidAnswerOptions:number;oldQuestion3Preserved:number;
 gradeRows:Array<{grade:number;lessonCount:number;questionCount:number;replaced:number;preserved:number}>;
 scopeNotYetVerifiedByMinistry:boolean;humanReviewStatus:string;
};
const about=readFileSync(resolve(process.cwd(),"app/about/page.tsx"),"utf8");

describe("Dadyoom original grade1–3 nominal-sentence question repair",()=>{
 it("tracks exactly 254 repaired generic questions without losing 76 original ones",()=>{
   expect(audit.countries).toBe(22);
   expect(audit.lessonCount).toBe(66);
   expect(audit.questionsTotal).toBe(330);
   expect(audit.replacedGenericQuestions).toBe(254);
   expect(audit.preservedOriginalQuestions).toBe(76);
   expect(audit.oldQuestion3Preserved).toBe(66);
   expect(audit.remainingGenericQuestions).toBe(0);
   expect(audit.invalidAnswerOptions).toBe(0);
   expect(audit.gradeRows.map(x=>[x.grade,x.lessonCount,x.questionCount,x.replaced,x.preserved])).toEqual([[1,22,110,86,24],[2,22,110,84,26],[3,22,110,84,26]]);
   expect(audit.scopeNotYetVerifiedByMinistry).toBe(true);
   expect(audit.humanReviewStatus).toBe("pending_human_review");
 });
 it("maintains twelve real Arabic graded questions with three distinct options and no stored answer keys",()=>{
   expect(source.questions).toHaveLength(12);
   expect(source.hasPrivateAnswerKeys).toBe(false);
   expect(new Set(source.questions.map(x=>x.grade+"/"+x.order)).size).toBe(12);
   for(const question of source.questions){
     expect([1,2,3]).toContain(question.grade);
     expect([1,2,4,5]).toContain(question.order);
     expect(question.question.length).toBeGreaterThanOrEqual(34);
     expect(question.options).toHaveLength(3);
     expect(new Set(question.options).size).toBe(3);
     expect(question.question).not.toMatch(/ما المهارة الرئيسة|أي تطبيق يساعدك|كيف تتحقق من إتقان/u);
   }
   const raw=readFileSync(resolve(process.cwd(),"data/curriculum-drafts/grades123-original-nominal-12-question-templates-20261029.json"),"utf8");
   expect(raw).not.toMatch(/"correct_answer"\s*:|"correctAnswer"\s*:|"student_id"\s*:/u);
 });
});
describe("Dadyoom on-site brand text",()=>{
 it("uses Dadyoom/ضاديوم, not a third-party business name, in the actual About page",()=>{
   expect(about).toContain("ضاديوم | Dadyoom");
   expect(about).toContain("عن ضاديوم");
   expect(about).toContain("أحمد سمير محمد حافظ حمام");
   expect(about).not.toMatch(/QAMORYX|كموريكس/i);
   expect(about).toContain("التسجيل التجاري");
 });
});
