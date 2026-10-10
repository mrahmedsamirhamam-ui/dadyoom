import Link from "next/link";
import drafts from "@/data/curriculum-completeness/bahrain-grade1-sem2-objective-drafts-20261010.json";
import { createClient } from "@/lib/supabase/server";

// Admin-only parent layout verifies permissions before viewing unpublished data.
export const dynamic = "force-dynamic";

type DbDraft={id:string;lesson_id:string;is_published:boolean;content:unknown;answer:unknown};
function object(value:unknown):Record<string,unknown>{
  return value!==null && typeof value==="object" && !Array.isArray(value)
    ? value as Record<string,unknown> : {};
}
export default async function BahrainGradeOneDraftReview(){
  const db=await createClient();
  const {data,error}=await db.from("lesson_activities")
    .select("id,lesson_id,is_published,content,answer")
    .in("lesson_id",drafts.items.map(row=>row.lessonId))
    .eq("content->>origin",drafts.origin)
    .limit(20);
  const records=(data??[]) as DbDraft[];
  const byLesson=new Map(records.map(row=>[row.lesson_id,row]));
  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
    <div className="mx-auto max-w-5xl space-y-5">
      <nav className="flex gap-3 text-sm font-bold text-[#15584e]">
        <Link href="/admin">الإدارة</Link><span>←</span>
        <Link href="/admin/curriculum/coverage/assessments">جودة التقييمات</Link>
      </nav>
      <header className="rounded-3xl border border-[#d8c7a4] bg-white p-7">
        <p className="text-sm font-black text-[#947035]">الصف الأول — البحرين — الجزء الثاني</p>
        <h1 className="mt-2 text-3xl font-black">مراجعة مسودات تمييز الحروف</h1>
        <p className="mt-3 leading-8">هذه تدريبات أصلية من ضاديوم مستوحاة من مهارة الحرف في عنوان الدرس.
          ليست نصوصًا من الكتاب المدرسي، ولم تُعتمد مطابقتها لفهرس 2026–2027.
          لا يمكن نشرها من هذه الصفحة؛ اعتمادها يحتاج فحص المعلم لكل إجابة وبدائلها.</p>
        <p className="mt-3 text-xs text-[#786e60]">المصدر: مسودات {drafts.createdAt}؛ تُقارن محتوياتها مع قاعدة البيانات عند فتح الصفحة.</p>
        {error?<p role="alert" className="mt-3 rounded-xl bg-amber-50 p-4 font-black text-amber-900">
          تعذر جلب حالة المسودات الحالية. لا تفترض أنها غير منشورة حتى تراجع البيانات.
        </p>:<div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
          <span className="rounded-xl bg-[#eef6ed] px-3 py-2">{records.length} مسودة موجودة في قاعدة البيانات</span>
          <span className="rounded-xl bg-[#fff2dc] px-3 py-2">
            {records.filter(x=>x.is_published).length} نشاط منشور — يحتاج تحقق فوري إن كان أكبر من صفر
          </span>
        </div>}
      </header>
      {!error? drafts.items.map((item,index)=>{
        const row=byLesson.get(item.lessonId);
        const currentQuestion=object(row?.content).text;
        const currentOptions=object(row?.content).options;
        const currentAnswer=object(row?.answer).correct;
        const unchanged=row!==undefined &&
          currentQuestion===item.prompt &&
          JSON.stringify(currentOptions)===JSON.stringify(item.options) &&
          currentAnswer===item.correct;
        return <article key={item.lessonId} className="rounded-2xl border border-[#d8c7a4] bg-white p-6">
          <p className="text-sm font-black text-[#8a6b33]">المسودة {index+1} من {drafts.items.length}</p>
          <h2 className="mt-2 text-xl font-black">{item.lessonTitle}</h2>
          <p role="status" className="mt-3 text-sm font-black text-[#7c5820]">
            {!row?"المسودة غير موجودة في قاعدة البيانات — يلزم إعادة فحص":row.is_published?"منشورة في قاعدة البيانات — تحتاج تحقق حالة الاعتماد":unchanged?"غير منشورة — مطابقة لنسخة المصدر المحفوظة":"غير منشورة لكن محتواها تغيّر عن نسخة المصدر — يلزم تدقيق"}
          </p>
          <p className="mt-4 leading-8"><strong>السؤال المقترح:</strong> {item.prompt}</p>
          <ol className="mt-2 list-decimal space-y-2 pr-6">
            {item.options.map(option=><li key={option}>{option}</li>)}
          </ol>
          <p className="mt-3 rounded-xl bg-[#eef6ed] p-4"><strong>الإجابة المقترحة:</strong> {item.correct}</p>
          <p className="mt-2 text-sm leading-7">{item.explanation}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-[#15584e]">
            <Link href={`/lessons/${item.lessonId}`} className="underline">عرض الدرس</Link>
          </div>
        </article>;
      }):null}
      <p className="rounded-2xl border border-[#d8c7a4] bg-white p-5 leading-7">
        <strong>قبل النشر:</strong> تأكد من سلامة نطق الحرف والمستوى والبدائل،
        وافحص كتاب العام الحالي عند توفره. لا تنشر السؤال بوصفه تطبيقًا رسميًا قبل التوثيق.
      </p>
    </div>
  </main>;
}
