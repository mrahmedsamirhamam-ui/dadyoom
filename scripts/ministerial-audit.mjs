#!/usr/bin/env node
// READ-ONLY collector/comparator: no lesson generation, database writes, or publishing.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { auditCurriculum } from "../lib/ministerial-audit/engine.mjs";
const cwd = process.cwd();
const arg = (name, fallback=null) => { const i=process.argv.indexOf(name); return i>=0 ? process.argv[i+1] : fallback; };
const flag=(name)=>process.argv.includes(name);
const year=arg("--year","2026-2027");
const folder=path.resolve(cwd,arg("--out","_audits/ministerial"));
const read=(file)=>JSON.parse(fs.readFileSync(path.resolve(cwd,file),"utf8"));
const registry=read("data/ministerial-audit/official-source-registry-2026-2027.json");
const countries=read("data/curriculum-packs/arab-countries.json").countries;
const sha=(text)=>crypto.createHash("sha256").update(text).digest("hex");
const safe=(url,allow)=>{try{const u=new URL(url);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&allow.some(x=>u.hostname===x||u.hostname.endsWith("."+x));}catch{return false;}};
function save(name,obj){fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,name),JSON.stringify(obj,null,2)+"\n");}
async function probeOfficialSources() {
  const results=[];
  // Deliberately small sequential official-domain-only fetches: no broad search or crawling.
  for(const c of registry.countries) for(const source of c.portals??[]) {
    const entry={country:c.country,url:source.url,kind:source.kind,year:source.year ?? null,status:"not-requested"};
    if(!safe(source.url,c.approvedDomains??[])){entry.status="blocked-untrusted-domain";results.push(entry);continue;}
    try{
      const response=await fetch(source.url,{redirect:"manual",signal:AbortSignal.timeout(14000),
        headers:{"User-Agent":"DadyoomMinisterialAudit/1.0 (+educational-source-review; read-only)","Accept":"text/html,application/pdf"}});
      entry.httpStatus=response.status;
      entry.contentType=response.headers.get("content-type")??"";
      if(!response.ok){entry.status="unavailable-or-login-required";results.push(entry);continue;}
      const n=Number(response.headers.get("content-length")??0);
      if(n>10_000_000){entry.status="too-large-for-safe-probe";results.push(entry);continue;}
      const reader=response.body?.getReader();
      if(!reader){entry.status="no-response-body";results.push(entry);continue;}
      const chunks=[];let total=0,overflow=false;
      try{while(true){const r=await reader.read();if(r.done)break;total+=r.value.byteLength;if(total>10_000_000){overflow=true;break;}chunks.push(Buffer.from(r.value));}}
      finally{await reader.cancel().catch(()=>{});}
      if(overflow){entry.status="too-large-for-safe-probe";results.push(entry);continue;}
      const bytes=Buffer.concat(chunks);
      entry.sha256=sha(bytes);
      entry.bytes=bytes.length;
      entry.status="downloaded-not-syllabus-verified";
      if(/text\/html/i.test(entry.contentType)){
        const html=bytes.toString("utf8");
        entry.title=html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s+/g," ").trim().slice(0,160)??null;
      }
    }catch(e){entry.status="network-or-protection-error";entry.error=String(e?.message??e).slice(0,170);}
    results.push(entry);
  }
  save("official-portal-probes.json",{createdAt:new Date().toISOString(),note:"Cryptographic SHA-256 of portal response proves only which bytes were retrieved; not that a textbook was audited or is current.",results});
  return results;
}
async function fetchAll(client,table,columns){
  const data=[];
  for(let offset=0;offset<250000;offset+=500){
    const {data:page,error}=await client.from(table).select(columns).range(offset,offset+499);
    if(error)throw new Error("READ_ONLY_DB_EXPORT_FAILED:"+table+":"+error.message);
    if(!Array.isArray(page))throw new Error("NON_ARRAY_DB_RESPONSE:"+table);
    data.push(...page);
    if(page.length<500)return data;
  }
  throw new Error("DB_EXPORT_EXCEEDED_SAFETY_LIMIT");
}
async function readPlatformFromSupabase(){
  const {createClient}=await import("@supabase/supabase-js");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error("Provide secret env NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY on a trusted machine. No credentials in repository.");
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const [cs,cur,grades,units,lessons,questions,activities]=await Promise.all([
    fetchAll(db,"countries","id,code"),
    fetchAll(db,"curricula","id,country_id,academic_year"),
    fetchAll(db,"grades","id,curriculum_id,grade_number"),
    fetchAll(db,"units","id,grade_id,title"),
    fetchAll(db,"lessons","id,unit_id,title,content,status,semester,learning_objectives"),
    // Do NOT export correct_answer or activity answer: prevents answer key leakage.
    fetchAll(db,"questions","id,lesson_id,explanation"),
    fetchAll(db,"lesson_activities","id,lesson_id,activity_type,is_published")
  ]);
  const index=(a)=>new Map(a.map(x=>[x.id,x]));
  const [ci,cu,gi,ui]=[index(cs),index(cur),index(grades),index(units)];
  const qs=new Map(), as=new Map();
  for(const q of questions){const v=qs.get(q.lesson_id)??{n:0,explained:0};v.n++;if(String(q.explanation??"").trim())v.explained++;qs.set(q.lesson_id,v);}
  for(const a of activities){const v=as.get(a.lesson_id)??{n:0,types:[]};if(a.is_published){v.n++;v.types.push(a.activity_type);}as.set(a.lesson_id,v);}
  return lessons.map(l=>{
    const u=ui.get(l.unit_id), g=gi.get(u?.grade_id), cr=cu.get(g?.curriculum_id),c=ci.get(cr?.country_id);
    return {id:l.id,country:c?.code??"UNKNOWN",grade:g?.grade_number??0,
      semester:l.semester,academicYear:cr?.academic_year??null,track:"general",
      unitTitle:u?.title??"",title:l.title,status:l.status,content:l.content??"",
      objectives:Array.isArray(l.learning_objectives)?l.learning_objectives:[],
      questionCount:qs.get(l.id)?.n??0,questionsWithExplanation:qs.get(l.id)?.explained??0,
      publishedActivities:as.get(l.id)?.n??0,activityTypes:as.get(l.id)?.types??[],
      linguisticReview:{status:"not_verified"},pedagogicalReview:{status:"not_verified"},
      officialTextReview:{status:"not_verified"}};
  });
}
function fromManifestDir(dir){
  if(!dir)return [];
  const full=path.resolve(cwd,dir);
  if(!fs.existsSync(full))throw new Error("OFFICIAL_MANIFEST_DIR_MISSING:"+full);
  return fs.readdirSync(full).filter(f=>f.endsWith(".json")).sort().map(f=>read(path.join(full,f)));
}
function makeMarkdown(result){
  const lines=["# ضاديوم — تدقيق المصدر الوزاري مقابل الدروس", "", "السنة: "+result.academicYear,
    "الدول: "+result.countries+"؛ الصفوف: 1–"+result.gradeMax+"؛ نطاقات دولة × صف × فصل: "+result.scopes,
    "**النطاقات المعتمدة بدليل كامل: "+result.verifiedScopes+"**. هذه ليست نسبة اكتمال المنهج.",
    "الحالة النهائية: "+(result.releaseReady?"PASS":"BLOCKED — لا يمكن اعتماد اكتمال المنهج"),"",
    "## أعداد نتائج الفحص"];
  for(const [code,count] of Object.entries(result.counts).sort((a,b)=>b[1]-a[1])) lines.push("- "+code+": "+count);
  lines.push("","## حالات البلدان والصفوف والفصول","| البلد | الصف | الفصل | مرجع رسمي مدقق | دروس في ضاديوم | عناوين مطابقة | مطابقة المحتوى المعتمدة | الحالة |","|---|---:|---:|---:|---:|---:|---:|---|");
  for(const s of result.summary)lines.push("| "+s.country+" | "+s.grade+" | "+s.semester+" | "+(s.officialLessons??"غير متاح")+" | "+s.platformLessons+" | "+s.exactTitleMatches+" | "+s.approvedContentMatches+" | "+s.status+" |");
  lines.push("","## قاعدة تنفيذية","غياب مصدر رسمي معتمد لا يعني عدم وجود دروس، بل يعني تعذر التحقق منها. لا يُنشئ البرنامج الدروس، ولا ينشرها، ولا يَعُدّ تشابه العنوان دليل صحة النص. يراجع المحرر كل حالة وبصمة المصدر قبل الإصلاح.");
  return lines.join("\n")+"\n";
}
async function main(){
  if(registry.countries.length!==22||countries.length!==22)throw new Error("REGISTRY_MUST_HAVE_22_COUNTRIES");
  if(flag("--probe-official-portals")){const p=await probeOfficialSources();console.log("OFFICIAL_SOURCE_PROBES="+p.length);}
  const platformFile=arg("--platform");
  const live=flag("--live");
  if(live && platformFile)throw new Error("Select only one of --live or --platform");
  const platform=live?await readPlatformFromSupabase():platformFile?read(platformFile):[];
  if(!Array.isArray(platform))throw new Error("PLATFORM_EXPORT_MUST_BE_ARRAY");
  const report=auditCurriculum({countries,registry:registry.countries,
    manifests:fromManifestDir(arg("--official-dir")),
    platformLessons:platform,academicYear:year,includeGrade13:flag("--include-grade13")});
  save("report.json",report);
  fs.writeFileSync(path.join(folder,"report.md"),makeMarkdown(report));
  console.log(JSON.stringify({countries:report.countries,scopes:report.scopes,verifiedScopes:report.verifiedScopes,
    lessonsAnalyzed:platform.length,releaseReady:report.releaseReady,findings:report.findings.length,
    officialEvidenceMissing:report.counts.OFFICIAL_MANIFEST_REQUIRED??0,reportFolder:folder}));
  if(flag("--strict")&&!report.releaseReady)process.exitCode=2;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  main().catch(e=>{console.error(String(e?.stack??e));process.exitCode=1;});
}
export { makeMarkdown };
