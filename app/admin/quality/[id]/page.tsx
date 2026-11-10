import "server-only";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVerifiedLessonReviewer } from "@/lib/lesson-review/authorization";
import {
  AXIS_LABELS,NEXT_REVIEW_STAGE,QUALITY_AXES,STAGE_LABELS,
  type AxisState,type ReviewStage,
} from "@/lib/lesson-review/model";
export const dynamic = "force-dynamic";

type Review = {axis:string;state:AxisState;notes:string;reviewer_name:string|null;reviewed_at:string|null};
export default async function ReviewLessonDetail({params}: {params:Promise<{id:string}>}) {
  if (!(await getVerifiedLessonReviewer())) redirect("/admin");
  const {id}=await params;
  if(!/^[0-9a-fA-F-]{36}$/.test(id)) notFound();
  const db=createAdminClient();
  const [lesson,flow,axes,history]=await Promise.all([
    db.from("lessons").select("id,title,status").eq("id",id).maybeSingle(),
    db.from("dadyoom_lq1_review_workflows").select("stage").eq("lesson_id",id).maybeSingle(),
    db.from("dadyoom_lq1_quality_axis_reviews").select("axis,state,notes,reviewer_name,reviewed_at").eq("lesson_id",id),
    db.from("dadyoom_lq1_review_events").select("from_stage,to_stage,reviewer_name,notes,occurred_at,version_number")
      .eq("lesson_id",id).order("version_number",{ascending:false}).limit(30),
  ]);
  if(lesson.error||!lesson.data) notFound();
  if(flow.error||axes.error||history.error) return <main dir="rtl" className="p-6" role="alert">تعذر تحميل سجل المراجعة. لم تُطبق قاعدة بيانات المراجعة أو حدث خطأ.</main>;
  const stage=(flow.data?.stage??(lesson.data.status==="published"?"published_unreviewed":"draft")) as ReviewStage;
  const next=NEXT_REVIEW_STAGE[stage];
  const reviews=(axes.data??[]) as Review[];
  return <main dir="rtl" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <Link href="/admin/quality" className="underline">لوحة المراجعات</Link>
    <header><h1 className="text-2xl font-black">{lesson.data.title}</h1>
      <p className="mt-2">حالة المراجعة: {STAGE_LABELS[stage]} · حالة نشر الدرس الأصلية: {lesson.data.status}</p>
      <p className="text-sm">لا تُنشر تغييرات الدرس ولا شارة الاعتماد من هذه اللوحة.</p>
    </header>
    <section aria-label="محاور الجودة" className="space-y-3">
      {QUALITY_AXES.map(a=>{
        const row=reviews.find(x=>x.axis===a.key);
        return <form key={a.key} method="post" action="/api/admin/quality"
          className="space-y-2 rounded-xl border bg-white p-4">
          <h2 className="font-bold">{a.name}</h2><p className="text-sm">{a.description}</p>
          <p className="text-xs">آخر حالة: {AXIS_LABELS[row?.state??"unreviewed"]}؛ المراجع: {row?.reviewer_name??"لا يوجد"}</p>
          <input type="hidden" name="intent" value="axis"/>
          <input type="hidden" name="lesson_id" value={id}/>
          <input type="hidden" name="axis" value={a.key}/>
          <label>قرار المراجعة <select name="state" defaultValue={row?.state??"in_review"} className="border p-2">
            {Object.entries(AXIS_LABELS).map(([key,value])=><option key={key} value={key}>{value}</option>)}
          </select></label>
          <label className="block">ملاحظات المراجع
            <textarea name="notes" required maxLength={2000} defaultValue={row?.notes??""}
              className="mt-1 block w-full rounded border p-2" rows={2}/>
          </label>
          <button disabled={stage==="approved"||stage==="published"}
            className="rounded bg-[#174f47] px-3 py-2 font-bold text-white disabled:opacity-40">حفظ قرار المحور</button>
        </form>;
      })}
    </section>
    {next&&<section className="rounded-xl border bg-white p-4">
      <h2 className="font-bold">انتقال إلى المرحلة التالية: {STAGE_LABELS[next]}</h2>
      <p className="text-sm">انتقال يدوي واحد فقط، مع تسجيل المراجع والملاحظات ونسخة الدرس. لا يغير النشر العام.</p>
      <form method="post" action="/api/admin/quality" className="mt-3 space-y-2">
        <input type="hidden" name="intent" value="transition"/>
        <input type="hidden" name="lesson_id" value={id}/>
        <input type="hidden" name="next_stage" value={next}/>
        <textarea name="notes" required maxLength={2000} rows={3}
          placeholder="سبب الانتقال وملخص الأدلة" className="block w-full rounded border p-2"/>
        <button className="rounded bg-[#174f47] px-4 py-2 font-bold text-white">
          اعتماد الانتقال الداخلي فقط
        </button>
      </form>
    </section>}
    <section><h2 className="font-bold">سجل القرارات والإصدارات</h2>
      {(history.data??[]).map(e=><article key={e.version_number} className="mt-2 rounded border p-3">
        <p>الإصدار {e.version_number}: {e.from_stage} ← {e.to_stage}</p>
        <p>المراجع: {e.reviewer_name} · {new Date(e.occurred_at).toLocaleString("ar-BH")}</p>
        <p>{e.notes}</p>
      </article>)}
      {!(history.data??[]).length&&<p>لا توجد قرارات مراجعة مسجلة بعد.</p>}
    </section>
  </main>;
}
