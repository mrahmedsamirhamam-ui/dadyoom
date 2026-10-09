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
test("responsive QA retries only transient server 5xx and never accepts persistent 503", () => {
 const start = s.indexOf("async function responsiveSmoke(");
 const end = s.indexOf("async function roleRouteSmoke(", start);
 expect(start).toBeGreaterThan(-1);
 expect(end).toBeGreaterThan(start);
 const code = s.slice(start, end);
 expect(code).toContain("attempt <= 3");
 expect(code).toContain("E2E_RESPONSIVE_LOAD_RETRY");
 expect(code).toContain("response.status() < 500");
 expect(code).toContain("Boolean(response)");
 expect(code).toContain("await page.waitForTimeout(attempt * 1200)");
});
