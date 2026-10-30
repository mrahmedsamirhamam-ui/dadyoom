import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("features/lessons/components/InteractiveLessonActivities.tsx");
const bundle=read("features/lessons/queries/getLessonPageBundle.ts");
const projection=read("features/lesson-activities/services/public-lesson-activities.ts");
const listening=read("features/lesson-activities/components/ListeningScriptPlayer.tsx");

test("student page displays each standalone source passage and the exact question before choices",()=>{
 for(const x of ["content.originalText","content.originalReference","content.sourceContext",
   "activity.prompt","{originalReadingText}","{originalContextText}","{visiblePrompt}",
   "originalReadingText ? (","originalContextText ? ("]){
   assert.ok(page.includes(x),"Missing visible source or question: "+x);
 }
 assert.match(page,/aria-label="نص القراءة الخاص بالنشاط"/);
 assert.match(page,/aria-label="بطاقة التوضيح الخاصة بالنشاط"/);
 assert.ok(page.includes('dir="rtl"'));
 assert.ok(!page.includes("activity.answer"),"Private grading keys cannot be inspected on the student page");
});

test("published RPC and draft preview go through the same recursive answer-key sanitizer",()=>{
 assert.equal(bundle.split("publicLessonActivities(bundle.activities)").length-1,2);
 assert.ok(bundle.includes("publicLessonActivities(activities)"));
 assert.ok(bundle.includes("instructions,prompt,content,activity_order"));
 assert.ok(projection.includes("function sanitizeContent"));
 assert.ok(projection.includes("privateFields.has(normalized)"));
 assert.ok(!projection.includes("answer: item.answer"));
});

test("teacher-guided listening scripts play with no paid TTS and are hidden until the learner asks to see them",()=>{
 assert.ok(page.includes('content.requiresTeacherRead === true'));
 assert.ok(page.includes("<ListeningScriptPlayer script={teacherListeningScript} />"));
 assert.ok(page.includes("listeningQuestion"));
 assert.ok(listening.includes("speechSynthesis"));
 assert.ok(listening.includes("setShowTeacherScript(x => !x)"));
 assert.ok(listening.includes("showTeacherScript ?"));
 assert.ok(listening.includes("لا يوجد صوت عربي"));
});
