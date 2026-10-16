import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const sw=readFileSync("public/sw.js","utf8");
const manifest=readFileSync("app/manifest.ts","utf8");
describe("PWA icon cache is refreshed for the PNG rebrand",()=>{
  test("bump cache version without removing offline fallback",()=>{
    expect(sw).toContain('dadyoom-offline-v3-raster-brand');
    expect(sw).not.toContain('dadyoom-offline-v2');
    expect(sw).toContain("keys()");
    expect(sw).toContain("caches.delete(key)");
    expect(sw).toContain('const OFFLINE_URL = "/offline.html"');
  });
  test("precache both real PNG icon sizes that the manifest references",()=>{
    for(const name of ["/pwa/icon-192.png","/pwa/icon-512.png"]){
      expect(sw).toContain(name);
      expect(manifest).toContain(name);
    }
    expect(manifest).not.toContain("image/svg+xml");
  });
});
