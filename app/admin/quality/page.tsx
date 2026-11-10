import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVerifiedLessonReviewer } from "@/lib/lesson-review/authorization";
import { REVIEW_STAGES, STAGE_LABELS, type ReviewStage } from "@/lib/lesson-review/model";
export const dynamic = "force-dynamic";

type ReviewRow = {
  id:string; title:string; public_status:string; country_code:string;
  grade_number:number; review_stage:ReviewStage; review_started:boolean;
};
type Dashboard = { total:number; counts:Record<string,number>; items:ReviewRow[] };
function parsePage(value:string|undefined) {
  const n=Number(value ?? "1");
  return Number.isSafeInteger(n)&&n>0?Math.min(n,10000):1;
}
export default async function QualityBoard({searchParams}:{
  searchParams:Promise<{country?:string;grade?:string;stage?:string;page?:string}>;
}) {
  if (!(await getVerifiedLessonReviewer())) redirect("/admin");
  const s=await searchParams;
  const country=/^[A-Z]{2}$/.test(s.country??"")?s.country!:null;
  const grade=Number(s.grade);
  const gradeFilter=s.grade&&Number.isInteger(grade)&&grade>=1&&grade<=13?grade:null;
  const stage=REVIEW_STAGES.includes(s.stage as ReviewStage)?s.stage!:null;
  const page=parsePage(s.page);
  const db=createAdminClient();
  const countriesRequest=db.from("countries").select("code,name_ar").order("name_ar");
  const reviewRequest=db.rpc("dadyoom_lq1_review_dashboard",{
    p_country:country,p_grade:gradeFilter,p_stage:stage,p_limit:40,p_offset:(page-1)*40,
  });
  const [countryResult,reviewResult]=await Promise.all([countriesRequest,reviewRequest]);
  if (reviewResult.error || !reviewResult.data) return (
    <main className="p-6" dir="rtl"><h1 className="text-2xl font-bold">مراجعة جودة الدروس</h1>
      <p role="alert" className="mt-4">بيانات دورة المراجعة غير متاحة؛ ترحيل قاعدة البيانات لم يُطبّق أو تعذرت القراءة. لا تُعرض أعداد تقديرية.</p>
    </main>);
  const data=reviewResult.data as Dashboard;
  const countries=(countryResult.data??[]) as {code:string;name_ar:string}[];
  const query=(p:number)=>`?country=${country??""}&grade=${gradeFilter??""}&stage=${stage??""}&page=${p}`;
  return <main dir="rtl" className="space-y-6 p-4 sm:p-8">
    <header>
      <h1 className="text-2xl font-black">مكتبة ضاديوم التعليمية التفاعلية: من المنهج إلى الإتقان</h1>
      <p className="mt-2 text-sm">لوحة مراجعين داخلية؛ بيانات الموافقة لا تغيّر ظهور الدروس للزوار، والشارة العامة معطلة.</p>
    </header>
    <form method="get" className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4">
      <label>الدولة <select name="country" defaultValue={country??""} className="block w-full border p-2">
        <option value="">كل الدول</option>{countries.map(c=><option key={c.code} value={c.code}>{c.name_ar}</option>)}
      </select></label>
      <label>الصف <select name="grade" defaultValue={gradeFilter??""} className="block w-full border p-2">
        <option value="">كل الصفوف</option>{Array.from({length:13},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
      </select></label>
      <label>حالة المراجعة <select name="stage" defaultValue={stage??""} className="block w-full border p-2">
        <option value="">كل الحالات</option>{REVIEW_STAGES.map(x=><option key={x} value={x}>{STAGE_LABELS[x]}</option>)}
      </select></label>
      <button type="submit" className="self-end rounded-lg bg-[#174f47] px-4 py-3 font-bold text-white">تصفية</button>
    </form>
    <section aria-label="أعداد حالات المراجعة" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {REVIEW_STAGES.map(x=><div className="rounded-xl border bg-white p-4" key={x}>
        <p className="text-sm">{STAGE_LABELS[x]}</p>
        <p className="text-2xl font-black tabular-nums">{data.counts[x]??0}</p>
      </div>)}
    </section>
    <section>
      <h2 className="mb-3 font-bold">الدروس المطابقة للفلاتر: {data.total}</h2>
      <div className="space-y-2">{data.items.map(l=><article className="rounded-xl border bg-white p-4" key={l.id}>
        <h3 className="font-bold">{l.title}</h3>
        <p className="text-sm">{l.country_code} · صف {l.grade_number} · {STAGE_LABELS[l.review_stage]}</p>
        <p className="text-xs">حالة النشر الحالية: {l.public_status==="published"?"منشور":"غير منشور"}</p>
        <Link className="mt-2 inline-block font-bold underline" href={`/admin/quality/${l.id}`}>افتح بطاقة الجودة وسجل القرارات</Link>
      </article>)}</div>
      {!data.items.length&&<p>لا توجد نتائج لهذا النطاق.</p>}
    </section>
    <nav aria-label="صفحات المراجعة" className="flex gap-6">
      {page>1&&<Link href={query(page-1)}>السابق</Link>}
      {page*40<data.total&&<Link href={query(page+1)}>التالي</Link>}
    </nav>
  </main>;
}
