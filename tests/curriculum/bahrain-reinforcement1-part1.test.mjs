import {readFileSync} from "node:fs";import {test,expect} from "vitest";
const d=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-reinforcement1-original-drafts-part1-2026-2027.json",import.meta.url),"utf8"));
test("14 distinct ordered Bahrain first reinforcement adult learning supports",()=>{
 expect(d.rows).toHaveLength(14);
 expect(d.rows.map(x=>x.order)).toEqual(Array.from({length:14},(_,i)=>i+1));
 for(const r of d.rows){expect(r.content.length).toBeGreaterThanOrEqual(950);expect(r.learning_objectives).toHaveLength(3);expect(r.quiz.options.filter(x=>x===r.quiz.correct)).toHaveLength(1);expect(r.editorialReview).toBe("required");expect(r.bookTextCopied).toBe(false);expect(r.content).toContain("SOURCE=DADYOOM_BH_REINFORCEMENT1_DRAFT_V1");}
});
