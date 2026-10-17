import { describe, expect, test } from "vitest";
import {
  buildLessonGamePack, approvedPack, answerText, GAME_MODES,
} from "../../lib/games/lesson-game-pack";
import { readFileSync } from "node:fs";
const api=readFileSync("app/api/lessons/games/route.ts","utf8");
describe("lesson-specific five-game HTML pack",()=>{
 test("five distinct items per game when lesson has enough material",()=>{
   const content="أخذت مريم كتابًا من المكتبة. شاهدت صور الأشجار والأزهار في الحديقة. كتبت قائمة بالأصدقاء الذين يحبون القراءة. تعلم الأطفال كيف يتعاونون في جمع القصص وتنظيمها. استمع المعلم إلى أسئلة الطلاب وشرح لهم أهمية الاطلاع وممارسة الكتابة. شكر الجميع أمينة المكتبة لأنها رتبت الرفوف وساعدت القراء على اختيار الكتب. اقرأ الكلمات بعناية ثم ضع علامة على الكلمة التي حذفت من السياق.";
   const bank=buildLessonGamePack("رحلة القراءة",content,[],[]);
   expect(bank.pack).not.toBeNull();
   expect(GAME_MODES).toHaveLength(5);
   for(const mode of GAME_MODES) {
     const items=bank.pack?.[mode]??[];
     expect(items).toHaveLength(5);
     expect(new Set(items.map(x=>x.prompt)).size).toBe(5);
     for(const x of items) expect(x.options).toContain(x.answer);
   }
 });
 test("doesn't repeat a single question five times or invent unsupported content",()=>{
   const bank=buildLessonGamePack("عنوان", "درس قصير.",[],[]);
   expect(bank.pack).toBeNull();
   expect(bank.bankSize).toBeLessThan(5);
   expect(api).toContain("LESSON_GAME_BANK_NEEDS_CONTENT");
 });
 test("resolves existing option IDs and rejects malformed AI output",()=>{
   const options=[{id:"a",text:"المبتدأ"},{id:"b",text:"الخبر"}];
   expect(answerText("b",["المبتدأ","الخبر"],options)).toBe("الخبر");
   expect(answerText("wrong",["المبتدأ","الخبر"],options)).toBeNull();
   expect(approvedPack({maze:[{prompt:"a",options:["x"],answer:"x"}]})).toBeNull();
 });
 test("published-only, RLS-aware, admin-approved updates",()=>{
   expect(api).toContain('.eq("status", "published")');
   expect(api).toContain('profile.data?.role !== "admin"');
   expect(api).toContain('body.approved !== true');
   expect(api).toContain('const pack = approvedPack(body.pack)');
   expect(api).toContain("x-dadyoom-approved-game-pack");
   expect(api).toContain("human-approved-html-v2");
   expect(api.indexOf('eq("status", "published")')).toBeLessThan(api.indexOf('from("edu_lesson_game_packs")'));
 });
});
