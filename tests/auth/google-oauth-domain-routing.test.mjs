import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const oauth = readFileSync("components/auth/GoogleAuthButton.tsx", "utf8");
const callback = readFileSync("app/auth/callback/route.ts", "utf8");
const login = readFileSync("components/auth/EmailPasswordAuthForm.tsx", "utf8");

describe("Google OAuth follows the exact hostname used to start sign-in", () => {
  test("web OAuth returns to a same-origin /auth/callback and never hardcodes legacy domain", () => {
    expect(oauth).toContain("redirectTo: isNative");
    expect(oauth).toContain("window.location.origin}/auth/callback");
    expect(oauth).not.toContain("dadyoom.dpdns.org");
  });
  test("server exchanges code and issues role navigation on the callback origin", () => {
    expect(callback).toContain("const origin =");
    expect(callback).toContain("url.origin;");
    expect(callback).toContain("exchangeCodeForSession(");
    expect(callback).toContain("new URL(destination, origin)");
    expect(callback).not.toContain("dadyoom.dpdns.org");
  });
  test("OAuth recovery no longer instructs users to return to the old hostname", () => {
    expect(login).toContain("Authentication ← URL Configuration");
    expect(login).not.toContain("افتح ضاديوم من الرابط الأصلي");
  });
});
