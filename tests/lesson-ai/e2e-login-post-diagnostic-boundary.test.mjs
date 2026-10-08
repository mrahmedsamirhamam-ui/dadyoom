import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("login POST gate remains strict and reports request start/fail evidence", () => {
  const code = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  const block = code.split("async function login(")[1].split("async function canonicalLearningFlow(")[0];
  expect(block).toContain("page.waitForResponse(");
  expect(block).toContain('"/api/auth/password-login"');
  expect(block).toContain("E2E_LOGIN_POST_DIAGNOSTIC");
  expect(block).toContain("passwordPostStarted");
  expect(block).toContain("passwordPostFailed");
  expect(block).toContain("throw cause;");
  expect(block).toContain('page.off("request", onPasswordRequest)');
});
test("login diagnostics never log passwords, POST bodies, or bearer tokens", () => {
  const code = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  const block = code.split('console.error("E2E_LOGIN_POST_DIAGNOSTIC"')[1].split("throw cause;")[0];
  expect(block).not.toContain("request.postData");
  expect(block).not.toContain("user.email");
  expect(block).not.toContain("password,");
  expect(block).not.toContain("access_token");
});