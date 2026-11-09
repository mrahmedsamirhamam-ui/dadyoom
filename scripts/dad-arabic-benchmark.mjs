#!/usr/bin/env node
// Safe, staging-only diagnostic. Does not certify any Arabic answer.
import fs from "node:fs";
import path from "node:path";
import { provisionalLexicalMatch } from "../lib/lesson-review/qa-compare.mjs";
const questionsFile=path.resolve("data/qa/dad-arabic-100.json");
const src=JSON.parse(fs.readFileSync(questionsFile,"utf8"));
const questions=src.questions??[];
if(questions.length!==100||new Set(questions.map(q=>q.id)).size!==100||
   questions.some(q=>q.approved!==false||q.review_status!=="needs_teacher_review"||!q.expected_answer))
  throw new Error("DATASET_NOT_100_UNAPPROVED_ANSWER_KEYS");
const execute=process.argv.includes("--execute");
const outputArg=process.argv.find(x=>x.startsWith("--output="));
const output=outputArg?.split("=").slice(1).join("=")??"";
if(!execute){
  console.log(JSON.stringify({mode:"dry-run",questions:questions.length,
    categories:[...new Set(questions.map(q=>q.category))],actual_responses:0,
    note:"No AI calls; use --execute only against an explicitly isolated staging environment."},null,2));
  process.exit(0);
}
const endpoint=process.env.DAD_QA_URL??"";
const cookie=process.env.DAD_QA_COOKIE??"";
if(!endpoint||!cookie) throw new Error("STAGING_ENDPOINT_AND_COOKIE_REQUIRED");
const url=new URL(endpoint);
const stagingHost=process.env.DAD_QA_STAGING_HOST??"";
const allowed=(["localhost","127.0.0.1","::1"].includes(url.hostname)||
  (stagingHost.length>0&&url.hostname===stagingHost));
if(!allowed||(!["http:","https:"].includes(url.protocol))||
  !url.pathname.endsWith("/api/dad/chat")||
  url.hostname==="dadyoom.com"||url.hostname==="www.dadyoom.com")
  throw new Error("PRODUCTION_OR_UNAPPROVED_TARGET_FORBIDDEN");
const results=[];
for(const q of questions){
  try{
    const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Cookie":cookie},
      body:JSON.stringify({message:q.question}),signal:AbortSignal.timeout(25000)});
    const data=await response.json().catch(()=>({}));
    const text=typeof data.reply==="string"?data.reply:"";
    results.push({id:q.id,category:q.category,status:response.status,reply:text,
      expected_answer:q.expected_answer,lexical_match:response.ok&&provisionalLexicalMatch(text,q.expected_answer),
      requires_teacher_review:true,error:response.ok?null:String(data.error??"HTTP_ERROR")});
  }catch(error){
    results.push({id:q.id,category:q.category,status:null,reply:"",
      expected_answer:q.expected_answer,lexical_match:false,requires_teacher_review:true,
      error:error instanceof Error?error.message:"REQUEST_FAILED"});
  }
}
const responded=results.filter(x=>x.status===200&&x.reply).length;
const matches=results.filter(x=>x.lexical_match).length;
const report={dataset:src.dataset_version,mode:"staging-execution",target_host:url.hostname,
  question_count:questions.length,response_count:responded,lexical_matches:matches,
  lexical_match_percent:responded?Number((100*matches/responded).toFixed(2)):null,
  estimated_correctness_percent:null,certified_correctness_percent:null,
  requires_teacher_review:questions.length,
  caveat:"Lexical matching is not semantic correctness. All answers remain unapproved pending teacher review.",
  results};
if(output){
  const target=path.resolve(output);
  if(!target.startsWith(path.resolve(".")+"/")) throw new Error("OUTPUT_MUST_BE_INSIDE_REPO");
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(report,null,2));
}
console.log(JSON.stringify({...report,results:undefined},null,2));
