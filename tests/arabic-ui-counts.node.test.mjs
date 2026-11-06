import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arabicCountNoun, formatArabicCount } from "../lib/arabic/counts.mjs";

test("Arabic count and tamyiz handle zero, 1, 2, 3–10, 11–99, 100+", () => {
  const cases = [
    [0, "grade", "صفوف"],
    [1, "grade", "صف"],
    [2, "grade", "صفان"],
    [3, "grade", "صفوف"],
    [10, "skill", "مهارات"],
    [11, "lesson", "درسًا"],
    [12, "grade", "صفًا"],
    [21, "grade", "صفًا"],
    [22, "lesson", "درسًا"],
    [99, "lesson", "درسًا"],
    [100, "student", "طالب"],
    [102, "student", "طالب"],
    [6, "classroom", "فصول"],
    [2, "result", "نتيجتان"],
    [12, "result", "نتيجةً"],
  ];
  for (const [n, noun, expected] of cases) {
    assert.equal(arabicCountNoun(n, noun), expected, n + " " + noun);
  }
  assert.equal(formatArabicCount(12, "grade", "en"), "12 صفًا");
  assert.equal(formatArabicCount(10, "skill", "en"), "10 مهارات");
  assert.notEqual(formatArabicCount(12, "grade", "en"), "12 صفوف");
  assert.notEqual(formatArabicCount(10, "skill", "en"), "10 مهارة");
});

test("Untrusted number inputs are rejected instead of generating misleading UI", () => {
  for (const n of [-1, NaN, Infinity, 1.2, Number.MAX_SAFE_INTEGER + 1, "12"]) {
    assert.throws(() => arabicCountNoun(n, "lesson"), RangeError);
  }
  assert.throws(() => arabicCountNoun(10, "unknown"), TypeError);
});

test("Fixed quantity labels are replaced in student, teacher and school surfaces", () => {
  const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
  const teacher = read("app/(dashboard)/teacher/page.tsx");
  const student = read("app/(dashboard)/student/page.tsx");
  const school = read("app/(dashboard)/school/page.tsx");
  const catalog = read("app/(dashboard)/courses/CurriculumCatalogClient.tsx");
  assert.match(teacher, /formatArabicCount\(classes\.length, "classroom"\)/);
  assert.match(student, /formatArabicCount\(dashboard\.completedLessons, "lesson"\)/);
  assert.match(school, /formatArabicCount\(schoolTeachers\.length, "teacher"\)/);
  assert.match(school, /formatArabicCount\(teacherStudentCount, "student"\)/);
  assert.match(school, /formatArabicCount\(teacherClassCount, "classroom"\)/);
  assert.match(school, /formatArabicCount\(filteredSchoolInterventions\.length, "result"\)/);
  assert.doesNotMatch(catalog, /بلا حدّ 6 دروس/);
  assert.doesNotMatch(teacher, /\{classes\.length\} فصل/);
  assert.doesNotMatch(student, /\} دروس مكتملة/);
});
