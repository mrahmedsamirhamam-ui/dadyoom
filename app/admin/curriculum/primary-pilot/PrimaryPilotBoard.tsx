"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PROOF_NAMES,
  type PilotAction,
  type PilotLane,
  type PilotProofKey,
  type PilotRow,
} from "@/lib/curriculum-review/primary-pilot";

type Payload = {
  rows:PilotRow[];
  counts:Record<PilotLane,number>;
  page:number; pageSize:number; total:number;
  reportHash:string; snapshotComplete:boolean; writesEnabled:boolean; note:string;
};
const lanes: {key:PilotLane;label:string;hint:string}[] = [
  {key:"green",label:"الخضراء: جاهزة لقرار الاعتماد",hint:"تُراجع الأدلة مجددًا على الخادم قبل تسجيل VERIFIED في سجل المراجعة الخاص"},
  {key:"yellow",label:"الصفراء: تضارب الوصف",hint:"المطلوب صياغة واضحة للإثراء الأصلي، دون نسبة الدرس إلى الوزارة"},
  {key:"red",label:"الحمراء: تحتاج استكمالًا",hint:"لا يتم سحب الدرس المنشور تلقائيًا؛ القرار يسجل في مسار المراجعة فقط"},
];
const actions: Record<PilotLane,{label:string;action:PilotAction}> = {
  green:{label:"اعتماد كمطابق رسمي",action:"approve_official"},
  yellow:{label:"تعديل الوصف إلى إثراء ضاديوم",action:"mark_enrichment"},
  red:{label:"حفظ كمسودة غير مكتملة",action:"keep_draft"},
};
const proofKeys: PilotProofKey[] = [
  "official_source","complete_explanation","tested_interactions","independent_review",
];

