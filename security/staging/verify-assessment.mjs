/** STAGING ONLY. No production tokens. Node 20+; no extra dependencies.
 * Usage: STAGING_SUPABASE_URL=... STAGING_ANON_KEY=... STAGING_STUDENT_A_JWT=...
 * STAGING_STUDENT_B_JWT=... STAGING_ATTEMPT_ID=... STAGING_QUESTION_ID=...
 * STAGING_STUDENT_B_ATTEMPT_ID=... STAGING_CONFIRMED_ISOLATED=YES node security/staging/verify-assessment.mjs
 * Seed two synthetic students and a question owned by student A in an isolated DB.
 */
import assert from "node:assert/strict";
const required = ["STAGING_SUPABASE_URL","STAGING_ANON_KEY","STAGING_STUDENT_A_JWT",
"STAGING_STUDENT_B_JWT","STAGING_ATTEMPT_ID","STAGING_QUESTION_ID","STAGING_STUDENT_B_ATTEMPT_ID"];
for (const key of required) assert.ok(process.env[key], `Missing ${key}`);
const url = new URL(process.env.STAGING_SUPABASE_URL);
assert.ok((url.hostname.endsWith(".supabase.co") && url.protocol==="https:") || (["localhost","127.0.0.1"].includes(url.hostname) && url.protocol==="http:"), "Only local or Supabase staging URL allowed");
assert.notEqual(url.hostname,"hvqsvtomhlxavmfqoxfz.supabase.co","REFUSE PRODUCTION");
assert.notEqual(url.hostname,"wqldqqqzvvtfhpjuiwuc.supabase.co","REFUSE SCHOOL");
const base=url.origin, key=process.env.STAGING_ANON_KEY;
assert.ok(process.env.STAGING_CONFIRMED_ISOLATED==="YES", "Confirm isolation with STAGING_CONFIRMED_ISOLATED=YES");
const a=process.env.STAGING_STUDENT_A_JWT,b=process.env.STAGING_STUDENT_B_JWT;
async function req(path,token,method="GET",body){
 const response=await fetch(base+"/rest/v1/"+path,{method,headers:{
  apikey:key,Authorization:`Bearer ${token}`,"Content-Type":"application/json",
  Prefer:"return=representation"},body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data=raw}
 return {status:response.status,data};
}
const attempts=process.env.STAGING_ATTEMPT_ID,question=process.env.STAGING_QUESTION_ID;
const results=[];
function check(name,ok,detail){results.push({name,pass:ok,detail});console.log((ok?"PASS":"FAIL")+" "+name,detail)}
// Direct secret reads must fail even for the student's own question.
for(const table of ["questions","ai_assessments","assessment_session_answers"]){
 const r=await req(`${table}?select=correct_answer&limit=1`,a);
 check("secret:"+table,r.status===401||r.status===403, r.status);
}
// Cross-student access should return no rows, not merely HTTP 200.
const other=await req(`assessment_sessions?select=id&id=eq.${encodeURIComponent(process.env.STAGING_STUDENT_B_ATTEMPT_ID)}`,a);
check("cross-student isolation",other.status===200&&Array.isArray(other.data)&&other.data.length===0,other.status);
// Direct score writes must fail or affect zero rows.
const tamper=await req(`assessment_sessions?id=eq.${attempts}`,a,"PATCH",{correct_answers:999999});
check("direct score tampering",([401,403].includes(tamper.status))||
 (tamper.status===200&&Array.isArray(tamper.data)&&tamper.data.length===0),tamper.status);
// Parallel calls must be authenticated as A and must use a fresh unanswered question.
const payload={p_attempt_id:attempts,p_question_id:question,p_selected_option:Number(process.env.STAGING_SELECTED_OPTION??0)};
const responses=await Promise.all(Array.from({length:10},()=>req("rpc/submit_atomic_assessment_answer",a,"POST",payload)));
const successes=responses.filter(r=>r.status===200),conflicts=responses.filter(r=>r.status===409||r.data?.code==="23505");
check("10-way concurrency",successes.length===1&&conflicts.length===9,
 `success=${successes.length} conflicts=${conflicts.length}`);
const answers=await req(`assessment_session_answers?select=id&session_id=eq.${attempts}&assessment_id=eq.${question}`,a);
check("one recorded answer",answers.status===200&&answers.data?.length===1,answers.status);
// Never grant student access to the reward ledger just for testing.
// Verify exactly one outbox row using a separate LOCAL privileged SQL query.
console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length},null,2));
if(results.some(x=>!x.pass))process.exitCode=1;
