import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=read("scripts/curriculum-g123-listening-198-voice-or-teacher-original-activities-20261030.sql");
const client=read("features/lesson-activities/components/ListeningScriptPlayer.tsx");
const activityUI=read("features/lessons/components/InteractiveLessonActivities.tsx");
const rows=JSON.parse(sql.split("$listening$")[1]);

test("198 source-owned listening assessments are optional, genuinely differentiated and have no leaked answer keys",()=>{
 assert.equal(rows.length,9);
 assert.equal(new Set(rows.map(r=>r.grade+":"+r.activity_order)).size,9);
 assert.deepEqual([...new Set(rows.map(r=>r.grade))].sort(),[1,2,3]);
 for(const row of rows){
  assert.equal(row.activity_type,"listening");
  assert.equal(row.section,"listening");
  assert.equal(row.content.requiresTeacherRead,true);
  assert.ok(row.content.text.length>=65);
  assert.ok(row.content.listeningQuestion.length>10);
  assert.equal(row.content.origin,"DADYOOM_G123_LISTENING_NEW_198_ORIGINAL_TTS_OPTIONAL_20261030");
  assert.equal("answer" in row.content,false);
  assert.equal("correct" in row.content,false);
  assert.equal(row.content.options.length,3);
  assert.ok(row.content.options.includes(row.answer.correct));
  assert.equal(new Set(row.content.options).size,3);
 }
 assert.match(sql,/inserted<>198/);
 assert.match(sql,/history_count<>0/);
 assert.match(sql,/student_lesson_progress/);
 assert.match(sql,/lesson_activity_attempts/);
 assert.match(sql,/question_attempts/);
 assert.match(sql,/t\.answer,false/);
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\./i);
});

test("zero-cost browser Arabic reading has manual activation, language guard and teacher fallback",()=>{
 assert.match(client,/"use client"/);
 assert.match(client,/window\.speechSynthesis\.getVoices\(\)/);
 assert.match(client,/SpeechSynthesisUtterance/);
 assert.match(client,/\.startsWith\("ar"\)/);
 assert.match(client,/onClick=\{play\}/);
 assert.match(client,/\.cancel\(\)/);
 assert.match(client,/useEffect\(\(\) => \{/);
 assert.match(client,/showTeacherScript/);
 assert.match(client,/typeof window === "undefined"/);
 assert.doesNotMatch(client,/fetch\s*\(/);
 assert.doesNotMatch(client,/\/api\/dad-voice/);
 assert.match(activityUI,/import ListeningScriptPlayer/);
 assert.match(activityUI,/content\.requiresTeacherRead === true/);
 assert.match(activityUI,/content\.text as string/);
 assert.match(activityUI,/content\.listeningQuestion/);
 assert.match(activityUI,/<ListeningScriptPlayer script=\{teacherListeningScript\}/);
 assert.match(activityUI,/استمع إلى تعليمات المعلم/);
});
