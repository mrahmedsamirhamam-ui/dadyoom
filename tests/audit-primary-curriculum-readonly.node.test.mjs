import test from "node:test";
import assert from "node:assert/strict";
import { auditPrimaryCurriculum } from "../scripts/audit-primary-curriculum-readonly.mjs";

const lesson = {
 id:"lesson-qa-1",country:"BH",grade:1,status:"published",source_entry_id:"index-1",
 title:"نشاط تجريبي",summary:"شرح تعليمي أصلي مفيد للمبتدئين في القراءة والكتابة.",
 content:"مثال تعليمي أصلي مصاغ بلغة واضحة ومناسبة لعمر الطالب. ".repeat(5),
 content_kind:"official_candidate",learning_objectives:["يميز الطالب الصوت"],
};
const signed=(status="passed")=>({status,reviewer:"reviewer-test",checked_on:"2026-11-11",evidence_ref:"local-test-evidence"});
const snapshot={
 collection_metadata:{complete:true,source:"isolated synthetic QA fixture"},
 official_index:[{id:"index-1",country:"BH",grade:1,kind:"official",edition_year:"2026-2027",index_checked:true,url:"https://example.org/official-test",document_title:"مصدر اختبار فقط",page_reference:"1"}],
 lessons:[lesson],questions:[{lesson_id:lesson.id},{lesson_id:lesson.id},{lesson_id:lesson.id}],
 activities:[{lesson_id:lesson.id,is_published:true}],
 evidence:[{lesson_id:lesson.id,source:signed("matched"),content:signed(),activity_runtime:signed(),final_review:signed("approved")}]
};
const audit=(input)=>auditPrimaryCurriculum(input,{scope:[{country:"BH",grades:[1,2,3]}]});
test("four independent synthetic attestations are still never propagated to global VERIFIED",()=>{
 const report=audit(snapshot);
 assert.equal(report.lesson_audit[0].OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
 assert.equal(report.lesson_audit[0].eligible_for_independent_human_decision,true);
 assert.equal(report.scopes[0].OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
 assert.equal(report.status,"REVIEW_ONLY_NO_DB_WRITES");
 assert.equal(report.lesson_audit[0].requiresExternalHumanConfirmation,true);
});
test("only source index title or link does not establish official match",()=>{
 const altered={...snapshot, evidence:[{...snapshot.evidence[0],source:{...snapshot.evidence[0].source,status:"missing"}}]};
 const row=audit(altered).lesson_audit[0];
 assert.equal(row.OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
 assert.equal(row.evidence.official_source,false);
});
test("source year must match specific academic year",()=>{
 const altered={...snapshot,official_index:[{...snapshot.official_index[0],edition_year:"2024-2025"}]};
 assert.equal(audit(altered).lesson_audit[0].OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
});
test("unready published flags block official match even with all proof fields",()=>{
 const altered={...snapshot,lessons:[{...lesson,instructions:[{kind:"dadyoom_source",source_publication_ready:false}]}]};
 assert.equal(audit(altered).lesson_audit[0].OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
});
test("original enrichment never becomes official match automatically",()=>{
 const altered={...snapshot,lessons:[{...lesson,content_kind:"original_enrichment"}]};
 assert.equal(audit(altered).lesson_audit[0].OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
});
test("broken or missing questions, activity and runtime each block verification",()=>{
 for(const altered of [
 {...snapshot,questions:[{lesson_id:lesson.id}]},
 {...snapshot,activities:[]},
 {...snapshot,evidence:[{...snapshot.evidence[0],activity_runtime:{status:"passed"}}]},
 ]){
  assert.equal(audit(altered).lesson_audit[0].OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
 }
});
test("independent reviewer record is required",()=>{
 const altered={...snapshot,evidence:[{...snapshot.evidence[0],final_review:{status:"approved"}}]};
 assert.equal(audit(altered).lesson_audit[0].OFFICIAL_SYLLABUS_MATCH,"NOT_VERIFIED");
});
test("missing catalog and missing production snapshot are not asserted as zero coverage",()=>{
 const report=auditPrimaryCurriculum({lessons:[],questions:[],activities:[],official_index:[]});
 assert.equal(report.missing_data_warning,true);
 assert.equal(report.scopes.length,6);
 assert.ok(report.scopes.every(item=>item.collection_complete===false && item.OFFICIAL_SYLLABUS_MATCH==="NOT_VERIFIED"));
});
test("out-of-scope grades and countries do not enter audit",()=>{
 const altered={...snapshot, lessons:[...snapshot.lessons,{...lesson,id:"outside",grade:5}]};
 assert.equal(audit(altered).lesson_audit.length,1);
});
test("read-only audit rejects non-object input",()=>{
 assert.throws(()=>auditPrimaryCurriculum(null),/EXPECTED_LOCAL_SNAPSHOT_OBJECT/);
});

test("duplicate sources and evidence fail closed",()=>{
 assert.throws(()=>audit({...snapshot, official_index:[snapshot.official_index[0],snapshot.official_index[0]]}),/DUPLICATE_OFFICIAL_INDEX_IDS/);
 assert.throws(()=>audit({...snapshot, evidence:[snapshot.evidence[0],snapshot.evidence[0]]}),/DUPLICATE_LESSON_EVIDENCE_IDS/);
});
