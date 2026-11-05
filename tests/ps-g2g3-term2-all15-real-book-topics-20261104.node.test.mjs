import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync("scripts/"+p,"utf8");
const reorder=read("ps-g2-t2-reorder-eight-existing-and-draft-six-pseudo-chapters-20261104.sql");
const newLessons=read("ps-g2g3-term2-add14-actual-textbook-2020-story-subjects-20261104.sql");
const corrected=read("ps-g2g3-term2-correct8-existing-real-book-chapter-stories-20261104.sql");
const getBodies=(src,prefix)=>[...src.matchAll(new RegExp("\\$"+prefix+"(\\d+)\\$([\\s\\S]*?)\\$"+prefix+"\\1\\$","g"))].map(m=>m[2]);
function mustGuard(s,{insertsOnly=false}={}){
 const basics=["BEGIN;","COMMIT;","RAISE EXCEPTION"];
 const history=insertsOnly?[]:["student_lesson_progress","question_attempts","lesson_activity_attempts"];
 for(const token of [...basics,...history])assert.ok(s.includes(token),token);
 assert.ok(!/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bDROP\s+TABLE\s+(?:public\.)?(?:lessons|student)/i.test(s));
}
test("14 previously missing chapters are complete original explanations (7 Grade2 + 7 Grade3) from actual 2020 books, not generic title shells",()=>{
 const bodies=getBodies(newLessons,"body");
 assert.equal(bodies.length,14);
 const headings=[
 "النمر والحطاب","صباح جديد","حيلة فلاح","يوم الطفل الفلسطيني","لدي حلم","الببغاء الثرثار","في البقالة",
 "الراعي والذئب","أحب أن أكون","الغراب والثعلب","في حديقة الحيوان","طبيب الأسد","الصديق وقت الضيق","أول فدائي في الإسلام"
 ];
 assert.equal(new Set(headings).size,14);
 for(let i=0;i<14;i++){
  const s=bodies[i];
  assert.ok(s.includes(headings[i]),"real chapter "+headings[i]);
  assert.ok(s.length>2900,headings[i]+" is only a title or brief placeholder");
  for(const section of ["أولًا: أتعرف","ثانيًا: أفهم","ثالثًا: أكتسب","رابعًا: أتدرب","خامسًا: أفكر","سادسًا: أفرق","[نهاية شرح ضاديوم الأصلي المبني على أحداث الكتاب 2020]"])
  assert.ok(s.includes(section),headings[i]+": "+section);
  assert.ok(s.includes("2020")&&s.includes("2026–2027"),"clear source-edition distinction");
 }
 assert.ok(bodies[0].includes("الحطاب")&&bodies[0].includes("النمر")&&bodies[0].includes("شجرة"));
 assert.ok(bodies[6].includes("سليم")&&bodies[6].includes("مريم")&&bodies[6].includes("الصلاحية"));
 assert.ok(bodies[11].includes("القرد")&&bodies[11].includes("الأسد")&&bodies[11].includes("أنيابه"));
 assert.ok(bodies[12].includes("الدب")&&bodies[12].includes("الصديق"));
 assert.ok(bodies[13].includes("علي بن أبي طالب")&&bodies[13].includes("الهجرة"));
 assert.ok(newLessons.includes("https://www.wepal.net/library/upload/03-2021/content/603e883c5c134.pdf"));
 assert.ok(newLessons.includes("https://wepal.net/upload/legacy/2021/03-2021/content/603e83f9c0ac4.pdf"));
 assert.ok(newLessons.includes("(SELECT count(*) FROM book_missing)<>14"));
 assert.ok(newLessons.includes("SELECT count(*) FROM book_missing WHERE grade_number=2)<>7"));
 assert.ok(newLessons.includes("SELECT count(*) FROM book_missing WHERE grade_number=3)<>7"));
 // Insert-only transaction protects students by refusing duplicate titles/order and never touching existing rows.
 assert.ok(newLessons.includes("A schoolbook title already exists; refuse duplicate"));
 mustGuard(newLessons,{insertsOnly:true});
});
test("Eight original 2020 schoolbook topics missing their genuine story explanations now have complete prefixes without losing older enrichment",()=>{
 const bodies=getBodies(corrected,"actual");
 assert.equal(bodies.length,8);
 const names=["نبني ونبني","العصفورة والأفعى","في مدينة الخليل","عمر والغلام","والدي الحبيب","من نوادر أشعب","يوم الشجرة","ذكاء القاضي إياس"];
 for(let i=0;i<8;i++){
  assert.ok(bodies[i].length>2450,names[i]+" short/fake content");
  assert.ok(bodies[i].includes(names[i]));
  assert.ok(bodies[i].includes("أحداث")&&bodies[i].includes("مفردات"));
  assert.ok(bodies[i].includes("[نهاية تصحيح نص الدرس المدرسي الفعلي، طبعة 2020]"));
 }
 assert.ok(bodies[2].includes("علياء")&&bodies[2].includes("الخليل"));
 assert.ok(bodies[3].includes("عمر بن الخطاب")&&bodies[3].includes("الغلام"));
 assert.ok(bodies[7].includes("القاضي إياس")&&bodies[7].includes("الفطائري"));
 assert.ok(corrected.includes("المادة الإثرائية السابقة من ضاديوم منفصلة"));
 mustGuard(corrected);
});
test("G2 old book lessons re-ordered to fifteen unique chapters, six broad misleading pages draft; no student data altered",()=>{
 assert.ok(reorder.includes("من نوادر أشعب")&&reorder.includes("نوادر أشعب"));
 assert.ok(reorder.includes("sort_order=30+x.book_chapter"));
 assert.ok(reorder.includes("status='draft'"));
 assert.ok(reorder.includes("COUNT(*) FROM existing_book_rows") || reorder.includes("count(*) FROM existing_book_rows"));
 assert.ok(reorder.includes("count(DISTINCT book_chapter)"));
 mustGuard(reorder);
});

