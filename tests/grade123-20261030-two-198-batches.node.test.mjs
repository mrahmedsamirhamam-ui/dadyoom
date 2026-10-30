import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const previous=JSON.parse(read("data/audits/grades123-22countries-after-594-original-activities-20261029.json"));
const current=JSON.parse(read("data/audits/grades123-22countries-after-two-198-batches-20261030.json"));
const quality=JSON.parse(read("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json"));
const sources=[
 ["scripts/curriculum-g123-madd-198-verified-activities-20261030.sql","$madd$",
  "DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030"],
 ["scripts/curriculum-g123-shadda-tanween-198-original-activities-20261030.sql","$phonics$",
  "DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030"],
];

test("two real batches add 396 activities for 132 previously incomplete lessons",()=>{
 assert.equal(previous.totals.after_6_to_10,570);
 assert.equal(current.totals.after_6_to_10,702);
 assert.equal(current.totals.current_published_below_six,1044);
 assert.equal(current.totals.published,1746);
 assert.equal(current.totals.drafts,57);
 assert.equal(current.countries.length,22);
 const grouped=current.countries.flatMap(c=>c.grades);
 assert.equal(grouped.length,66);
 assert.equal(grouped.reduce((n,g)=>n+g.after_6_to_10,0),702);
 const result=evaluateGrade123Audit(current,quality);
 assert.equal(result.ready,false);
 assert.equal(result.sufficient,702);
 assert.equal(result.missing.exercises,1044);
 assert.ok(result.errors.some(message=>message.includes("official/general syllabus evidence missing")));
});

test("all activity templates are grade-specific, safe and validate answers",()=>{
 for(const [file,delim,origin] of sources){
  const sql=read(file);
  const ix=sql.indexOf(delim);
  assert.ok(ix>=0);
  const jx=sql.indexOf(delim,ix+delim.length);
  assert.ok(jx>ix);
  const rows=JSON.parse(sql.slice(ix+delim.length,jx));
  assert.equal(rows.length,9);
  assert.equal(new Set(rows.map(r=>r.grade+":"+r.activity_order)).size,9);
  for(const row of rows){
   assert.ok([1,2,3].includes(row.grade));
   assert.ok([4,5,6].includes(row.activity_order));
   assert.ok(["matching","multiple_choice","fill_blank"].includes(row.activity_type));
   assert.equal(row.content.origin,origin);
   assert.equal(row.content.answer,undefined);
   assert.equal(row.content.correct,undefined);
   if(row.activity_type==="multiple_choice")
    assert.ok(row.content.options.includes(row.answer.correct));
   if(row.activity_type==="fill_blank")
    assert.ok(row.content.items[0].options.includes(row.answer.answers[0]));
   if(row.activity_type==="matching")
    assert.ok(row.answer.pairs.every(p=>row.content.left.includes(p.left) &&
     row.content.right.includes(p.right)));
  }
  assert.match(sql,/student_lesson_progress/);
  assert.match(sql,/lesson_activity_attempts/);
  assert.match(sql,/GET DIAGNOSTICS inserted=ROW_COUNT/);
  assert.match(sql,/inserted<>198/);
  assert.match(sql,/t\.answer,false/);
  assert.doesNotMatch(sql,/\bUPDATE\s+public\.(?:questions|lessons|question_attempts|student_lesson_progress)\b/i);
 }
});
