import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedLessonReviewer } from "@/lib/lesson-review/authorization";
import { loadPrimaryPilotReport, stagingPilotClient } from "@/lib/curriculum-review/primary-pilot-server";
import type { PilotAction, PilotLane } from "@/lib/curriculum-review/primary-pilot";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTION_FOR_LANE: Record<PilotLane, PilotAction> = {
  green:"approve_official",yellow:"mark_enrichment",red:"keep_draft",
};
function reply(body:object,status=200) {
  return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
}
export async function GET(request:NextRequest) {
  const reviewer=await getVerifiedLessonReviewer();
  if (!reviewer) return reply({error:"ليس لديك تصريح مراجعة الدروس."},403);
  try {
    const data=loadPrimaryPilotReport();
    const lane=request.nextUrl.searchParams.get("lane") ?? "red";
    const page=Number(request.nextUrl.searchParams.get("page") ?? "1");
    if (!["green","yellow","red"].includes(lane) || !Number.isInteger(page) || page<1 || page>10000)
      return reply({error:"تصفية غير صالحة."},400);
    const filtered=data.rows.filter(row=>row.lane===lane);
    const pageSize=30;
    return reply({
      rows:filtered.slice((page-1)*pageSize,page*pageSize),
      page,pageSize,total:filtered.length,counts:data.counts,
      reportHash:data.reportHash,
      snapshotComplete:data.snapshotComplete,
      writesEnabled:stagingPilotClient()!==null,
      scope:{country:"BH",grades:[1,2,3]},
      note:"التصنيف من تقرير جرد محلي؛ الاعتماد يتطلب تحققًا جديدًا على الخادم وفي قاعدة staging.",
    });
  } catch {
    return reply({error:"تقرير الجرد المحلي غير متاح أو غير صالح؛ لا تُعرض بيانات افتراضية."},503);
  }
}
export async function POST(request:NextRequest) {
  const origin=request.headers.get("origin");
  if (!origin || origin!==new URL(request.url).origin)
    return reply({error:"مصدر الطلب غير مطابق."},403);
  const reviewer=await getVerifiedLessonReviewer();
  if (!reviewer) return reply({error:"ليس لديك تصريح المراجعة."},403);
  const database=stagingPilotClient();
  if (!database) return reply({error:"الكتابة معطلة: يتطلب القرار قاعدة staging منفصلة وإذنًا محليًا صريحًا."},503);
  const size=Number(request.headers.get("content-length")??"0");
  if (size>10000) return reply({error:"طلب كبير جدًا."},413);
  let input:Record<string,unknown>;
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return reply({error:"تنسيق الطلب غير مدعوم."},415);
    const raw=await request.text();
    if (raw.length>10000) return reply({error:"طلب كبير جدًا."},413);
    const parsed:unknown=JSON.parse(raw);
    if (!parsed || typeof parsed!=="object" || Array.isArray(parsed)) throw Error("INVALID_BODY");
    input=parsed as Record<string,unknown>;
  } catch {return reply({error:"طلب غير صالح."},400);}
  const id=typeof input.id==="string"?input.id:"";
  const action=typeof input.action==="string"?input.action:"";
  const notes=typeof input.notes==="string"?input.notes.trim():"";
  const summary=typeof input.proposedSummary==="string"?input.proposedSummary.trim():null;
  const reportHash=typeof input.reportHash==="string"?input.reportHash:"";
  if (!UUID.test(id) || notes.length<20 || notes.length>2000)
    return reply({error:"المعرف أو سبب القرار غير صالح؛ اكتب 20 حرفًا على الأقل."},400);
  let data:ReturnType<typeof loadPrimaryPilotReport>;
  try {data=loadPrimaryPilotReport();} catch {return reply({error:"تعذر إعادة قراءة تقرير الجرد."},503);}
  if (data.reportHash!==reportHash) return reply({error:"تغير التقرير منذ فتح الصفحة؛ حدّث النتائج."},409);
  const row=data.rows.find(item=>item.id===id);
  if (!row || ACTION_FOR_LANE[row.lane]!==action)
    return reply({error:"القرار لا يطابق القائمة أو النطاق؛ لا تنفيذ."},409);
  if (action==="approve_official" && (!data.snapshotComplete || !row.eligible_for_independent_human_decision))
    return reply({error:"لم تثبت شروط المراجعة الأربعة في الجرد المحلي."},409);
  if (action==="mark_enrichment" && (!summary || summary.length<40 || summary.length>500))
    return reply({error:"يلزم وصف إثرائي بديل بين 40 و500 حرف."},400);
  const {data:decision,error}=await database.rpc("dadyoom_cm1_record_primary_decision",{
    p_lesson_id:id,p_action:action,p_reviewer_id:reviewer.id,
    p_reviewer_name:reviewer.name,p_notes:notes,p_proposed_summary:summary,
  });
  if (error) {
    // Do not leak DB internals to browser. A failed RPC leaves the transaction rolled back.
    return reply({error:"رفضت قاعدة staging القرار أو لم تُثبت الأدلة المطلوبة؛ لا تعديل."},409);
  }
  return reply({ok:true,decision,note:"حُفظ قرار المراجعة الخاص بـ staging دون تغيير lessons.status أو lessons.summary."});
}