test("14 book-based grade2+3 objectives are individualized, guarded against duplicate records, and the solar/lunar lesson error is corrected",()=>{
 const s=read("ps-g2g3-term2-14-specific-objectives-lam-correction-20261105.sql");
 const rows=[...s.matchAll(/\('([0-9a-f-]{36})'::uuid,([23]),'([^']+)','(\[[^\n]+\])'::jsonb\)/g)];
 assert.equal(rows.length,14,"14 exact existing lesson IDs and objective rows");
 assert.equal(new Set(rows.map(r=>r[1])).size,14,"never reuse lesson ID");
 assert.equal(rows.filter(r=>r[2]==="2").length,7);
 assert.equal(rows.filter(r=>r[2]==="3").length,7);
 assert.equal(new Set(rows.map(r=>r[2]+"|"+r[3])).size,14,"no duplicate grade+title");
 for(const row of rows){
   const goals=JSON.parse(row[4]);
   assert.equal(goals.length,3,row[3]);
   assert.ok(goals.every(goal=>goal.length>=35),row[3]);
   assert.ok(goals.join(" ").includes("أن "),row[3]);
 }
 for(const guard of ["BEGIN;","COMMIT;","RAISE EXCEPTION","Duplicate lesson title detected","WHERE l.id=t.id AND l.title=t.title","l.source_pdf_url LIKE '%wepal.net%'"])assert.ok(s.includes(guard),guard);
 assert.ok(s.includes("اللام الشمسية في «الثور» و«السوق» و«الناس»، واللام القمرية في «الفلاح» و«الغطاء»"));
 assert.ok(!/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bDROP\s+TABLE\s+(?:public\.)?(?:lessons|student)/i.test(s));
 assert.ok(s.includes("NO certification of 2024 educational packs or 2026–27 full textbook"));
});
