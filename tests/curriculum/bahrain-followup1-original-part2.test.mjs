import {test,expect} from "vitest";
import {readFileSync} from "node:fs";
const a=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-followup1-original-drafts-part2-2026-2027.json",import.meta.url),"utf8"));
test("13 scoped original differentiated Bahraini adult follow-up lessons",()=>{
expect(a.rows).toHaveLength(13);
expect(a.rows.map(x=>x.order)).toEqual(Array.from({length:13},(_,i)=>i+13));
expect(new Set(a.rows.map(x=>x.title)).size).toBe(13);
for(const row of a.rows){expect(row.content.length).toBeGreaterThanOrEqual(890);expect(row.content).toContain("مفتاح الإجابة");expect(row.learning_objectives).toHaveLength(3);expect(row.quiz.options.filter(x=>x===row.quiz.correct)).toHaveLength(1);expect(row.bookTextCopied).toBe(false);expect(row.editorialReview).toBe("required");}
});
