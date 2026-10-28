#!/usr/bin/env node
// Compare a manually verified official 2026-27 TOC to public Dadyoom metadata.
// No downloads, textbook reproduction, DB writes, answer keys, or student data.
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

export function normalizeArabicLessonTitle(input){
 if(typeof input!=="string")return "";
 return input.normalize("NFC").replace(/[\u064B-\u065F\u0670\u0640]/g,"").replace(/\s+/g," ").trim();
}
export function compareVerifiedToc(catalog,toc){
 const validCodes=["AE","BH","DJ","DZ","EG","IQ","JO","KM","KW","LB","LY","MA","MR","OM","PS","QA","SA","SD","SO","SY","TN","YE"];
 if(![1,2,3].includes(toc?.grade)||!validCodes.includes(toc.countryCode))throw Error("Phase-1 needs a valid country and grade 1–3");
 if(![1,2,3].includes(toc.semester)||toc.academicYear!=="2026-2027")throw Error("verified year/semester required");
 if(toc.sourceAuthority!=="official-ministry-or-authorized-curriculum-agency"||toc.editionVerified!==true||toc.tableOfContentsReviewed!==true)throw Error("official TOC not independently checked");
 if(!/^https:\/\//.test(toc.sourceUrl??"")||typeof toc.editionLabel!=="string"||toc.editionLabel.length<4)throw Error("missing source URL or edition");
 if(!Array.isArray(toc.lessons)||toc.lessons.length===0||toc.lessons.some(l=>!l.title?.trim()||!Number.isInteger(l.tocPage)||l.tocPage<1))throw Error("missing title/page source evidence");
 if(catalog.grade!==toc.grade||catalog.officialTitleMatchCertified!==false)throw Error("metadata catalog invalid or falsely certified");
 const items=catalog.lessonRecords.filter(l=>l.countryCode===toc.countryCode&&l.status==="published"&&!l.isGenericSkillPack);
 const results=toc.lessons.map(l=>{
  const matches=items.filter(x=>normalizeArabicLessonTitle(x.title)===normalizeArabicLessonTitle(l.title));
  const exact=matches.filter(x=>x.semester===toc.semester),noTerm=matches.filter(x=>x.semester==null);
  const status=exact.length>1?"duplicate-candidates-review":exact.length===1?"title-only-match-content-and-questions-pending":noTerm.length?"title-match-but-term-unverified":"verified-official-title-missing-in-catalog";
  return {title:l.title,tocPage:l.tocPage,status,candidates:(exact.length?exact:noTerm).map(x=>({lessonId:x.lessonId,questionCount:x.questionCount,activityCount:x.activityCount,reviewStatus:x.reviewStatus}))};
 });
 return {countryCode:toc.countryCode,grade:toc.grade,semester:toc.semester,academicYear:toc.academicYear,sourceUrl:toc.sourceUrl,
 counts:{officialHeadings:results.length,exactTitleAndSemester:results.filter(x=>x.status==="title-only-match-content-and-questions-pending").length,titleMatchButTermUnknown:results.filter(x=>x.status==="title-match-but-term-unverified").length,missingTitle:results.filter(x=>x.status==="verified-official-title-missing-in-catalog").length,duplicateCandidates:results.filter(x=>x.status==="duplicate-candidates-review").length},
 results};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const args=Object.fromEntries(process.argv.slice(2).filter(s=>s.startsWith("--")&&s.includes("=")).map(s=>{const i=s.indexOf("=");return[s.slice(0,i),s.slice(i+1)]}));
 if(!args["--catalog"]||!args["--toc"])throw Error("Usage: node scripts/compare-official-arabic-toc.mjs --catalog=GRADE.json --toc=VERIFIED_OFFICIAL_TOC.json");
 const c=JSON.parse(readFileSync(resolve(args["--catalog"]),"utf8"));
 const t=JSON.parse(readFileSync(resolve(args["--toc"]),"utf8"));
 process.stdout.write(JSON.stringify(compareVerifiedToc(c,t),null,2)+"\n");
}
