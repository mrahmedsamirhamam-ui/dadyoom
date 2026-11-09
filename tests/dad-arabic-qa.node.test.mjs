import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import {normalizeArabic, provisionalLexicalMatch} from "../lib/lesson-review/qa-compare.mjs";
const dataset=JSON.parse(fs.readFileSync(new URL("../data/qa/dad-arabic-100.json",import.meta.url),"utf8"));
test("100 distinct, explicitly unapproved questions",()=>{
  assert.equal(dataset.questions.length,100);
  assert.equal(new Set(dataset.questions.map(q=>q.question)).size,100);
  assert.equal(new Set(dataset.questions.map(q=>q.category)).size,10);
  assert.ok(dataset.questions.every(q=>q.review_status==="needs_teacher_review" && q.approved===false && q.expected_answer));
});
test("Arabic comparison strips diacritics but remains provisional",()=>{
  assert.equal(normalizeArabic("إِمْلاء"),"املاء");
  assert.equal(provisionalLexicalMatch("الفاعل هو الطَّالب", "الطالب"),true);
  assert.equal(provisionalLexicalMatch("جواب مختلف","الفاعل"),false);
  assert.equal(provisionalLexicalMatch("كتابة متقدمة","ب"),false);
});
