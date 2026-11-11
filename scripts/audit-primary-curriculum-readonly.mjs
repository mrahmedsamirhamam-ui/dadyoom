#!/usr/bin/env node
/**
 * Dadyoom primary curriculum evidence audit.
 * LOCAL INPUT ONLY: no database client, network calls, DML, publication change,
 * or permission to infer official equivalence from lesson title alone.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const PRIORITY_SCOPE = Object.freeze([{country:"BH",grades:[1,2,3]},{country:"PS",grades:[1,2,3]}]);
const clean = (v) => typeof v==="string" ? v.trim() : "";
const actualDate = (v) => {if(typeof v!=="string"||!/^\d{4}-\d\d-\d\d$/.test(v))return false;const date=new Date(v+"T00:00:00.000Z");return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===v;};
const signed = (v, flag="status", status="passed") => !!(v && v[flag]===status && clean(v.reviewer) && actualDate(v.checked_on) && clean(v.evidence_ref));
const validSource = (v, expectedYear) => !!(v && v.kind==="official" && v.edition_year===expectedYear &&
 v.index_checked===true && /^https:\/\//.test(clean(v.url)) && clean(v.document_title) && clean(v.page_reference));

export function auditPrimaryCurriculum(snapshot, options={}) {
  if (!snapshot || typeof snapshot!=="object" || Array.isArray(snapshot)) throw new TypeError("EXPECTED_LOCAL_SNAPSHOT_OBJECT");
  const year=options.academicYear ?? "2026-2027";
  const lessons=Array.isArray(snapshot.lessons)?snapshot.lessons:[];
  const questions=Array.isArray(snapshot.questions)?snapshot.questions:[];
  const activities=Array.isArray(snapshot.activities)?snapshot.activities:[];
  const sources=Array.isArray(snapshot.official_index)?snapshot.official_index:[];
  const evidence=Array.isArray(snapshot.evidence)?snapshot.evidence:[];
  const scope=options.scope ?? PRIORITY_SCOPE;
  const scopeKeys=new Set(scope.flatMap(s=>s.grades.map(g=>s.country+":"+g)));
  const inScopeSources=sources.filter(s=>s && scopeKeys.has(s.country+":"+s.grade));
  if(new Set(inScopeSources.map(s=>s.id)).size!==inScopeSources.length)throw new Error("DUPLICATE_OFFICIAL_INDEX_IDS");
  if(new Set(evidence.map(e=>e?.lesson_id)).size!==evidence.length)throw new Error("DUPLICATE_LESSON_EVIDENCE_IDS");
  const sourceMap=new Map(inScopeSources.map(s=>[s.id,s]));
  const evidenceMap=new Map(evidence.map(e=>[e.lesson_id,e]));
  const questionsById=new Map();
  for (const q of questions) {if(q && typeof q.lesson_id==="string")questionsById.set(q.lesson_id,(questionsById.get(q.lesson_id)??0)+1);}
  const actsById=new Map();
  for (const a of activities) {
    if(a && typeof a.lesson_id==="string" && a.is_published===true)actsById.set(a.lesson_id,(actsById.get(a.lesson_id)??0)+1);
  }
  const reportRows=[];
  for(const l of lessons) {
    if(!l || !scopeKeys.has(l.country+":"+l.grade))continue;
    const proof=evidenceMap.get(l.id)??{};
    const index=sourceMap.get(l.source_entry_id);
    const reasons=[];
    const contentString=clean(l.content);
    const summary=clean(l.summary);
    const objectives=Array.isArray(l.learning_objectives)?l.learning_objectives.filter(s=>clean(s)):[];
    const explicitlyUnready=Array.isArray(l.instructions) && l.instructions.some(s=>s?.kind==="dadyoom_source"&&s.source_publication_ready===false);
    const claimsOfficial=/(?:محتوى رسمي|نص كتاب الوزارة|من كتاب الوزارة|مطابق للمنهج|معتمد من الوزارة)/u.test([l.title,l.summary,l.content].map(x=>clean(x)).join(" "));
    const editorialFlags=claimsOfficial && (l.content_kind==="original_enrichment" || explicitlyUnready)
      ? ["EDITORIAL_OFFICIAL_CLAIM_CONFLICT"] : [];

    const sourceOk=!!(index && index.country===l.country && index.grade===l.grade && validSource(index,year)
      && signed(proof.source,"status","matched"));
    if(!sourceOk)reasons.push("SOURCE_INDEX_EDITION_OR_HUMAN_MATCH_MISSING");
    if(explicitlyUnready)reasons.push("SOURCE_MARKED_NOT_PUBLICATION_READY");
    if(contentString.length<120 || summary.length<30 || objectives.length===0)reasons.push("EXPLANATION_INCOMPLETE_OR_UNPROVEN");
    const contentOk=contentString.length>=120 && summary.length>=30 && objectives.length>0 && signed(proof.content);
    if(!signed(proof.content))reasons.push("CONTENT_REVIEW_EVIDENCE_MISSING");
    const questionCount=questionsById.get(l.id)??0, activityCount=actsById.get(l.id)??0;
    if(questionCount<3)reasons.push("QUESTIONS_LT_3");
    if(activityCount<1)reasons.push("NO_PUBLISHED_INTERACTIVE_ACTIVITIES");
    const activityOk=questionCount>=3 && activityCount>=1 && signed(proof.activity_runtime);
    if(!signed(proof.activity_runtime))reasons.push("ACTIVITY_RUNTIME_TEST_EVIDENCE_MISSING");
    const reviewOk=signed(proof.final_review,"status","approved");
    if(!reviewOk)reasons.push("INDEPENDENT_HUMAN_REVIEW_MISSING");
    const kind=l.content_kind==="original_enrichment"?"original_enrichment":
      l.content_kind==="official_candidate"?"official_candidate":"unclassified";
    if(kind==="unclassified")reasons.push("CONTENT_KIND_UNCLASSIFIED");
    if(l.status!=="published")reasons.push("NOT_PUBLISHED");
    const gates={official_source:sourceOk&&!explicitlyUnready,complete_explanation:contentOk,
      tested_interactions:activityOk,independent_review:reviewOk};
    const eligible=l.status==="published"&&kind==="official_candidate"&&Object.values(gates).every(Boolean);
    reportRows.push({
      id:l.id,title:clean(l.title),country:l.country,grade:l.grade,status:l.status,content_kind:kind,editorial_flags:editorialFlags,
      evidence:gates,question_count:questionCount,published_activity_count:activityCount,
      OFFICIAL_SYLLABUS_MATCH:"NOT_VERIFIED",
      eligible_for_independent_human_decision:eligible,
      requiresExternalHumanConfirmation:eligible,
      issues:[...new Set([...reasons,...editorialFlags])]
    });
  }
  const countryGrades=scope.flatMap(s=>s.grades.map(grade=>{
    const subset=reportRows.filter(l=>l.country===s.country&&l.grade===grade);
    const expected=sources.filter(i=>i?.country===s.country&&i?.grade===grade&&i.edition_year===year&&i.kind==="official");
    const mapped=new Set(lessons.filter(l=>l?.country===s.country&&l.grade===grade).map(l=>l.source_entry_id).filter(Boolean));
    return {
      country:s.country,grade,published_snapshot:subset.filter(x=>x.status==="published").length,
      draft_snapshot:subset.filter(x=>x.status!=="published").length,
      official_index_entries_supplied:expected.length,
      official_index_entries_unmapped:expected.filter(x=>!mapped.has(x.id)).map(x=>x.id),
      eligible_for_independent_human_decision:subset.filter(x=>x.eligible_for_independent_human_decision).length,
      OFFICIAL_SYLLABUS_MATCH:"NOT_VERIFIED",
      collection_complete: !!snapshot.collection_metadata?.complete && expected.length>0,
    };
  }));
  return {
    status:"REVIEW_ONLY_NO_DB_WRITES",
    academic_year:year,
    provenance:snapshot.collection_metadata??null,
    limitations:"Supplied offline data and attestations are NOT independent verification; external official-index checks and human approval remain mandatory. No database update or global VERIFIED status is issued.",
    scopes:countryGrades,lesson_audit:reportRows,
    missing_data_warning:!snapshot.collection_metadata?.complete,
  };
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const input=process.argv.find(x=>x.startsWith("--input="))?.slice(8);
  const output=process.argv.find(x=>x.startsWith("--output="))?.slice(9);
  if (!input || !output){console.error("Usage: node scripts/audit-primary-curriculum-readonly.mjs --input=local-snapshot.json --output=review-report.json");process.exitCode=2;}
  else {
    const report=auditPrimaryCurriculum(JSON.parse(readFileSync(resolve(input),"utf8")));
    writeFileSync(resolve(output),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify({status:report.status,scope:report.scopes,rows:report.lesson_audit.length,output},null,2));
  }
}
