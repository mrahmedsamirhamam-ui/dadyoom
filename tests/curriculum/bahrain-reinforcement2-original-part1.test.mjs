import {readFileSync} from "node:fs"; import {expect,test} from "vitest";
const d=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-reinforcement2-original-drafts-part1-2026-2027.json",import.meta.url),"utf8"));
test("11 different Bahrain second-reinforcement lessons have original explanations and unambiguous answers",()=>{
 expect(d.countryCode).toBe("BH");
 expect(d.academicYear).toBe("2026-2027");
 expect(d.rows.map(r=>r.order)).toEqual(Array.from({length:11},(_,i)=>i+1));
 expect(new Set(d.rows.map(r=>r.title)).size).toBe(11);
 for(const r of d.rows){
 expect(r.content.length).toBeGreaterThanOrEqual(900);
 expect(r.learning_objectives).toHaveLength(3);
 expect(r.vocabulary).toHaveLength(2);
 expect(r.quiz.options).toHaveLength(4);
 expect(r.quiz.options.filter(o=>o===r.quiz.correct)).toHaveLength(1);
 expect(r.content).toContain("مفتاح الإجابة");
 expect(r.content).toContain("SOURCE=DADYOOM_BH_REINFORCEMENT2_DRAFT_V1");
 expect(r.editorialReview).toBe("required");
 expect(r.bookTextCopied).toBe(false);
 }
});