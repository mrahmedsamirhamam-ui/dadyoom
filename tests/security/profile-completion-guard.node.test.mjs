import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../../app/api/auth/complete-profile/route.ts", import.meta.url), "utf8");
test("privileged roles cannot be self-selected", () => {
  assert.match(source, /allowedSelfSignupRoles = new Set\(\["student", "child", "parent"\]\)/);
  assert.match(source, /if \(!allowedSelfSignupRoles\.has\(role\)\)/);
  assert.match(source, /status: 403/);
});
test("existing role is checked and immutable in profile completion", () => {
  assert.match(source, /storedRole && storedRole !== role/);
  assert.match(source, /\.eq\("role", storedRole\)/);
});
test("service role cannot overwrite an existing profile via upsert", () => {
  assert.doesNotMatch(source, /\.upsert\(/);
  assert.match(source, /\.insert\(/);
  assert.match(source, /\.update\(\{ full_name: fullName, country \}\)/);
});
test("profile lookup errors fail closed", () => {
  assert.match(source, /if \(lookupError\)/);
  assert.match(source, /status: 503/);
});

test("concurrent role changes cannot silently succeed", () => {
  assert.match(source, /\.select\("id,role"\)\.maybeSingle\(\)/);
  assert.match(source, /!writtenProfile \|\| writtenProfile\.role !== \(storedRole \|\| role\)/);
  assert.match(source, /racedRole !== \(storedRole \|\| role\)/);
});
