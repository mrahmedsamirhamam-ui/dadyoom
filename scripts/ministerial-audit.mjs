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
export async function fetchAll(client,table,columns){
  // Stable primary-key ordering is mandatory for offset pagination. Without it,
  // rows can be silently omitted or counted twice across pages.
  const data=[], seen=new Set();
  for(let offset=0;offset<250000;offset+=500){
    const {data:page,error}=await client.from(table).select(columns)
      .order("id",{ascending:true}).range(offset,offset+499);
    if(error)throw new Error("READ_ONLY_DB_EXPORT_FAILED:"+table+":"+error.message);
    if(!Array.isArray(page))throw new Error("NON_ARRAY_DB_RESPONSE:"+table);
    for(const row of page){
      if(row?.id==null || seen.has(String(row.id)))
        throw new Error("DUPLICATE_OR_MISSING_PAGINATED_ID:"+table+":"+String(row?.id));
      seen.add(String(row.id));
    }
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
  // Teaching subject is the only audit target. We deliberately do not fetch activities,
  // question counts, games or answer keys; these cannot prove that a lesson's topic exists.
  const [cs,cur,grades,units,lessons]=await Promise.all([
    fetchAll(db,"countries","id,code"),
    fetchAll(db,"curricula","id,country_id,academic_year"),
    fetchAll(db,"grades","id,curriculum_id,grade_number"),
    fetchAll(db,"units","id,grade_id,title,semester"),
    fetchAll(db,"lessons","id,unit_id,title,content,status,semester,source_pdf_url,official_content_scope")
  ]);
  const index=(a)=>new Map(a.map(x=>[x.id,x]));
  const [ci,cu,gi,ui]=[index(cs),index(cur),index(grades),index(units)];
  return lessons.map(l=>{
    const u=ui.get(l.unit_id), g=gi.get(u?.grade_id), cr=cu.get(g?.curriculum_id),c=ci.get(cr?.country_id);
    return {id:l.id,country:c?.code??"UNKNOWN",grade:g?.grade_number??0,
      semester:l.semester??u?.semester??null,lessonSemester:l.semester??null,unitSemester:u?.semester??null,
      academicYear:cr?.academic_year??null,track:"general",
      unitTitle:u?.title??"",title:l.title,status:l.status,content:l.content??"",
      sourcePdfUrl:l.source_pdf_url??null,officialContentScope:l.official_content_scope??null,
      subjectReview:{status:"not_verified"},topicEvidence:[]};
  });
}
function fromManifestDir(dir){
  if(!dir)return [];
  const full=path.resolve(cwd,dir);
  if(!fs.existsSync(full))throw new Error("OFFICIAL_MANIFEST_DIR_MISSING:"+full);
  return fs.readdirSync(full).filter(f=>f.endsWith(".json")).sort().map(f=>read(path.join(full,f)));
}
// Combine human-reviewed evidence with the matching teaching-body snapshot only.
// Never count an unrecognized/stale lesson ID as having passed review.
export function attachSubjectReviews(platform,bundle){
  if(!Array.isArray(platform)||!Array.isArray(bundle))
    throw new Error("SUBJECT_REVIEW_BUNDLE_MUST_BE_ARRAY");
  const byId=new Map();
  for(const item of platform){
    if(!item?.id||byId.has(item.id))throw new Error("DUPLICATE_OR_MISSING_PLATFORM_LESSON_ID");
    byId.set(item.id,item);
  }
  const seen=new Set();
  for(const record of bundle){
    if(!record?.lessonId||seen.has(record.lessonId))
      throw new Error("DUPLICATE_OR_MISSING_REVIEW_LESSON_ID");
    seen.add(record.lessonId);
    const item=byId.get(record.lessonId);
    if(!item)throw new Error("REVIEW_REFERENCES_UNKNOWN_PLATFORM_LESSON:"+record.lessonId);
    item.subjectReview=record.subjectReview;
    item.topicEvidence=record.topicEvidence;
    // Previously omitted: auditLessonTopicCompleteness verifies the live page's
    // hash against the actual subject body. Without this, reviewed lessons could
    // never pass even with genuine screenshot/browser-check evidence.
    item.livePageReview=record.livePageReview;
  }
  return platform;
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
  const reviewFile=arg("--subject-reviews");
  if(reviewFile) attachSubjectReviews(platform,read(reviewFile));
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
