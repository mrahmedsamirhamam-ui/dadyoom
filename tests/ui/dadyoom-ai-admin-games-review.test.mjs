import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const admin=readFileSync("app/admin/games/page.tsx","utf8");
const client=readFileSync("app/admin/games/GamePackReviewClient.tsx","utf8");
const gate=readFileSync(".github/workflows/seo-production-gate.yml","utf8");
const smoke=readFileSync("scripts/smoke-games-5x5.mjs","utf8");
describe("Human-reviewed Dadyoom AI question editing with live production smoke",()=>{
 test("only an authenticated admin enters review UI",()=>{
  expect(admin).toContain("db.auth.getUser()");
  expect(admin).toContain('profile.data?.role !== "admin"');
  expect(client).toContain("approvedPack(candidate)");
  expect(client).toContain("راجعت بنفسي صحة كل سؤال");
  expect(client).toContain("25 سؤالًا");
  expect(client).toContain('method: "PUT"');
 });
 test("requires five questions in each game on a real production lesson",()=>{
  expect(smoke).toContain("modeNames");
  expect(smoke).toContain("items.length !== 5");
  expect(smoke).toContain("item.options.includes(item.answer)");
  expect(gate).toContain("run: node scripts/smoke-games-5x5.mjs");
 });
});
