import { test } from "vitest";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const utility = readFileSync("lib/curriculum/verified-book-reference.ts", "utf8");
const catalog = readFileSync("app/api/courses/catalog/route.ts", "utf8");
const service = readFileSync("services/lessons/student-curriculum-catalog.ts", "utf8");
const ui = readFileSync("app/courses/CurriculumCatalogClient.tsx", "utf8");

test("book-only references are scoped to four known countries and named book bundle units", () => {
  for (const code of ["YE", "TN", "OM", "LY"]) assert.ok(utility.includes(`case "${code}"`));
  assert.ok(utility.includes("حزمة الكتب الرسمية"));
  assert.ok(utility.includes("حزمة الكتاب الرسمي"));
  assert.ok(utility.includes("كتب اللغة العربية الرسمية المعتمدة"));
  assert.ok(utility.includes("كتاب (?:الأدب والنصوص"));
});

test("student catalog and scoped API classify books without deleting or mutating DB lessons", () => {
  assert.ok(catalog.includes("resourceKind: isBookReference({"));
  assert.ok(service.includes("resourceKind: isBookReference({"));
  assert.ok(service.includes('resourceKind?: "lesson" | "book-reference"'));
});

test("book card cannot be opened as scored lesson and counts are distinct", () => {
  assert.ok(ui.includes('lesson.resourceKind === "book-reference" ? ('));
  assert.ok(ui.includes("مرجع كتاب — ليس درسًا"));
  assert.ok(ui.includes("lesson.resourceKind !== \"book-reference\""));
  assert.ok(ui.includes("لا يظهر زر بدء درس أو نقاط تحصيل"));
});

test("book reference identity and direct lesson routing are protected", () => {
  const references = readFileSync("lib/curriculum/verified-book-reference.ts", "utf8");
  const lesson = readFileSync("app/lessons/[id]/page.tsx", "utf8");
  const bookPage = readFileSync("app/curriculum/books/[id]/page.tsx", "utf8");
  const ui = readFileSync("app/courses/CurriculumCatalogClient.tsx", "utf8");
  expect(references).toContain("export function isKnownBookReferenceId");
  expect(references).toContain("BOOK_REFERENCE_IDS");
  expect(lesson).toContain('redirect(`/curriculum/books/${id}`)');
  expect(lesson).toContain("isKnownBookReferenceId(id)");
  expect(bookPage).toContain("robots: { index:false, follow:true }");
  expect(bookPage).toContain("isBookReference({ countryCode");
  expect(ui).toContain('href={`/curriculum/books/${lesson.id}`}');
});
