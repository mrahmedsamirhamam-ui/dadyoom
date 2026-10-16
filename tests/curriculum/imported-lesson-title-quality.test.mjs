import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { suspectImportedLessonTitleReason } from "../../lib/curriculum/imported-lesson-title-quality";

const queue=readFileSync("app/admin/curriculum/coverage/drafts/page.tsx","utf8");
const create=readFileSync("app/admin/lessons/new/actions.ts","utf8");

describe("OCR artifacts cannot accidentally masquerade as textbook lesson titles",()=>{
 test("flags headings, page counters, table columns and unqualified lesson numbers seen in Bahrain drafts",()=>{
   for (const t of [
     "(الوحدة) عنوان الدرس الكتاب و الصفحات",
     "اسم الكتاب: براعم العربية ج 1 الصف: الثالث",
     "القراءة11", "القراءة 9-", "القراءة–", "القراءة",
     "الدّرس الثّاني","الدّرس التّاسع","الدّرس العاشر",
     "ورقمه", ")(القراءة-"
   ]) expect(suspectImportedLessonTitleReason(t),t).not.toBeNull();
 });
 test("does not block lesson-specific legitimate titles or actual student exercises",()=>{
   for (const t of ["الاستماع: السلحفاة والبطتان", "الهمزة المتوسطة على الألف",
     "أصوغ جملة اسمية", "القراءة: صديقتي مريم",
     "الدرس الثاني — كتابة وصف المكان"]) {
     expect(suspectImportedLessonTitleReason(t),t).toBeNull();
   }
 });
 test("review flags are visible; new publication is blocked without suppressing draft save",()=>{
   expect(queue).toContain("const brokenTitle = suspectImportedLessonTitleReason(draft.title)");
   expect(queue).toContain("عناوين OCR مشكوك فيها");
   expect(create).toContain("isPublished && suspectImportedLessonTitleReason(title)");
   expect(create).toContain('"draft"');
   expect(create).toContain("reviewedForPublication");
 });
});
