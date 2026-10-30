import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync(new URL("../data/review-queue/grades123-90-short-published-coverage-nodes-20261030.json",import.meta.url),"utf8"));
test("all 90 short published Grade1-3 mapping nodes remain source/teacher-review blocked",()=>{
 assert.equal(data.count,90);
 assert.equal(data.rows.length,90);
 assert.equal(new Set(data.rows.map(r=>r.lessonId)).size,90);
 assert.deepEqual(data.byCountry.map(v=>v.n),[36,12,36,3,3]);
 assert.deepEqual(data.byCountry.map(v=>v.country),["EG","LY","PS","TN","YE"]);
 assert.equal(data.missingSourceOrPage,90);
 assert.equal(data.teacherApproved,false);
 assert.equal(data.ministryScopeVerified,false);
 for (const row of data.rows) {
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok(row.textLength<500);
  assert.ok([1,2,3].includes(row.grade));
  assert.ok(!row.sourcePdfPresent || !row.sourcePagePresent);
  assert.equal("answer" in row,false);
 }
});
