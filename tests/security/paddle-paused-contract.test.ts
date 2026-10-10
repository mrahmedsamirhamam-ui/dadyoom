import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("free-only Paddle contract on live Cloudflare", () => {
  it("never serves Paddle checkout while in production or without sandbox opt-in", () => {
    const route = read("app/api/payments/paddle/config/route.ts");
    expect(route).toContain('environment() !== "sandbox"');
    expect(route).toContain('process.env.DADYOOM_SANDBOX_CHECKOUT_ENABLED !== "true"');
    expect(route).toMatch(/error: "PAYMENTS_PAUSED"[\\s\\S]*?status: 403/);
  });
  it("role E2E requires the expected 403 and a closed checkout in production", () => {
    const gate = read("scripts/final-e2e-release-gate.mjs");
    expect(gate).toContain('paddleConfig.status === 403 && paddleError === "PAYMENTS_PAUSED"');
    expect(gate).toContain("E2E_LIVE_PADDLE_CHECKOUT_NOT_PAUSED");
  });
});
