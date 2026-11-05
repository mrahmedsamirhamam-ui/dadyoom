import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync("scripts/curriculum-bh-g1-units23-eight-independent-subjects-20261031.sql","utf8");
test("8 authentic Bahrain source-titled original lesson bodies, not 8 generic activity changes",()=>{
 const matches=[...source.matchAll(/\$subject\d+\$([\s\S]*?)\$subject\d+\$/g)].map(x=>x[1]);
 assert.equal(matches.length,8);
 const titles=["في الطابور الصباحي","الخبر المفرح","هيا نرسم","المدرسة الجميلة","أين جارنا جاسم؟","الصديقة الجديدة","الحية بيه","مسابقة بطل الحي"];
 for(let i=0;i<8;i++){
   assert.ok(matches[i].length>=1200);
   assert.ok(matches[i].includes(titles[i]),titles[i]);
   for(const term of ["أولًا: أستمع وأفهم","ثانيًا: أتحاور وأقرأ","ثالثًا: أكتشف","رابعًا: تراكيب","خامسًا: أعبّر","ليست النص المدرسي الرسمي"])
     assert.ok(matches[i].includes(term),term+" "+titles[i]);
 }
});
test("guarded source-only production writes never touch original student records or activity data",()=>{
 assert.ok(source.includes("BEGIN;")&&source.includes("COMMIT;"));
 assert.ok(source.includes("g.grade_number<>1"));
 assert.ok(source.includes("c.code<>'BH'"));
 assert.ok(source.includes("l.semester<>1"));
 assert.ok(source.includes("student_lesson_progress"));
 assert.ok(source.includes("question_attempts"));
 assert.ok(source.includes("lesson_activity_attempts"));
 assert.ok(source.includes("length(l.content)<>s.previous_chars"));
 assert.ok(source.includes("IF good<>8"));
 assert.ok(!/\b(?:INSERT INTO|DELETE FROM|UPDATE)\s+public\.(questions|lesson_activities|question_attempts|lesson_activity_attempts|student_lesson_progress)/i.test(source));
});
