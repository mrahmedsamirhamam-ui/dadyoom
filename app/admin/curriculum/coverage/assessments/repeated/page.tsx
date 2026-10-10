import Link from "next/link";
import audit from "@/data/curriculum-completeness/bahrain-repeated-assessment-prompts-20261010.json";
import { extractBahrainPlanYear } from "@/lib/curriculum/source-plan-year";

// This is an admin-only QA snapshot; no activity is automatically invalidated.
const route="/admin/curriculum/coverage/assessments/repeated";
const pageSize=25;
const grades=[...new Set(audit.entries.map(x=>String(x.grade??"adult")))].sort((a,b)=>a==="adult"?1:b==="adult"?-1:Number(a)-Number(b));
function link(grade:string,page:number) {
 const p=new URLSearchParams();
 if(grade!=="all")p.set("grade",grade);
 if(page>1)p.set("page",String(page));
 const search=p.toString();
 return search ? route+"?"+search : route;
}
export default async function RepeatedAssessments({
 searchParams,
}: {searchParams:Promise<{grade?:string;page?:string}>}) {
 const p=await searchParams;
 const grade=grades.includes(p.grade??"")?p.grade!:"all";
 const filtered=audit.entries.filter(x=>grade==="all"||String(x.grade??"adult")===grade);
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const requested=Number(p.page??1);
 const current=Number.isSafeInteger(requested)?Math.max(1,Math.min(pages,requested)):1;
 const records=filtered.slice((current-1)*pageSize,current*pageSize);
 return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
  <div className="mx-auto max-w-6xl space-y-6">
   <nav className="flex flex-wrap gap-3 text-sm font-black text-[#15584e]">
    <Link href="/admin">الإدارة</Link><span>←</span>
    <Link href="/admin/curriculum/coverage/assessments">تقييمات البحرين</Link><span>←</span><span>الأسئلة المتكررة</span>
   </nav>
   <header className="rounded-3xl border border-[#d8c7a4] bg-white p-7">
    <h1 className="text-3xl font-black">تدقيق تكرار الأسئلة بين الدروس</h1>
    <p className="mt-3 leading-8">لقطة موثقة بتاريخ {audit.auditedAt}. نراجع هنا سؤالًا
    يتكرر في عشرة دروس مختلفة أو أكثر من الصف والفصل وتصنيف المصدر نفسه.
    التشابه لا يثبت وجود خطأ، لكنه لا يثبت إتقان مهارة الدرس المحددة.</p>
    <p className="mt-3 leading-8">في هذه اللقطة يظهر السؤال العام «{audit.summary.genericRepeatedPrompt}»
    في {audit.summary.genericPromptActivityCount} درسًا مختلفًا، ولا تحمل هذه الأنشطة وسم المراجعة.
    يوجد كذلك {audit.summary.alreadyMarkedReviewActivities} نشاطًا مكررًا سبق وسمها بالمراجعة.
    يُرجى مراجعة مدى ملاءمة السؤال للدرس والإجابة والتمايز ومصدر الكتاب قبل الاعتماد.</p>
    <p className="mt-3 text-sm text-[#786955]">عدد الدروس في الفلتر: {filtered.length}.
    لا تغير هذه الصفحة أنشطة الطلاب أو درجاتهم، ولا تمثل مطابقة موثقة لفهارس الكتب.</p>
   </header>
   <section className="rounded-3xl border border-[#d8c7a4] bg-white p-5">
    <h2 className="font-black">اختر الصف للمراجعة</h2>
    <nav aria-label="تصفية الصف الدراسي" className="mt-3 flex flex-wrap gap-2">
     {["all",...grades].map(g=><Link key={g} href={link(g,1)}
      aria-current={g===grade?"page":undefined}
      className={`rounded-xl border px-3 py-2 text-sm font-black ${g===grade?"bg-[#123f39] text-white":"bg-[#fffdf8] text-[#123f39]"}`}>
      {g==="all"?"كل الصفوف":g==="adult"?"التعليم المستمر":`الصف ${g}`}
     </Link>)}
    </nav>
   </section>
   <section className="space-y-3">
    <h2 className="text-xl font-black">الصفحة {current} من {pages}</h2>
    {records.map(r=><article key={r.activityId} className="rounded-2xl border border-[#dccba9] bg-white p-5">
     <p className="text-sm font-black text-[#655939]">الصف {r.grade??"مستوى غير قياسي"} • الفصل {r.term}
     • تكرر السؤال في {r.repeatLessonCount} درسًا من الفئة نفسها</p>
     <h3 className="mt-2 text-lg font-black">{r.lessonTitle}</h3>
     <p className="mt-2 leading-7"><strong>السؤال المكرر:</strong> {r.question}</p>
     <p className="mt-2 text-sm text-[#786955]">{r.reviewStatus==="required"
       ?"موسوم سابقًا بأنه يحتاج مراجعة المعلم"
       :"لم يُوسم هذا النشاط بالمراجعة؛ التكرار يستدعي فحصًا تربويًا"}
       {" • "}سنة وثيقة المصدر: {extractBahrainPlanYear("BH",r.sourcePdfUrl)??"غير مستخلصة"}
       {" • "}صفحة المصدر: {r.sourcePageStart??"غير محددة"}</p>
     <div className="mt-3 flex flex-wrap gap-4 text-sm font-black text-[#15584e]">
      <Link className="underline" href={`/lessons/${r.lessonId}`}>افتح الدرس</Link>
      {r.sourcePdfUrl?.startsWith("https://")?<a href={r.sourcePdfUrl} rel="noopener noreferrer" target="_blank" className="underline">مصدر الدرس ↗</a>:null}
     </div>
    </article>)}
    {records.length===0?<p className="rounded-xl bg-white p-5">لا توجد نتائج.</p>:null}
   </section>
   <nav aria-label="ترقيم النتائج" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
    {current>1?<Link href={link(grade,current-1)} className="font-black text-[#15584e] underline">الصفحة السابقة</Link>:<span>البداية</span>}
    <span>{current} / {pages}</span>
    {current<pages?<Link href={link(grade,current+1)} className="font-black text-[#15584e] underline">الصفحة التالية</Link>:<span>النهاية</span>}
   </nav>
  </div>
 </main>;
}
