import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PORTAL_EXPERIENCE, type WarmPortalRole } from "@/lib/ui/portal-experience";

const roles: WarmPortalRole[] = ["student", "teacher", "parent", "school"];
const layout = readFileSync(resolve("components/roles/RolePortalLayout.tsx"), "utf8");
const tour = readFileSync(resolve("components/roles/RoleWelcomeTour.tsx"), "utf8");

describe("Dadyoom warm role experience", () => {
  it("provides one usable primary action and three onboarding steps for every role", () => {
    for (const role of roles) {
      const x = PORTAL_EXPERIENCE[role];
      expect(x.welcome.trim()).not.toBe("");
      expect(x.subtitle.trim()).not.toBe("");
      expect(x.primaryAction.title.trim()).not.toBe("");
      expect(x.primaryAction.href).toMatch(/^\/[a-z/-]+$/);
      expect(x.steps).toHaveLength(3);
      expect(x.steps.every(step => step.title.trim() && step.description.trim())).toBe(true);
    }
  });

  it("does not pretend to know student performance, parent links or school metrics", () => {
    const content = JSON.stringify(PORTAL_EXPERIENCE);
    expect(content).not.toMatch(/100%|مكتمل|تم الربط|أحرزت|حصلت على/);
  });

  it("keeps independently protected role portals and trusted profile checks", () => {
    expect(layout).toContain("supabase.auth.getUser()");
    expect(layout).toContain('from("profiles")');
    expect(layout).toContain("hasVerifiedPrivilegedRole");
    expect(layout).toContain("destinationForStoredRole");
    expect(layout).toContain("<RoleWelcomeTour role={role} />");
    expect(layout).toContain("experience.primaryAction.href");
  });

  it("removes duplicate first-screen actions while retaining the full service list", () => {
    expect(layout).toContain(".filter(href => href !== experience.primaryAction.href)");
    expect(layout).toContain("الوصول السريع");
    expect(layout).toContain("المزيد من خدمات");
  });

  it("tour is optional, accessible, three steps and stores only a completion flag", () => {
    expect(tour).toContain('role="region"');
    expect(tour).toContain('aria-labelledby="dadyoom-welcome-tour-title"');
    expect(tour).toContain("تخطّي الجولة");
    expect(tour).toContain("السابق");
    expect(tour).toContain("التالي");
    expect(tour).toContain("إنهاء الجولة");
    expect(tour).toContain("إعادة جولة التعريف");
    expect(tour).toContain('window.localStorage.setItem(tourKey(role), "completed")');
    expect(tour).not.toMatch(/service_role|user_metadata|student_id|access_token|auth\.getSession/);
  });
});
