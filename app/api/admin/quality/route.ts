import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVerifiedLessonReviewer } from "@/lib/lesson-review/authorization";
import {
  QUALITY_AXES,NEXT_REVIEW_STAGE,type AxisState,type ReviewStage,
} from "@/lib/lesson-review/model";
export const runtime="nodejs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const states=new Set<AxisState>(["unreviewed","in_review","approved","needs_changes"]);
function response(message:string,status:number) {
  return NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:NextRequest) {
  const origin=request.headers.get("origin");
  const forwarded=request.headers.get("x-forwarded-host");
  const host=forwarded??request.headers.get("host");
  if (!origin||!host) return response("رفض الطلب غير الموثق.",403);
  try { if (new URL(origin).host!==host) return response("المصدر غير مطابق.",403); }
  catch { return response("المصدر غير صالح.",403); }
  const reviewer=await getVerifiedLessonReviewer();
  if (!reviewer) return response("لا تملك صلاحية المراجع المعتمد.",403);
  const form=await request.formData();
  const id=String(form.get("lesson_id")??"").trim();
  const intent=String(form.get("intent")??"");
  const notes=String(form.get("notes")??"").trim();
  if (!UUID.test(id)||!notes||notes.length>2000) return response("معرّف الدرس أو الملاحظات غير صالحة.",400);
  const db=createAdminClient();
  if(intent==="axis") {
    const axis=String(form.get("axis")??"");
    const state=String(form.get("state")??"") as AxisState;
    if(!QUALITY_AXES.some(x=>x.key===axis)||!states.has(state))
      return response("محور الجودة أو حالته غير صالح.",400);
    const {error}=await db.from("lesson_quality_axis_reviews").upsert({
      lesson_id:id,axis,state,notes,
      reviewer_id:reviewer.id,reviewer_name:reviewer.name,
      reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString(),
    },{onConflict:"lesson_id,axis"});
    if(error) return response("تعذر حفظ القرار؛ راجع حالة قاعدة البيانات والدرس.",409);
  } else if(intent==="transition") {
    const next=String(form.get("next_stage")??"") as ReviewStage;
    const [flow,lesson]=await Promise.all([
      db.from("lesson_review_workflows").select("stage").eq("lesson_id",id).maybeSingle(),
      db.from("lessons").select("status").eq("id",id).maybeSingle(),
    ]);
    if(flow.error||lesson.error||!lesson.data) return response("تعذر التحقق من حالة الدرس الحالية.",409);
    const from=(flow.data?.stage??(lesson.data.status==="published"?"published_unreviewed":"draft")) as ReviewStage;
    if(NEXT_REVIEW_STAGE[from]!==next) return response("لا يجوز تخطي مراحل المراجعة.",409);
    // The DB function uses SELECT FOR UPDATE and repeats all checks atomically.
    const {error}=await db.rpc("advance_lesson_review",{
      p_lesson_id:id,p_next_stage:next,p_reviewer_id:reviewer.id,
      p_reviewer_name:reviewer.name,p_notes:notes,
    });
    if(error) return response("لم يُقبل الانتقال؛ تحقق من اعتماد المحاور الستة وتوافر السجل.",409);
  } else return response("عملية غير مدعومة.",400);
  // Never updates lessons.status, does not publish or show public badge.
  return NextResponse.redirect(new URL(`/admin/quality/${id}`,request.url),303);
}
