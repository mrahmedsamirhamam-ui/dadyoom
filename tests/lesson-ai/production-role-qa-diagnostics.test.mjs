import { readFileSync } from "node:fs";
import { test, expect } from "vitest";
const s=readFileSync(new URL("../../scripts/final-e2e-release-gate.mjs",import.meta.url),"utf8");
test("E2E captures bounded Cloudflare 5xx diagnostics with no auth headers or request bodies",()=>{
 expect(s).toContain('requestUrl === "/api/lessons/complete"');
 expect(s).toContain('bodyPreview: raw.slice(0, 250)');
 expect(s).toContain('response.headers.get("cf-ray")');
 expect(s).toContain("complete.errorDiagnostics?.bodyPreview");
 expect(s).not.toContain("response.headers.get(\"set-cookie\")");
});