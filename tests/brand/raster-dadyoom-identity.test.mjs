import { describe, expect, test } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const read=(name)=>readFileSync(name,"utf8");
const image=(name)=>readFileSync(name);
const logo=read("components/brand/DadyoomLogo.tsx");
const layout=read("app/layout.tsx");
const manifest=read("app/manifest.ts");
const header=read("app/page.tsx");

describe("Dadyoom visual identity is committed PNG/WebP, never SVG",()=>{
  test("shared home, app header and footer use raster-only logo and square icon",()=>{
    expect(logo).toContain('import Image from "next/image"');
    expect(logo).toContain('export const DADYOOM_RASTER_MARK = "/brand/dadyoom-mark-2026.png"');
    expect(logo).toContain("src={DADYOOM_RASTER_MARK}");
    expect(logo).not.toContain('/brand/dadyoom-logo.webp');
    expect(logo).not.toContain('/brand/dadyoom-logo-inverse.webp');
    expect(logo).not.toMatch(/<svg[\s>]/iu);
    expect(header).toContain('DadyoomMark');
    expect(header).toContain('DadyoomLogo');
  });
  test("browser favicon, Android PWA and Apple metadata have no SVG image urls",()=>{
    expect(layout).toContain('url: "/favicon.ico"');
    expect(layout).toContain('url: "/apple-icon.png"');
    expect(layout).toContain('logo: `${siteUrl}/brand/dadyoom-mark-2026.png`');
    expect(manifest).toContain('src: "/pwa/icon-192.png"');
    expect(manifest).toContain('src: "/pwa/icon-512.png"');
    expect(layout).not.toContain('/icon.svg');
    expect(manifest).not.toContain('/icon.svg');
    expect(existsSync("app/icon.svg")).toBe(false);
  });
  test("actual image magic bytes match names, not just filenames",()=>{
    for(const name of ["public/brand/dadyoom-mark-2026.png","public/brand/dadyoom-icon.png","public/brand/dadyoom-logo.png",
      "public/pwa/icon-192.png","public/pwa/icon-512.png","app/icon.png","app/apple-icon.png"]) {
      expect(image(name).subarray(0,8).toString("hex"),name).toBe("89504e470d0a1a0a");
    }
    for(const name of ["public/brand/dadyoom-logo.webp","public/brand/dadyoom-logo-inverse.webp"]) {
      const bytes=image(name);
      expect(bytes.toString("ascii",0,4),name).toBe("RIFF");
      expect(bytes.toString("ascii",8,12),name).toBe("WEBP");
    }
    expect(image("app/favicon.ico").subarray(0,4).toString("hex")).toBe("00000100");
  });
});
