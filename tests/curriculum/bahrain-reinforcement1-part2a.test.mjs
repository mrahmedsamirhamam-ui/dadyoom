import {readFileSync} from "node:fs";import {test,expect} from "vitest";
const d=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-reinforcement1-original-drafts-part2a-2026-2027.json",import.meta.url),"utf8"));
test("seven independently authored reinforcement1 lessons with disambiguated order",()=>{
 expect(d.rows.map(x=>x.order)).toEqual([15,16,17,18,19,20,21]);
 for(const r of d.rows){expect(r.content.length).toBeGreaterThanOrEqual(740);expect(r.learning_objectives).toHaveLength(3);expect(r.quiz.options.filter(x=>x===r.quiz.correct)).toHaveLength(1);expect(r.editorialReview).toBe("required");}
});