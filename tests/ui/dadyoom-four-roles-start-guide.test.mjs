import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const guide=readFileSync("app/guide/page.tsx","utf8");
const script=readFileSync("scripts/smoke-games-playwright.mjs","utf8");
describe("All four roles have a simple start without losing features",()=>{
 test("the same existing dashboards provide a visible guide link",()=>{
   for(const role of ["student","teacher","parent","school"]) {
     const layout=readFileSync("app/(dashboard)/"+role+"/layout.tsx","utf8");
     expect(layout).toContain('href: "/guide"');
     expect(layout).toContain("ابدأ من هنا");
   }
 });
 test("guide has clear three-step progression and preserves honest national scope",()=>{
   for(const route of ["/student","/teacher","/parent","/school","/study","/search","/school/meetings"]) {
     expect(guide).toContain('href: "'+route+'"');
   }
   expect(guide).toContain("المطابقة");
   expect(guide).toContain("الصوت والفيديو قيد التطوير");
 });
 test("five action mode checks have an explicit guardian branch",()=>{
   expect(script).toContain('key === "guardian"');
   expect(script).toContain('GAME_UI_MOBILE_25_ROUNDS=PASS');
 });
});
