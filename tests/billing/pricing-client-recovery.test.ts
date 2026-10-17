import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { isUsablePricingStatus } from "../../lib/billing/pricing-client-state";

const parent = {
  authenticated: true, role: "parent",
  dashboardHref: "/parent", dashboardLabel: "لوحة ولي الأمر",
  plan: "free", degraded: false,
};

describe("pricing page recovers without changing access privileges", () => {
  test("recognizes an authenticated parent even if subscription details are degraded", () => {
    expect(isUsablePricingStatus(parent)).toBe(true);
    expect(isUsablePricingStatus({ ...parent, degraded: true })).toBe(true);
  });

  test("does not mistake an HTTP 200 degraded anonymous fallback for a logout", () => {
    expect(isUsablePricingStatus({
      authenticated: false, degraded: true,
      role: null, dashboardHref: "/student", dashboardLabel: "لوحة الطالب",
    })).toBe(false);
    expect(isUsablePricingStatus({
      authenticated: false, degraded: false,
      role: null, dashboardHref: "/student", dashboardLabel: "لوحة الطالب",
    })).toBe(true);
  });

  test("does not accept mismatched privileged dashboard links", () => {
    expect(isUsablePricingStatus({
      ...parent, dashboardHref: "/admin", dashboardLabel: "لوحة الإدارة",
    })).toBe(false);
    expect(isUsablePricingStatus({
      ...parent, dashboardHref: "https://outside.invalid", dashboardLabel: "لوحة ولي الأمر",
    })).toBe(false);
    expect(isUsablePricingStatus({
      ...parent, dashboardLabel: "لوحة المعلم",
    })).toBe(false);
  });

  test("handles valid dashboard presentation for student, child, school, admin and teacher", () => {
    for (const [role, dashboardHref, dashboardLabel] of [
      ["student", "/student", "لوحة الطالب"],
      ["child", "/student", "لوحة الطالب"],
      ["school", "/school", "لوحة المدرسة"],
      ["admin", "/admin", "لوحة الإدارة"],
      ["teacher", "/teacher", "لوحة المعلم"],
    ]) {
      expect(isUsablePricingStatus({
        authenticated: true, degraded: true, role, dashboardHref, dashboardLabel,
      })).toBe(true);
    }
  });

  test("rejects missing or malformed state instead of guessing a user role", () => {
    for (const bad of [null, {}, false, { ...parent, authenticated: "true" },
      { ...parent, dashboardHref: null }, { ...parent, dashboardLabel: undefined }]) {
      expect(isUsablePricingStatus(bad)).toBe(false);
    }
  });

  test("pricing UI has bounded retries, explicit recovery and no new checkout control", () => {
    const ui = readFileSync("components/billing/PricingClient.tsx", "utf8");
    expect(ui).toContain("const maxAttempts = 5;");
    expect(ui).toContain("isUsablePricingStatus(payload)");
    expect(ui).toContain("setStatusRequestId((previous) => previous + 1)");
    expect(ui).toContain("تعذّر التحقق من حسابك — حاول مجددًا");
    expect(ui).toContain("لا يوجد شراء أو اشتراك مدفوع حاليًا");
    expect(ui).toContain("خمس ألعاب حركية مجانية عندما يتوفر بنك أسئلة مناسب للدرس");
    expect(ui).toContain("جارٍ التحقق من حسابك…");
    expect(ui).toContain('current={statusResolved && !status.degraded && status.plan === "free"}');
    expect(ui).toContain('current={statusResolved && !status.degraded && status.plan === "plus"}');
  });
});
