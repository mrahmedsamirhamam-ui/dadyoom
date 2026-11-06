import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { readA1Plan, validateA1Plan } from "../scripts/verify-international-a1.mjs";

test("original non-native A1 map: 12 units / 48 unique lessons / 16 alpha",()=>{
  const v=validateA1Plan(readA1Plan());
  assert.deepEqual(v.skills,["interaction","listening","reading","speaking","writing"]);
  assert.equal(v.alphaLessons,16);
});

test("no lesson can claim a CEFR endorsement or go published without review",()=>{
  const x=readA1Plan();
  x.units[0].lessons[0].review_status="approved";
  assert.throws(()=>validateA1Plan(x));
  x.units[0].lessons[0].review_status="draft";
  x.units[0].lessons[0].cefr_evidence_state="validated";
  assert.throws(()=>validateA1Plan(x));
});

test("rejects duplicate goals and wrong bridging language",()=>{
  const x=readA1Plan();
  x.units[1].lessons[0].can_do_ar=x.units[0].lessons[0].can_do_ar;
  assert.throws(()=>validateA1Plan(x),/duplicate measurable goal/);
  x.units[1].lessons[0].can_do_ar=readA1Plan().units[1].lessons[0].can_do_ar;
  x.instruction_language="fr";
  assert.throws(()=>validateA1Plan(x));
});

test("draft schema does not touch national curriculum and enables RLS on seven new tables",()=>{
  const sql=readFileSync(new URL("../docs/international/PROPOSED_NON_NATIVE_SCHEMA.sql",import.meta.url),"utf8");
  assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS public\.non_native_/g)||[]).length,7);
  assert.equal((sql.match(/ALTER TABLE public\.non_native_\w+ ENABLE ROW LEVEL SECURITY/g)||[]).length,7);
  assert.doesNotMatch(sql,/^\s*(?:ALTER|DROP|TRUNCATE|UPDATE|DELETE FROM)\s+(?:TABLE\s+)?(?:public\.)?(?:lessons|units|grades|curricula)\b/gim);
  assert.match(sql,/non_native_progress_owner_read/);
  assert.match(sql,/auth\.uid\(\)/);
  assert.match(sql,/rights_verified_at/);
  assert.match(sql,/REVOKE ALL ON/);
  assert.doesNotMatch(sql,/GRANT (?:INSERT|UPDATE|DELETE|ALL) ON .* TO anon/);
});

test("speech scoring is explicitly formative-only until independent validation",()=>{
  const x=readA1Plan();
  assert.equal(x.phonetic_scoring_status,"disabled_pending_validation");
  assert.equal(x.raw_audio_storage,"none_in_alpha");
  assert.equal(x.assessment_policy.automatic_CEFR_award,false);
});
