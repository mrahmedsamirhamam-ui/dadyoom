import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const api = process.env.P0_LOCAL_API_URL || "";
const anonKey = process.env.P0_LOCAL_ANON_KEY || "";
const serviceKey = process.env.P0_LOCAL_SERVICE_KEY || "";
const dbURL = process.env.P0_LOCAL_DB_URL || "";
const requestedProductionRef = (process.env.PRODUCTION_SUPABASE_PROJECT_REF || "").trim();
const apiURL = new URL(api || "http://invalid.test");
const db = new URL(dbURL || "postgresql://invalid.test/postgres");
const allow = host => ["127.0.0.1", "localhost", "::1", "[::1]"].includes(host);
if (!allow(apiURL.hostname) || !allow(db.hostname) ||
    !["http:", "https:"].includes(apiURL.protocol) ||
    !["postgresql:", "postgres:"].includes(db.protocol) ||
    db.pathname !== "/postgres" || !anonKey || !serviceKey ||
    (requestedProductionRef && (api.includes(requestedProductionRef) || dbURL.includes(requestedProductionRef))) ||
    ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "DATABASE_URL", "STAGING_SUPABASE_URL"].some(k => Boolean(process.env[k]?.trim()))) {
  throw new Error("SUPABASE_LOCAL_GUARD_FAILED: untrusted or remote endpoint");
}
console.log("P0_SUPABASE_LOCAL_ISOLATION=PASS api=loopback db=loopback database=postgres");

