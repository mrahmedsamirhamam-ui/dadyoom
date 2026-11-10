import test from "node:test";
import assert from "node:assert/strict";
import { auditExportedLessonsSeo } from "../scripts/audit-exported-lessons-seo.mjs";

const rows = [
  { id: "1", country_code: "BH", grade_number: 1, status: "published", title: "مُفكّرة التعلم", summary: "", content: "محتوى رسمي من كتاب الوزارة" },
  { id: "2", country_code: "bh", grade_number: 1, status: "published", title: "مفكرة  التعلم", summary: "درس", content: "نشاط" },
  { id: "3", country_code: "EG", grade_number: 1, status: "published", title: "مفكرة التعلم", summary: "", content: "" },
  { id: "4", country_code: "BH", grade_number: 1, status: "draft", title: "مفكرة التعلم", content: "مسودة" },
  { id: "5", country_code: "BH", grade_number: 2, status: "published", title: "قراءة", instructions: [{ kind:"dadyoom_source", source_publication_ready: false }] },
];

test("flags only same-country-and-grade duplicate title candidates", () => {
  const report = auditExportedLessonsSeo(rows);
  assert.equal(report.counts.rows, 5);
  assert.equal(report.counts.published, 4);
  assert.equal(report.counts.duplicate_title_groups, 1);
  assert.deepEqual(report.duplicate_title_groups[0].lesson_ids, ["1","2"]);
});
test("records explicit source-unready without silently noindexing", () => {
  const report = auditExportedLessonsSeo(rows);
  assert.deepEqual(report.explicit_source_unready_ids, ["5"]);
  assert.equal(report.audit_type, "offline_heuristic_not_seo_certification");
  assert.match(report.disclaimer, /human review/i);
});
test("flags unsupported official claims for human source verification", () => {
  const report = auditExportedLessonsSeo(rows);
  assert.deepEqual(report.official_claim_candidate_ids, ["1"]);
});
test("rejects nonarray input without network or database calls", () => {
  assert.throws(() => auditExportedLessonsSeo({ lessons: [] }), /EXPECTED_JSON_ARRAY/);
});
test("never conflates matching titles in different countries", () => {
  const report = auditExportedLessonsSeo([rows[0], rows[2]]);
  assert.equal(report.counts.duplicate_title_groups, 0);
});
