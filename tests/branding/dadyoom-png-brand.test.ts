import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Dadyoom PNG site identity", () => {
  it("uses a real PNG logo image and no SVG in the shared brand component", () => {
    const file = source("components/brand/DadyoomLogo.tsx");
    expect(file).toContain('"/brand/dadyoom-mark-2026.png"');
    expect(file).toContain('import Image from "next/image"');
    expect(file).not.toMatch(/<svg\b|image\/svg\+xml|dadyoom-logo\.svg/u);
    expect(file).toContain("ضاديوم");
  });
  it("uses that same logo in site header, About and icon metadata", () => {
    expect(source("components/layout/Header.tsx")).toContain("<DadyoomLogo inverse />");
    const about=source("app/about/page.tsx");
    expect(about).toContain('<DadyoomLogo href=""');
    expect(about).toContain("ضاديوم — Dadyoom");
    expect(about).not.toMatch(/QAMORYX|Qamoryx|QAMORIX/u);
    expect(source("app/layout.tsx")).toContain("/brand/dadyoom-mark-2026.png");
    expect(source("app/manifest.ts")).toContain("/brand/dadyoom-mark-2026.png");
    expect(source("app/manifest.ts")).not.toContain("image/svg+xml");
  });
  it("points at an existing real PNG binary, not an SVG file renamed .png", () => {
    const png=readFileSync(resolve(process.cwd(), "public/brand/dadyoom-mark-2026.png"));
    expect(png.subarray(0,8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(160);
    expect(png.readUInt32BE(20)).toBe(160);
  });
});
