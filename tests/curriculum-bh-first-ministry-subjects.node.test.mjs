import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const sql=fs.readFileSync("scripts/curriculum-bh-g1-four-ministry-component-original-subjects-20261031.sql","utf8");
test("four source-authored complete subject bodies are guarded and no student answers changed",()=>{
  assert.ok(sql.includes("c.code<>'BH'"));
  assert.ok(sql.includes("g.grade_number<>1"));
  assert.ok(sql.includes("l.semester<>1"));
  assert.ok(sql.includes("student_lesson_progress"));
  assert.ok(sql.includes("question_attempts"));
  assert.ok(sql.includes("lesson_activity_attempts"));
  assert.ok(sql.includes("BEGIN;")&&sql.includes("COMMIT;"));
  assert.ok(!/\b(UPDATE|DELETE|INSERT)\s+(?:INTO|FROM)?\s*public\.(?:questions|lesson_activities|student_lesson_progress|question_attempts|lesson_activity_attempts)\b/i.test(sql));
  assert.ok(sql.includes("https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf"));
});
test("each of four lessons contains independent original educational text for all 5 official component headings",()=>{
  const bodies=[...sql.matchAll(/\$SUBJECT\$([\s\S]*?)\$SUBJECT\$/g)].map(x=>x[1]);
  assert.equal(bodies.length,4);
  for(const body of bodies) {
    assert.ok(body.length>=1100);
    for(const label of ["أولًا: أستمع وأفهم","ثانيًا: أتحاور وأقرأ","ثالثًا: أكتشف","رابعًا: تراكيب","خامسًا: أعبّر"])
      assert.ok(body.includes(label),label);
    assert.ok(body.includes("ليست")||body.includes("وليس")||body.includes("ولا تُنسب"));
    assert.ok(body.includes("[نهاية إضافة ضاديوم الأصلية]"));
  }
});
test("no old Ministry story is claimed as copied/verified and all lesson IDs distinct",()=>{
  const ids=[...sql.matchAll(/'([0-9a-f]{8}-[0-9a-f-]{27,})','الدرس/g)].map(x=>x[1]);
  assert.equal(ids.length,4);
  assert.equal(new Set(ids).size,4);
  assert.ok(sql.includes("هذه أُسرتي")||sql.includes("هذه أسرتي"));
  assert.ok(sql.includes("منزل العم جابر"));
  assert.ok(sql.includes("الاستعداد للاحتفال"));
});
