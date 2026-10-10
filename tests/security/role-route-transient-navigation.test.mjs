import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("role QA retries abort and edge 5xx, but never silently passes persistent failures", () => {
  const source=readFileSync("scripts/final-e2e-release-gate.mjs","utf8");
  const start=source.indexOf("async function roleRouteSmoke(");
  const end=source.indexOf("async function humanUiJourneySmoke(",start);
  const route=source.slice(start,end);
  expect(route).toContain('navigationError.message.includes("net::ERR_ABORTED")');
  expect(route).toContain('navigationError.name === "TimeoutError"');
  expect(route).toContain('[429, 502, 503, 504].includes(http)');
  expect(route).toContain('if (attempt === 3)');
  expect(route).toContain('E2E_ROUTE_NAV_EXHAUSTED');
  expect(route).toContain('if (navigationError) throw navigationError');
  expect(route).toContain('status === 200');
  expect(route).toContain('observedPath === requiredPath');
  expect(route).toContain('!hasClientErrorShell');
  expect(route).toContain('bodyText.trim().length > 0');
});
