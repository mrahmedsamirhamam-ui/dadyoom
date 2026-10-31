import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { auditCurriculum,normalizeArabic,normalizeStrictTitle,checkOfficialManifest } from "../lib/ministerial-audit/engine.mjs";
import { textHash } from "../lib/ministerial-audit/topic-coverage.mjs";
const countries=JSON.parse(fs.readFileSync("data/curriculum-packs/arab-countries.json","utf8")).countries;
const sourceRegistry=JSON.parse(fs.readFileSync("data/ministerial-audit/official-source-registry-2026-2027.json","utf8")).countries;
const source={url:"https://moe.gov.bh/ar/official-arabic.pdf",sha256:"a".repeat(64),documentType:"textbook",edition:"2026-2027",
  extractionStatus:"reviewed",retrievedAt:"2026-10-31",reviewedAt:"2026-10-31",reviewedBy:"qualified-reviewer"};
const official=(titles=["أصدقائي"])=>({country:"BH",grade:1,semester:1,track:"general",academicYear:"2026-2027",subject:"arabic",
  source,units:[{title:"الوحدة الأولى",lessons:titles.map((title,i)=>({title,page:i+3,topics:[{id:"topic-1",title:"الدرس ومفاهيمه الأساسية",page:i+3}]}))}]});
const lesson=(title="أصدقائي")=>{
 const content="يوضح هذا الدرس كيف نتعامل مع أصدقائنا باحترام؛ لأن التعاون يساعدنا على الفهم ونستنتج من الموقف أن الصديق الصالح يساند صديقه في المواقف الصعبة. ".repeat(3);
 return {id:"x",country:"BH",grade:1,semester:1,track:"general",academicYear:"2026-2027",
  title,unitTitle:"الوحدة الأولى",status:"published",content,
  subjectReview:{status:"approved",reviewedBy:"teacher-qa",reviewedAt:"2026-10-31",
    sourceSha256:"a".repeat(64),contentSha256:textHash(content)},
  topicEvidence:[{topicId:"topic-1",start:0,end:content.length,
    sourceSha256:"a".repeat(64),status:"approved",reviewedBy:"teacher-qa",excerptSha256:textHash(content)}],
  publishedActivities:0,questionCount:0};
};
function audit(manifests=[],platformLessons=[],extra={}){return auditCurriculum({countries,registry:sourceRegistry,
  manifests,platformLessons,academicYear:"2026-2027",...extra});}
test("registry contains exactly 22 real codes, no invented official approval",()=>{
 assert.equal(sourceRegistry.length,22);
 assert.equal(new Set(sourceRegistry.map(x=>x.country)).size,22);
 assert.ok(sourceRegistry.every(x=>(x.portals??[]).length>=1));
 assert.equal(sourceRegistry.reduce((n,x)=>n+(x.portals??[]).length,0),29);
 assert.ok(sourceRegistry.every(x=>x.verificationStatus==="SOURCE_INDEX_ONLY_NOT_SYLLABUS_VERIFIED"));
});
test("no official textbook: all 528 grade/semester scopes must fail closed",()=>{
 const r=audit();
 assert.equal(r.countries,22);
 assert.equal(r.scopes,22*12*2);
 assert.equal(r.verifiedScopes,0);
 assert.equal(r.releaseReady,false);
 assert.equal(r.counts.OFFICIAL_MANIFEST_REQUIRED,528);
 assert.equal(r.summary.find(x=>x.country==="BH"&&x.grade===1&&x.semester===1).status,"SOURCE_UNVERIFIED");
});
test("complete official TOC and every teaching topic evidenced in real lesson body can match one scope",()=>{
 const r=audit([official()],[lesson()]);
 assert.equal(r.verifiedScopes,1);
 assert.equal(r.releaseReady,false);
 assert.equal(r.summary.find(x=>x.country==="BH"&&x.grade===1&&x.semester===1).approvedContentMatches,1);
 assert.equal(r.counts.OFFICIAL_MANIFEST_REQUIRED,527);
});
test("an almost identical lesson title becomes candidate, never automatic proof",()=>{
 const r=audit([official(["الصداقه"])],[lesson("الصداقة")]);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="OFFICIAL_LESSON_MISSING_OR_RENAMED"&&x.candidates.length===1));
 assert.ok(r.findings.some(x=>x.code==="PLATFORM_LESSON_NOT_IN_OFFICIAL_TOC"));
});
test("content weak or human approval missing means matching title is NOT completion",()=>{
 const l=lesson();l.content="ضع النص هنا";l.subjectReview={status:"pending"};
 const r=audit([official()],[l]);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="PLACEHOLDER_IN_LESSON_BODY"));
 assert.ok(r.findings.some(x=>x.code==="SHORT_LESSON_SUBJECT_REVIEW"||x.code==="VERY_SHORT_LESSON_SUBJECT_REVIEW"));
 assert.ok(r.findings.some(x=>x.code==="TITLE_MATCH_SUBJECT_NOT_CERTIFIED"));
});
test("official PDF cannot be trusted without full year/sha/publisher",()=>{
 const m=official();m.source={...source,url:"https://unknown.example/arabic.pdf",sha256:"fake"};
 const reasons=checkOfficialManifest(m,sourceRegistry,"2026-2027");
 assert.ok(reasons.includes("UNTRUSTED_OFFICIAL_URL"));
 assert.ok(reasons.includes("SOURCE_HASH_UNVERIFIED"));
 const r=audit([m],[lesson()]);
 assert.equal(r.verifiedScopes,0);
 assert.equal(r.counts.OFFICIAL_MANIFEST_INVALID,1);
});
test("duplicates in ministry or Dadyoom become explicit findings",()=>{
 const l=lesson();const r=audit([official(["أصدقائي","أصدقائي"])],[l,{...l,id:"y"}]);
 assert.ok(r.findings.some(x=>x.code==="DUPLICATE_PLATFORM_LESSON"));
 assert.ok(r.findings.some(x=>x.code==="DUPLICATE_OFFICIAL_TOC_LESSON"));
 assert.equal(r.verifiedScopes,0);
});
test("optional grade13 is checked, not assumed to be an official curriculum",()=>{
 const r=audit([],[],{includeGrade13:true});
 assert.equal(r.scopes,572);
 assert.equal(r.counts.OFFICIAL_MANIFEST_REQUIRED,572);
});
test("Arabic normalization is conservative for spelling variants but not evidence",()=>{
 assert.equal(normalizeArabic("أَصْدِقَائِي"),normalizeArabic("اصدقائي"));
 assert.notEqual(normalizeArabic("مدينة"),normalizeArabic("مدرسة"));
});