const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const service = createClient(api, serviceKey, opts);
const ANON = createClient(api, anonKey, opts);
const passed = [], failed = [];
function check(name, predicate, details="") {
  if (predicate) { passed.push(name); console.log("PASS", name); }
  else { failed.push(name); console.error("FAIL", name, String(details).slice(0, 280)); }
}
function query(sql) {
  const p = spawnSync("psql", [dbURL, "-v", "ON_ERROR_STOP=1", "-tAc", sql], {encoding:"utf8"});
  if (p.status !== 0) throw new Error("local postgres query failed: " + p.stderr.slice(0,300));
  return p.stdout.trim();
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const run=process.env.GITHUB_RUN_ID||"synthetic";
const password="P0-local-test_Only!9A";
const users={};
for (const role of ["teacher","school","admin","student","parent"]) {
  const email="p0-"+role+"-"+run+"@example.test";
  const client=createClient(api,anonKey,opts);
  const signed=await client.auth.signUp({
    email,password,
    options:{data:{role,full_name:"Synthetic QA "+role,country:"BH"}}
  });
  if (signed.error || !signed.data.user) throw new Error("GoTrue SIGNUP failed for "+role+": "+signed.error?.message);
  const session=signed.data.session || (await client.auth.signInWithPassword({email,password})).data.session;
  if (!session?.access_token) throw new Error("Missing real GoTrue JWT for "+role+" (email confirmation may be enabled)");
  const jwtClient=createClient(api,anonKey,{
    auth:{autoRefreshToken:false,persistSession:false},
    global:{headers:{Authorization:"Bearer "+session.access_token}}
  });
  const actual=(await jwtClient.auth.getUser()).data.user;
  check("auth_issued_jwt_"+role,actual?.id===signed.data.user.id);
  const row=await service.from("profiles").select("id,role").eq("id",signed.data.user.id).single();
  check("signup_metadata_"+role+"_is_student",!row.error&&row.data?.role==="student",row.error?.message);
  users[role]={id:signed.data.user.id,client:jwtClient};
}
const student=users.student, teacher=users.teacher, other=users.school, admin=users.admin, parent=users.parent;
for (const [role, user] of Object.entries(users)) {
  if (!UUID.test(user.id)) throw new Error("unexpected non-UUID local Auth user id");
  const profile=await user.client.from("profiles").select("id,role").eq("id",user.id).maybeSingle();
  check("profile_read_own_"+role,!profile.error&&profile.data?.id===user.id,profile.error?.message);
  const cross=await user.client.from("profiles").select("id").eq("id",student.id);
  if(role!=="student")check("profile_cross_denied_"+role,!cross.error&&cross.data?.length===0,cross.error?.message);
}
for (const elevated of ["teacher","school","admin"]) {
  const r=await student.client.from("profiles").update({role:elevated}).eq("id",student.id);
  const actual=await service.from("profiles").select("role").eq("id",student.id).single();
  check("self_promotion_denied_"+elevated,Boolean(r.error)&&actual.data?.role==="student",r.error?.message);
}
const safe=await student.client.from("profiles").update({full_name:"Approved safe name"}).eq("id",student.id).select("full_name");
check("safe_name_change_allowed",!safe.error&&safe.data?.[0]?.full_name==="Approved safe name",safe.error?.message);
const qid="aaaa1111-1111-4111-8111-111111111111";
const lid="11111111-1111-4111-8111-111111111111";
const inserted=await service.from("questions").insert({
 id:qid,lesson_id:lid,question_order:1,question:"Only synthetic?",
 question_type:"mcq", options:[{id:"A",text:"yes",correct:true},{id:"B",text:"no",correct:false}],
 points:1, correct_answer:"A",explanation:"synthetic only"
});
if(inserted.error)throw new Error("Synthetic question setup failed: "+inserted.error.message);
const key=await student.client.from("questions").select("correct_answer").eq("id",qid);
check("student_cannot_read_correct_answer",Boolean(key.error),key.error?.message);
const anonymousKey=await ANON.from("questions").select("correct_answer").eq("id",qid);
check("anon_cannot_read_correct_answer",Boolean(anonymousKey.error),anonymousKey.error?.message);
const options=await student.client.from("questions").select("options").eq("id",qid).maybeSingle();
check("raw_options_do_not_leak_correctness",!options.error && !JSON.stringify(options.data?.options||[]).includes('"correct"'),options.error?.message||"raw options contain correctness flags");
const safeView=await student.client.from("dadyoom_student_questions").select("id,options").eq("id",qid);
check("student_safe_view_still_operational",!safeView.error&&safeView.data?.length===1,safeView.error?.message);
const anonView=await ANON.from("dadyoom_student_questions").select("id").eq("id",qid);
check("anonymous_safe_view_still_operational",!anonView.error&&anonView.data?.length===1,anonView.error?.message);
const overwritten=await student.client.from("questions").update({correct_answer:"B"}).eq("id",qid).select("id");
const afterKey=await service.from("questions").select("correct_answer").eq("id",qid).single();
check("student_cannot_write_correct_answer",Boolean(overwritten.error)&&afterKey.data?.correct_answer==="A",overwritten.error?.message);
if(afterKey.data?.correct_answer!=="A")
  await service.from("questions").update({correct_answer:"A"}).eq("id",qid);
const attempts=await service.from("question_attempts").insert([
 {user_id:student.id,question_id:qid,selected_answer:"B",is_correct:false},
 {user_id:other.id,question_id:qid,selected_answer:"A",is_correct:true}
]);
if(attempts.error)throw new Error("Attempts setup failed: "+attempts.error.message);
for (const [name,user] of [["student",student],["other",other],["teacher",teacher],["parent",parent]]) {
  const attemptsRead=await user.client.from("question_attempts").select("user_id,question_id");
  const own=attemptsRead.data?.filter(x=>x.user_id===user.id)||[];
  check("attempts_owner_only_"+name,!attemptsRead.error && attemptsRead.data?.length===own.length,
    attemptsRead.error?.message);
}
const anonRead=await ANON.from("question_attempts").select("user_id");
check("anon_attempts_denied",Boolean(anonRead.error),anonRead.error?.message);
const forge=await student.client.from("question_attempts").update({is_correct:true}).eq("user_id",student.id);
check("student_cannot_forge_grade",Boolean(forge.error),forge.error?.message);
const direct=await student.client.rpc("approve_profile_role_request",{
 p_target_user_id:teacher.id,p_reviewer_id:admin.id,p_decision:"approved",p_reason:"Synthetic unauthorized browser request"
});
check("direct_approval_rpc_denied",Boolean(direct.error),direct.error?.message);
query("UPDATE public.profiles SET role='admin' WHERE id='"+admin.id+"'");
query("INSERT INTO private.role_approval_authorities(reviewer_id,authorization_reference) VALUES('"+admin.id+"','synthetic independently checked QA')");
query("INSERT INTO public.profile_role_requests(user_id,requested_role) VALUES('"+teacher.id+"','teacher')");
const fromService=await service.rpc("approve_profile_role_request",{
 p_target_user_id:teacher.id,p_reviewer_id:admin.id,p_decision:"approved",
 p_reason:"Synthetic approved by QA DBA"
});
const teacherRole=await service.from("profiles").select("role").eq("id",teacher.id).single();
const auditCount=query("SELECT count(*) FROM public.profile_role_review_audit WHERE target_user_id='"+teacher.id+"'");
check("trusted_approval_atomic_and_audited",!fromService.error&&fromService.data==="approved"&&
 teacherRole.data?.role==="teacher"&&auditCount==="1",fromService.error?.message);
const teacherEsc=await teacher.client.from("profiles").update({role:"admin"}).eq("id",teacher.id);
const teacherStored=await service.from("profiles").select("role").eq("id",teacher.id).single();
check("teacher_cannot_become_admin",Boolean(teacherEsc.error)&&teacherStored.data?.role==="teacher",teacherEsc.error?.message);
await import("node:fs").then(fs=>fs.writeFileSync(
 process.env.P0_LOCAL_IDS_PATH || "/tmp/p0-local-test-ids.json",
 JSON.stringify({reviewerId:admin.id,lessonId:lid,questionId:qid})
));
console.log("SUPABASE_LOCAL_E2E_SUMMARY",JSON.stringify({passed:passed.length,failed:failed.length,failures:failed}));
if (failed.length) process.exitCode=1;
