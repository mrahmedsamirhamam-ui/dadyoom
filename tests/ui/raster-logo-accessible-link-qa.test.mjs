import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const script=readFileSync("scripts/final-e2e-release-gate.mjs","utf8");
const logo=readFileSync("components/brand/DadyoomLogo.tsx","utf8");
const source=script.slice(script.indexOf("let candidate = null;"),script.indexOf("if (!candidate) {"));

describe("Production UI role QA sees accessible links containing raster images",()=>{
  test("raster brand navigation exposes accessible name even without textContent",()=>{
    expect(logo).toContain('aria-label="ضاديوم — بيت العربية الرقمي"');
    expect(logo).toContain('import Image from "next/image"');
    expect(source).toContain('anchor.textContent?.trim() ||');
    expect(source).toContain('anchor.getAttribute("aria-label")');
    expect(source).toContain('anchor.querySelector("img[alt]")?.getAttribute("alt")');
  });
  test("only visible internal safe links count as genuine navigations",()=>{
    expect(source).toContain("anchor.getBoundingClientRect()");
    expect(source).toContain("anchor.target !==");
    expect(source).toContain('raw.startsWith(');
    expect(script).toContain('E2E_HUMAN_UI_${role.toUpperCase()}_INSUFFICIENT_CLICKS');
  });
});
