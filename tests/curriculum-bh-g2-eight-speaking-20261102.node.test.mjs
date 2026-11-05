import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const s=fs.readFileSync("scripts/curriculum-bh-g2-eight-remaining-speaking-subjects-20261102.sql","utf8");
test("all eight remaining grade2 official speaking topics have ORIGINAL distinct full lesson subjects",()=>{
 const b=[...s.matchAll(/\$body\d+\$([\s\S]*?)\$body\d+\$/g)].map(x=>x[1]);
 assert.equal(b.length,8);
 const titles=["أمّي الحنون","ألعابنا","هواياتي الجميلة","في مدينة الألعاب","كيف أغسل يديّ","نظافتي الصباحية","فوائد الرياضة","من أجل صحة سليمة"];
 for(let i=0;i<8;i++){
   assert.ok(b[i].length>=1350, titles[i]);
   assert.ok(b[i].includes("«"+titles[i]+"»"), titles[i]);
   for(const part of ["أولًا: معنى موضوع التحدّث","ثانيًا: أستمع إلى موقف واضح","ثالثًا: أتعلم المفردات وأفسّر المعنى","رابعًا: أقدم نموذجًا للحديث","خامسًا: أفكر وأتحقق من الفهم"])
      assert.ok(b[i].includes(part),titles[i]+" "+part);
   assert.ok(b[i].includes("ليس النص الوزاري الأصلي"));
 }
 assert.equal(new Set(b.map(x=>x)).size,8);
});
test("protected one-time-only transaction modifies actual teaching content, not student records",()=>{
 for(const part of ["BEGIN;","COMMIT;","wrong<>0","g.grade_number<>2","c.code<>'BH'","l.semester<>1","student_lesson_progress","question_attempts","lesson_activity_attempts","IF n<>8"])assert.ok(s.includes(part),part);
 assert.ok(!/\bDELETE FROM\b|\bTRUNCATE\b|\bDROP TABLE public\./i.test(s));
});
