import Link from "next/link";
import audit from "@/data/curriculum-completeness/bahrain-assessment-quality-audit-20261010.json";
import { extractBahrainPlanYear } from "@/lib/curriculum/source-plan-year";

// Uses a bounded read-only snapshot; no expensive join on each live page view.
export const dynamic = "force-dynamic";
const perPage = 25;
const path = "/admin/curriculum/coverage/assessments/review";
const scopes = ["all","plan-scheduled","official-book-unscheduled","UNCLASSIFIED"] as const;
const scopeLabels: Record<string,string> = {
  all: "جميع الحالات",
  "plan-scheduled": "الخطة الحالية",
  "official-book-unscheduled": "محتوى كتاب غير مجدول",
  UNCLASSIFIED: "مصدر غير مصنف",
};
function href(scope: string, grade: string, page: number) {
  const p = new URLSearchParams();
  if (scope !== "all") p.set("scope",scope);
  if (grade !== "all") p.set("grade",grade);
  if (page > 1) p.set("page",String(page));
  const query = p.toString();
  return query ? `${path}?${query}` : path;
}
export default async function BahrainAssessmentReviewQueue({
  searchParams,
}: {
  searchParams: Promise<{scope?: string;grade?: string;page?: string}>;
}) {
  const params=await searchParams;
  const scope=(scopes as readonly string[]).includes(params.scope ?? "") ? params.scope! : "all";
  const gradeOptions=[...new Set(audit.reviewQueue.map(row=>row.grade===null?"adult":String(row.grade)))].sort((a,b)=>a==="adult"?1:b==="adult"?-1:Number(a)-Number(b));
  const grade=gradeOptions.includes(params.grade ?? "") ? params.grade! : "all";
  const filtered=audit.reviewQueue.filter(row=>
    (scope==="all" || row.scope===scope) &&
    (grade==="all" || (row.grade===null?"adult":String(row.grade))===grade)
  );
  const pages=Math.max(1,Math.ceil(filtered.length/perPage));
  const requested=Number(params.page??1);
  const current=Number.isSafeInteger(requested)?Math.max(1,Math.min(pages,requested)):1;
  const rows=filtered.slice((current-1)*perPage,current*perPage);
  const count=filtered.reduce((total,row)=>total+row.reviewRequiredActivities,0);
  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
    <div className="mx-auto max-w-6xl space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
        <Link href="/admin">الإدارة</Link><span>←</span>
        <Link href="/admin/curriculum/coverage/assessments">تدقيق الأنشطة</Link><span>←</span>
        <span>قائمة مراجعة المعلم</span>
      </nav>
      <header className="rounded-3xl border border-[#d8c7a4] bg-white p-6 sm:p-8">
        <p className="text-sm font-black text-[#9a712c]">البحرين — لقطة مراجعة {audit.reviewQueueDataAt}</p>
        <h1 className="mt-2 text-3xl font-black">قائمة أنشطة تحتاج مراجعة تربوية</h1>
        <p className="mt-3 leading-8">تحتوي القائمة على أنشطة موسومة صراحةً بأنها تحتاج إلى مراجعة.
          إدراج الدرس لا يثبت خطأه أو صحة مطابقته للكتاب. ولا تمكّن هذه الصفحة من اعتماد
          الأنشطة أو تعديل بيانات الطلاب. أرقام القائمة ثابتة لحين إعادة التدقيق.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
          <span className="rounded-xl bg-[#eaf4ec] px-4 py-2">الدروس الظاهرة بالفلتر: {filtered.length}</span>
          <span className="rounded-xl bg-[#fff0d6] px-4 py-2">أنشطة تحتاج مراجعة: {count}</span>
        </div>
      </header>
      <section className="rounded-3xl border border-[#d8c7a4] bg-white p-5">
        <h2 className="font-black">حالة المصدر</h2>
        <nav aria-label="تصفية حالة المصدر" className="mt-3 flex flex-wrap gap-2">
          {scopes.map(key=><Link key={key} href={href(key,grade,1)}
            aria-current={scope===key?"page":undefined}
            className={`rounded-xl border px-3 py-2 text-sm font-bold ${scope===key?"bg-[#123f39] text-white":"bg-[#fffdf8] text-[#123f39]"}`}>
            {scopeLabels[key]}
          </Link>)}
        </nav>
        <h2 className="mt-6 font-black">الصف الدراسي</h2>
        <nav aria-label="تصفية الصف" className="mt-3 flex flex-wrap gap-2">
          {["all",...gradeOptions].map(key=><Link key={key} href={href(scope,key,1)}
            aria-current={grade===key?"page":undefined}
            className={`rounded-xl border px-3 py-2 text-sm font-bold ${grade===key?"bg-[#123f39] text-white":"bg-[#fffdf8] text-[#123f39]"}`}>
            {key==="all"?"كل الصفوف":key==="adult"?"التعليم المستمر":`الصف ${key}`}
          </Link>)}
        </nav>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-black">النتائج — الصفحة {current} من {pages}</h2>
        {rows.map(row=><article key={row.lessonId} className="rounded-2xl border border-[#d8c7a4] bg-white p-5">
          <p className="text-xs font-bold text-[#77664c]">
            {row.grade===null?"التعليم المستمر":`الصف ${row.grade}`} •
            الفصل/الجزء {row.semester} • {scopeLabels[row.scope]??row.scope}
          </p>
          <h3 className="mt-2 text-lg font-black leading-8">{row.title}</h3>
          <p className="mt-2 text-sm leading-7">
            <strong>{row.reviewRequiredActivities}</strong> نشاط يحتاج مراجعة — الأنواع: {row.activityTypes.join("، ") || "غير محدد"}
          </p>
          <p className="mt-1 text-xs text-[#786e60]">
            سنة وثيقة المصدر: {extractBahrainPlanYear("BH",row.sourcePdfUrl)??"غير مستخلصة"}؛
            صفحة المصدر: {row.sourcePageStart??"غير محددة"} — سنة الوثيقة لا تثبت خطة حالية.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-[#15584e]">
            <Link href={`/admin/curriculum/coverage/assessments/review/${row.lessonId}`} className="underline">فحص الأسئلة والإجابات</Link>
            <Link href={`/lessons/${row.lessonId}`} className="underline">فتح الدرس للتدقيق</Link>
            {row.sourcePdfUrl?.startsWith("https://") ?
              <a href={row.sourcePdfUrl} target="_blank" rel="noopener noreferrer" className="underline">الرجوع إلى المصدر الرسمي ↗</a> : null}
          </div>
        </article>)}
        {!rows.length?<p className="rounded-xl bg-white p-5">لا توجد أنشطة من هذه الفئة في لقطة التدقيق.</p>:null}
      </section>
      <nav aria-label="صفحات النتائج" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
        {current>1?<Link className="font-black text-[#15584e] underline" href={href(scope,grade,current-1)}>← الصفحة السابقة</Link>:<span>البداية</span>}
        <span className="text-sm font-bold">الصفحة {current} من {pages}</span>
        {current<pages?<Link className="font-black text-[#15584e] underline" href={href(scope,grade,current+1)}>الصفحة التالية →</Link>:<span>النهاية</span>}
      </nav>
    </div>
  </main>;
}
