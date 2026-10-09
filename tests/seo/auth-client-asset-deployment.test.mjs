import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("auth pages are not cached across client-bundle deploys", () => {
  for (const page of ["app/login/page.tsx", "app/signup/page.tsx"]) {
    const code = readFileSync(page, "utf8");
    expect(code).toContain('dynamic = "force-dynamic"');
    expect(code).toContain("revalidate = 0");
    expect(code).toContain("index: false");
    expect(code).not.toContain('dynamic = "force-static"');
  }
});

test("Cloudflare deployments finish atomically and check auth JS chunks", () => {
  const workflow = readFileSync(".github/workflows/cloudflare-deploy.yml", "utf8");
  const gate = readFileSync("scripts/verify-production-auth-assets.mjs", "utf8");
  expect(workflow).toContain("cancel-in-progress: false");
  expect(workflow).toContain("node scripts/verify-production-auth-assets.mjs");
  expect(workflow).toContain("DADYOOM_DEPLOY_VERIFY=SUPERSEDED");
  expect(workflow).toContain("git ls-remote --heads origin");
  expect(workflow).toContain("exit 1");
  expect(gate).toContain("DADYOOM_AUTH_ASSET_GATE=PASS");
  expect(gate).toContain("AUTH_ASSET_MISSING");
  expect(gate).toContain('asset.headers.get("cf-ray")');
  expect(gate).toContain("startingCommit");
  expect(gate).toContain("observedCommit");
  expect(gate).toContain("DEPLOY_VERSION_CHANGED_DURING_ASSETS_CHECK");
  expect(gate).toContain("/login");
  expect(gate).toContain("/signup");
});
