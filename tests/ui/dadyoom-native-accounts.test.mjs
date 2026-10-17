import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const own = readFileSync("app/payments/dadyoom/page.tsx","utf8");
const pricing = readFileSync("components/billing/PricingClient.tsx","utf8");
describe("Dadyoom Accounts own payment record UI",()=>{
 test("reads only own authenticated orders via RLS and no service-role key",()=>{
  expect(own).toContain("db.auth.getUser()");
  expect(own).toContain('from("edu_payment_orders")');
  expect(own).toContain('.eq("buyer_id", user.id)');
  expect(own).toContain("redirect(\"/login\")");
  expect(own).not.toContain("createAdminClient");
 });
 test("does not fake charging, verification or delete legacy cancellation path",()=>{
  expect(own).toContain("لا نخصم أي مبلغ");
  expect(own).toContain("لا يعني تأكيد استلام المال");
  expect(own).toContain("الاشتراكات المدفوعة الجديدة متوقفة");
  expect(pricing).toContain('href="/payments/dadyoom"');
  expect(pricing).toContain("<PaddleManageSubscription />");
  expect(own).not.toContain("PaddleManageSubscription");
 });
});
