import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { publishedLessonNeedsSourceCorrection, validatePublishedBahrainSourceCorrection } from "../../lib/curriculum/bahrain-published-source-correction";

const actions=readFileSync("app/admin/lessons/[id]/actions.ts","utf8");
const page=readFileSync("app/admin/lessons/[id]/page.tsx","utf8");
const valid={
 title:"القراءة: الحرف باء",
 summary:"يتعرف الطالب على صوت حرف الباء في الكلمات والنصوص.",
 content:"يستمع الطالب إلى مقاطع قصيرة تتضمن صوت الباء ثم يقرأ كلمات متنوعة. يحدد الحرف في أول الكلمة ووسطها وآخرها، ثم يكتبه على السطر مع التشكيل في سياقات متعددة. بعد ذلك يصنف الكلمات حسب موقع الصوت ويجيب عن أسئلة الفهم ويناقش الفروق بين الصور والكتابة.",
 sourceUrl:"https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_1/e_books/Arabic-G1/book/index.html",
 sourcePageStart:"22",sourcePageEnd:"25",reviewerConfirmed:"yes"
};
describe("Bahrain published lesson correction guard",()=>{
 test("valid structured correction updates no publication or official certification fields",()=>{
   const result=validatePublishedBahrainSourceCorrection(valid);
   expect(result.ok).toBe(true);
   if(result.ok){
     expect(result.correction.source_page_start).toBe(22);
     expect(result.correction).not.toHaveProperty("status");
     expect(result.correction).not.toHaveProperty("official_content_scope");
   }
 });
 test("reject missing human review, bad sources, OCR titles and generic content",()=>{
   for(const x of [
     {...valid,reviewerConfirmed:""},
     {...valid,sourceUrl:"https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf"},
     {...valid,sourceUrl:"https://edunet.bh/manual/books2026/books1.pdf"},
     {...valid,title:"الدرس الثاني"},
     {...valid,sourcePageEnd:"2"},
     {...valid,content:"يتناول هذا الدرس موضوع «القراءة»"+valid.content},
     {...valid,summary:"قصير"},
   ])expect(validatePublishedBahrainSourceCorrection(x).ok).toBe(false);
 });
 test("admin authenticated, Bahrain and already-flagged published lessons only",()=>{
   expect(publishedLessonNeedsSourceCorrection({title:"الدرس الثاني",content:valid.content})).toBe(true);
   expect(publishedLessonNeedsSourceCorrection({title:valid.title,content:valid.content})).toBe(false);
   expect(actions).toContain('row.status !== "published"');
   expect(actions).toContain('country?.code !== "BH"');
   expect(actions).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
   expect(actions).toContain('publishedLessonNeedsSourceCorrection(row)');
   expect(actions).toContain('.update(parsed.correction)');
   expect(actions).toContain('.eq("status", "published")');
   expect(page).toContain('publishedLessonNeedsSourceCorrection(lesson)');
   expect(page).toContain("حفظ التصحيح بعد المراجعة — دون اعتماد الكتاب");
 });
});
