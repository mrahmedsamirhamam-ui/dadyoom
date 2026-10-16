import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
const responsive = src.slice(src.indexOf("async function responsiveSmoke("), src.indexOf("async function roleRouteSmoke("));

describe("Production role responsive gate remains strict under transient edge errors", () => {
  test("retries only connection aborts/timeouts and temporary Cloudflare statuses", () => {
    expect(responsive).toContain('navigationError.message.includes("net::ERR_ABORTED")');
    expect(responsive).toContain('navigationError.name === "TimeoutError"');
    expect(responsive).toContain("[429, 502, 503, 504].includes(status)");
    expect(responsive).toContain("attempt <= 3");
    expect(responsive).toContain("recordDiagnostic(\"responsive-navigation-retry\"");
  });
  test("does not claim pass after exhausted navigation or a redirected login", () => {
    expect(responsive).toContain("finalNavigationError === null");
    expect(responsive).toContain("E2E_RESPONSIVE_NAV_EXHAUSTED");
    expect(responsive).toContain("Boolean(response) && response.status() === 200");
    expect(responsive).toContain("observedPath === requiredPath");
    expect(responsive).toContain("if (navigationError) throw navigationError");
    expect(responsive).toContain("if (!transientNavigation && !transientHttp)");
  });
});
