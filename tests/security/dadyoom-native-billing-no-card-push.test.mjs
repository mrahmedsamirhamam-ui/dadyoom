import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const route=readFileSync("app/api/payments/bank/create/route.ts","utf8");
const accounts=readFileSync("app/payments/dadyoom/page.tsx","utf8");
describe("Native Dadyoom billing does not invite paused card payments",()=>{
 test("legacy bank checkout is a terminal denial, not card misdirection",()=>{
  expect(route).toContain('error: "PAID_CHECKOUT_PAUSED"');
  expect(route).toContain('accountUrl: "/payments/dadyoom"');
  expect(route).toContain("acceptsPayment: false");
  expect(route).not.toContain("استخدم Visa أو Mastercard");
  expect(route).toContain("status: 410");
 });
 test("accounts ledger remains authenticated and RLS-scoped",()=>{
  expect(accounts).toContain("db.auth.getUser()");
  expect(accounts).toContain('.eq("buyer_id", user.id)');
  expect(accounts).toContain('from("edu_payment_orders")');
  expect(accounts).not.toContain("PADDLE_API_KEY");
 });
});