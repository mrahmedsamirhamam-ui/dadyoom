import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const audit=JSON.parse(read("data/curriculum-completeness/bahrain-repeated-assessment-prompts-20261010.json"));
test("Bahrain duplicate assessment audit preserves evidence and IDs",()=>{
  expect(audit.entries).toHaveLength(audit.summary.activities);
  expect(new Set(audit.entries.map(item=>item.activityId)).size).toBe(audit.entries.length);
  expect(audit.summary.genericPromptUnflaggedCount).toBe(404);
  expect(audit.entries.filter(item=>item.reviewStatus==="required")).toHaveLength(audit.summary.alreadyMarkedReviewActivities);
});
test("admin detail displays real answer without allowing ID guessing or database mutations",()=>{
  const list=read("app/admin/curriculum/coverage/assessments/repeated/page.tsx");
  const detail=read("app/admin/curriculum/coverage/assessments/repeated/[id]/page.tsx");
  expect(list).toContain("/assessments/repeated/${r.activityId}");
  expect(detail).toContain("audit.entries.find(entry => entry.activityId === id)");
  expect(detail).toContain("if (!record) notFound()");
  expect(detail).toContain('.eq("lesson_id", record.lessonId)');
  expect(detail).toContain('.eq("is_published", true)');
  expect(detail).toContain("asObject(activity?.answer).correct");
  expect(detail).toContain("تغيّر السؤال مقارنةً بلقطة المراجعة");
  for(const forbidden of [".insert(", ".update(", ".delete(", "service_role"])expect(detail).not.toContain(forbidden);
});
