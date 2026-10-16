import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path) => readFileSync(path, "utf8");
const navigation = read("components/navigation/CompactNavigation.tsx");
const home = read("app/page.tsx");
const english = read("app/en/page.tsx");
const admin = read("app/admin/layout.tsx");
const dashboard = read("components/Navbar.tsx");
const portals = read("components/roles/RolePortalLayout.tsx");
const courses = read("app/courses/layout.tsx");
const chatbot = read("components/dad-ai/DadCompanion.tsx");
const install = read("components/pwa/DadyoomInstallPrompt.tsx");
const arabicVoice = read("services/dad-ai/dad-voice.ts");
const serverVoice = read("app/api/dad-voice/route.ts");
const offline = read("lib/mobile/hybrid-ai.ts");
const gate = read(".github/workflows/seo-production-gate.yml");

describe("Compact global Dadyoom navigation", () => {
  test("shared headers use one accessible openable menu rather than wide nav bars", () => {
    for (const page of [home, english, admin, dashboard, portals, courses]) {
      expect(page).toContain("<CompactNavigation");
    }
    expect(navigation).toContain('aria-expanded={open}');
    expect(navigation).toContain('aria-controls={panelId}');
    expect(navigation).toContain('event.key === "Escape"');
    expect(navigation).toContain('pointerdown');
    expect(navigation).toContain('setOpen(false)');
    expect(admin).toContain('href: "/admin/monetization"');
    expect(admin).toContain('href: "/admin/payments"');
    expect(admin).toContain('href: "/admin/curriculum/coverage"');
    expect(dashboard).toContain("<NotificationBell />");
    // /student/reminders belongs to the student layout. Do not show its
    // navigation link on a teacher/admin/parent/school dashboard.
    expect(dashboard).toContain('role === "student" || role === "child"');
    expect(dashboard).toContain('{user && (role === "student" || role === "child") ? (');
  });
  test("companion, installer and language control no longer occupy same corner", () => {
    expect(chatbot).toContain("pointer-events-auto absolute bottom-0 right-0");
    expect(chatbot).toContain("h-[58px] w-[58px]");
    expect(chatbot).toContain("useState(false)");
    expect(install).toContain("bottom-[4.75rem] left-4");
  });
  test("Arabic tutoring is required even when the offline engine ignores instructions", () => {
    expect(offline).toContain("isReadableArabic(localText) ? localText : ARABIC_OFFLINE_UNAVAILABLE");
    expect(arabicVoice).toContain("DADYOOM_ARABIC_VOICE_UNAVAILABLE");
    expect(serverVoice).toContain('candidateVoice');
    expect(serverVoice).toContain('"ar-SA-ZariyahNeural"');
  });
  test("SEO gate checks actual canonical instead of a retired domain in page HTML", () => {
    expect(gate).toContain('grep -Fq "https://dadyoom.com/" "$home"');
    expect(gate).toContain("SEO_RESPONSE_CODES home=");
    expect(gate).not.toContain('grep -Fq "dadyoom.dpdns.org" "$home"');
  });
});
