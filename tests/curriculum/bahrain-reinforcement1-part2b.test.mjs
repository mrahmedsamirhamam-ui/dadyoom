import {readFileSync} from "node:fs";import {test,expect} from "vitest";
const d=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-reinforcement1-original-drafts-part2b-2026-2027.json",import.meta.url),"utf8"));
test("remaining first reinforcement lessons 22 through 28 have original independent checks",()=>{
 expect(d.rows.map(x=>x.order)).toEqual([22,23,24,25,26,27,28]);
 for(const r of d.rows){expect(r.content.length).toBeGreaterThanOrEqual(760);expect(r.learning_objectives).toHaveLength(3);expect(r.quiz.options.filter(x=>x===r.quiz.correct)).toHaveLength(1);expect(r.editorialReview).toBe("required");}
});