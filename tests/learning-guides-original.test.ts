import { describe, expect, it } from "vitest";
import { learningGuides } from "@/content/learning-guides";
describe("10 original Arabic learning guides",()=>{
 it("publishes ten unique slugged teaching guides",()=>{
  expect(learningGuides.length).toBeGreaterThanOrEqual(10);
  expect(new Set(learningGuides.map(g=>g.slug)).size).toBe(learningGuides.length);
 });
 it("requires meaningful, original text and no fabricated credentials",()=>{
  for (const g of learningGuides) {
   expect(g.description.length).toBeGreaterThan(65);
   expect(g.sections).toHaveLength(4);
   expect(g.sections.every(s=>s.heading.length>4&&s.body.length>135)).toBe(true);
   expect(g.sections.map(s=>s.body).join(" ").length).toBeGreaterThan(730);
   expect(g.sections.map(s=>s.body).join(" ")).not.toMatch(/معتمد رسميًا|آراء طلابنا|أكثر من مليون مستخدم/u);
  }
 });
});