import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const notifierPath = fileURLToPath(
  new URL("../../scripts/submit-indexnow.mjs", import.meta.url),
);
const workflow = readFileSync(
  new URL("../../.github/workflows/seo-production-gate.yml", import.meta.url),
  "utf8",
);

function runNotifier(paths) {
  return spawnSync(process.execPath, [notifierPath], {
    env: { ...process.env, DADYOOM_INDEXNOW_PATHS: paths },
    encoding: "utf8",
    timeout: 5000,
  });
}

test("regular CI cannot send the entire sitemap to IndexNow", () => {
  const run = runNotifier("");
  expect(run.status).toBe(0);
  expect(run.stdout).toContain("INDEXNOW=SKIPPED_NO_CHANGED_URLS");
  const script = readFileSync(notifierPath, "utf8");
  expect(script).not.toContain("getSitemapUrls");
  expect(script).not.toContain("SITEMAP_URL");
  expect(workflow).toContain("DADYOOM_INDEXNOW_PATHS");
  expect(workflow).toContain("INDEXNOW=SKIPPED_NO_CHANGED_PUBLIC_LANDING_PAGES");
  expect(workflow).not.toContain("name: Submit sitemap to IndexNow");
});

test("private and off-domain URLs are rejected before any network call", () => {
  for (const path of ["/admin", "/student/grades", "/api/ask", "https://example.com/"]) {
    const run = runNotifier(path);
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain("INDEXNOW_NONPUBLIC_OR_OFFSITE_URL");
  }
});

test("notifier refuses oversized batches before accessing the network", () => {
  const run = runNotifier(Array.from({ length: 51 }, (_, i) => "/example-" + i).join("\n"));
  expect(run.status).not.toBe(0);
  expect(run.stderr).toContain("INDEXNOW_TOO_MANY_CHANGED_URLS");
});
