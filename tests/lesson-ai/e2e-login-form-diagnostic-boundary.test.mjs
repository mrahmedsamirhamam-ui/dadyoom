import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("login gate still requires visible email, password and submit controls", () => {
  const code = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  const segment = code.split("async function login(")[1].split("const responsePromise =")[0];
  expect(segment).toContain('input[type="email"]');
  expect(segment).toContain('input[type="password"]');
  expect(segment).toContain('emailInput.waitFor({');
  expect(segment).toContain('passwordInput.waitFor({');
  expect(segment).toContain('submitButton.waitFor({');
  expect(segment).toContain('throw cause;');
});

test("login failures expose HTTP status and page evidence without logging credentials", () => {
  const code = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  const segment = code.split("async function login(")[1].split("const responsePromise =")[0];
  expect(segment).toContain("E2E_LOGIN_FORM_DIAGNOSTIC");
  expect(segment).toContain("formHttpStatus");
  expect(segment).toContain("documentTitle");
  expect(segment).toContain("bodyPreview");
  expect(segment).not.toContain("console.error(user.email)");
  expect(segment).not.toContain("console.error(password)");
});