import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const PLAN_URL = new URL("../data/international/a1-curriculum-draft.json", import.meta.url);
const SKILLS = new Set(["reading","writing","listening","speaking","interaction"]);
const MODES = {reading:"reception",listening:"reception",writing:"production",speaking:"production",interaction:"interaction"};

export function validateA1Plan(plan) {
  assert.equal(plan.schema_version,1);
  assert.equal(plan.track_code,"non_native_arabic_cefr_a1");
  assert.equal(plan.cefr_target,"A1");
  assert.equal(plan.cefr_alignment,"candidate_not_certified");
  assert.equal(plan.status,"draft");
  assert.equal(plan.require_human_review_before_publication,true);
  assert.equal(plan.instruction_language,"en");
  assert.equal(plan.next_instruction_language,"fr");
  assert.deepEqual(plan.interface_languages,["ar","en"]);
  assert.equal(plan.phonetic_scoring_status,"disabled_pending_validation");
  assert.equal(plan.raw_audio_storage,"none_in_alpha");
  assert.equal(plan.assessment_policy.automatic_CEFR_award,false);
  assert.equal(plan.assessment_policy.avoid_reusing_guided_items_for_transfer,true);
  assert.equal(plan.assessment_policy.status,"planned_not_implemented");
  assert.deepEqual(plan.alpha_unit_numbers,[1,2,3,4]);
  assert.equal(plan.units.length,12,"A1 pilot outline needs 12 units");
  const ids=new Set(), objectives=new Set(), skillCoverage=new Set();
  let alphaLessons=0;
  for(const [index,unit] of plan.units.entries()){
    const n=index+1;
    const prefix="a1-u"+String(n).padStart(2,"0");
    assert.equal(unit.id,prefix);
    assert.equal(unit.position,n);
    assert.ok(unit.title_ar.trim().length>4);
    assert.ok(unit.title_en.trim().length>4);
    assert.equal(unit.review_status,"draft");
    assert.equal(unit.delivery,n<=4?"alpha_candidate":"later_wave_backlog");
    assert.equal(unit.lessons.length,4);
    if(n<=4)alphaLessons+=unit.lessons.length;
    for(const [j,lesson] of unit.lessons.entries()){
      assert.equal(lesson.id,prefix+"-l"+String(j+1).padStart(2,"0"));
      assert.equal(lesson.position,j+1);
      assert.equal(lesson.instruction_language,"en");
      assert.equal(lesson.content_status,"outline_only");
      assert.equal(lesson.review_status,"draft");
      assert.equal(lesson.cefr_evidence_state,"candidate_not_validated");
      assert.equal(lesson.audio_feedback,"not_automatic_proficiency_scoring");
      assert.ok(SKILLS.has(lesson.primary_skill));
      assert.equal(lesson.communicative_mode,MODES[lesson.primary_skill]);
      skillCoverage.add(lesson.primary_skill);
      for(const key of ["title_ar","title_en","can_do_ar","can_do_en"]){
        assert.equal(typeof lesson[key],"string");
        assert.ok(lesson[key].trim().length>8,key+" missing for "+lesson.id);
      }
      assert.ok(!ids.has(lesson.id),"duplicate lesson "+lesson.id);
      assert.ok(!objectives.has(lesson.can_do_ar),"duplicate measurable goal "+lesson.id);
      ids.add(lesson.id);objectives.add(lesson.can_do_ar);
    }
  }
  assert.equal(ids.size,48);
  assert.equal(alphaLessons,16);
  assert.deepEqual([...skillCoverage].sort(),[...SKILLS].sort());
  assert.ok(plan.sources.every(x=>x.rights==="reference_only" && x.url.startsWith("https://")));
  const codes=plan.sources.filter(x=>x.framework.startsWith("Cambridge")).map(x=>x.code).sort();
  assert.deepEqual(codes,["0508","0544"]);
  return {units:plan.units.length,lessons:ids.size,alphaLessons,skills:[...skillCoverage].sort()};
}

export function readA1Plan(){
  return JSON.parse(readFileSync(PLAN_URL,"utf8"));
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const summary=validateA1Plan(readA1Plan());
  process.stdout.write("DADYOOM_A1_OUTLINE_VALID "+JSON.stringify(summary)+"\n");
}
