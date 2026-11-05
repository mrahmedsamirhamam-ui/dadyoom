import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  READING_PATHS,
  splitPublishedLessonIntoSteps,
  listPublishedGoalChoices,
} from "../lib/adaptive-goal-paths/grounded-lesson-reading.mjs";

test("Three reading supports are distinct and do not impose public learner levels", () => {
  assert.deepEqual(READING_PATHS.map(row => row.id), ["start", "progress", "challenge"]);
  for (const row of READING_PATHS) {
    assert.ok(row.title.startsWith("مسار "));
    assert.ok(row.hint.length > 4);
  }
});

test("Break every published paragraph into lossless chunks without rewriting text", () => {
  const raw = [
    "الدرس الثاني: النمر والحطاب\n\n",
    "أولًا: تتعرف الشخصيات وتتبع الأحداث في القصة. التكبر لا يعني امتلاك الحكمة.\n",
    "السبب والنتيجة: لماذا اتخذ الحطاب تلك الخطوة؟ أفسر ما ورد في النص.\n\n",
    "اللام الشمسية: النمر. اللام القمرية: الإنسان.",
  ].join("");
  const steps = splitPublishedLessonIntoSteps(raw, 94);
  assert.ok(steps.length > 1);
  assert.equal(steps.join(""), raw);
  assert.ok(steps.every(step => step.length > 0));
  assert.equal(splitPublishedLessonIntoSteps(raw, 4000).join(""), raw);
});

test("Long unpunctuated text, non-Arabic characters and literal HTML remain unchanged", () => {
  const text = "<script>alert('xss')</script> " + "كلمة ".repeat(250) + "درس\n";
  const steps = splitPublishedLessonIntoSteps(text, 100);
  assert.ok(steps.length > 5);
  assert.equal(steps.join(""), text);
  assert.equal(splitPublishedLessonIntoSteps(""), [].join(""));
  assert.deepEqual(splitPublishedLessonIntoSteps(null), []);
  assert.deepEqual(splitPublishedLessonIntoSteps(undefined), []);
  assert.throws(() => splitPublishedLessonIntoSteps(text, 0), RangeError);
  assert.throws(() => splitPublishedLessonIntoSteps(text, 9000), RangeError);
});

test("The selected objective is taken verbatim from actual published lesson data", () => {
  const objectives = ["أن يحدد الشخصيات من القصة", "أن يربط حدثًا بنتيجته", "أن يفسر المفردات"];
  assert.deepEqual(listPublishedGoalChoices(objectives), objectives);
  assert.deepEqual(listPublishedGoalChoices(["", "  ", "هدف موثق", null, 5]), ["هدف موثق"]);
  assert.deepEqual(listPublishedGoalChoices(undefined), []);
  assert.deepEqual(listPublishedGoalChoices({}), []);
});

test("Published lesson page integrates the grounded reading UI without replacing slides or grading", () => {
  const page = readFileSync(new URL("../app/lessons/[id]/page.tsx", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../features/lessons/components/LessonExplanationPaths.tsx", import.meta.url), "utf8");
  assert.match(page, /<LessonExplanationPaths/);
  assert.match(page, /lessonTitle=\{lesson.title\}/);
  assert.match(page, /content=\{lesson.content\}/);
  assert.match(page, /objectives=\{objectives\}/);
  assert.match(page, /<LessonLearningSlides/);
  assert.match(page, /<MultipleChoiceQuestion/);
  assert.match(page, /id="lesson-assessment"/);
  assert.match(ui, /splitPublishedLessonIntoSteps\(content\)/);
  assert.match(ui, /listPublishedGoalChoices\(objectives\)/);
  assert.match(ui, /<StructuredLessonText content=\{content\} \/>/);
  assert.match(ui, /useState<ReadingPath>\("progress"\)/); // Full lesson is default for SEO and accessibility.
  assert.match(ui, /role="group" aria-label="مسارات عرض الشرح"/);
  assert.match(ui, /aria-pressed=\{path === choice.id\}/);
  assert.match(ui, /هذه أدوات مساندة للقراءة وليست اختبارًا تشخيصيًا/);
  assert.match(ui, /لم يُسجَّل هدف تعلم محدد لهذا الدرس/);
  assert.doesNotMatch(ui, /createAdminClient|createClient|supabase\.|fetch\(|localStorage|sessionStorage|service_role/);
});

test("The same published objective and source are not re-authored by a generated explanation", () => {
  const ui = readFileSync(new URL("../features/lessons/components/LessonExplanationPaths.tsx", import.meta.url), "utf8");
  assert.match(ui, /selectedGoal/);
  assert.match(ui, /النص الأصلي متاح كاملًا دائمًا/);
  assert.match(ui, /لم تُصحّح كتابتك آليًا ولا تُحتسب درجة/);
  assert.doesNotMatch(ui, /OpenAI|Gemini|anthropic|llm|https:\/\/.*\/api\//i);
});
