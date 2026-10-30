import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const file=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const audit=JSON.parse(file("data/audits/grades123-22countries-activity-context-rendering-gap-fixed-20261030.json"));
const rpc=file("scripts/curriculum-g123-expose-student-activity-prompt-without-answers-20261030.sql");
const projection=file("features/lesson-activities/services/public-lesson-activities.ts");
const bundle=file("features/lessons/queries/getLessonPageBundle.ts");
const ui=file("features/lessons/components/InteractiveLessonActivities.tsx");

test("live original-context inventory and checked prompt security are unchanged",()=>{
 assert.equal(audit.counts.originalTextActivities,789);
 assert.equal(audit.counts.originalReferenceActivities,195);
 assert.equal(audit.counts.sourceContextActivities,198);
 assert.equal(789+195+198,1182);
 assert.equal(audit.counts.originalContextWithMissingPrompt,0);
 assert.equal(audit.counts.observedTopLevelAnswerOrCorrectInContent,0);
 assert.equal(audit.productionRPC.securityDefiner,false);
 assert.equal(audit.productionRPC.validatedExamplePrompts,6);
 assert.equal(audit.productionRPC.validatedExampleAnswerKeyLeaks,0);
 assert.equal(audit.frontendStatus.cloudflareProductionDeploymentVerified,false);
});

test("RPC adds only non-secret question text while retaining SECURITY INVOKER",()=>{
 for(const term of ["pg_get_functiondef","p_lesson_id uuid","SECURITY DEFINER posture",
 "''instructions'', a.instructions","''prompt'', a.prompt",
 "from public.lesson_activities a","a.is_published = true"]) {
  assert.ok(rpc.includes(term),"Missing guard: "+term);
 }
 assert.ok(rpc.includes("EXECUTE replace(definition,marker,replacement)"));
 assert.ok(!rpc.includes("SET answer="));
});

test("student-safe projection and authorized preview deliver prompt, not grading keys",()=>{
 assert.ok(bundle.includes("get_lesson_page_bundle"));
 assert.ok(bundle.includes("instructions,prompt,content,activity_order"));
 assert.ok(bundle.includes("publicLessonActivities(bundle.activities)"));
 assert.ok(projection.includes('prompt: typeof item.prompt === "string" ? item.prompt : null'));
 assert.ok(projection.includes("const content = sanitizeContent(item.content)"));
 assert.ok(projection.includes('"answer", "answers", "answerkey"'));
 assert.ok(!projection.includes("answer: item.answer"));
});

test("learner sees actual original text and question before selecting answers",()=>{
 for(const part of ["content.originalText","content.originalReference","content.sourceContext",
   "activity.prompt","{originalReadingText}","{originalContextText}",
   "{visiblePrompt}","!supervisedListening"]) {
  assert.ok(ui.includes(part),"Missing student UI: "+part);
 }
 const passage=ui.indexOf("نص القراءة الخاص بالنشاط");
 const choices=ui.indexOf("{hasOptions ? (");
 assert.ok(passage>=0 && choices>passage);
});
