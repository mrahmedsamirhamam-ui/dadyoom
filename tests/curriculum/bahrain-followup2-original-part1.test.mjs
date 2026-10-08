import { readFileSync } from "node:fs";
import { test, expect } from "vitest";
const data=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-followup2-original-drafts-part1-2026-2027.json",import.meta.url),"utf8"));
test("second Bahrain adult follow-up stage first ten original lessons",()=>{
 expect(data.rows).toHaveLength(10);
 expect(data.rows.map(x=>x.order)).toEqual(Array.from({length:10},(_,i)=>i+1));
 expect(new Set(data.rows.map(x=>x.title)).size).toBe(10);
 for(const a of data.rows){expect(a.content.length).toBeGreaterThanOrEqual(880);expect(a.learning_objectives).toHaveLength(3);expect(a.vocabulary).toHaveLength(2);expect(a.quiz.options.filter(x=>x===a.quiz.correct)).toHaveLength(1);expect(a.bookTextCopied).toBe(false);expect(a.editorialReview).toBe("required");expect(a.content).toContain("SOURCE=DADYOOM_BH_FOLLOWUP2_DRAFT_V1");}
 expect(data.rows.find(x=>x.order===5).references.length).toBeGreaterThanOrEqual(2);
});
