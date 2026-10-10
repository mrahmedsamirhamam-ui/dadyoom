import { readFileSync } from "node:fs";
import { expect,test } from "vitest";
const draft=JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-grade1-sem2-objective-drafts-20261010.json",import.meta.url),"utf8"));
test("Bahrain grade-one second-semester practice drafts are safe, distinct and unpublished",()=>{
 expect(draft.countryCode).toBe("BH");
 expect(draft.grade).toBe(1);
 expect(draft.semester).toBe(2);
 expect(draft.publicationPolicy).toBe("DRAFT_ONLY_REQUIRES_HUMAN_REVIEW");
 expect(draft.items).toHaveLength(12);
 expect(new Set(draft.items.map(item=>item.lessonId)).size).toBe(12);
 expect(new Set(draft.items.map(item=>item.prompt)).size).toBe(12);
 for(const item of draft.items){
   expect(item.options).toHaveLength(4);
   expect(new Set(item.options).size).toBe(4);
   expect(item.options.filter(x=>x===item.correct)).toHaveLength(1);
   expect(item.explanation.length).toBeGreaterThan(10);
 }
});
