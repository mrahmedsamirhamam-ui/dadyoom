import fs from "node:fs";
import path from "node:path";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

/** Read-only audit of versioned curriculum packs; never writes to Supabase. */
const root = process.cwd();
const directory = path.join(root,"data","curriculum-packs");
const registry = JSON.parse(fs.readFileSync(path.join(directory,"arab-countries.json"),"utf8"));
const codes = new Map(registry.countries.map(c=>[c.code,c.nameAr]));
const ignored = new Set(["arab-countries.json","official-sources-2026.json"]);
const files = fs.readdirSync(directory).filter(f=>f.endsWith(".json")&&!ignored.has(f)).sort();
const rows = new Map();
const seenKeys = new Set();
const errors = [];
for(const file of files){
  let pack;
  try{pack=JSON.parse(fs.readFileSync(path.join(directory,file),"utf8"))}
  catch(e){errors.push({file,error:String(e)});continue}
  const check=validateCurriculumPack(pack);
  if(!check.ok) errors.push({file,error:check.errors.join("; ")});
  if(seenKeys.has(pack.packKey)) errors.push({file,error:"duplicate packKey"});
  seenKeys.add(pack.packKey);
  if(!codes.has(pack.country?.code)) errors.push({file,error:"unknown country"});
  const key=[pack.country?.code,pack.grade?.number,pack.semester??"unknown"].join(":");
  const lessons=(pack.units??[]).flatMap(u=>u.lessons??[]);
  if(rows.has(key)) errors.push({file,error:"duplicate country-grade-semester scope"});
  const issues=[];
  for(const lesson of lessons){
    const id=`${pack.country?.code}/G${pack.grade?.number}/S${pack.semester}/L${lesson.number}`;
    if(!lesson.source?.url) issues.push({lesson:id,type:"official_source_url_missing"});
    if(!lesson.source?.pageStart) issues.push({lesson:id,type:"source_page_unverified"});
    if(!Array.isArray(lesson.questions)||lesson.questions.length<3) issues.push({lesson:id,type:"question_shortage"});
    if(!Array.isArray(lesson.objectives)||lesson.objectives.length===0) issues.push({lesson:id,type:"objective_shortage"});
  }
  rows.set(key,{country:pack.country?.code,grade:pack.grade?.number,semester:pack.semester??null,
    file,lessons:lessons.length,validationPassed:check.ok,sourceVerification:"NOT_VERIFIED",
    sourceGaps:issues.filter(x=>x.type==="official_source_url_missing").length,issues});
}
const scopes=[];
for(const [code,nameAr] of codes){
 for(let grade=1;grade<=12;grade++){
  for(const semester of [1,2]){
   const item=rows.get(`${code}:${grade}:${semester}`);
   scopes.push({country:code,countryName:nameAr,grade,semester,
    status:!item?"NO_VERSIONED_PACK":item.validationPassed?"PACK_SCHEMA_VALID_SOURCE_UNVERIFIED":"INVALID_PACK",
    lessonCount:item?.lessons??0,packFile:item?.file??null,sourceGaps:item?.sourceGaps??null});
  }
 }
}
const output={generatedAt:new Date().toISOString(),scope:"VERSIONED_REPOSITORY_PACKS_ONLY",
 note:"A missing pack does NOT prove that Supabase has no lessons. Valid schema does NOT prove official syllabus alignment or publication.",
 countries:codes.size,expectedCountryGradeSemesterScopes:scopes.length,
 scopesWithPacks:scopes.filter(x=>x.packFile).length,
 scopesWithoutPacks:scopes.filter(x=>!x.packFile).length,
 totalPackLessons:[...rows.values()].reduce((n,r)=>n+r.lessons,0),
 errors,scopes,lessonIssues:[...rows.values()].flatMap(r=>r.issues)};
const json=JSON.stringify(output,null,2)+"\n";
const report=process.argv.includes("--out")?process.argv[process.argv.indexOf("--out")+1]:null;
if(report){fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,json)}
else console.log(json);
if(errors.length)process.exitCode=1;