test("single wrong Arabic hamza or alif-maqsura cannot pass exact ministerial title match",()=>{
 assert.notEqual(normalizeStrictTitle("إلى المدرسة"), normalizeStrictTitle("الى المدرسة"));
 assert.notEqual(normalizeStrictTitle("على"),normalizeStrictTitle("علي"));
 const r=audit([official(["إلى المدرسة"])],[lesson("الى المدرسة")]);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="OFFICIAL_LESSON_MISSING_OR_RENAMED"));
});
test("an old official source edition never certifies today's academic year",()=>{
 const m=official();m.academicYear="2024-2025";m.source={...source,edition:"2024-2025"};
 const r=audit([m],[lesson()]);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="OFFICIAL_MANIFEST_INVALID"&&x.reasons.includes("EDITION_YEAR_MISMATCH")));
});
test("missing semester and missing current published-content year are blockers",()=>{
 const p=lesson();p.semester=null;p.academicYear="2025-2026";
 const r=audit([official()],[p]);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="PLATFORM_SEMESTER_UNASSIGNED"));
});

test("grade13 records are never ignored silently when grade13 is not enabled",()=>{
 const p={...lesson(),id:"grade13",country:"MR",grade:13,semester:2};
 const r=audit([],[p]);
 assert.equal(r.scopes,528);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="UNMAPPED_GRADE13_REQUIRES_EDUCATION_STAGE_PROOF"&&x.country==="MR"));
});

test("activities and games are irrelevant to whether original lesson subject is covered",()=>{
 const l=lesson();l.publishedActivities=0;l.gamesCount=0;l.questionCount=0;
 const r=audit([official()],[l]);
 assert.equal(r.verifiedScopes,1);
 assert.equal(r.releaseReady,false); // remaining 527 grade/semesters unverified
 assert.equal(r.counts.UNDER_SIX_ACTIVITIES,undefined);
});
test("official lesson title with no topic outline is never a verified complete lesson",()=>{
 const m=official();delete m.units[0].lessons[0].topics;
 const r=audit([m],[lesson()]);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="TITLE_MATCH_SUBJECT_NOT_CERTIFIED"&&
  x.subjectIssues.includes("OFFICIAL_LESSON_TOPIC_OUTLINE_NOT_REVIEWED")));
});
test("lesson title matching official does not hide a missing required ministry subtopic",()=>{
 const m=official();m.units[0].lessons[0].topics.push({id:"topic-2",title:"حوار الأصدقاء",page:4});
 const r=audit([m],[lesson()]);
 assert.equal(r.verifiedScopes,0);
 assert.ok(r.findings.some(x=>x.code==="TITLE_MATCH_SUBJECT_NOT_CERTIFIED"&&x.missingOrUnverifiedTopics.some(y=>y.topicId==="topic-2")));
});
