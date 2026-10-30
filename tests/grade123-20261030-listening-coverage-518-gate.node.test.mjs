import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";

const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const previous=read("data/audits/grades123-22countries-after-591-text-based-activities-20261030.json");
const current=read("data/audits/grades123-22countries-after-198-listening-activities-20261030.json");
const quality=read("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const remaining=read("data/review-queue/grades123-22countries-518-activity-gaps-20261030.json");
const media=read("data/audits/grades123-listening-66-scripts-no-direct-audio-20261030.json");

test("source-linked listening batch improves exactly 66 country-grade lessons without declaring syllabus readiness",()=>{
 assert.equal(previous.totals.after_6_to_10,1162);
 assert.equal(current.totals.after_6_to_10,1228);
 assert.equal(current.totals.published,1746);
 assert.equal(current.totals.drafts,57);
 assert.equal(current.totals.total,1803);
 assert.equal(current.totals.current_published_below_six,518);
 assert.equal(current.totals.new_published_activities,198);
 assert.equal(current.countries.length,22);
 const groups=current.countries.flatMap(c=>c.grades);
 assert.equal(groups.length,66);
 assert.equal(groups.reduce((n,g)=>n+g.after_6_to_10,0),1228);
 const gate=evaluateGrade123Audit(current,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1228);
 assert.equal(gate.missing.exercises,518);
 assert.equal(current.audioEndToEndVerified,false);
 assert.equal(current.nextBatchGrades456Allowed,false);
});

test("518 remaining lessons are unique and not silently marked completed",()=>{
 assert.equal(remaining.remaining,518);
 assert.equal(remaining.rows.length,518);
 assert.equal(new Set(remaining.rows.map(x=>x.lessonId)).size,518);
 assert.deepEqual(remaining.byGrade.map(x=>x.n),[234,140,144]);
 assert.equal(remaining.missingSourceOrPage,335);
 assert.equal(remaining.shortUnder500,90);
 for(const row of remaining.rows){
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(row.grade));
  assert.ok(row.publishedActivities>=0&&row.publishedActivities<6);
  assert.equal(row.missingToSix,6-row.publishedActivities);
  assert.equal("answer" in row,false);
 }
});

test("existing 66 scripted listening lessons have no recorded audio and voice E2E remains unverified",()=>{
 assert.equal(media.summary.lessons,66);
 assert.equal(media.summary.explicitDirectAudioLinks,0);
 assert.equal(media.readiness.independentStudentAudioPlaybackVerified,false);
 assert.equal(media.readiness.lessonAudioComplete,false);
});
