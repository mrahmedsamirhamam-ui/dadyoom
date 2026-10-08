import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("teacher BPay acknowledge keeps ownership and settled transaction checks but skips immediate triple re-render", () => {
  const source = readFileSync("features/marketplace/actions.ts", "utf8");
  const section = source.split("export async function confirmBpayCoursePayment")[1];
  expect(section).toContain('payment.status !== "approved"');
  expect(section).toContain(".eq(\"teacher_id\", user.id)");
  expect(section).toContain("await finalizePaymentOrder(paymentOrderId)");
  expect(section).toContain("تم تأكيد استلام BPay وفتح الدورة للطالب.");
  expect(section).not.toContain('revalidatePath("/teacher/marketplace")');
});

test("teacher marketplace UI and end-to-end test give observable failures after click", () => {
  const client = readFileSync("app/(dashboard)/teacher/marketplace/TeacherMarketplaceClient.tsx", "utf8");
  const e2e = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  expect(client).toContain('role="status" aria-live="polite"');
  expect(client).toContain("router.refresh()");
  expect(e2e).toContain("E2E_BPAY_TEACHER_UI_DIAGNOSTIC");
  expect(e2e).toContain("storedOrderStatus");
});
