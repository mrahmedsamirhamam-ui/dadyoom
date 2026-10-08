import {readFileSync} from "node:fs";
import {test,expect} from "vitest";
const data=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-followup1-original-drafts-part3-2026-2027.json",import.meta.url),"utf8"));
test("18 distinct followup1 adult lessons with verified answer keys and review status",()=>{
 expect(data.rows).toHaveLength(18);
 expect(data.rows.map(x=>x.order)).toEqual(Array.from({length:18},(_,i)=>i+26));
 expect(new Set(data.rows.map(x=>x.title)).size).toBe(18);
 for(const row of data.rows){expect(row.content.length).toBeGreaterThanOrEqual(920);expect(row.learning_objectives).toHaveLength(3);expect(row.quiz.options).toHaveLength(4);expect(row.quiz.options.filter(x=>x===row.quiz.correct)).toHaveLength(1);expect(row.content).toContain("SOURCE=DADYOOM_BH_FOLLOWUP1_DRAFT_V1");expect(row.content).toContain("مفتاح الإجابة");expect(row.editorialReview).toBe("required");expect(row.bookTextCopied).toBe(false);}
});
