import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load=(p)=>readFileSync("scripts/"+p,"utf8");
const g1=load("ps-g1-term1-official-book-2020-toc-add7-review-and-reorder18-20261104.sql");
const g2=load("ps-g2-term1-move15-real-book-chapters-into-official-curriculum-20261104.sql");
const g3=load("ps-g3-term1-actual-book-2020-add2-and-reorder15-20261104.sql");
const fix=load("ps-real-books-correct-g2-freedom-drawing-g3-gold-land-20261104.sql");
const bh=load("ministerial-real-book-bh-g1-d-g2-photographer-source-grounded-20261104.sql");
const between=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i); assert.ok(i>=0&&j>i,a+" "+b);return s.slice(i,j);};
const stableUUIDs=(s)=>[...s.matchAll(/'([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})'::uuid/g)].map(x=>x[1]);
function assertSafe(s){
 assert.ok(s.includes("BEGIN;")&&s.includes("COMMIT;"));
 assert.ok(s.includes("student_lesson_progress"));
 assert.ok(s.includes("question_attempts"));
 assert.ok(s.includes("lesson_activity_attempts"));
 assert.ok(!/\bDELETE\s+FROM\s+(?:public\.)?(?:lessons|student_lesson_progress|questions)\b/i.test(s));
 assert.ok(!/\bTRUNCATE\b|\bDROP\s+TABLE\s+public\./i.test(s));
}
test("grade1 Palestine: first actual-book volume has six distinct reviews + readiness, not 18 letters alone",()=>{
 const letters=between(g1,"INSERT INTO book_existing VALUES","CREATE TEMP TABLE book_new");
 const reviews=between(g1,"INSERT INTO book_new VALUES","CREATE TEMP TABLE book_generic");
 const broad=between(g1,"INSERT INTO book_generic VALUES","DO $guard$");
 assert.equal(stableUUIDs(letters).length,18);
 assert.equal(stableUUIDs(broad).length,6);
 const chapters=[...reviews.matchAll(/\$subject\d+\$([\s\S]*?)\$subject\d+\$/g)].map(x=>x[1]);
 assert.equal(chapters.length,7);
 assert.equal(new Set(chapters).size,7);
 for(const chapter of chapters){
  assert.ok(chapter.length>1400);
  assert.ok(chapter.includes("طبعة")||chapter.includes("الطبعة"));
  for(const section of ["أولًا: أستمع وأفهم","ثانيًا: أتعلم الموضوع نفسه","ثالثًا: أقرأ وأحلل وأركب","رابعًا: أكتب وأعبر","خامسًا: أفكر وأتحقق"])assert.ok(chapter.includes(section));
  assert.ok(chapter.includes("ليس نص الكتاب المدرسي"));
 }
 for(const p of [2,36,61,90,122,150,179])assert.ok(reviews.includes(","+p+","),"Missing real book page "+p);
 assert.ok(g1.includes("6 broad")||g1.includes("6 broad"));
 assert.ok(g1.includes("count(DISTINCT new_sort)"));
 assert.ok(g1.includes("generic headings hidden"));
 assert.ok(g1.includes("6 existing")||g1.includes("book_generic"));
 assert.ok(g1.includes("6c7fda35-8df3-4a39-9ce9-1aa48c80bd4d"));
 assert.ok(!g1.includes("6c7fda35-8df3-4a39-94eb-9307fc462fdc"));
 assertSafe(g1);
});
test("grade3 Palestine: original textbook chapters 'مكتبتي صديقتي' and 'حذاء الحكيم' are distinct complete story lessons",()=>{
 const existing=between(g3,"INSERT INTO ps_g3_existing VALUES","CREATE TEMP TABLE ps_g3_missing");
 const missing=between(g3,"INSERT INTO ps_g3_missing VALUES","CREATE TEMP TABLE ps_g3_generic");
 const broad=between(g3,"INSERT INTO ps_g3_generic VALUES","DO $guard$");
 assert.equal(stableUUIDs(existing).length,13);
 assert.equal(stableUUIDs(broad).length,6);
 const stories=[...missing.matchAll(/\$subject\d+\$([\s\S]*?)\$subject\d+\$/g)].map(x=>x[1]);
 assert.equal(stories.length,2);
 assert.ok(stories[0].includes("سلمى")&&stories[0].includes("علا")&&stories[0].includes("مكتبتها"));
 assert.ok(stories[1].includes("القطار")&&stories[1].includes("الحذاء")&&stories[1].includes("الحكيم"));
 assert.ok(stories.every(s=>s.length>1800&&s.includes("[نهاية شرح ضاديوم لدرس الكتاب الفعلي]")));
 assert.ok(missing.includes("مكتبتي صديقتي")&&missing.includes("حذاء الحكيم"));
 assertSafe(g3);
});
test("grade2 Palestine 15 real book lessons move into official course, preserving identity/answers and hiding fake headings",()=>{
 const existing=between(g2,"INSERT INTO g2_source_lessons VALUES","CREATE TEMP TABLE g2_broad_headings");
 const generic=between(g2,"INSERT INTO g2_broad_headings VALUES","DO $pre$");
 assert.equal(stableUUIDs(existing).length,15);
 assert.equal(stableUUIDs(generic).length,6);
 assert.equal(new Set(stableUUIDs(existing)).size,15);
 assert.ok(g2.includes("lesson_number=NULL"));
 assert.ok(g2.includes("unit_id='cd3a849d-db92-4c7c-8288-91a5a129f676'::uuid"));
 assert.ok(g2.includes("student_lesson_progress"));
 assert.ok(g2.includes("15 actual chapters moved"));
 assertSafe(g2);
});
test("three legacy Dadyoom original stories are NOT allowed to substitute real Ministry narrative plots",()=>{
 const fixed=[...fix.matchAll(/\$fixed\d+\$([\s\S]*?)\$fixed\d+\$/g)].map(x=>x[1]);
 assert.equal(fixed.length,3);
 assert.ok(fixed[0].includes("البلبل")&&fixed[0].includes("القفص")&&fixed[0].includes("العصفور"));
 assert.ok(fixed[1].includes("خلود")&&fixed[1].includes("موج")&&fixed[1].includes("الشاطئ"));
 assert.ok(fixed[2].includes("أخوين")&&fixed[2].includes("الذهب")&&fixed[2].includes("الأرض"));
 assert.ok(fixed.every(x=>x.includes("2020")&&x.length>1800));
 assert.ok(fix.includes("نص ضاديوم الإثرائي السابق مستقل"));
 assertSafe(fix);
});
test("Bahrain original teacher guides and printed student book context trump invented listening story",()=>{
 const body=[...bh.matchAll(/\$lesson\d+\$([\s\S]*?)\$lesson\d+\$/g)].map(x=>x[1]);
 assert.equal(body.length,2);
 assert.ok(body[0].includes("بدر")&&body[0].includes("عيد ميلاده السادس")&&body[0].includes("محل الحلويات"));
 assert.ok(body[1].includes("الضميرين «أنا» و«نحن»")&&body[1].includes("المقطع الصوتي والمد بالألف"));
 assert.ok(body.every(x=>x.length>1450));
 assertSafe(bh);
});
