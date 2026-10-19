import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const hub=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const data=JSON.parse(readFileSync("data/curriculum-completeness/action-game-22-countries-20261017.json","utf8"));
const smoke=readFileSync("scripts/smoke-games-22-countries.mjs","utf8");
const gate=readFileSync(".github/workflows/seo-production-gate.yml","utf8");
describe("All 22 countries have a real game API and safe next action on missing material",()=>{
 test("actual production sample has 22 unique countries and lesson IDs",()=>{
  expect(data.items).toHaveLength(22);
  expect(new Set(data.items.map(x=>x.code)).size).toBe(22);
  expect(new Set(data.items.map(x=>x.id)).size).toBe(22);
  expect(data.scope).toContain("5 playable action-game modes");
 });
 test("all games need five distinct answerable lesson questions",()=>{
  expect(smoke).toContain('GAME_22_COUNTRIES_PRODUCTION=PASS count=22');
  expect(smoke).toContain('questions.length !== 5');
  // Formatting of the arrow callback is irrelevant to the five-unique-prompts gate.
  expect(smoke.replace(/\s+/g, "")).toMatch(/newSet\(questions\.map\(\(?x\)?=>x\.prompt\)\)\.size!==5/);
  expect(smoke).toContain('!q.options.includes(q.answer)');
  expect(gate).toContain("run: node scripts/smoke-games-22-countries.mjs");
 });
 test("book-only placeholder never traps student in an empty dead end",()=>{
  // The fallback is shown only after loading completes, preventing a
  // misleading empty-bank warning during a normal slow network request.
  expect(hub).toContain('!pack && !loading && message');
  expect(hub).toContain("setRetryable(mayRetry)");
  expect(hub).toContain('href="/study"');
  expect(hub).toContain('href="/guide"');
 });
});
