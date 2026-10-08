import {readFileSync} from "node:fs";
import {test,expect} from "vitest";
const data=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-followup2-original-drafts-part2-2026-2027.json",import.meta.url),"utf8"));
test("17 final differentiated second-followup Bahrain drafts and answers",()=>{
 expect(data.rows).toHaveLength(17);
 expect(data.rows.map(x=>x.order)).toEqual(Array.from({length:17},(_,i)=>i+11));
 expect(new Set(data.rows.map(x=>x.title)).size).toBe(17);
 for(const a of data.rows){expect(a.content.length).toBeGreaterThanOrEqual(950);expect(a.learning_objectives).toHaveLength(3);expect(a.vocabulary).toHaveLength(2);expect(a.quiz.options).toHaveLength(4);expect(a.quiz.options.filter(x=>x===a.quiz.correct)).toHaveLength(1);expect(a.editorialReview).toBe("required");expect(a.bookTextCopied).toBe(false);expect(a.content).toContain("SOURCE=DADYOOM_BH_FOLLOWUP2_DRAFT_V1");}
 expect(data.rows.find(x=>x.order===20).references.length).toBeGreaterThanOrEqual(1);
});
