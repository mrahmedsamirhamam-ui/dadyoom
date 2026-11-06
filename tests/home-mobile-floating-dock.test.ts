import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const home = read("app/page.tsx");
const css = read("app/globals.css");
const install = read("components/pwa/DadyoomInstallPrompt.tsx");
const dad = read("components/dad-ai/DadCompanion.tsx");

describe("Homepage mobile dock, RTL and CTA", () => {
  it("keeps the header CTA while adding a matching hero CTA", () => {
    expect(home).toMatch(/href="\/signup" className="hero-cta"/);
    expect(home).toContain('href="/try" className="hero-secondary"');
    expect(home).toContain('href="/try" className="dadyoom-home-header-cta');
    expect(home.match(/ابدأ مجانًا/g)).toHaveLength(1);
    expect(home).toContain("ذاكر العربية الآن، دون تسجيل");
    expect(home).toContain("ابدأ رحلتك");
    expect(home).toContain("استكشف مناهج الدول");
    expect(css).toContain(".dadyoom-home-page .hero-cta");
    expect(css).toContain("background: #174d44");
  });
  it("uses a high contrast introduction and safe bottom spacing", () => {
    expect(home).toContain("dadyoom-home-intro");
    expect(css).toContain("color: #3d4a46");
    expect(css).toContain("font-size: 0.95rem");
    expect(css).toContain("line-height: 1.9");
    expect(css).toContain("padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px))");
  });
  it("positions install dock on the left and dad on the right", () => {
    expect(install).toContain('className="floating-dock"');
    expect(install).not.toContain("fixed bottom-4 left-4");
    expect(dad).toContain("fixed bottom-3 right-3");
    expect(dad).not.toContain("fixed bottom-4 left-4");
    expect(css).toContain("max-width: calc(100vw - 24px)");
    expect(css).toContain("flex-direction: column");
    expect(css).toContain("gap: 8px");
    expect(install).toContain("INSTALL_DISMISSED_KEY");
    expect(install).toContain("window.localStorage.setItem");
    expect(install).toContain("window.localStorage.getItem");
    expect(install).toContain("data-dadyoom-install-dismiss");
    expect(install).toContain("min-h-11 min-w-11");
  });
  it.each([360, 390, 430])("reserves separate horizontal space at %ipx", (viewport) => {
    const dock = Math.min(208, viewport - 128);
    const dadSize = 78;
    const gap = viewport - 12 - dock - 12 - dadSize;
    expect(gap).toBeGreaterThanOrEqual(8);
  });
  it("does not allow one floating widget to obstruct the other dialog", () => {
    expect(css).toContain('body:has([data-dad-chat-open="true"]) .floating-dock');
    expect(css).toContain('body:has([data-dadyoom-install-dialog="true"]) [data-dad-floating-root]');
  });
  it("offers four real role destinations without an invented screen or fake stats", () => {
    for (const href of ["/student", "/teacher", "/parent", "/school"]) {
      expect(home).toContain('href: "' + href + '"');
    }
    expect(home).toContain("<HomeTrustStrip />");
    expect(home).not.toContain("<MiniStat value=");
    expect(home).toContain('id="home-about-title"');
    expect(home.indexOf('id="home-about-title"')).toBeGreaterThan(home.indexOf('className="hero-cta"'));
    expect(home.indexOf("<HomeInteractionPanel />")).toBeLessThan(home.indexOf("<footer"));
  });
  it("keeps the true role and ad logic untouched while reflecting responsive headline", () => {
    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("clamp(2rem, 7.5vw, 2.45rem)");
    expect(home).toContain("text-[#80551b]");
    expect(home).toContain("ضاديوم — بيت العربية الرقمي");
    expect(home).toContain("dadyoom-home-hero-tagline");
    const trust = read("components/home/HomeTrustStrip.tsx");
    expect(trust).toContain('.eq("status", "published")');
    expect(trust).toContain('.eq("is_active", true)');
    expect(trust).toContain("if (!lessons || !curricula)");
    expect(trust).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });


  it("hides fixed widgets when the home footer enters the viewport", () => {
    expect(home).toContain("data-dadyoom-home-footer");
    expect(home).toContain("<HomeFloatingGuard />");
    const guard=read("components/home/HomeFloatingGuard.tsx");
    expect(guard).toContain("IntersectionObserver");
    expect(guard).toContain("dadyoom-home-footer-visible");
    expect(css).toContain("visibility: hidden !important");
    expect(css).toContain("pointer-events: none !important");
  });
  it("keeps footer links reachable and skill cards visibly interactive", () => {
    for (const href of ["/about", "/founder", "/how-to-use", "/courses"]) {
      expect(home).toContain('href="' + href + '"');
    }
    expect(home).toContain('aria-label="روابط تعريفية"');
    expect(home).toContain("grid grid-cols-2 gap-x-4 gap-y-3");
    expect(home).toContain("min-h-11 items-center");
    expect(home).toContain("dadyoom-home-skill-card");
    expect(home).toContain("active:scale-[0.98]");
    expect(home).toContain("ابدأ التدريب");
  });
  it("formats dynamic numbers separately from surrounding RTL text", () => {
    const trust=read("components/home/HomeTrustStrip.tsx");
    expect(trust.match(/<bdi dir="ltr">/g)).toHaveLength(2);
    expect(home).not.toContain('value="22"');
    expect(home).not.toContain('value="24/7"');
  });

});
