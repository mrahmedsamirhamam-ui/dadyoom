import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

const audit = readFileSync("scripts/check-domain-migration-ready.mjs", "utf8");

describe("Dadyoom .com domain migration must be a prepared, non-mutating step", () => {
  test("read-only audit checks current Cloudflare and SEO wiring", () => {
    const r = spawnSync(process.execPath, ["scripts/check-domain-migration-ready.mjs"], {
      encoding: "utf8", timeout: 8000,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("DOMAIN_PREPARATION=CODE_READY_ONLY");
    expect(r.stdout).toContain("DOMAIN_OWNERSHIP=EXTERNAL_ACCOUNT_VERIFICATION_REQUIRED");
    expect(r.stdout).toContain("CUTOVER=VERIFY_LIVE_SEO_AND_SEARCH_CONSOLE");
  });
  test("no registrar, DNS or payment mutation in readiness script", () => {
    expect(audit).not.toContain("wrangler deploy");
    expect(audit).not.toContain("fetch(");
    expect(audit).not.toContain("writeFile");
    expect(audit).toContain("DOMAIN_PAYMENT=NEVER_EXECUTED_BY_SCRIPT");
    expect(audit).toContain("CANONICAL_DNS_REDIRECTS=NOT_MODIFIED_BY_THIS_SCRIPT");
  });
});
