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
    expect(home.match(/ابدأ مجانًا/g)).toHaveLength(2);
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
});
