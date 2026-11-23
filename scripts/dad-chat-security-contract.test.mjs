import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(new URL("../app/api/dad/chat/route.ts", import.meta.url), "utf8");

test("client lesson context is not a system message", () => {
  assert.match(route, /role: "user" as const,\s*content: `بيانات سياق الدرس/);
  assert.doesNotMatch(route, /role: "system" as const,\s*content: `سياق الدرس الحالي/);
});
test("request size is checked before JSON parse and quota consumption", () => {
  const limit = route.indexOf('if (declaredLength > 32768)');
  const bytes = route.indexOf('Buffer.byteLength(raw, "utf8") > 32768');
  const parse = route.indexOf("JSON.parse(raw)");
  const charge = route.indexOf('consumeFeature("dad_chat")');
  assert.ok(limit >= 0 && bytes > limit && parse > bytes && charge > parse);
});
test("invalid input is rejected before quota consumption", () => {
  const charge = route.indexOf('consumeFeature("dad_chat")');
  for (const marker of ["INVALID_JSON", "INVALID_BODY", "INVALID_FIELDS", "INVALID_HISTORY", "اكتب سؤالك أولًا."]) {
    assert.ok(route.indexOf(marker) >= 0 && route.indexOf(marker) < charge, marker);
  }
});
test("internal exception message is not returned to callers", () => {
  assert.doesNotMatch(route, /error\.message/);
  assert.match(route, /error: "تعذر الحصول على رد من ضاد\."/);
});
