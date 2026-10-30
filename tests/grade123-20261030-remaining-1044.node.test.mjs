import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const audit=read("data/audits/grades123-22countries-after-two-198-batches-20261030.json");
const queue=read("data/review-queue/grades123-22countries-1044-activity-gaps-20261030.json");
const registry=read("data/curriculum-packs/arab-countries.json");

test("all 1044 incomplete Grade1-3 lesson identities are unique and valid",()=>{
 assert.equal(queue.remaining,1044);
 assert.equal(queue.lessons.length,1044);
 assert.equal(new Set(queue.lessons.map(x=>x.lessonId)).size,1044);
 assert.equal(queue.lessons.reduce((n,r)=>n+r.activitiesToSix,0)>0,true);
 const codes=new Set(registry.countries.map(x=>x.code));
 assert.equal(codes.size,22);
 for(const row of queue.lessons){
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok(codes.has(row.country));
  assert.ok([1,2,3].includes(row.grade));
  assert.equal(row.activitiesToSix,6-row.activityCount);
  assert.ok(row.activityCount>=0 && row.activityCount<6);
  assert.ok(row.title.trim().length>0);
  assert.equal("answer" in row,false);
  assert.equal("studentId" in row,false);
 }
});

test("the queue agrees with the independently measured production group totals",()=>{
 const cells=queue.countryGradeCounts;
 assert.equal(cells.length,66);
 assert.equal(cells.reduce((n,x)=>n+x.n,0),1044);
 assert.equal(queue.missingSourceOrPage,861);
 assert.equal(queue.shortBelow500,90);
 for(const country of audit.countries){
  for(const grade of country.grades){
   const row=cells.find(x=>x.country===country.country_code && x.grade===grade.grade);
   assert.ok(row);
   assert.equal(row.n,grade.current_published_below_six);
  }
 }
});
