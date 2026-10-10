import Link from "next/link";
import { notFound } from "next/navigation";
import audit from "@/data/curriculum-completeness/bahrain-assessment-quality-audit-20261010.json";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Activity = {
 id:string; title:string|null; prompt:string|null; instructions:string|null;
 activity_type:string; content:unknown; answer:unknown;
};
const asObject=(v:unknown):Record<string,unknown> =>
 v && typeof v==="object" && !Array.isArray(v) ? v as Record<string,unknown> : {};
const printable=(v:unknown):string =>
 typeof v==="string" ? v : v == null ? "غير محدد" : JSON.stringify(v,null,2);

export default async function ActivityReview({
 params,
}: {params:Promise<{id:string}>}) {
 const {id}=await params;
 // Only review records in the Bahrain audit queue; parent admin layout checks the role.
 const lesson=audit.reviewQueue.find(x=>x.lessonId===id);
 if(!lesson) notFound();
 const db=await createClient();
 const {data,error}=await db.from("lesson_activities")
  .select("id,title,prompt,instructions,activity_type,content,answer")
  .eq("lesson_id",id).eq("is_published",true)
  .contains("content",{reviewStatus:"required"}).limit(20);
 const items=(data??[]) as Activity[];
 return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
  <div className="mx-auto max-w-4xl space-y-5">
   <nav className="text-sm font-bold text-[#15584e]">
    <Link href="/admin/curriculum/coverage/assessments/review">← قائمة مراجعة الأنشطة</Link>
   </nav>
   <header className="rounded-2xl bg-white p-6">
    <h1 className="text-2xl font-black">{lesson.title}</h1>
    <p className="mt-3 leading-7">هذه نسخة قراءة فقط للأنشطة المنشورة الموسومة بأنها تحتاج مراجعة.
      لا يتم تغيير الإجابات أو اعتماد الدرس تلقائيًا.</p>
    <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-[#15584e]">
     <Link href={`/lessons/${id}`} className="underline">عرض الدرس</Link>
     {lesson.sourcePdfUrl?.startsWith("https://")
      ? <a href={lesson.sourcePdfUrl} target="_blank" rel="noopener noreferrer" className="underline">مستند المصدر ↗</a>
      : null}
    </div>
   </header>
   {error ? <p role="alert" className="rounded-2xl bg-white p-5">تعذر تحميل الأنشطة. لا يُعد الدرس مُراجَعًا.</p> : null}
   {!error && items.length===0 ? <p className="rounded-2xl bg-white p-5">
     لم يعد هناك نشاط موسوم بالمراجعة في هذا الدرس؛ يلزم تدقيق جديد قبل اعتماده.
   </p>:null}
   {!error ? items.map((item,i)=>{
    const content=asObject(item.content);
    const answer=asObject(item.answer);
    const options=Array.isArray(content.options)?content.options:[];
    return <article key={item.id} className="rounded-2xl border border-[#ded0b7] bg-white p-6">
     <p className="text-sm font-black text-[#80602d]">النشاط {i+1} — {item.activity_type}</p>
     <h2 className="mt-2 text-lg font-black">{item.title??"نشاط تعليمي"}</h2>
     <p className="mt-4 leading-8"><strong>السؤال: </strong>{printable(item.prompt??content.text)}</p>
     {item.instructions?<p className="mt-2">{item.instructions}</p>:null}
     {options.length>0?<div className="mt-3 rounded-xl bg-[#f8f2e7] p-4">
      <strong>الاختيارات:</strong><ul className="mt-2 list-disc space-y-2 pr-6">
       {options.map((opt,j)=><li key={j}>{printable(opt)}</li>)}
      </ul></div>:null}
     <div className="mt-3 rounded-xl bg-[#f0f6f1] p-4">
      <strong>الإجابة المسجلة (تحتاج تحقق المعلم):</strong>
      <pre className="mt-2 whitespace-pre-wrap break-words font-sans">{printable(answer.correct??item.answer)}</pre>
     </div>
     {content.teacherNote?<p className="mt-3 leading-7"><strong>ملاحظة المعلم:</strong> {printable(content.teacherNote)}</p>:null}
     {content.alignmentStatus?<p className="mt-2 text-xs leading-6">مطابقة المصدر: {printable(content.alignmentStatus)}</p>:null}
    </article>;
   }):null}
   <p className="rounded-2xl border border-[#ded0b7] bg-white p-5 leading-7">
    قبل الاعتماد: طابق السؤال مع المصدر، تحقق من الإجابة ومستوى الصعوبة،
    وافحص حقوق المحتوى. هذه الصفحة لا تنفذ أي تعديلات.
   </p>
  </div>
 </main>;
}
