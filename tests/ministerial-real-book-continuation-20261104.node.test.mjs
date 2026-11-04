import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(name)=>fs.readFileSync("scripts/"+name,"utf8");
const firstTerm=read("ps-g2g3-thirteen-real-book-subject-corrections-20261104.sql");
const grade3Pack=read("ps-g3-term2-2024-ministry-pack-add-2-fix-4-and-order-20261104.sql");
const grade2Pack=read("ps-g2-term2-2024-ministry-pack-2-real-subject-corrections-20261104.sql");
const ordinal=read("ps-g3-term2-2024-pack-ordinal-vs-2020-book-sequence-20261104.sql");
function blocks(src,tag){const r=new RegExp("\\$"+tag+"\\d+\\$([\\s\\S]*?)\\$"+tag+"\\d+\\$","g");return [...src.matchAll(r)].map(x=>x[1]);}
function safe(src){
 assert.ok(src.includes("BEGIN;")&&src.includes("COMMIT;"));
 for(const s of ["student_lesson_progress","question_attempts","lesson_activity_attempts","RAISE EXCEPTION","Rollback"])assert.ok(src.includes(s)||src.includes(s.toLowerCase()),s);
 assert.ok(!/\bDELETE FROM\b|\bTRUNCATE\b|\bDROP TABLE\s+(?:public\.)?(?:lessons|questions|student)/i.test(src));
}
test("13 individually source-aligned full student-book reading subjects (2020 print) cannot be generic or activity-only",()=>{
 const items=blocks(firstTerm,"subject");
 assert.equal(items.length,13);
 assert.equal(new Set(items).size,13);
 const verifiedNames=["عودة الطائر","الغراب والجرة","جحا وحميره العشرة","يوم المرور","الخروف والذئب","طبيبة القرية","الصياد","قريتنا نظيفة","دينا والقمر","العصفورة تبني عشها","الخباز","عاقبة الطمع","عروس البحر"];
 for(let i=0;i<13;i++){
  assert.ok(items[i].includes("«"+verifiedNames[i]+"»"));
  assert.ok(items[i].length>=1700);
  for(const section of ["أولًا: أتعرّف موضوع الدرس الحقيقي","ثانيًا: أفهم الفكرة","ثالثًا: أكتسب المفردات","رابعًا: أتعلّم الموضوع اللغوي","خامسًا: أفكر","[نهاية شرح موضوع الدرس المطابق لأحداث الكتاب]"]){
   assert.ok(items[i].includes(section),verifiedNames[i]+": "+section);
  }
  assert.ok(items[i].includes("2020")&&items[i].includes("2026–2027"),"edition caveat");
 }
 assert.ok(items[12].includes("يافا")&&items[12].includes("الميناء"));
 assert.ok(items[11].includes("النملة")&&items[11].includes("العسل"));
 assert.ok(items[8].includes("دينا")&&items[8].includes("القمر"));
 safe(firstTerm);
});
test("2024 Ministry source: G3 pack contains 6 genuine lessons, including 2 missing subjects, without mislabeling a full 2026 textbook",()=>{
 const existing=blocks(grade3Pack,"bk"),newOnes=blocks(grade3Pack,"new");
 assert.equal(existing.length,4);assert.equal(newOnes.length,2);
 assert.ok(newOnes[0].includes("سمير")&&newOnes[0].includes("أبي خليل")&&newOnes[0].includes("ميناء غزة"));
 assert.ok(newOnes[1].includes("سماح")&&newOnes[1].includes("خلود")&&newOnes[1].includes("العنب"));
 assert.ok(existing[0].includes("حيفا")&&existing[0].includes("النورس"));
 assert.ok(existing[2].includes("عرين")&&existing[2].includes("الحاسوب"));
 assert.ok(existing.every(x=>x.length>=1600)&&newOnes.every(x=>x.length>=1600));
 assert.ok(grade3Pack.includes("https://moe.edu.ps/uploads/new_pal_books/arabic3.pdf"));
 assert.ok(grade3Pack.includes("2024")&&grade3Pack.includes("NOT entire current textbook"));
 safe(grade3Pack);
});
test("2024 G2 MOE pack original two lessons corrected with source details not invented stories",()=>{
 const items=blocks(grade2Pack,"lesson");assert.equal(items.length,2);
 assert.ok(items[0].includes("ياسر")&&items[0].includes("عبير")&&items[0].includes("عكا"));
 assert.ok(items[1].includes("سعيد")&&items[1].includes("الصقر")&&items[1].includes("أفعى"));
 assert.ok(items.every(x=>x.length>=1600&&x.includes("2024")));
 assert.ok(grade2Pack.includes("https://moe.edu.ps/uploads/new_pal_books/arabic2.pdf"));
 safe(grade2Pack);
});
test("Ministry 2024 grade3 educational pack numbering 7–12 distinct from complete 2020 book 1,5,6,8,11,13",()=>{
 const expected=[[1,7,4],[5,8,14],[6,9,21],[8,10,29],[11,11,38],[13,12,47]];
 for(const [full,pack,p] of expected)assert.ok(ordinal.includes(","+full+","+pack+","+p+")"),full+" vs "+pack);
 assert.ok(ordinal.includes("رزمة الوزارة 2024"));
 assert.ok(ordinal.includes("فهرس الكتاب الكامل المطبوع 2020"));
 assert.ok(ordinal.includes("position('رقم الدرس في الرزمة '"));
 safe(ordinal);
});
