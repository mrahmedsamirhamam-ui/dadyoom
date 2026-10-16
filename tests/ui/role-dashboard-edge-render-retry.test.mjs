import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const src=readFileSync("scripts/final-e2e-release-gate.mjs","utf8");
const journey=src.slice(src.indexOf("async function humanUiJourneySmoke("),src.indexOf("async function secondaryCurriculumCoverageGate("));
describe("Production role journeys require a real rendered dashboard after transient edge failures",()=>{
  test("does not count links from HTTP 503 pages or other failed document loads",()=>{
    expect(journey).toContain("dashboardResponse?.status() ?? 0");
    expect(journey).toContain("if (http === 200) break");
    expect(journey).toContain("[429, 502, 503, 504].includes(http)");
    expect(journey).toContain("E2E_HUMAN_DASHBOARD_EDGE_RETRY");
    expect(journey).toContain("DASHBOARD_HTTP_FAILED");
    expect(journey).toContain("attempt === 3");
  });
  test("waits for slow-rendering portal links without weakening minimum clicks or runtime safety",()=>{
    expect(journey).toContain("E2E_HUMAN_LINK_RENDER_RETRY");
    expect(journey).toContain("if (candidate || readAttempt === 3) break");
    expect(journey).toContain('anchor.getAttribute("aria-label")');
    expect(journey).toContain("E2E_HUMAN_UI_${role.toUpperCase()}_INSUFFICIENT_CLICKS");
    expect(journey).toContain("E2E_HUMAN_UI_${role.toUpperCase()}_RUNTIME_ERROR");
  });
});