export default function PrimaryPilotBoard() {
  const [lane,setLane]=useState<PilotLane>("red");
  const [page,setPage]=useState(1);
  const [reload,setReload]=useState(0);
  const [data,setData]=useState<Payload|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [summaries,setSummaries]=useState<Record<string,string>>({});
  const [pending,setPending]=useState<string|null>(null);
  const [feedback,setFeedback]=useState("");

  const load=useCallback(async (selected:PilotLane,p:number)=>{
    const response=await fetch("/api/admin/curriculum/primary-pilot?lane="+selected+"&page="+p,{cache:"no-store"});
    const body=await response.json() as Payload & {error?:string};
    if(!response.ok)throw new Error(body.error??"تعذر جلب تقرير المراجعة.");
    return body;
  },[]);

  useEffect(()=>{
    let live=true;
    load(lane,page).then(result=>{
      if(live){setData(result);setError("");}
    }).catch((reason:unknown)=>{
      if(live){setData(null);setError(reason instanceof Error?reason.message:"تعذر التحميل");}
    }).finally(()=>{if(live)setLoading(false);});
    return ()=>{live=false;};
  },[lane,page,reload,load]);

  async function save(row:PilotRow) {
    if(!data?.writesEnabled || pending) return;
    const action=actions[row.lane].action;
    const reason=(notes[row.id]??"").trim();
    const summary=(summaries[row.id]??"").trim();
    if(reason.length<20){setFeedback("اكتب سببًا واضحًا لا يقل عن 20 حرفًا.");return;}
    if(action==="mark_enrichment"&&(summary.length<40||summary.length>500)){
      setFeedback("اكتب وصفًا بديلًا بين 40 و500 حرف.");return;
    }
    if(!window.confirm("تأكيد قرار المراجعة لهذا الدرس؟ سيتم حفظه في سجل staging فقط، دون نشر أو تعديل الدرس العام."))return;
    setPending(row.id);
    setFeedback("");
    try {
      const response=await fetch("/api/admin/curriculum/primary-pilot",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:row.id,action,notes:reason,proposedSummary:summary,reportHash:data.reportHash}),
      });
      const body=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok||!body.ok)throw new Error(body.error??"تعذر حفظ القرار");
      setFeedback("حُفظ القرار في سجل مراجعة staging، ولم تتغير حالة النشر أو صفحة الزائر.");
      setReload(v=>v+1);
    } catch(reason:unknown){
      setFeedback(reason instanceof Error?reason.message:"تعذر حفظ القرار");
    } finally {setPending(null);}
  }

  return <div dir="rtl" className="space-y-6">
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
      هذه لوحة تجريبية للبحرين والصفوف ١–٣، تستند إلى تقرير جرد محلي. الأخضر يعني
      <strong> أهلية مبدئية لقرار المراجع فقط</strong>، وليس شهادة اعتماد وزارية.
      لا تتغير بيانات الدرس العامة بهذه اللوحة.
    </div>
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="قوائم التدقيق">
      {lanes.map(l=><button key={l.key} type="button"
        aria-pressed={lane===l.key}
        className={"rounded-xl border p-4 text-right font-bold "+(lane===l.key?"border-[#174f47] bg-[#edf5f0]":"bg-white")}
        onClick={()=>{setLane(l.key);setPage(1);setLoading(true);setFeedback("");}}>
        <span>{l.label}</span>
        <span className="mt-1 block text-sm font-normal">{data?.counts[l.key]??"—"} درسًا</span>
      </button>)}
    </div>
    <p className="text-sm text-[#53685e]">{lanes.find(l=>l.key===lane)?.hint}</p>
    {data&&!data.snapshotComplete&&<p role="alert" className="rounded border border-orange-300 p-3">
      نسخة البيانات غير مؤكدة الاكتمال. لن يظهر أي درس كجاهز للاعتماد حتى يكتمل الجرد.
    </p>}
    {data&&!data.writesEnabled&&<p role="status" className="rounded border p-3 text-sm">
      وضع القراءة فقط: لم تُفعّل بيئة staging المعزولة. الأزرار غير قابلة للتنفيذ.
    </p>}
    {error&&<p role="alert" className="rounded border border-red-400 p-4">{error}</p>}
    {feedback&&<p role="status" className="rounded border p-3">{feedback}</p>}
    {loading?<p>جارٍ قراءة التقرير المحلي…</p>:data?<section aria-label="الدروس والقرارات">
      <p className="mb-3 text-sm">نتائج القائمة: {data.total} · الصفحة {page}</p>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1050px] border-collapse text-right text-sm">
          <thead className="bg-[#edf5f0]"><tr>
            <th scope="col" className="p-3">الدرس</th><th scope="col" className="p-3">الصف / الدولة</th>
            {proofKeys.map(k=><th key={k} scope="col" className="p-3">{PROOF_NAMES[k]}</th>)}
            <th scope="col" className="p-3">أسباب التعثر / الإجراء</th>
          </tr></thead>
          <tbody>{data.rows.map(row=><tr key={row.id} className="border-t align-top">
            <td className="p-3 font-bold">{row.title||"عنوان غير موثق"}
              <div className="mt-1 font-normal text-xs text-[#60766c]">نشر السجل: {row.status} · نوع المحتوى: {row.content_kind}</div>
            </td>
            <td className="p-3">الصف {row.grade} · البحرين</td>
            {proofKeys.map(k=><td key={k} className="p-3">
              <span className={row.evidence[k]?"text-green-800":"text-red-700"}>
                {row.evidence[k]?"✓ مثبت في الجرد":"✕ غير مثبت"}
              </span>
            </td>)}
            <td className="min-w-[275px] space-y-2 p-3">
              {row.issues.length>0
                ? <p className="text-xs leading-6">{row.issues.join(" · ")}</p>
                : <p className="text-xs">لا نواقص في تقرير الجرد؛ القرار النهائي مشروط بفحص قاعدة staging.</p>}
              <label className="block">سبب قرار المراجع
                <textarea rows={2} maxLength={2000} className="mt-1 block w-full rounded border p-2"
                  placeholder="وثق السبب والأدلة التي راجعتها"
                  value={notes[row.id]??""} onChange={e=>setNotes(v=>({...v,[row.id]:e.target.value}))}/>
              </label>
              {row.lane==="yellow"&&<label className="block">الوصف البديل المقترح
                <textarea rows={3} maxLength={500} className="mt-1 block w-full rounded border p-2"
                  placeholder="مادة إثرائية أصلية من ضاديوم…"
                  value={summaries[row.id]??""} onChange={e=>setSummaries(v=>({...v,[row.id]:e.target.value}))}/>
              </label>}
              <button type="button" disabled={!data.writesEnabled||!!pending} onClick={()=>void save(row)}
                className="rounded-lg bg-[#174f47] px-3 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {pending===row.id?"جارٍ التحقق…":actions[row.lane].label}
              </button>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
      {!data.rows.length&&<p className="mt-4">لا توجد دروس في هذه القائمة ضمن ملف الجرد الحالي.</p>}
      <nav className="mt-5 flex gap-4" aria-label="صفحات نتائج المراجعة">
        <button disabled={page<=1} className="rounded border px-4 py-2 disabled:opacity-40"
          onClick={()=>{setPage(p=>p-1);setLoading(true);}}>السابق</button>
        <button disabled={page*data.pageSize>=data.total} className="rounded border px-4 py-2 disabled:opacity-40"
          onClick={()=>{setPage(p=>p+1);setLoading(true);}}>التالي</button>
      </nav>
    </section>:null}
  </div>;
}
