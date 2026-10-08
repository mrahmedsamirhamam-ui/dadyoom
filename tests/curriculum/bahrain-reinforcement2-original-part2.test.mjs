import {readFileSync} from "node:fs"; import {test,expect} from "vitest";
const d=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-reinforcement2-original-drafts-part2-2026-2027.json",import.meta.url),"utf8"));
test("Bahrain second reinforcement final 11 original scoped lesson drafts and checks",()=>{
 expect(d.rows.map(x=>x.order)).toEqual(Array.from({length:11},(_,i)=>i+12));
 expect(new Set(d.rows.map(x=>x.title)).size).toBe(11);
 for(const r of d.rows){
 expect(r.content.length).toBeGreaterThanOrEqual(900);
 expect(r.content).toContain("مفتاح الإجابة");
 expect(r.learning_objectives).toHaveLength(3);
 expect(r.vocabulary).toHaveLength(2);
 expect(r.quiz.options).toHaveLength(4);
 expect(r.quiz.options.filter(x=>x===r.quiz.correct)).toHaveLength(1);
 expect(r.editorialReview).toBe("required");
 expect(r.bookTextCopied).toBe(false);
 }
});