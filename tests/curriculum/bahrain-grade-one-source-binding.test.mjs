import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolveBahrainGradeOneSource } from "../../lib/curriculum/bahrain-grade-one-source-map";

const admin=readFileSync("app/admin/lessons/[id]/page.tsx","utf8");
const prepare=readFileSync("app/api/admin/lessons/prepare-source-pages/route.ts","utf8");
const analyze=readFileSync("app/api/admin/lessons/analyze-lesson/route.ts","utf8");

describe("Bahrain grade-one OCR folders are source-page scoped, never local lesson-number scoped",()=>{
 test("resolves real textbook spans in all 17 bundled folders",()=>{
   const spans=[[22,34],[35,48],[49,61],[62,65],[66,67],[68,81],
    [82,96],[97,109],[110,123],[124,129],[130,131],[132,144],
    [145,156],[157,168],[169,181],[182,186],[187,190]];
   for(let i=0;i<spans.length;i++){
     const [sourcePageStart,sourcePageEnd]=spans[i];
     expect(resolveBahrainGradeOneSource({countryCode:"BH",gradeNumber:1,sourcePageStart,sourcePageEnd}))
       .toBe(`/curriculum/bahrain/grade-01/lesson-${String(i+2).padStart(2,"0")}`);
   }
 });
 test("refuses same lesson number in a different unit, foreign grade and missing folder",()=>{
   for(const inp of [
    {countryCode:"BH",gradeNumber:2,sourcePageStart:22,sourcePageEnd:34},
    {countryCode:"EG",gradeNumber:1,sourcePageStart:22,sourcePageEnd:34},
    {countryCode:"BH",gradeNumber:1,sourcePageStart:82,sourcePageEnd:96+1},
    {countryCode:"BH",gradeNumber:1,sourcePageStart:8,sourcePageEnd:21},
    {countryCode:"BH",gradeNumber:1,sourcePageStart:null,sourcePageEnd:34},
   ]) expect(resolveBahrainGradeOneSource(inp)).toBeNull();
 });
 test("restricts admin UI and both server endpoints to exact matched scope and admin role",()=>{
   expect(admin).toContain("resolveBahrainGradeOneSource({");
   expect(admin).toContain("لا توجد صور صفحات موثقة ومطابقة لهذا الدرس");
   expect(admin).not.toContain("paddedLessonNumber");
   expect(analyze).toContain("imageBaseUrl !== matchingImageFolder");
   expect(prepare).toContain("imageBaseUrl !== matchingImageFolder");
   expect(prepare).toContain("getDashboardRequestViewer()");
   expect(prepare.indexOf("getDashboardRequestViewer()")).toBeLessThan(prepare.indexOf("await request.json()"));
   expect(prepare).toContain('!== "admin"');
 });
});
