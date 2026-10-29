import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateGrade123Audit } from "../scripts/grade123-release-gate.mjs";

const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sql = read("scripts/curriculum-22countries-g123-add-594-grounded-activities-20261029.sql");
const s = sql.match(/\$dadyoom_json\$([\s\S]*?)\$dadyoom_json\$/);
assert.ok(s, "Missing immutable curriculum activity template body");
const rows = JSON.parse(s[1]);
const original = JSON.parse(read("data/audits/grades123-22countries-after-four-batches-20261029.json"));
const current = JSON.parse(read("data/audits/grades123-22countries-after-594-original-activities-20261029.json"));
const quality = JSON.parse(read("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json"));

test("27 unique, grade-differentiated source-verified activity templates", () => {
  assert.equal(rows.length,27);
  assert.equal(new Set(rows.map(r=>[r.title,r.grade,r.activity_order].join("|"))).size,27);
  assert.deepEqual([...new Set(rows.map(r=>r.grade))].sort(),[1,2,3]);
  assert.deepEqual([...new Set(rows.map(r=>r.activity_type))].sort(),
    ["fill_blank","matching","multiple_choice"]);
  for (const row of rows) {
    assert.ok([4,5,6].includes(row.activity_order));
    assert.ok(row.prompt.length >= 20);
    assert.equal(row.content.origin,"DADYOOM_G123_VERIFIED_EXAMPLES_594_ACTIVITIES_20261029");
    assert.equal(row.content.reviewStatus,"supplementary-original");
    assert.equal("answer" in row.content,false,"Never include marking keys in public JSON");
    assert.equal("correct" in row.content,false);
    if (row.activity_type==="multiple_choice") {
      assert.ok(row.content.options.includes(row.answer.correct));
      assert.equal(new Set(row.content.options).size,3);
    }
    if (row.activity_type==="fill_blank") {
      assert.ok(row.content.items[0].options.includes(row.answer.answers[0]));
    }
    if (row.activity_type==="matching") {
      assert.equal(row.answer.pairs.length,3);
      for(const pair of row.answer.pairs) {
        assert.ok(row.content.left.includes(pair.left));
        assert.ok(row.content.right.includes(pair.right));
      }
    }
  }
});

test("atomic operation preserves all student history and prior completion rules", () => {
  assert.match(sql,/IF lesson_count<>198 OR existing_activity_count<>594/);
  assert.match(sql,/inserted_count<>594/);
  assert.match(sql,/lesson_activity_attempts/);
  assert.match(sql,/student_lesson_progress/);
  assert.match(sql,/is_required\)\s*SELECT[\s\S]*false/);
  assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|questions|student_lesson_progress|question_attempts|lesson_activity_attempts)/i);
});

test("observed 66-cell activity coverage increases from 372 to 570 but is not completed", () => {
  assert.equal(original.totals.after_four_6_to_10,372);
  assert.equal(current.totals.after_6_to_10,570);
  assert.equal(current.totals.current_published_below_six,1176);
  assert.equal(current.totals.new_published_activities,594);
  assert.equal(current.countries.length,22);
  assert.equal(current.countries.flatMap(c=>c.grades).length,66);
  assert.equal(current.countries.flatMap(c=>c.grades).reduce((n,g)=>n+g.after_6_to_10,0),570);
  assert.equal(current.totals.published,1746);
  assert.equal(current.totals.drafts,57);
  const result=evaluateGrade123Audit(current,quality);
  assert.equal(result.ready,false);
  assert.equal(result.sufficient,570);
  assert.equal(result.missing.exercises,1176);
  assert.equal(result.qualityGaps.genericQuestionLessons,1);
});
